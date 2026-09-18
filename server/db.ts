// ? Centralized database connection file

import type {
  Fiche,
  Prisma,
  PrismaClient as PrismaClientType,
} from "generated/prisma/client";
import { randomBytes } from "node:crypto";
import { prisma } from "../prisma/client";
import { ENV } from "./_core/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export type { Fiche, User } from "generated/prisma/client";
export type InsertFiche = Prisma.FicheUncheckedCreateInput;
export type InsertUser = Prisma.UserUncheckedCreateInput;
export type InsertMembershipCard = Prisma.MembershipCardUncheckedCreateInput;

export async function upsertUser(
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
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
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
        : user.openId === ENV.ownerOpenId
          ? { role: "admin" as const }
          : {}),
      lastSignedIn: user.lastSignedIn ?? new Date(),
    },
  });
}

export async function getUserByOpenId(openId: string) {
  return prisma.user.findUnique({ where: { openId } });
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
export async function getFicheBySlug(slug: string) {
  await ensureDemoFiches();
  return prisma.fiche.findUnique({ where: { slug } });
}
export async function getFicheById(id: number) {
  return prisma.fiche.findUnique({ where: { id } });
}
export async function createFiche(value: InsertFiche) {
  return (await prisma.fiche.create({ data: value })).id;
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
  const [total, active, scans, expiring] = await Promise.all([
    prisma.fiche.count(),
    prisma.fiche.count({ where: { statut: "active" } }),
    prisma.fiche.aggregate({ _sum: { scansTotal: true } }),
    prisma.fiche.count({
      where: {
        dateEcheance: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        statut: { not: "supprimee" },
      },
    }),
  ]);
  return { total, active, scans: scans._sum.scansTotal ?? 0, expiring };
}

// Espace client
// --- Comptes clients : création atomique compte + fiche ---
export async function createClientAccountWithFiche(input: {
  user: {
    openId: string;
    name?: string | null;
    email?: string | null;
    formule: "essentiel" | "pro" | "signature";
  };
  credential: {
    username: string;
    passwordHash: string;
  };
  fiche: Omit<InsertFiche, "ownerId">;
  cardNumero?: string;
}) {
  return prisma.$transaction(async tx => {
    const existingUser = await tx.user.findUnique({
      where: { openId: input.user.openId },
    });
    if (existingUser) throw new Error("CLIENT_ACCOUNT_EXISTS");

    const existingUsername = await tx.clientCredential.findUnique({
      where: { username: input.credential.username },
    });
    if (existingUsername) throw new Error("CLIENT_USERNAME_EXISTS");

    const user = await tx.user.create({
      data: {
        openId: input.user.openId,
        name: input.user.name ?? null,
        email: input.user.email ?? null,
        loginMethod: "local-client",
        role: "user",
        formule: input.user.formule,
      },
    });

    const fiche = await tx.fiche.create({
      data: {
        ...input.fiche,
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
      const numero = input.cardNumero.trim() || `SC-${randomBytes(6).toString("hex").toUpperCase()}`;
      card = await tx.membershipCard.create({
        data: {
          ficheId: fiche.id,
          numero,
        },
      });
    }

    return { user, fiche, credential, card };
  });
}


// --- Invitations ---
export async function createInvitation(ficheId: number, ttlDays = 7) {
  const token = randomBytes(32).toString("base64url");
  const expireLe = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  await prisma.invitationClient.create({ data: { ficheId, token, expireLe } });
  return token;
}

export async function getInvitationByToken(token: string) {
  return prisma.invitationClient.findUnique({ where: { token } });
}

// Consomme le token et rattache la fiche à l'utilisateur, dans une seule
// transaction pour éviter une invitation utilisée deux fois en concurrence.
export async function consumeInvitation(token: string, userId: number) {
  return prisma.$transaction(async tx => {
    const invitation = await tx.invitationClient.findUnique({
      where: { token },
    });
    if (!invitation) throw new Error("INVITATION_NOT_FOUND");
    if (invitation.utilisee) throw new Error("INVITATION_ALREADY_USED");
    if (invitation.expireLe < new Date()) throw new Error("INVITATION_EXPIRED");

    const fiche = await tx.fiche.findUnique({
      where: { id: invitation.ficheId },
    });
    if (!fiche) throw new Error("FICHE_NOT_FOUND");
    if (fiche.ownerId) throw new Error("FICHE_ALREADY_OWNED");

    await tx.fiche.update({
      where: { id: fiche.id },
      data: { ownerId: userId },
    });
    await tx.invitationClient.update({
      where: { id: invitation.id },
      data: { utilisee: true },
    });
    return fiche;
  });
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
    const owner = await tx.user.findUnique({ where: { id: ownerId } });
    if (!owner || owner.role !== "user") throw new Error("OWNER_NOT_FOUND");
    return tx.fiche.update({ where: { id: ficheId }, data: { ownerId } });
  });
}

// --- Scans agrégés (réutilisé par admin ET client) ---
export async function listScansForFiche(ficheId: number, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return prisma.ficheScan.findMany({
    where: { ficheId, scanDate: { gte: since } },
    orderBy: { scanDate: "asc" },
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
