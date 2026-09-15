import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

import { hashAdminPassword } from "../server/_core/adminAuth";
import { prisma } from "../prisma/client";

function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    output.write(question);

    if (!input.isTTY) {
      const rl = createInterface({ input, output });
      rl.question("")
        .then(value => {
          rl.close();
          resolve(value.trim());
        })
        .catch(error => {
          rl.close();
          reject(error);
        });
      return;
    }

    const wasRaw = Boolean(input.isRaw);
    input.setRawMode?.(true);
    let value = "";

    const cleanup = () => {
      input.setRawMode?.(wasRaw);
      input.removeListener("data", onData);
      output.write("\n");
    };

    const onData = (chunk: Buffer | string) => {
      const char = chunk.toString();

      if (char === "\u0003") {
        cleanup();
        reject(new Error("Opération annulée."));
        return;
      }

      if (char === "\r" || char === "\n") {
        cleanup();
        resolve(value.trim());
        return;
      }

      if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
        return;
      }

      if (char.length === 1 && char.charCodeAt(0) >= 32) {
        value += char;
      }
    };

    input.on("data", onData);
  });
}

async function main() {
  const rl = createInterface({ input, output });

  try {
    const username = (
      await rl.question("Nom d'utilisateur admin : ")
    ).trim();

    if (!/^[a-zA-Z0-9._-]{3,64}$/.test(username)) {
      throw new Error(
        "Nom d'utilisateur invalide : utilisez 3 à 64 caractères parmi lettres, chiffres, ., _ et -."
      );
    }

    const password = await askHidden(
      "Mot de passe admin (12 caractères minimum) : "
    );

    if (password.length < 12) {
      throw new Error("Le mot de passe doit contenir au moins 12 caractères.");
    }

    const confirmation = await askHidden("Confirmer le mot de passe : ");

    if (password !== confirmation) {
      throw new Error("Les mots de passe ne correspondent pas.");
    }

    // Le modèle AdminCredential doit être présent dans Prisma avant d'exécuter ce script.
    const existingCredential = await prisma.adminCredential.findUnique({
      where: { username },
    });

    if (existingCredential) {
      throw new Error(`Le nom d'utilisateur "${username}" existe déjà.`);
    }

    const openId = `local_admin_${username}`;
    const existingUser = await prisma.user.findUnique({
      where: { openId },
    });

    if (existingUser) {
      throw new Error(
        `Un utilisateur associé à "${username}" existe déjà.`
      );
    }

    const passwordHash = hashAdminPassword(password);

    const admin = await prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          openId,
          name: username,
          role: "admin",
          loginMethod: "local-admin",
        },
      });

      const credential = await tx.adminCredential.create({
        data: {
          userId: user.id,
          username,
          passwordHash,
        },
      });

      return { user, credential };
    });

    console.log("\n========================================");
    console.log("      ADMIN CRÉÉ AVEC SUCCÈS");
    console.log("========================================\n");
    console.log(`Username : ${admin.credential.username}`);
    console.log(`User ID  : ${admin.user.id}`);
    console.log(`Role     : ${admin.user.role}`);
    console.log("\nLe mot de passe n'a pas été enregistré en clair.");
    console.log("Tu peux maintenant utiliser ce compte pour /admin/login.\n");
  } finally {
    rl.close();
  }
}

main()
  .catch(error => {
    console.error(
      `\nErreur : ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
