import { getPlanFeatures, type PlanName } from "@shared/planFeatures";

type PlanData = {
  liens?: unknown[];
  galerie?: unknown[];
  horaires?: { jour?: string; horaire?: string }[];
  sections?: unknown[];
};

export function validatePlanPayload(input: {
  formule: PlanName;
  photo?: string | null;
  logo?: string | null;
  googlePlaceId?: string | null;
  data: PlanData;
}) {
  const features = getPlanFeatures(input.formule);
  const errors: string[] = [];
  const links = input.data.liens ?? [];
  const photos = input.data.galerie ?? [];
  if (links.length > features.maxLinks)
    errors.push(`${input.formule}: maximum ${features.maxLinks} liens.`);
  if (features.maxPhotos === 0 && photos.length > 0)
    errors.push("La formule Essentiel ne permet pas de galerie photo.");
  else if (photos.length > features.maxPhotos)
    errors.push(
      `${input.formule}: maximum ${features.maxPhotos} photo${features.maxPhotos > 1 ? "s" : ""}.`
    );
  if (features.requiresProfile && !input.photo && !input.logo)
    errors.push(`${input.formule}: un portrait ou un logo est obligatoire.`);
  if (features.hasGoogleReview && !input.googlePlaceId)
    errors.push(
      `${input.formule}: google_place_id est obligatoire pour l'avis Google.`
    );
  if (features.requiresHours) {
    const hours = input.data.horaires ?? [];
    if (hours.length !== 7 && input.formule !== "essentiel")
      errors.push(
        `${input.formule}: les horaires doivent couvrir exactement les 7 jours.`
      );
    if (hours.some(row => !row.jour?.trim() || !row.horaire?.trim()))
      errors.push(
        `${input.formule}: chaque jour doit avoir un horaire ou une mention Fermé.`
      );
  }
  if (features.hasCatalog && !(input.data.sections ?? []).length)
    errors.push(
      `${input.formule}: au moins une section de catalogue est obligatoire.`
    );
  return errors;
}
