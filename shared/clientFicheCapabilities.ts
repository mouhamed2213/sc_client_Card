import { getPlanFeatures, type PlanName } from "./planFeatures";

export type ClientEditableKey =
  | "identity"
  | "contact"
  | "site"
  | "profile"
  | "presentation"
  | "rendezVous"
  | "socials"
  | "links"
  | "gallery"
  | "googleReview"
  | "hours"
  | "catalog"
  | "callbackForm";

type Capability = {
  editable: boolean;
  upgradeTo?: PlanName;
  maxItems?: number;
};

export const clientFicheCapabilities: Record<
  PlanName,
  Record<ClientEditableKey, Capability>
> = {
  essentiel: {
    identity: { editable: true },
    contact: { editable: true },
    site: { editable: false, upgradeTo: "pro" },
    profile: { editable: true },
    presentation: { editable: true },
    rendezVous: { editable: false, upgradeTo: "pro" },
    socials: { editable: false, upgradeTo: "pro" },
    links: { editable: false, upgradeTo: "pro", maxItems: getPlanFeatures("essentiel").maxLinks },
    gallery: { editable: false, upgradeTo: "pro", maxItems: getPlanFeatures("essentiel").maxPhotos },
    googleReview: { editable: false, upgradeTo: "pro" },
    hours: { editable: true },
    catalog: { editable: false, upgradeTo: "signature" },
    callbackForm: { editable: false, upgradeTo: "signature" },
  },
  pro: {
    identity: { editable: true },
    contact: { editable: true },
    site: { editable: true },
    profile: { editable: true },
    presentation: { editable: true },
    rendezVous: { editable: true },
    socials: { editable: true },
    links: { editable: true, maxItems: getPlanFeatures("pro").maxLinks },
    gallery: { editable: true, maxItems: getPlanFeatures("pro").maxPhotos },
    googleReview: { editable: true },
    hours: { editable: true },
    catalog: { editable: false, upgradeTo: "signature" },
    callbackForm: { editable: false, upgradeTo: "signature" },
  },
  signature: {
    identity: { editable: true },
    contact: { editable: true },
    site: { editable: true },
    profile: { editable: true },
    presentation: { editable: true },
    rendezVous: { editable: true },
    socials: { editable: true },
    links: { editable: true, maxItems: getPlanFeatures("signature").maxLinks },
    gallery: { editable: true, maxItems: getPlanFeatures("signature").maxPhotos },
    googleReview: { editable: true },
    hours: { editable: true },
    catalog: { editable: true },
    callbackForm: { editable: true },
  },
};

export function getClientFicheCapabilities(plan: PlanName) {
  return clientFicheCapabilities[plan];
}

export function canEditClientFiche(
  plan: PlanName,
  key: ClientEditableKey
) {
  return clientFicheCapabilities[plan][key].editable;
}
