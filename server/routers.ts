import { COOKIE_NAME } from "@shared/const";
import { mediaRules } from "@shared/mediaRules";
import { getPlanFeatures } from "@shared/planFeatures";
import { TRPCError } from "@trpc/server";
import { imageSize } from "image-size";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { Fiche } from "generated/prisma/client";
import { createContactRequest, createFiche, getFicheById, getFicheBySlug, getOverview, listContactRequests, listFiches, recordScan, updateFiche } from "./db";
import { validatePlanPayload } from "./planValidation";
import { storagePut } from "./storage";

const fichePayload = z.object({
  slug: z.string().min(3).max(160), formule: z.enum(["essentiel", "pro", "signature"]), statut: z.enum(["active", "suspendue", "supprimee", "brouillon"]), nom: z.string().min(1), prenom: z.string().min(1), fonction: z.string().min(1), entreprise: z.string().min(1), telephone: z.string().min(8), whatsapp: z.string().min(8), email: z.string().optional().default(""), site: z.string().optional().default(""), adresse: z.string().optional().default(""), lienItineraire: z.string().optional().default(""), googlePlaceId: z.string().optional().default(""), photo: z.string().optional().default(""), logo: z.string().optional().default(""),
  data: z.object({
    premierBouton: z.enum(["whatsapp", "appel", "contact"]), messageWhatsapp: z.string(),
    presentation: z.string().optional().default(""),
    rendezVous: z.object({ label: z.string(), url: z.string() }).optional(),
    reseauxSociaux: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    liens: z.array(z.object({ label: z.string(), url: z.string() })).default([]), horaires: z.array(z.object({ jour: z.string(), horaire: z.string() })).default([]), galerie: z.array(z.object({ url: z.string(), alt: z.string() })).default([]),
    sections: z.array(z.object({ titre: z.string(), articles: z.array(z.object({ nom: z.string(), description: z.string(), prix: z.string() })) })).default([]), notesInternes: z.string().default(""),
  }),
});

