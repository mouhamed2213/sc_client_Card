export const planFeatures = {
  essentiel: {
    maxLinks: 0,
    maxPhotos: 0,
    maxVideos: 0,
    hasForm: false,
    hasGoogleReview: false,
    requiresProfile: false,
    requiresHours: true,
    hasCatalog: false,
    maxCatalogSections: 0,
    maxCatalogArticlesPerSection: 0,
    hasPanel: false,
  },
  pro: {
    maxLinks: 10,
    maxPhotos: 4,
    maxVideos: 1,
    hasForm: false,
    hasGoogleReview: true,
    requiresProfile: true,
    requiresHours: true,
    hasCatalog: true,
    // Same cap as Signature: the catalogue itself isn't a Signature-exclusive
    // depth advantage, only its access is now shared between the two plans.
    maxCatalogSections: 6,
    maxCatalogArticlesPerSection: 12,
    hasPanel: false,
  },
  signature: {
    maxLinks: 10,
    maxPhotos: 8,
    maxVideos: 3,
    hasForm: true,
    hasGoogleReview: true,
    requiresProfile: true,
    requiresHours: true,
    hasCatalog: true,
    maxCatalogSections: 6,
    maxCatalogArticlesPerSection: 12,
    hasPanel: true,
  },
} as const;

export type PlanName = keyof typeof planFeatures;
export type PlanFeatures = (typeof planFeatures)[PlanName];

export function getPlanFeatures(plan: PlanName) {
  return planFeatures[plan];
}

export const planLabels: Record<PlanName, string> = {
  essentiel: "Essentiel",
  pro: "Pro",
  signature: "Signature",
};
