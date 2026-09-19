import { getPlanFeatures, type PlanName } from "./planFeatures";

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
  site?: string | null;
  data: PlanData;
}) {
  const features = getPlanFeatures(input.formule);
  const errors: string[] = [];
  const links = input.data.liens ?? [];
  const photos = input.data.galerie ?? [];

  // A feature being available for a plan does not make it mandatory.
  // Optional collections/fields may stay empty; when provided, plan limits
  // and their own field validation still apply elsewhere.
  if (input.formule === "essentiel" && links.length > 0)
    errors.push("La formule Essentiel ne permet pas de liens personnalisés.");
  else if (links.length > features.maxLinks)
    errors.push(`${input.formule}: maximum ${features.maxLinks} liens.`);

  if (features.maxPhotos === 0 && photos.length > 0)
    errors.push("La formule Essentiel ne permet pas de galerie photo.");
  else if (photos.length > features.maxPhotos)
    errors.push(
      `${input.formule}: maximum ${features.maxPhotos} photo${features.maxPhotos > 1 ? "s" : ""}.`
    );

  // Only the profile media explicitly required by the plan are mandatory.
  if (features.requiresProfile && (!input.photo || !input.logo))
    errors.push(`${input.formule}: le portrait et le logo sont obligatoires.`);

  // Google Review is optional. hasGoogleReview only grants access to the feature.
  // If a Place ID is supplied, its dedicated validation can run without making
  // the whole Signature form dependent on it.
  // Catalog is also optional: an empty catalog is a valid state.

  // Hours are optional. The editor may keep all seven rows empty.
  // Once hours are started, keep the existing integrity rule: the set must be
  // complete and every row must contain a day and a value.
  if (features.requiresHours) {
    const hours = input.data.horaires ?? [];
    const hasAnyHour = hours.some(
      row => Boolean(row.jour?.trim()) || Boolean(row.horaire?.trim())
    );

    if (hasAnyHour) {
      if (hours.length !== 7 && input.formule !== "essentiel")
        errors.push(
          `${input.formule}: les horaires doivent couvrir exactement les 7 jours.`
        );
      if (hours.some(row => !row.jour?.trim() || !row.horaire?.trim()))
        errors.push(
          `${input.formule}: chaque jour doit avoir un horaire ou une mention Fermé.`
        );
    }
  }

  return errors;
}