function parseFiche<T extends { dataJson: string }>(fiche: T) { const { dataJson, ...rest } = fiche; return { ...rest, data: JSON.parse(dataJson || "{}") }; }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  fiches: router({
    list: adminProcedure.query(async () => { const rows = await listFiches(); return rows.map((row: Fiche) => ({ ...parseFiche(row), plan: getPlanFeatures(row.formule) })); }),
    overview: adminProcedure.query(async () => getOverview()),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => { const fiche = await getFicheBySlug(input.slug); if (!fiche) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable" }); return { ...parseFiche(fiche), plan: getPlanFeatures(fiche.formule) }; }),
    recordScan: publicProcedure.input(z.object({ slug: z.string() })).mutation(async ({ input }) => { const fiche = await getFicheBySlug(input.slug); if (fiche && fiche.statut === "active") await recordScan(fiche); return { ok: true }; }),
    create: adminProcedure.input(fichePayload).mutation(async ({ input }) => { const existing = await getFicheBySlug(input.slug); if (existing) throw new TRPCError({ code: "CONFLICT", message: "Ce slug existe déjà." }); const createdAt = new Date(); const dateEcheance = new Date(createdAt); dateEcheance.setFullYear(dateEcheance.getFullYear() + 1); const errors = input.statut === "active" ? validatePlanPayload({ ...input, data: input.data }) : []; if (errors.length) throw new TRPCError({ code: "BAD_REQUEST", message: errors.join(" ") }); const id = await createFiche({ ...input, dataJson: JSON.stringify(input.data), dateCreation: createdAt, dateEcheance }); return { id, slug: input.slug }; }),
    update: adminProcedure.input(fichePayload.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => { const current = await getFicheById(input.id); if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable" }); const duplicate = await getFicheBySlug(input.slug); if (duplicate && duplicate.id !== input.id) throw new TRPCError({ code: "CONFLICT", message: "Ce slug existe déjà." }); if (input.statut === "active") { const errors = validatePlanPayload({ ...input, data: input.data }); if (errors.length) throw new TRPCError({ code: "BAD_REQUEST", message: errors.join(" ") }); } const { id, data, ...fields } = input; await updateFiche(id, { ...fields, dataJson: JSON.stringify(data) }); return { ok: true, slug: input.slug } as const; }),
    updateStatus: adminProcedure.input(z.object({ id: z.number(), statut: z.enum(["active", "suspendue", "supprimee", "brouillon"]) })).mutation(async ({ input }) => { const fiche = await getFicheById(input.id); if (!fiche) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable" }); if (input.statut === "active") { const errors = validatePlanPayload({ formule: fiche.formule, photo: fiche.photo, logo: fiche.logo, googlePlaceId: fiche.googlePlaceId, data: JSON.parse(fiche.dataJson || "{}") }); if (errors.length) throw new TRPCError({ code: "BAD_REQUEST", message: errors.join(" ") }); } const ok = await updateFiche(input.id, { statut: input.statut }); return { ok }; }),
    contact: publicProcedure.input(z.object({ slug: z.string(), name: z.string().min(2).max(120), phone: z.string().min(8).max(32), message: z.string().min(2).max(2000) })).mutation(async ({ input }) => { const fiche = await getFicheBySlug(input.slug); if (!fiche) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable" }); if (!getPlanFeatures(fiche.formule).hasForm) throw new TRPCError({ code: "FORBIDDEN", message: "Le formulaire n'est pas inclus dans cette formule." }); await createContactRequest({ ficheId: fiche.id, name: input.name.trim(), phone: input.phone.trim(), message: input.message.trim() }); return { ok: true } as const; }),
    contactRequests: adminProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => { const fiche = await getFicheBySlug(input.slug); if (!fiche) throw new TRPCError({ code: "NOT_FOUND", message: "Fiche introuvable" }); return listContactRequests(fiche.id); }),
  }),
  media: router({ upload: adminProcedure.input(z.object({ formula: z.enum(["essentiel", "pro", "signature"]), kind: z.enum(["profile", "logo", "gallery"]), filename: z.string().min(1).max(160), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), contentBase64: z.string().min(20) })).mutation(async ({ input }) => { const features = getPlanFeatures(input.formula); if (input.kind === "gallery" && features.maxPhotos === 0) throw new TRPCError({ code: "FORBIDDEN", message: "La formule Essentiel ne permet pas de galerie." }); const raw = input.contentBase64.replace(/^data:[^;]+;base64,/, ""); const bytes = Buffer.from(raw, "base64"); const maxBytes = mediaRules[input.kind].maxBytes; if (bytes.byteLength > maxBytes) throw new TRPCError({ code: "BAD_REQUEST", message: `Image trop lourde : maximum ${Math.round(maxBytes / 1024)} ko.` }); let dimensions: ReturnType<typeof imageSize>; try { dimensions = imageSize(bytes); } catch { throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier ne contient pas une image valide." }); } const expectedType = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1]; if (dimensions.type !== expectedType) throw new TRPCError({ code: "BAD_REQUEST", message: "Le type déclaré ne correspond pas au contenu de l’image." }); const rule = mediaRules[input.kind]; if (!dimensions.width || !dimensions.height || dimensions.width > rule.maxWidth || dimensions.height > rule.maxHeight) throw new TRPCError({ code: "BAD_REQUEST", message: `Dimensions invalides : maximum ${rule.maxWidth} × ${rule.maxHeight} px.` }); if (input.kind === "profile" && (dimensions.width !== 400 || dimensions.height !== 400)) throw new TRPCError({ code: "BAD_REQUEST", message: "Le portrait doit mesurer exactement 400 × 400 px." }); const extension = input.mimeType.split("/")[1]; const result = await storagePut(`fiches/media/${input.kind}/${input.filename.replace(/[^a-z0-9._-]/gi, "-")}.${extension}`, bytes, input.mimeType); return { ...result, bytes: bytes.byteLength }; }),
  }),
});

export type AppRouter = typeof appRouter;
