import { COOKIE_NAME } from "@shared/const";
import { mediaRules } from "@shared/mediaRules";
import { getPlanFeatures } from "@shared/planFeatures";
import { fichePayload } from "@shared/types/schemas";
import { TRPCError } from "@trpc/server";
import {
  assertCanEditFiche,
  assertCanViewFiche,
  assertCanManageOrganizationMembers,
  getOrganizationForUser,
  listAccessibleFiches,
  listOrganizationsForUser,
} from "./authorization";
import { Fiche } from "generated/prisma/client";
import { imageSize } from "image-size";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import {
  adminProcedure,
  clientProcedure,
  publicProcedure,
  router,
} from "./_core/trpc";
import {
  listClientDashboard,
  listInvitationsForFiche,
  revokeInvitation,
  updateMembershipCardStatus,
} from "./clientSpace";
import {
  attachFicheToOwner,
  assignFicheToOrganization,
  createContactRequest,
  createFicheAccess,
  createOrganization,
  createOrganizationInvitation,
  createFiche,
  createInvitation,
  createMembershipCard,
  getFicheById,
  getFicheBySlug,
  getOverview,
  listContactRequests,
  listFiches,
  listMembershipCards,
  listScansForFiche,
  recordScan,
  revokeFicheAccess,
  searchClientUsers,
  updateFiche,
} from "./db";
import { validatePlanPayload } from "./planValidation";
import { storagePut } from "./storage";

