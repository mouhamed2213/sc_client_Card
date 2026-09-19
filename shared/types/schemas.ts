import z from "zod";


export const fichePayload = z.object({
  slug: z.string().min(3).max(160),
  formule: z.enum(["essentiel", "pro", "signature"]),
  statut: z.enum(["active", "suspendue", "supprimee", "brouillon"]),
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
  data: z.object({
    premierBouton: z.enum(["whatsapp", "appel", "email"]),
    messageWhatsapp: z.string(),
    presentation: z.string().optional().default(""),
    rendezVous: z.object({ label: z.string(), url: z.string() }).optional(),
    reseauxSociaux: z
      .array(z.object({ label: z.string(), url: z.string() }))
      .default([]),
    liens: z
      .array(z.object({ label: z.string(), url: z.string() }))
      .default([]),
    horaires: z
      .array(z.object({ jour: z.string(), horaire: z.string() }))
      .default([]),
    galerie: z
      .array(z.object({ url: z.string(), alt: z.string() }))
      .default([]),
    sections: z
      .array(
        z.object({
          titre: z.string(),
          articles: z.array(
            z.object({
              nom: z.string(),
              description: z.string(),
              prix: z.string(),
            })
          ),
        })
      )
      .default([]),
    notesInternes: z.string().default(""),
  }),
});
