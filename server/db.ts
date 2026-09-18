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

export async function createOrganization(input: { name: string; type: "PERSONAL" | "BUSINESS" }) {
  return prisma.organization.create({ data: input });
}

export async function assignFicheToOrganization(ficheId: number, organizationId: number) {
  const [fiche, organization] = await Promise.all([
    prisma.fiche.findUnique({ where: { id: ficheId } }),
    prisma.organization.findUnique({ where: { id: organizationId } }),
  ]);
  if (!fiche) throw new Error("FICHE_NOT_FOUND");
  if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");
  return prisma.fiche.update({
    where: { id: ficheId },
    data: { organizationId },
  });
}

export async function createFicheAccess(input: { ficheId: number; membershipId: number }) {
  const [fiche, membership] = await Promise.all([
    prisma.fiche.findUnique({ where: { id: input.ficheId }, select: { id: true, organizationId: true } }),
    prisma.organizationMembership.findUnique({ where: { id: input.membershipId }, select: { id: true, organizationId: true, role: true } }),
  ]);
  if (!fiche) throw new Error("FICHE_NOT_FOUND");
  if (!membership) throw new Error("MEMBERSHIP_NOT_FOUND");
  if (!fiche.organizationId) throw new Error("FICHE_NOT_ASSIGNED_TO_ORGANIZATION");
  if (fiche.organizationId !== membership.organizationId) throw new Error("ORGANIZATION_MISMATCH");
  if (membership.role === "OWNER") return null;
  return prisma.ficheAccess.upsert({
    where: { ficheId_membershipId: { ficheId: input.ficheId, membershipId: input.membershipId } },
    create: { ficheId: input.ficheId, membershipId: input.membershipId },
    update: {},
  });
}

export async function revokeFicheAccess(input: { ficheId: number; membershipId: number }) {
  return prisma.ficheAccess.deleteMany({
    where: { ficheId: input.ficheId, membershipId: input.membershipId },
  });
}

// --- Invitations ---
export async function createOrganizationInvitation(input: {
  organizationId: number;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  ficheId?: number | null;
  invitedUserId?: number | null;
  ttlDays?: number;
}) {
  if (input.role === "OWNER" && input.ficheId != null) {
    throw new Error("OWNER_INVITATION_CANNOT_TARGET_FICHE");
  }

  const token = randomBytes(32).toString("base64url");
  const expireLe = new Date(
    Date.now() + (input.ttlDays ?? 7) * 24 * 60 * 60 * 1000
  );

  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
  });
  if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");

  if (input.ficheId != null) {
    const fiche = await prisma.fiche.findFirst({
      where: {
        id: input.ficheId,
        organizationId: input.organizationId,
      },
    });
    if (!fiche) throw new Error("FICHE_NOT_IN_ORGANIZATION");
  }

  return prisma.invitationClient.create({
    data: {
      organizationId: input.organizationId,
      ficheId: input.ficheId ?? null,
      role: input.role,
      invitedUserId: input.invitedUserId ?? null,
      token,
      expireLe,
    },
  });
}

// Transitional compatibility helper. New callers should create invitations
// from the organization context, not from ownerId.
export async function createInvitation(ficheId: number, ttlDays = 7) {
  const fiche = await prisma.fiche.findUnique({ where: { id: ficheId } });
  if (!fiche?.organizationId) throw new Error("FICHE_NOT_ASSIGNED_TO_ORGANIZATION");
  const invitation = await createOrganizationInvitation({
    organizationId: fiche.organizationId,
    role: "OWNER",
    ficheId: null,
    ttlDays,
  });
  return invitation.token;
}

export async function getInvitationByToken(token: string) {
  return prisma.invitationClient.findUnique({ where: { token } });
}

export async function consumeInvitation(token: string, userId: number) {
  return prisma.$transaction(async tx => {
    const invitation = await tx.invitationClient.findUnique({
      where: { token },
    });
    if (!invitation) throw new Error("INVITATION_NOT_FOUND");
    if (invitation.utilisee) throw new Error("INVITATION_ALREADY_USED");
    if (invitation.revokedAt) throw new Error("INVITATION_REVOKED");
    if (invitation.expireLe < new Date()) throw new Error("INVITATION_EXPIRED");
    if (invitation.invitedUserId && invitation.invitedUserId !== userId) {
      throw new Error("INVITATION_USER_MISMATCH");
    }
    if (!invitation.organizationId) {
      throw new Error("INVITATION_ORGANIZATION_MISSING");
    }

    const organization = await tx.organization.findUnique({
      where: { id: invitation.organizationId },
    });
    if (!organization) throw new Error("ORGANIZATION_NOT_FOUND");

    const invitedRole =
      invitation.role === "OWNER"
        ? "OWNER"
        : invitation.role === "ADMIN"
          ? "ADMIN"
          : invitation.role === "VIEWER"
            ? "VIEWER"
            : "MEMBER";

    const existingMembership = await tx.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId,
        },
      },
    });

    const membership = existingMembership
      ? await tx.organizationMembership.update({
          where: { id: existingMembership.id },
          data:
            existingMembership.role === "OWNER"
              ? {}
              : { role: invitedRole },
        })
      : await tx.organizationMembership.create({
          data: {
            organizationId: organization.id,
            userId,
            role: invitedRole,
          },
        });

    if (invitation.role !== "OWNER" && invitation.ficheId) {
      const fiche = await tx.fiche.findFirst({
        where: {
          id: invitation.ficheId,
          organizationId: organization.id,
        },
      });
      if (!fiche) throw new Error("FICHE_NOT_IN_ORGANIZATION");

      await tx.ficheAccess.upsert({
        where: {
          ficheId_membershipId: {
            ficheId: fiche.id,
            membershipId: membership.id,
          },
        },
        create: {
          ficheId: fiche.id,
          membershipId: membership.id,
        },
        update: {},
      });
    }

    await tx.invitationClient.update({
      where: { id: invitation.id },
      data: {
        utilisee: true,
        acceptedAt: new Date(),
      },
    });

    return membership;
  });
}

// --- Fiches côté client ---
export async function listFichesByOwner(ownerId: number) {
  return prisma.fiche.findMany({
    where: {
      organization: {
        memberships: {
          some: { userId: ownerId, role: "OWNER" },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFicheOwnedBy(id: number, ownerId: number) {
  return prisma.fiche.findFirst({
    where: {
      id,
      organization: {
        memberships: {
          some: { userId: ownerId, role: "OWNER" },
        },
      },
    },
  });
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

export async function assignFicheToClientOrganization(ficheId: number, userId: number) {
  return prisma.$transaction(async tx => {
    const fiche = await tx.fiche.findUnique({ where: { id: ficheId } });
    if (!fiche) throw new Error("FICHE_NOT_FOUND");
    if (fiche.organizationId) throw new Error("FICHE_ALREADY_ASSIGNED");

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, email: true },
    });
    if (!user || user.role !== "user") throw new Error("CLIENT_NOT_FOUND");

    let organization = await tx.organization.findFirst({
      where: {
        type: "PERSONAL",
        memberships: {
          some: { userId, role: "OWNER" },
        },
      },
    });

    if (!organization) {
      organization = await tx.organization.create({
        data: {
          name: user.name?.trim() || user.email || `Compte personnel #${userId}`,
          type: "PERSONAL",
        },
      });
      await tx.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId,
          role: "OWNER",
        },
      });
    }

    return tx.fiche.update({
      where: { id: ficheId },
      data: { organizationId: organization.id },
    });
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
