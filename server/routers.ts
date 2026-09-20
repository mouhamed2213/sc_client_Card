import { COOKIE_NAME } from "@shared/const";
import { mediaRules } from "@shared/mediaRules";
import { getPlanFeatures, type PlanName } from "@shared/planFeatures";
import { getClientFicheCapabilities } from "@shared/clientFicheCapabilities";
import { fichePayload } from "@shared/types/schemas";
import { TRPCError } from "@trpc/server";
import { Fiche } from "generated/prisma/client";
import { imageSize } from "image-size";
import { z } from "zod";
import { prisma } from "../prisma/client";
import {
  generateClientUsername,
  generateTemporaryClientPassword,
  hashClientPassword,
} from "./_core/clientAuth";
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
  updateMembershipCardStatus,
} from "./clientSpace";
import {
  attachFicheToOwner,
  changeFicheOwner,
  detachFicheOwner,
  getFicheOwner,
  createClientAccountWithFiche,
  createStandaloneFiche,
  createContactRequest,
  createMembershipCard,
  getFicheById,
  getFicheBySlug,
  getFicheOwnedBy,
  getOverview,
  listContactRequests,
  listFiches,
  listFichesByOwner,
  listMembershipCards,
  listScansForFiche,
  recordScan,
  searchClientUsers,
  updateFiche,
} from "./db";
import { validatePlanPayload } from "./planValidation";
import { storagePut } from "./storage";
import { optimizeGalleryVideo } from "./videoProcessing";

