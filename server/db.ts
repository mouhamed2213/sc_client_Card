// ? Centralized database connection file

import type {
  Fiche,
  Prisma,
  PrismaClient as PrismaClientType,
} from "generated/prisma/client";
import { randomBytes } from "node:crypto";
import { pickAvailableSlug, slugBaseFromFiche } from "@shared/slug";
import { prisma } from "../prisma/client";
import { ENV } from "./_core/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export type { Fiche, User } from "generated/prisma/client";
export type InsertFiche = Prisma.FicheUncheckedCreateInput;
export type InsertUser = Prisma.UserUncheckedCreateInput;
export type InsertMembershipCard = Prisma.MembershipCardUncheckedCreateInput;

export async function upsertLegacyOAuthUser(
  user: Partial<InsertUser> & { openId: string }
): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  await prisma.user.upsert({
    where: { openId: user.openId },
    create: {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role:
        user.role ?? (user.openId === ENV.legacyOwnerOpenId ? "admin" : "user"),
      lastSignedIn: user.lastSignedIn ?? new Date(),
    },
    update: {
      ...(user.name !== undefined ? { name: user.name ?? null } : {}),
      ...(user.email !== undefined ? { email: user.email ?? null } : {}),
      ...(user.loginMethod !== undefined
        ? { loginMethod: user.loginMethod ?? null }
        : {}),
      ...(user.role !== undefined
        ? { role: user.role }
        : user.openId === ENV.legacyOwnerOpenId
          ? { role: "admin" as const }
          : {}),
      lastSignedIn: user.lastSignedIn ?? new Date(),
    },
  });
}

