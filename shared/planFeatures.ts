export const planFeatures = {
  essentiel: {
    maxLinks: 3,
    maxPhotos: 0,
    hasForm: false,
    hasGoogleReview: false,
    requiresProfile: false,
    requiresHours: true,
    hasCatalog: false,
  },
  pro: {
    maxLinks: 10,
    maxPhotos: 8,
    hasForm: true,
    hasGoogleReview: true,
    requiresProfile: true,
    requiresHours: true,
    hasCatalog: false,
  },
  signature: {
    maxLinks: 10,
    maxPhotos: 8,
    hasForm: true,
    hasGoogleReview: true,
    requiresProfile: true,
    requiresHours: true,
    hasCatalog: true,
  },
} as const;

export type PlanName = keyof typeof planFeatures;
export type PlanFeatures = (typeof planFeatures)[PlanName];

export function getPlanFeatures(plan: PlanName) {
  return planFeatures[plan];
}