function parseFiche<T extends { dataJson: string }>(fiche: T) {
  const { dataJson, ...rest } = fiche;
  return { ...rest, data: JSON.parse(dataJson || "{}") };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async opts => {
      if (!opts.ctx.user) return null;
      if (opts.ctx.user.role !== "user") {
        return {
          ...opts.ctx.user,
          mustChangePassword: false,
        };
      }
      const credential = await prisma.clientCredential.findUnique({
        where: { userId: opts.ctx.user.id },
        select: { mustChangePassword: true },
      });
      return {
        ...opts.ctx.user,
        mustChangePassword: credential?.mustChangePassword ?? false,
      };
    }),
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
    createStandaloneFiche: adminProcedure
      .input(z.object({ fiche: fichePayload, ownerId: z.number().int().positive().nullable().optional() }))
      .mutation(async ({ input }) => {
        const { data, ...fields } = input.fiche;
        const createdAt = new Date();
        const dateEcheance = new Date(createdAt);
        dateEcheance.setFullYear(dateEcheance.getFullYear() + 1);
        // A standalone fiche starts as a draft; plan validation is performed
        // when the studio activates it, not when the draft is created.
        try {
          const fiche = await createStandaloneFiche({
            ownerId: input.ownerId ?? null,
            fiche: {
              ...fields,
              dataJson: JSON.stringify(data),
              dateCreation: createdAt,
              dateEcheance,
            },
          });
          return { ok: true as const, ficheId: fiche.id, slug: fiche.slug };
        } catch (error) {
          if (error instanceof Error && error.message === "OWNER_NOT_FOUND") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Compte client introuvable." });
          }
          if ((error as { code?: string })?.code === "P2002") {
            throw new TRPCError({ code: "CONFLICT", message: "Ce slug existe déjà." });
          }
          throw error;
        }
      }),
    createClientAccountWithFiche: adminProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(160),
          email: z
            .string()
            .trim()
            .email()
            .max(320)
            .optional()
            .or(z.literal("")),
          formule: z.enum(["essentiel", "pro", "signature"]),
          fiche: fichePayload,
          createCard: z.boolean().default(false),
          cardNumero: z.string().trim().max(80).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { data, ...fields } = input.fiche;
        const createdAt = new Date();
        const dateEcheance = new Date(createdAt);
        dateEcheance.setFullYear(dateEcheance.getFullYear() + 1);

        if (fields.formule !== input.formule) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "La formule du compte et de la fiche doivent être identiques.",
          });
        }

        const errors =
          fields.statut === "active"
            ? validatePlanPayload({ ...fields, data })
            : [];
        if (errors.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: errors.join(" "),
          });
        }

        const username = generateClientUsername(input.name);
        const temporaryPassword = generateTemporaryClientPassword();

        try {
          const result = await createClientAccountWithFiche({
            user: {
              name: input.name,
              email: input.email || null,
            },
            credential: {
              username,
              passwordHash: hashClientPassword(temporaryPassword),
            },
            fiche: {
              ...fields,
              dataJson: JSON.stringify(data),
              dateCreation: createdAt,
              dateEcheance,
            },
            cardNumero: input.createCard ? input.cardNumero : undefined,
          });

          return {
            ok: true as const,
            userId: result.user.id,
            ficheId: result.fiche.id,
            username: result.credential.username,
            temporaryPassword,
            mustChangePassword: result.credential.mustChangePassword,
            cardId: result.card?.id ?? null,
          };
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "CLIENT_ACCOUNT_EXISTS"
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Ce compte client existe déjà.",
            });
          }
          if (
            error instanceof Error &&
            error.message === "CLIENT_USERNAME_EXISTS"
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Impossible de générer un identifiant unique. Réessayez.",
            });
          }
          throw error;
        }
      }),
    getFicheOwner: adminProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const fiche = await getFicheOwner(input.ficheId);
        if (!fiche) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable." });
        return fiche;
      }),
    changeFicheOwner: adminProcedure
      .input(z.object({
        ficheId: z.number().int().positive(),
        ownerId: z.number().int().positive(),
      }))
      .mutation(async ({ input }) => {
        try {
          await changeFicheOwner(input.ficheId, input.ownerId);
          return { ok: true } as const;
        } catch (err) {
          if (err instanceof Error && err.message === "FICHE_NOT_FOUND")
            throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable." });
          if (err instanceof Error && err.message === "OWNER_NOT_FOUND")
            throw new TRPCError({ code: "BAD_REQUEST", message: "Compte client introuvable." });
          throw err;
        }
      }),
    detachFicheOwner: adminProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        try {
          await detachFicheOwner(input.ficheId);
          return { ok: true } as const;
        } catch (err) {
          if (err instanceof Error && err.message === "FICHE_NOT_FOUND")
            throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable." });
          if (err instanceof Error && err.message === "FICHE_NOT_OWNED")
            throw new TRPCError({ code: "CONFLICT", message: "Cette fiche n'est rattachée à aucun compte." });
          throw err;
        }
      }),
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
    myFiches: clientProcedure.query(({ ctx }) =>
      listFichesByOwner(ctx.user.id)
    ),
    dashboard: clientProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const fiche = await getFicheOwnedBy(input.ficheId, ctx.user.id);
        if (!fiche)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Fiche introuvable.",
          });
        const dashboard = await listClientDashboard(input.ficheId);
        const plan = dashboard.fiche
          ? getPlanFeatures(dashboard.fiche.formule)
          : null;
        return {
          ...dashboard,
          recentRequests: plan?.hasForm ? dashboard.recentRequests : [],
          requestCount: plan?.hasForm ? dashboard.requestCount : 0,
          fiche: dashboard.fiche
            ? {
                ...parseFiche(dashboard.fiche),
                plan,
              }
            : null,
        };
      }),
    ficheDetail: clientProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const fiche = await getFicheOwnedBy(input.ficheId, ctx.user.id);
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
        const fiche = await getFicheOwnedBy(input.ficheId, ctx.user.id);
        if (!fiche)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Fiche introuvable.",
          });
        if (fiche.formule !== "signature")
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Les statistiques sont disponibles uniquement avec la formule Signature.",
          });
        return listScansForFiche(input.ficheId, input.days ?? 30);
      }),
    contactRequests: clientProcedure
      .input(z.object({ ficheId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const fiche = await getFicheOwnedBy(input.ficheId, ctx.user.id);
        if (!fiche)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Fiche introuvable.",
          });
        if (!getPlanFeatures(fiche.formule).hasForm)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Les demandes reçues sont disponibles uniquement avec la formule Signature.",
          });
        return listContactRequests(input.ficheId);
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
          data: fichePayload.shape.data.omit({ notesInternes: true }),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const fiche = await getFicheOwnedBy(input.ficheId, ctx.user.id);
        if (!fiche)
          throw new TRPCError({ code: "FORBIDDEN", message: "Fiche introuvable." });

        const plan = fiche.formule as PlanName;
        const capabilities = getClientFicheCapabilities(plan);
        const currentData = JSON.parse(fiche.dataJson || "{}") as Record<string, any>;
        const current = {
          site: fiche.site ?? "",
          photo: fiche.photo ?? "",
          logo: fiche.logo ?? "",
          googlePlaceId: fiche.googlePlaceId ?? "",
          presentation: currentData.presentation ?? "",
          rendezVous: currentData.rendezVous ?? { label: "Prendre rendez-vous", url: "" },
          reseauxSociaux: currentData.reseauxSociaux ?? [],
          liens: currentData.liens ?? [],
          galerie: currentData.galerie ?? [],
          sections: currentData.sections ?? [],
        };

        const locked: Array<{
          key: keyof typeof capabilities;
          field: string;
          next: unknown;
          previous: unknown;
        }> = [
          { key: "site", field: "site", next: input.site ?? "", previous: current.site },
          { key: "profile", field: "photo", next: input.photo ?? "", previous: current.photo },
          { key: "profile", field: "logo", next: input.logo ?? "", previous: current.logo },
          { key: "googleReview", field: "googlePlaceId", next: input.googlePlaceId ?? "", previous: current.googlePlaceId },
          { key: "presentation", field: "presentation", next: input.data.presentation ?? "", previous: current.presentation },
          { key: "rendezVous", field: "rendezVous", next: input.data.rendezVous, previous: current.rendezVous },
          { key: "socials", field: "reseauxSociaux", next: input.data.reseauxSociaux ?? [], previous: current.reseauxSociaux },
          { key: "links", field: "liens", next: input.data.liens ?? [], previous: current.liens },
          { key: "gallery", field: "galerie", next: input.data.galerie ?? [], previous: current.galerie },
          { key: "catalog", field: "sections", next: input.data.sections ?? [], previous: current.sections },
        ];

        for (const item of locked) {
          if (
            !capabilities[item.key].editable &&
            JSON.stringify(item.next) !== JSON.stringify(item.previous)
          ) {
            const upgrade = capabilities[item.key].upgradeTo;
            throw new TRPCError({
              code: "FORBIDDEN",
              message: upgrade
                ? `Passez au plan ${upgrade === "signature" ? "Signature" : "Pro"} pour modifier « ${item.field} ».`
                : `La modification de « ${item.field} » n'est pas autorisée avec votre formule.`,
            });
          }
        }

        const nextData = {
          ...currentData,
          ...input.data,
          notesInternes: currentData.notesInternes ?? "",
        };

        const validationData = {
          ...nextData,
          liens: capabilities.links.editable ? nextData.liens : [],
          galerie: capabilities.gallery.editable ? nextData.galerie : [],
          sections: capabilities.catalog.editable ? nextData.sections : [],
        };

        const errors = validatePlanPayload({
          formule: fiche.formule,
          photo: capabilities.profile.editable ? input.photo : fiche.photo,
          logo: capabilities.profile.editable ? input.logo : fiche.logo,
          googlePlaceId: capabilities.googleReview.editable
            ? input.googlePlaceId
            : fiche.googlePlaceId,
          data: validationData,
        });

        if (errors.length)
          throw new TRPCError({ code: "BAD_REQUEST", message: errors.join(" ") });

        const { ficheId, data: _data, ...fields } = input;
        await updateFiche(ficheId, {
          prenom: fields.prenom,
          nom: fields.nom,
          fonction: fields.fonction,
          entreprise: fields.entreprise,
          telephone: fields.telephone,
          whatsapp: fields.whatsapp,
          email: fields.email,
          adresse: fields.adresse,
          lienItineraire: fields.lienItineraire,
          ...(capabilities.site.editable ? { site: fields.site } : {}),
          ...(capabilities.profile.editable
            ? { photo: fields.photo, logo: fields.logo }
            : {}),
          ...(capabilities.googleReview.editable
            ? { googlePlaceId: fields.googlePlaceId }
            : {}),
          dataJson: JSON.stringify(nextData),
        });
        return { ok: true } as const;
      }),

    uploadMedia: clientProcedure
      .input(
        z.object({
          ficheId: z.number().int().positive(),
          kind: z.enum(["profile", "logo", "gallery", "video"]),
          filename: z.string().min(1).max(160),
          mimeType: z.enum([
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/ogg",
          ]),
          contentBase64: z.string().min(20).max(70_000_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const fiche = await getFicheOwnedBy(input.ficheId, ctx.user.id);
        if (!fiche)
          throw new TRPCError({ code: "FORBIDDEN", message: "Fiche introuvable." });

        const plan = fiche.formule as PlanName;
        const capabilities = getClientFicheCapabilities(plan);
        const capability = capabilities.gallery;

        if (!capability.editable) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Passez au plan ${capability.upgradeTo === "signature" ? "Signature" : "Pro"} pour modifier cette section.`,
          });
        }

        const currentData = JSON.parse(fiche.dataJson || "{}") as {
          galerie?: Array<{ type?: "image" | "video" }>;
        };
        const gallery = currentData.galerie ?? [];
        const maxPhotos = capabilities.gallery.maxItems ?? getPlanFeatures(plan).maxPhotos;
        const maxVideos = capabilities.gallery.maxVideos ?? getPlanFeatures(plan).maxVideos;
        const photoCount = gallery.filter(item => item.type !== "video").length;
        const videoCount = gallery.filter(item => item.type === "video").length;

        if (input.kind === "gallery" && photoCount >= maxPhotos) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `La galerie est limitée à ${maxPhotos} photos.`,
          });
        }
        if (input.kind === "video" && videoCount >= maxVideos) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `La galerie est limitée à ${maxVideos} vidéos pour votre formule.`,
          });
        }
        if (input.kind === "video" && maxVideos === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Votre formule ne permet pas l’ajout de vidéos.",
          });
        }

        const raw = input.contentBase64.replace(/^data:[^;]+;base64,/, "");
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Le contenu média est invalide." });
        }
        const bytes = Buffer.from(raw, "base64");

        if (input.kind === "video") {
          if (bytes.byteLength > mediaRules.video.maxInputBytes)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Vidéo trop lourde : maximum ${Math.round(mediaRules.video.maxInputBytes / (1024 * 1024))} Mo avant optimisation.`,
            });

          let optimized: Awaited<ReturnType<typeof optimizeGalleryVideo>>;
          try {
            optimized = await optimizeGalleryVideo({
              bytes,
              filename: input.filename,
              mimeType: input.mimeType,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : "Traitement vidéo impossible.";
            const code = message === "VIDEO_TROP_LOURDE" || message === "FORMAT_VIDEO_NON_SUPPORTÉ"
              ? "BAD_REQUEST"
              : "INTERNAL_SERVER_ERROR";
            throw new TRPCError({ code, message });
          }

          const safeName = input.filename.replace(/[^a-z0-9._-]/gi, "-");
          const [videoResult, posterResult] = await Promise.all([
            storagePut(`fiches/media/video/${safeName}.mp4`, optimized.video, optimized.mimeType),
            storagePut(`fiches/media/video/posters/${safeName}.jpg`, optimized.poster, optimized.posterMimeType),
          ]);

          return {
            ...videoResult,
            poster: posterResult.url,
            type: "video" as const,
            bytes: optimized.video.byteLength,
          };
        }

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
          throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier ne contient pas une image valide." });
        }

        const expectedType =
          input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1];
        if (dimensions.type !== expectedType)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Le type déclaré ne correspond pas au contenu de l’image.",
          });

        const rule = mediaRules[input.kind];
        if (!dimensions.width || !dimensions.height || dimensions.width > rule.maxWidth || dimensions.height > rule.maxHeight)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Dimensions invalides : maximum ${rule.maxWidth} × ${rule.maxHeight} px.`,
          });

        if (input.kind === "profile" && (dimensions.width !== 400 || dimensions.height !== 400))
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
        return { ...result, type: "image" as const, bytes: bytes.byteLength };
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
          adresse: z.string().optional().default(""),
          lienItineraire: z.string().optional().default(""),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const fiche = await getFicheOwnedBy(input.ficheId, ctx.user.id);
        if (!fiche)
          throw new TRPCError({ code: "FORBIDDEN", message: "Fiche introuvable." });
        const { ficheId, ...fields } = input;
        await updateFiche(ficheId, fields);
        return { ok: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