export async function getUserByLegacyOpenId(openId: string) {
  return prisma.user.findUnique({ where: { openId } });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateUserLastSignedIn(
  id: number,
  lastSignedIn = new Date()
) {
  await prisma.user.update({ where: { id }, data: { lastSignedIn } });
}

const demoRows: InsertFiche[] = [
  {
    slug: "hotel-teranga",
    formule: "signature",
    statut: "active",
    nom: "Teranga",
    prenom: "Hôtel",
    fonction: "Hôtel & résidence",
    entreprise: "Hôtel Teranga",
    photo: "",
    logo: "",
    telephone: "+221771234567",
    whatsapp: "+221771234567",
    email: "bonjour@hotelteranga.sn",
    site: "https://hotelteranga.sn",
    adresse: "Route de Saly, Mbour — en face de la station Total",
    lienItineraire: "https://maps.google.com/?q=Hotel+Teranga+Saly",
    googlePlaceId: "ChIJdemo-teranga",
    dateCreation: new Date("2026-08-11"),
    dateEcheance: new Date("2027-08-11"),
    scansTotal: 128,
    lastScanAt: new Date("2026-09-13T17:30:00Z"),
    dataJson: JSON.stringify({
      premierBouton: "whatsapp",
      messageWhatsapp:
        "Bonjour, je souhaite réserver une chambre à l'Hôtel Teranga.",
      liens: [
        { label: "Réserver sur le site", url: "https://hotelteranga.sn" },
        { label: "Instagram", url: "https://instagram.com" },
      ],
      horaires: [
        { jour: "Lundi", horaire: "Ouvert 24h/24" },
        { jour: "Mardi", horaire: "Ouvert 24h/24" },
        { jour: "Mercredi", horaire: "Ouvert 24h/24" },
        { jour: "Jeudi", horaire: "Ouvert 24h/24" },
        { jour: "Vendredi", horaire: "Ouvert 24h/24" },
        { jour: "Samedi", horaire: "Ouvert 24h/24" },
        { jour: "Dimanche", horaire: "Ouvert 24h/24" },
      ],
      galerie: [],
      sections: [
        {
          titre: "Nos chambres",
          articles: [
            {
              nom: "Chambre double",
              description: "Lit king-size, terrasse et petit déjeuner",
              prix: "À partir de 45 000 F",
            },
            {
              nom: "Suite Teranga",
              description: "Vue jardin, salon privé et transfert aéroport",
              prix: "À partir de 75 000 F",
            },
          ],
        },
      ],
      notesInternes: "Fiche de démonstration.",
    }),
  },
  {
    slug: "marie-diallo",
    formule: "pro",
    statut: "active",
    nom: "Diallo",
    prenom: "Marie",
    fonction: "Conseillère immobilière",
    entreprise: "Saly Immo Conseil",
    photo: "",
    logo: "",
    telephone: "+221701112233",
    whatsapp: "+221701112233",
    email: "marie@salyimmo.sn",
    site: "",
    adresse: "Saly Centre, bureau 14",
    lienItineraire: "https://maps.google.com/?q=Saly+Centre",
    googlePlaceId: "ChIJdemo-marie",
    dateCreation: new Date("2026-07-02"),
    dateEcheance: new Date("2027-07-02"),
    scansTotal: 84,
    lastScanAt: new Date("2026-09-12T10:00:00Z"),
    dataJson: JSON.stringify({
      premierBouton: "contact",
      messageWhatsapp:
        "Bonjour Marie, je souhaite échanger sur un bien immobilier.",
      liens: [{ label: "Facebook", url: "https://facebook.com" }],
      horaires: [
        { jour: "Lundi", horaire: "09:00 — 18:00" },
        { jour: "Mardi", horaire: "09:00 — 18:00" },
        { jour: "Mercredi", horaire: "09:00 — 18:00" },
        { jour: "Jeudi", horaire: "09:00 — 18:00" },
        { jour: "Vendredi", horaire: "09:00 — 18:00" },
        { jour: "Samedi", horaire: "Sur rendez-vous" },
        { jour: "Dimanche", horaire: "Fermé" },
      ],
      galerie: [],
      sections: [],
      notesInternes: "Relancer pour la photo portrait.",
    }),
  },
  {
    slug: "atelier-baobab",
    formule: "essentiel",
    statut: "suspendue",
    nom: "Baobab",
    prenom: "Atelier",
    fonction: "Artisanat local",
    entreprise: "Atelier Baobab",
    photo: "",
    logo: "",
    telephone: "+221781010101",
    whatsapp: "+221781010101",
    email: "",
    site: "",
    adresse: "Somone, quartier des pêcheurs",
    lienItineraire: "https://maps.google.com/?q=Somone+Senegal",
    googlePlaceId: "",
    dateCreation: new Date("2026-05-19"),
    dateEcheance: new Date("2027-05-19"),
    scansTotal: 41,
    lastScanAt: new Date("2026-08-20T10:00:00Z"),
    dataJson: JSON.stringify({
      premierBouton: "whatsapp",
      messageWhatsapp: "Bonjour, je souhaite découvrir vos créations.",
      liens: [],
      horaires: [
        { jour: "Lundi — Samedi", horaire: "09:00 — 19:00" },
        { jour: "Dimanche", horaire: "Fermé" },
      ],
      galerie: [],
      sections: [],
      notesInternes: "Fiche suspendue pour démonstration.",
    }),
  },
];

async function ensureDemoFiches() {
  if ((await prisma.fiche.count()) === 0)
    await prisma.fiche.createMany({ data: demoRows });
}
export async function listFiches() {
  await ensureDemoFiches();
  return prisma.fiche.findMany({ orderBy: { updatedAt: "desc" } });
}
export async function listRecentFiches(limit = 10) {
  await ensureDemoFiches();
  return prisma.fiche.findMany({
    orderBy: { dateCreation: "desc" },
    take: limit,
  });
}

export async function listFichesPaginated(input: {
  page: number;
  pageSize: number;
  search?: string;
  statut?: "active" | "suspendue" | "supprimee" | "brouillon";
  aRenouveler?: boolean;
  expiree?: boolean;
}) {
  await ensureDemoFiches();
  const search = input.search?.trim();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const renewalLimit = new Date(startOfToday);
  renewalLimit.setUTCDate(renewalLimit.getUTCDate() + 30);
  renewalLimit.setUTCHours(23, 59, 59, 999);
  const where = {
    ...(input.statut ? { statut: input.statut } : {}),
    ...(input.aRenouveler
      ? {
          statut: "active" as const,
          dateEcheance: { gte: startOfToday, lte: renewalLimit },
        }
      : {}),
    ...(input.expiree
      ? {
          statut: "active" as const,
          dateEcheance: { lt: startOfToday },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { prenom: { contains: search, mode: "insensitive" as const } },
            { nom: { contains: search, mode: "insensitive" as const } },
            { entreprise: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.fiche.count({ where }),
    prisma.fiche.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
  ]);
  return { rows, total };
}

export async function getFicheBySlug(slug: string) {
  await ensureDemoFiches();
  return prisma.fiche.findUnique({ where: { slug } });
}
export async function getFicheById(id: number) {
  return prisma.fiche.findUnique({ where: { id } });
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
const MAX_SLUG_ATTEMPTS = 5;

/** Generates a unique slug (`prenom-nom`, `prenom-nom-2`, …) inside a transaction. */
async function generateUniqueSlug(
  tx: Tx,
  fiche: { prenom?: string | null; nom?: string | null; entreprise?: string | null }
) {
  const base = slugBaseFromFiche(fiche);
  const rows = await tx.fiche.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });
  return pickAvailableSlug(base, rows.map(row => row.slug));
}

function isSlugConflict(error: unknown) {
  const e = error as { code?: string; meta?: { target?: unknown } };
  if (e?.code !== "P2002") return false;
  const target = e.meta?.target;
  return Array.isArray(target) ? target.includes("slug") : String(target ?? "").includes("slug");
}

/** Runs `work` again when two concurrent creations pick the same slug. */
async function withSlugRetry<T>(work: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await work();
    } catch (error) {
      if (!isSlugConflict(error) || attempt >= MAX_SLUG_ATTEMPTS) throw error;
    }
  }
}

