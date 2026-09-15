export type Formule = "essentiel" | "pro" | "signature";

export type TemplateLink = {
  label: string;
  url: string;
};

export type TemplateHour = {
  jour: string;
  horaire: string;
};

export type TemplateImage = {
  url: string;
  alt: string;
};

export type TemplateArticle = {
  nom: string;
  description: string;
  prix: string;
};

export type TemplateSection = {
  titre: string;
  articles: TemplateArticle[];
};

export type FicheTemplateData = {
  premierBouton?: "whatsapp" | "appel" | "contact";
  messageWhatsapp?: string;
  presentation?: string;
  rendezVous?: TemplateLink;
  reseauxSociaux?: TemplateLink[];
  liens?: TemplateLink[];
  horaires?: TemplateHour[];
  galerie?: TemplateImage[];
  sections?: TemplateSection[];
};

export type FicheIdentity = {
  slug: string;
  formule: Formule;
  nom: string;
  prenom: string;
  fonction: string;
  entreprise: string;
  photo?: string | null;
  logo?: string | null;
  telephone: string;
  whatsapp: string;
  email?: string | null;
  site?: string | null;
  adresse?: string | null;
  lienItineraire?: string | null;
  googlePlaceId?: string | null;
};

export type FicheTemplateModel = FicheIdentity & {
  data: FicheTemplateData;
};
