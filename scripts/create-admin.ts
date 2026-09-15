import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { hashAdminPassword } from "../server/_core/adminAuth";

function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    output.write(question);

    if (!input.isTTY) {
      const rl = createInterface({ input, output });
      rl.question("").then(value => {
        rl.close();
        resolve(value);
      }).catch(error => {
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
        resolve(value);
        return;
      }

      if (char === "\u007f" || char === "\b") {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    };

    input.on("data", onData);
  });
}

async function main() {
  const rl = createInterface({ input, output });

  try {
    const username = (await rl.question("Nom d'utilisateur admin : ")).trim();
    rl.close();

    if (!/^[a-zA-Z0-9._-]{3,64}$/.test(username)) {
      throw new Error(
        "Nom d'utilisateur invalide : utilisez 3 à 64 caractères parmi lettres, chiffres, ., _ et -."
      );
    }

    const password = await askHidden("Mot de passe admin (12 caractères minimum) : ");

    if (password.length < 12) {
      throw new Error("Le mot de passe doit contenir au moins 12 caractères.");
    }

    const confirmation = await askHidden("Confirmer le mot de passe : ");

    if (password !== confirmation) {
      throw new Error("Les mots de passe ne correspondent pas.");
    }

    const passwordHash = hashAdminPassword(password);

    console.log("\n=== Variables d'environnement administrateur ===\n");
    console.log(`ADMIN_USERNAME=${username}`);
    console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
    console.log("\nAjoutez ces deux variables dans votre environnement serveur (.env.local en développement).\n");
    console.log("Ne committez jamais ADMIN_PASSWORD_HASH dans Git.\n");
  } finally {
    rl.close();
  }
}

main().catch(error => {
  console.error(`\nErreur : ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