function parseFiche<T extends { dataJson: string }>(fiche: T) {
  const { dataJson, ...rest } = fiche;
  return { ...rest, data: JSON.parse(dataJson || "{}") };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  fiches: router({
    list: adminProcedure.query(async () => {
      const rows = await listFiches();
      return rows.map((row: Fiche) => ({
        ...parseFiche(row),
        plan: getPlanFeatures(row.formule),
      }));
    }),
    overview: adminProcedure.query(async () => getOverview()),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const fiche = await getFicheBySlug(input.slug);
        if (!fiche)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable",
          });
        return { ...parseFiche(fiche), plan: getPlanFeatures(fiche.formule) };
      }),
    recordScan: publicProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ input }) => {
        const fiche = await getFicheBySlug(input.slug);
        if (fiche && fiche.statut === "active") await recordScan(fiche);
        return { ok: true };
      }),
    create: adminProcedure.input(fichePayload).mutation(async ({ input }) => {
      const existing = await getFicheBySlug(input.slug);
      if (existing)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ce slug existe déjà.",
        });
      const createdAt = new Date();
      const dateEcheance = new Date(createdAt);
      dateEcheance.setFullYear(dateEcheance.getFullYear() + 1);
      const errors =
        input.statut === "active"
          ? validatePlanPayload({ ...input, data: input.data })
          : [];
      if (errors.length)
        throw new TRPCError({ code: "BAD_REQUEST", message: errors.join(" ") });
      const { data, ...fields } = input;
      const id = await createFiche({
        ...fields,
        dataJson: JSON.stringify(data),
        dateCreation: createdAt,
        dateEcheance,
      });
      return { id, slug: input.slug };
    }),
    update: adminProcedure
      .input(fichePayload.extend({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const current = await getFicheById(input.id);
        if (!current)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable",
          });
        const duplicate = await getFicheBySlug(input.slug);
        if (duplicate && duplicate.id !== input.id)
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ce slug existe déjà.",
          });
        if (input.statut === "active") {
          const errors = validatePlanPayload({ ...input, data: input.data });
          if (errors.length)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: errors.join(" "),
            });
        }
        const { id, data, ...fields } = input;
        await updateFiche(id, { ...fields, dataJson: JSON.stringify(data) });
        return { ok: true, slug: input.slug } as const;
      }),
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          statut: z.enum(["active", "suspendue", "supprimee", "brouillon"]),
        })
      )
      .mutation(async ({ input }) => {
        const fiche = await getFicheById(input.id);
        if (!fiche)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable",
          });
        if (input.statut === "active") {
          const errors = validatePlanPayload({
            formule: fiche.formule,
            photo: fiche.photo,
            logo: fiche.logo,
            googlePlaceId: fiche.googlePlaceId,
            data: JSON.parse(fiche.dataJson || "{}"),
          });
          if (errors.length)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: errors.join(" "),
            });
        }
        const ok = await updateFiche(input.id, { statut: input.statut });
        return { ok };
      }),
    contact: publicProcedure
      .input(
        z.object({
          slug: z.string(),
          name: z.string().min(2).max(120),
          phone: z.string().min(8).max(32),
          message: z.string().min(2).max(2000),
        })
      )
      .mutation(async ({ input }) => {
        const fiche = await getFicheBySlug(input.slug);
        if (!fiche)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable",
          });
        if (!getPlanFeatures(fiche.formule).hasForm)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Le formulaire n'est pas inclus dans cette formule.",
          });
        await createContactRequest({
          ficheId: fiche.id,
          name: input.name.trim(),
          phone: input.phone.trim(),
          message: input.message.trim(),
        });
        return { ok: true } as const;
      }),
    contactRequests: adminProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const fiche = await getFicheBySlug(input.slug);
        if (!fiche)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable",
          });
        return listContactRequests(fiche.id);
      }),
  }),
  media: router({
    upload: adminProcedure
      .input(
        z.object({
          formula: z.enum(["essentiel", "pro", "signature"]),
          kind: z.enum(["profile", "logo", "gallery"]),
          filename: z.string().min(1).max(160),
          mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
          contentBase64: z.string().min(20),
        })
      )
      .mutation(async ({ input }) => {
        const features = getPlanFeatures(input.formula);
        if (input.kind === "gallery" && features.maxPhotos === 0)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "La formule Essentiel ne permet pas de galerie.",
          });
        const raw = input.contentBase64.replace(/^data:[^;]+;base64,/, "");
        const bytes = Buffer.from(raw, "base64");
        const maxBytes = mediaRules[input.kind].maxBytes;
        if (bytes.byteLength > maxBytes)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Image trop lourde : maximum ${Math.round(maxBytes / 1024)} ko.`,
          });
        let dimensions: ReturnType<typeof imageSize>;
        try {
          dimensions = imageSize(bytes);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le fichier ne contient pas une image valide.",
          });
        }
        const expectedType =
          input.mimeType === "image/jpeg"
            ? "jpg"
            : input.mimeType.split("/")[1];
        if (dimensions.type !== expectedType)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le type déclaré ne correspond pas au contenu de l’image.",
          });
        const rule = mediaRules[input.kind];
        if (
          !dimensions.width ||
          !dimensions.height ||
          dimensions.width > rule.maxWidth ||
          dimensions.height > rule.maxHeight
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Dimensions invalides : maximum ${rule.maxWidth} × ${rule.maxHeight} px.`,
          });
        if (
          input.kind === "profile" &&
          (dimensions.width !== 400 || dimensions.height !== 400)
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le portrait doit mesurer exactement 400 × 400 px.",
          });
        const extension = input.mimeType.split("/")[1];
        const result = await storagePut(
          `fiches/media/${input.kind}/${input.filename.replace(/[^a-z0-9._-]/gi, "-")}.${extension}`,
          bytes,
          input.mimeType
        );
        return { ...result, bytes: bytes.byteLength };
      }),
  }),
  admin: router({
    inviteOwner: adminProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const fiche = await getFicheById(input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable.",
          });
        if (fiche.ownerId)
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cette fiche a déjà un propriétaire.",
          });
        const token = await createInvitation(input.ficheId);
        return { token, url: `/espace-client/invite/${token}` };
      }),
    createOrganization: adminProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(180),
          type: z.enum(["PERSONAL", "BUSINESS"]),
        })
      )
      .mutation(({ input }) => createOrganization(input)),

    assignFicheToOrganization: adminProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          organizationId: z.number().int().positive(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await assignFicheToOrganization(input.ficheId, input.organizationId);
          return { ok: true } as const;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "ASSIGNMENT_FAILED";
          if (message === "FICHE_NOT_FOUND" || message === "ORGANIZATION_NOT_FOUND") {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ressource introuvable." });
          }
          throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible d'affecter la fiche." });
        }
      }),

    inviteOrganizationMember: adminProcedure
      .input(
        z.object({
          organizationId: z.number().int().positive(),
          role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
          ficheId: z.number().int().positive().nullable().optional(),
          invitedUserId: z.number().int().positive().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        if (input.role === "OWNER" && input.ficheId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Une invitation OWNER est au niveau de l'organisation et ne cible pas une fiche.",
          });
        }
        try {
          const invitation = await createOrganizationInvitation(input);
          return {
            token: invitation.token,
            url: `/espace-client/invite/${invitation.token}`,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (message === "ORGANIZATION_NOT_FOUND" || message === "FICHE_NOT_IN_ORGANIZATION") {
            throw new TRPCError({ code: "NOT_FOUND", message: "Organisation ou fiche introuvable." });
          }
          throw error;
        }
      }),

    grantFicheAccess: adminProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          membershipId: z.number().int().positive(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await createFicheAccess(input.ficheId, input.membershipId);
          return { ok: true } as const;
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (message === "FICHE_NOT_FOUND" || message === "MEMBERSHIP_NOT_FOUND") {
            throw new TRPCError({ code: "NOT_FOUND", message: "Ressource introuvable." });
          }
          throw new TRPCError({ code: "BAD_REQUEST", message: "Accès incompatible avec l'organisation." });
        }
      }),

    revokeFicheAccess: adminProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          membershipId: z.number().int().positive(),
        })
      )
      .mutation(({ input }) => revokeFicheAccess(input.ficheId, input.membershipId)),

    searchClientUsers: adminProcedure
      .input(z.object({ query: z.string().max(160).optional().default("") }))
      .query(({ input }) => searchClientUsers(input.query)),
    attachFicheToOwner: adminProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          ownerId: z.number().int().positive(),
        })
      )
      .mutation(async ({ input }) => {
        const fiche = await getFicheById(input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable.",
          });
        if (fiche.ownerId)
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cette fiche a déjà un propriétaire.",
          });
        try {
          await attachFicheToOwner(input.ficheId, input.ownerId);
        } catch (err) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              err instanceof Error && err.message === "OWNER_NOT_FOUND"
                ? "Compte client introuvable."
                : "Impossible de rattacher cette fiche.",
          });
        }
        return { ok: true } as const;
      }),
    listInvitations: adminProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const fiche = await getFicheById(input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable.",
          });
        return listInvitationsForFiche(input.ficheId);
      }),
    revokeInvitation: adminProcedure
      .input(z.object({ invitationId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        try {
          return await revokeInvitation(input.invitationId);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "INVITATION_NOT_FOUND"
          )
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Invitation introuvable.",
            });
          if (
            error instanceof Error &&
            error.message === "INVITATION_ALREADY_USED"
          )
            throw new TRPCError({
              code: "CONFLICT",
              message: "Cette invitation a déjà été utilisée.",
            });
          throw error;
        }
      }),
    listMembershipCards: adminProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const fiche = await getFicheById(input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable.",
          });
        return listMembershipCards(input.ficheId);
      }),
    createMembershipCard: adminProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          numero: z.string().trim().min(1).max(80),
        })
      )
      .mutation(async ({ input }) => {
        const fiche = await getFicheById(input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fiche introuvable.",
          });
        try {
          return await createMembershipCard(input);
        } catch (error) {
          if ((error as { code?: string })?.code === "P2002")
            throw new TRPCError({
              code: "CONFLICT",
              message: "Ce numéro de carte existe déjà.",
            });
          throw error;
        }
      }),
    updateMembershipCardStatus: adminProcedure
      .input(
        z.object({
          cardId: z.number().int().positive(),
          statut: z.enum(["active", "perdue", "revoquee"]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await updateMembershipCardStatus(input.cardId, input.statut);
        } catch (error) {
          if ((error as { code?: string })?.code === "P2025")
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Carte introuvable.",
            });
          throw error;
        }
      }),
  }),
  clientSpaceRouter: router({
    myOrganizations: clientProcedure.query(({ ctx }) =>
      listOrganizationsForUser(ctx.user.id)
    ),
    myFiches: clientProcedure.query(({ ctx }) =>
      listAccessibleFiches(ctx.user.id)
    ),
    organization: clientProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const organization = await getOrganizationForUser(ctx.user.id, input.organizationId);
        if (!organization) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Vous n'avez pas accès à cette organisation.",
          });
        }
        const membership = organization.memberships.find(m => m.user.id === ctx.user.id);
        if (!membership) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé." });
        }
        return {
          id: organization.id,
          name: organization.name,
          type: organization.type,
          createdAt: organization.createdAt,
          role: membership.role,
          canManage: membership.role === "OWNER",
          fiches: organization.fiches,
          members: membership.role === "OWNER"
            ? organization.memberships.map(m => ({
                id: m.id,
                userId: m.user.id,
                name: m.user.name,
                email: m.user.email,
                role: m.role,
                createdAt: m.createdAt,
                accessCount: m.ficheAccess.length,
                ficheIds: m.ficheAccess.map(a => a.ficheId),
              }))
            : [],
        };
      }),
    organizationMembers: clientProcedure
      .input(z.object({ organizationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await assertCanManageOrganizationMembers(ctx.user.id, input.organizationId);
        const organization = await getOrganizationForUser(ctx.user.id, input.organizationId);
        if (!organization) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé." });
        }
        return organization.memberships.map(m => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          createdAt: m.createdAt,
          ficheIds: m.ficheAccess.map(a => a.ficheId),
        }));
      }),
    dashboard: clientProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const { fiche } = await assertCanViewFiche(ctx.user.id, input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Fiche introuvable.",
          });
        const dashboard = await listClientDashboard(input.ficheId);
        return {
          ...dashboard,
          fiche: dashboard.fiche
            ? {
                ...parseFiche(dashboard.fiche),
                plan: getPlanFeatures(dashboard.fiche.formule),
              }
            : null,
        };
      }),
    ficheDetail: clientProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const { fiche } = await assertCanViewFiche(ctx.user.id, input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Fiche introuvable.",
          });
        return { ...parseFiche(fiche), plan: getPlanFeatures(fiche.formule) };
      }),
    scans: clientProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          days: z
            .union([z.literal(7), z.literal(30), z.literal(90)])
            .optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const { fiche } = await assertCanViewFiche(ctx.user.id, input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Fiche introuvable.",
          });
        return listScansForFiche(input.ficheId, input.days ?? 30);
      }),
    contactRequests: clientProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const { fiche } = await assertCanViewFiche(ctx.user.id, input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Fiche introuvable.",
          });
        return listContactRequests(input.ficheId);
      }),
    membershipCards: clientProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const { fiche } = await assertCanViewFiche(ctx.user.id, input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Fiche introuvable.",
          });
        return listMembershipCards(input.ficheId);
      }),
    updateSignature: clientProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          nom: z.string().min(1),
          prenom: z.string().min(1),
          fonction: z.string().min(1),
          entreprise: z.string().min(1),
          telephone: z.string().min(8),
          whatsapp: z.string().min(8),
          email: z.string().optional().default(""),
          site: z.string().optional().default(""),
          adresse: z.string().optional().default(""),
          lienItineraire: z.string().optional().default(""),
          googlePlaceId: z.string().optional().default(""),
          photo: z.string().optional().default(""),
          logo: z.string().optional().default(""),
          data: fichePayload.shape.data,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { fiche } = await assertCanEditFiche(ctx.user.id, input.ficheId);
        if (!fiche)
          throw new TRPCError({ code: "FORBIDDEN", message: "Fiche introuvable." });
        if (fiche.formule !== "signature")
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "La modification complète est réservée à la formule Signature.",
          });

        const links = input.data.liens ?? [];
        const photos = input.data.galerie ?? [];
        const errors: string[] = [];
        if (!input.photo?.trim() || !input.logo?.trim())
          errors.push("Un portrait et un logo sont obligatoires pour une fiche Signature.");
        if (links.length > 10)
          errors.push("La formule Signature autorise au maximum 10 liens.");
        if (photos.length > 8)
          errors.push("La formule Signature autorise au maximum 8 photos dans la galerie.");
        if (errors.length)
          throw new TRPCError({ code: "BAD_REQUEST", message: errors.join(" ") });

        const { ficheId, data, ...fields } = input;
        await updateFiche(ficheId, {
          ...fields,
          dataJson: JSON.stringify({
            ...JSON.parse(fiche.dataJson || "{}"),
            ...data,
            notesInternes: JSON.parse(fiche.dataJson || "{}").notesInternes ?? "",
          }),
        });
        return { ok: true } as const;
      }),

    uploadMedia: clientProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          kind: z.enum(["profile", "logo", "gallery"]),
          filename: z.string().min(1).max(160),
          mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
          contentBase64: z.string().min(20),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { fiche } = await assertCanEditFiche(ctx.user.id, input.ficheId);
        if (!fiche)
          throw new TRPCError({ code: "FORBIDDEN", message: "Fiche introuvable." });
        if (fiche.formule !== "signature")
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "L’envoi de médias depuis l’espace client est réservé à la formule Signature.",
          });

        const currentData = JSON.parse(fiche.dataJson || "{}") as {
          galerie?: unknown[];
        };
        const maxPhotos = getPlanFeatures("signature").maxPhotos;
        if (input.kind === "gallery" && (currentData.galerie?.length ?? 0) >= maxPhotos)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `La galerie Signature est limitée à ${maxPhotos} photos.`,
          });

        const raw = input.contentBase64.replace(/^data:[^;]+;base64,/, "");
        const bytes = Buffer.from(raw, "base64");
        const maxBytes = mediaRules[input.kind].maxBytes;
        if (bytes.byteLength > maxBytes)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Image trop lourde : maximum ${Math.round(maxBytes / 1024)} ko.`,
          });

        let dimensions: ReturnType<typeof imageSize>;
        try {
          dimensions = imageSize(bytes);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le fichier ne contient pas une image valide.",
          });
        }

        const expectedType =
          input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1];
        if (dimensions.type !== expectedType)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le type déclaré ne correspond pas au contenu de l’image.",
          });

        const rule = mediaRules[input.kind];
        if (
          !dimensions.width ||
          !dimensions.height ||
          dimensions.width > rule.maxWidth ||
          dimensions.height > rule.maxHeight
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Dimensions invalides : maximum ${rule.maxWidth} × ${rule.maxHeight} px.`,
          });

        if (
          input.kind === "profile" &&
          (dimensions.width !== 400 || dimensions.height !== 400)
        )
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le portrait doit mesurer exactement 400 × 400 px.",
          });

        const extension = input.mimeType.split("/")[1];
        const result = await storagePut(
          `fiches/media/${input.kind}/${input.filename.replace(/[^a-z0-9._-]/gi, "-")}.${extension}`,
          bytes,
          input.mimeType
        );
        return { ...result, bytes: bytes.byteLength };
      }),

    updateContact: clientProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          nom: z.string().min(1),
          prenom: z.string().min(1),
          fonction: z.string().min(1),
          entreprise: z.string().min(1),
          telephone: z.string().min(8),
          whatsapp: z.string().min(8),
          email: z.string().optional().default(""),
          site: z.string().optional().default(""),
          adresse: z.string().optional().default(""),
          lienItineraire: z.string().optional().default(""),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { fiche } = await assertCanEditFiche(ctx.user.id, input.ficheId);
        if (!fiche)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Fiche introuvable.",
          });
        if (fiche.formule !== "signature")
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "La modification de la fiche est réservée à la formule Signature.",
          });
        const { ficheId, ...fields } = input;
        await updateFiche(ficheId, fields);
        return { ok: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
