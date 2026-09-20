import { getClientFicheCapabilities } from "./clientFicheCapabilities";
import { getPlanFeatures, type PlanName } from "./planFeatures";

type PlanData = {
  liens?: unknown[];
  galerie?: unknown[];
  horaires?: { jour?: string; horaire?: string }[];
  sections?: unknown[];
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
  const photos = input.data.galerie ?? [];
  const sections = input.data.sections ?? [];
  const appointment = input.data.rendezVous;
  const socials = input.data.reseauxSociaux ?? [];

  if (links.length > features.maxLinks) {
    errors.push(
      features.maxLinks === 0
        ? "Cette formule ne permet pas de liens personnalisés."
        : `${input.formule}: maximum ${features.maxLinks} liens.`
    );
  }

  if (photos.length > features.maxPhotos) {
    errors.push(
      features.maxPhotos === 0
        ? "Cette formule ne permet pas de galerie photo."
        : `${input.formule}: maximum ${features.maxPhotos} photos.`
    );
  }

  if (!capabilities.site.editable && input.site?.trim())
    errors.push("Cette formule ne permet pas de site internet.");

  if (!capabilities.rendezVous.editable && (appointment?.url?.trim() || appointment?.label?.trim()))
    errors.push("Cette formule ne permet pas de prise de rendez-vous.");

  if (!capabilities.socials.editable && socials.some(item => item.url?.trim()))
    errors.push("Cette formule ne permet pas de réseaux sociaux.");

  if (!capabilities.googleReview.editable && input.googlePlaceId?.trim())
    errors.push("Cette formule ne permet pas les avis Google.");

  if (!capabilities.catalog.editable && sections.length > 0)
    errors.push("Cette formule ne permet pas de catalogue.");

  if (features.requiresProfile && (!input.photo || !input.logo))
    errors.push(`${input.formule}: le portrait et le logo sont obligatoires.`);

  if (features.requiresHours) {
    const hours = input.data.horaires ?? [];
    const hasAnyHour = hours.some(
      row => Boolean(row.jour?.trim()) || Boolean(row.horaire?.trim())
    );

    if (hasAnyHour) {
      if (hours.length !== 7)
        errors.push(`${input.formule}: les horaires doivent couvrir exactement les 7 jours.`);
      if (hours.some(row => !row.jour?.trim() || !row.horaire?.trim()))
        errors.push(`${input.formule}: chaque jour doit avoir un horaire ou une mention Fermé.`);
    }
  }

  return errors;
}
