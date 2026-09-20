export const planFeatures = {
  essentiel: {
    maxLinks: 0,
    maxPhotos: 0,
    hasForm: false,
    hasGoogleReview: false,
    requiresProfile: false,
    requiresHours: true,
    hasCatalog: false,
    hasPanel: false,
  },
  pro: {
    maxLinks: 10,
    maxPhotos: 4,
    hasForm: false,
    hasGoogleReview: true,
    requiresProfile: true,
    requiresHours: true,
    hasCatalog: false,
    hasPanel: false,
  },
  signature: {
    maxLinks: 10,
    maxPhotos: 8,
    hasForm: true,
    hasGoogleReview: true,
    requiresProfile: true,
    requiresHours: true,
    hasCatalog: true,
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
