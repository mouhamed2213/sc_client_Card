import { getClientFicheCapabilities } from "./clientFicheCapabilities";
import { getPlanFeatures, type PlanName } from "./planFeatures";
import { parseVideoUrl } from "./videoUrls";

type PlanData = {
  liens?: unknown[];
  galerie?: Array<{ type?: "image" | "video"; url?: string; alt?: string; source?: string; embedUrl?: string }>;
  horaires?: { jour?: string; horaire?: string }[];
  sections?: Array<{ titre?: string; articles?: unknown[] }>;
  presentation?: string;
  rendezVous?: { label?: string; url?: string };
  reseauxSociaux?: { label?: string; url?: string }[];
};

export function validatePlanPayload(input: {
  formule: PlanName;
  photo?: string | null;
  logo?: string | null;
  googlePlaceId?: string | null;
  site?: string | null;
  data: PlanData;
}) {
  const features = getPlanFeatures(input.formule);
  const capabilities = getClientFicheCapabilities(input.formule);
  const errors: string[] = [];
  const links = input.data.liens ?? [];
  const gallery = input.data.galerie ?? [];
  const photos = gallery.filter(item => item.type !== "video");
  const videos = gallery.filter(item => item.type === "video");
  const sections = input.data.sections ?? [];
  const appointment = input.data.rendezVous;
  const socials = input.data.reseauxSociaux ?? [];

  if (links.length > features.maxLinks) {
    errors.push(features.maxLinks === 0
      ? "Cette formule ne permet pas de liens personnalisés."
      : `${input.formule}: maximum ${features.maxLinks} liens.`);
  }
  if (photos.length > features.maxPhotos) {
    errors.push(features.maxPhotos === 0
      ? "Cette formule ne permet pas de galerie photo."
      : `${input.formule}: maximum ${features.maxPhotos} photos.`);
  }
  if (videos.length > features.maxVideos) {
    errors.push(features.maxVideos === 0
      ? "Cette formule ne permet pas de vidéos."
      : `${input.formule}: maximum ${features.maxVideos} vidéos.`);
  }
  for (const video of videos) {
    if (!video.url || !parseVideoUrl(video.url)) errors.push("Une ou plusieurs vidéos utilisent une URL non supportée.");
  }

  if (!capabilities.site.editable && input.site?.trim()) errors.push("Cette formule ne permet pas de site internet.");
  if (!capabilities.rendezVous.editable && appointment?.url?.trim()) errors.push("Cette formule ne permet pas de prise de rendez-vous.");
  if (!capabilities.socials.editable && socials.some(item => item.url?.trim())) errors.push("Cette formule ne permet pas de réseaux sociaux.");
  if (!capabilities.googleReview.editable && input.googlePlaceId?.trim()) errors.push("Cette formule ne permet pas les avis Google.");
  if (!capabilities.catalog.editable && sections.length > 0) errors.push("Cette formule ne permet pas de catalogue.");
  if (capabilities.catalog.editable) {
    const maxSections = features.maxCatalogSections;
    const maxArticles = features.maxCatalogArticlesPerSection;
    if (sections.length > maxSections) errors.push(`${input.formule}: maximum ${maxSections} sections de catalogue.`);
    if (sections.some(section => (section.articles ?? []).length > maxArticles)) {
      errors.push(`${input.formule}: maximum ${maxArticles} articles par section.`);
    }
  }
  if (features.requiresProfile && (!input.photo || !input.logo)) errors.push(`${input.formule}: la couverture et la photo / le logo sont obligatoires.`);
  if (features.requiresHours) {
    const hours = input.data.horaires ?? [];
    const hasAnyHour = hours.some(row => Boolean(row.jour?.trim()) || Boolean(row.horaire?.trim()));
    if (hasAnyHour) {
      if (hours.length !== 7) errors.push(`${input.formule}: les horaires doivent couvrir exactement les 7 jours.`);
      if (hours.some(row => !row.jour?.trim() || !row.horaire?.trim())) errors.push(`${input.formule}: chaque jour doit avoir un horaire ou une mention Fermé.`);
    }
  }
  return errors;
}
