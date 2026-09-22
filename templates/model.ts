export type Formule = "essentiel" | "pro" | "signature";

export type TemplateLink = {
  label: string;
  url: string;
};

export type TemplateHour = {
  jour: string;
  horaire: string;
};

export type TemplateGalleryItem = {
  id?: any;
  type?: "image" | "video";
  url: string;
  alt: string;
  source?: "youtube" | "instagram" | "facebook" | "tiktok" | "vimeo" | "direct";
  embedUrl?: string;
};

export type ArticleBadge = "populaire" | "nouveau" | "promo";
export type ArticleCurrency = "XOF" | "EUR";

export type TemplateArticle = {
  nom: string;
  description: string;
  prix: string;
  devise?: ArticleCurrency;
  photo?: string;
  badge?: ArticleBadge;
};

export type TemplateSection = {
  titre: string;
  articles: TemplateArticle[];
};

export type FicheTemplateData = {
  premierBouton?: "whatsapp" | "appel" | "email";
  messageWhatsapp?: string;
  presentation?: string;
  rendezVous?: TemplateLink;
  reseauxSociaux?: TemplateLink[];
  liens?: TemplateLink[];
  horaires?: TemplateHour[];
  galerie?: TemplateGalleryItem[];
  sections?: TemplateSection[];
};

export type FicheIdentity = {
  slug: string;
  formule: any;
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