export async function createFiche(value: InsertFiche) {
  return (await prisma.fiche.create({ data: value })).id;
}

// --- Fiche autonome : créée sans compte ou rattachée à un compte existant ---
export async function createStandaloneFiche(input: {
  fiche: Omit<InsertFiche, "ownerId" | "slug">;
  ownerId?: number | null;
}) {
  return withSlugRetry(() => prisma.$transaction(async tx => {
    let ownerId: number | null = null;
    if (input.ownerId != null) {
      const owner = await tx.user.findUnique({
        where: { id: input.ownerId },
        include: { clientCredential: true },
      });
      if (
        !owner ||
        owner.role !== "user" ||
        owner.loginMethod !== "local-client" ||
        !owner.clientCredential
      ) {
        throw new Error("OWNER_NOT_FOUND");
      }
      ownerId = owner.id;
    }
    const slug = await generateUniqueSlug(tx, input.fiche);
    return tx.fiche.create({
      data: { ...input.fiche, slug, ownerId },
    });
  }));
}
export async function updateFiche(
  id: number,
  value: Prisma.FicheUncheckedUpdateInput
) {
  await prisma.fiche.update({ where: { id }, data: value });
  return true;
}
export async function recordScan(fiche: Fiche) {
  const today = new Date().toISOString().slice(0, 10);
  await prisma.$transaction([
    prisma.fiche.update({
      where: { id: fiche.id },
      data: { scansTotal: { increment: 1 }, lastScanAt: new Date() },
    }),
    prisma.ficheScan.upsert({
      where: { ficheId_scanDate: { ficheId: fiche.id, scanDate: today } },
      create: { ficheId: fiche.id, scanDate: today, count: 1 },
      update: { count: { increment: 1 } },
    }),
  ]);
}
export async function createContactRequest(input: {
  ficheId: number;
  name: string;
  phone: string;
  message: string;
}) {
  return prisma.contactRequest.create({ data: input });
}
export async function listContactRequests(ficheId: number) {
  return prisma.contactRequest.findMany({
    where: { ficheId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
export async function getOverview() {
  await ensureDemoFiches();
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const renewalLimit = new Date(startOfToday);
  renewalLimit.setUTCDate(renewalLimit.getUTCDate() + 30);
  renewalLimit.setUTCHours(23, 59, 59, 999);
  const [total, active, scans, expiring] = await Promise.all([
    prisma.fiche.count(),
    prisma.fiche.count({
      where: {
        statut: "active",
        dateEcheance: { gte: startOfToday },
      },
    }),
    prisma.fiche.aggregate({ _sum: { scansTotal: true } }),
    prisma.fiche.count({
      where: {
        statut: "active",
        dateEcheance: { gte: startOfToday, lte: renewalLimit },
      },
    }),
  ]);
  return { total, active, scans: scans._sum.scansTotal ?? 0, expiring };
}

// Espace client
// --- Comptes clients : création atomique compte + fiche ---
export async function createClientAccountWithFiche(input: {
  user: {
    name?: string | null;
    email?: string | null;
  };
  credential: {
    username: string;
    passwordHash: string;
  };
  fiche: Omit<InsertFiche, "ownerId" | "slug">;
  cardNumero?: string;
}) {
  return withSlugRetry(() => prisma.$transaction(async tx => {
    const existingUsername = await tx.clientCredential.findUnique({
      where: { username: input.credential.username },
    });
    if (existingUsername) throw new Error("CLIENT_USERNAME_EXISTS");

    const user = await tx.user.create({
      data: {
        name: input.user.name ?? null,
        email: input.user.email ?? null,
        loginMethod: "local-client",
        role: "user",
        // Fiche.formule is the source of truth for client-space capabilities.
        // User.formule is kept only as account-level compatibility metadata.
        formule: input.fiche.formule,
      },
    });

    const slug = await generateUniqueSlug(tx, input.fiche);
    const fiche = await tx.fiche.create({
      data: {
        ...input.fiche,
        slug,
        ownerId: user.id,
      },
    });

    const credential = await tx.clientCredential.create({
      data: {
        userId: user.id,
        username: input.credential.username,
        passwordHash: input.credential.passwordHash,
        mustChangePassword: true,
      },
    });

    let card = null;
    if (input.cardNumero !== undefined) {
      const numero =
        input.cardNumero.trim() ||
        `SC-${randomBytes(6).toString("hex").toUpperCase()}`;
      card = await tx.membershipCard.create({
        data: {
          ficheId: fiche.id,
          numero,
        },
      });
    }

    return { user, fiche, credential, card };
  }));
}

// --- Fiches côté client ---
export async function listFichesByOwner(ownerId: number) {
  return prisma.fiche.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFicheOwnedBy(id: number, ownerId: number) {
  return prisma.fiche.findFirst({ where: { id, ownerId } });
}

// --- Comptes clients (un compte peut posséder plusieurs fiches) ---
export async function searchClientUsers(query: string) {
  const q = query.trim();
  return prisma.user.findMany({
    where: {
      role: "user",
      loginMethod: "local-client",
      clientCredential: { isNot: null },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { fiche: true } } },
    orderBy: { lastSignedIn: "desc" },
    take: 15,
  });
}

export async function attachFicheToOwner(ficheId: number, ownerId: number) {
  return prisma.$transaction(async tx => {
    const fiche = await tx.fiche.findUnique({ where: { id: ficheId } });
    if (!fiche) throw new Error("FICHE_NOT_FOUND");
    if (fiche.ownerId) throw new Error("FICHE_ALREADY_OWNED");
    const owner = await tx.user.findUnique({
      where: { id: ownerId },
      include: { clientCredential: true },
    });
    if (
      !owner ||
      owner.role !== "user" ||
      owner.loginMethod !== "local-client" ||
      !owner.clientCredential
    ) {
      throw new Error("OWNER_NOT_FOUND");
    }
    return tx.fiche.update({ where: { id: ficheId }, data: { ownerId } });
  });
}

export async function getFicheOwner(ficheId: number) {
  return prisma.fiche.findUnique({
    where: { id: ficheId },
    select: {
      ownerId: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          loginMethod: true,
          role: true,
          _count: { select: { fiche: true } },
        },
      },
    },
  });
}

export async function changeFicheOwner(ficheId: number, ownerId: number) {
  return prisma.$transaction(async tx => {
    const fiche = await tx.fiche.findUnique({ where: { id: ficheId } });
    if (!fiche) throw new Error("FICHE_NOT_FOUND");

    const owner = await tx.user.findUnique({
      where: { id: ownerId },
      include: { clientCredential: true },
    });
    if (
      !owner ||
      owner.role !== "user" ||
      owner.loginMethod !== "local-client" ||
      !owner.clientCredential
    ) {
      throw new Error("OWNER_NOT_FOUND");
    }

    return tx.fiche.update({
      where: { id: ficheId },
      data: { ownerId },
    });
  });
}

export async function detachFicheOwner(ficheId: number) {
  const fiche = await prisma.fiche.findUnique({ where: { id: ficheId } });
  if (!fiche) throw new Error("FICHE_NOT_FOUND");
  if (!fiche.ownerId) throw new Error("FICHE_NOT_OWNED");

  return prisma.fiche.update({
    where: { id: ficheId },
    data: { ownerId: null },
  });
}

// --- Scans agrégés (réutilisé par admin ET client) ---
export async function listScansForFiche(ficheId: number, days = 30) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const rows = await prisma.ficheScan.findMany({
    where: {
      ficheId,
      scanDate: { gte: startDate, lte: endDate },
    },
    orderBy: { scanDate: "asc" },
  });

  const byDate = new Map(rows.map(row => [row.scanDate, row.count]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const scanDate = date.toISOString().slice(0, 10);
    return {
      scanDate,
      count: byDate.get(scanDate) ?? 0,
    };
  });
}

// --- Cartes membres ---
export async function listMembershipCards(ficheId: number) {
  return prisma.membershipCard.findMany({
    where: { ficheId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createMembershipCard(input: InsertMembershipCard) {
  return prisma.membershipCard.create({ data: input });
}
