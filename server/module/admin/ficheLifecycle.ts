export const RENEWAL_WINDOW_DAYS = 30;

export type FicheBusinessStatus =
  | "active"
  | "a_renouveler"
  | "expiree"
  | "suspendue"
  | "supprimee"
  | "brouillon";

function startOfTodayUtc(now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function getFicheBusinessStatus(fiche: {
  statut: string;
  dateEcheance: Date;
}): FicheBusinessStatus {
  if (fiche.statut === "suspendue") return "suspendue";
  if (fiche.statut === "supprimee") return "supprimee";
  if (fiche.statut === "brouillon") return "brouillon";
  if (fiche.statut !== "active") return fiche.statut as FicheBusinessStatus;

  const startOfToday = startOfTodayUtc();
  if (fiche.dateEcheance < startOfToday) return "expiree";

  const renewalLimit = new Date(startOfToday);
  renewalLimit.setUTCDate(
    renewalLimit.getUTCDate() + RENEWAL_WINDOW_DAYS
  );
  renewalLimit.setUTCHours(23, 59, 59, 999);

  return fiche.dateEcheance <= renewalLimit ? "a_renouveler" : "active";
}

export function isFichePubliclyAccessible(fiche: {
  statut: string;
  dateEcheance: Date;
}) {
  const status = getFicheBusinessStatus(fiche);
  return status === "active" || status === "a_renouveler";
}

/**
 * Client-side edit/access rule.
 *
 * Admin procedures are intentionally not governed by this helper: an
 * administrator must keep control over drafts and suspended fiches.
 */
export function isFicheOwnerEditable(fiche: {
  statut: string;
  dateEcheance: Date;
}) {
  const status = getFicheBusinessStatus(fiche);
  return status === "active" || status === "a_renouveler";
}

export function getFicheOwnerBlockedMessage(
  fiche: { statut: string; dateEcheance: Date }
) {
  const status = getFicheBusinessStatus(fiche);
  if (status === "suspendue") {
    return "Cette fiche est suspendue. La consultation des demandes et les modifications sont temporairement indisponibles.";
  }
  if (status === "expiree") {
    return "Cette fiche est expirée. La consultation des demandes et les modifications sont indisponibles jusqu’au renouvellement.";
  }
  if (status === "brouillon") {
    return "Cette fiche est encore en brouillon. La consultation et les modifications depuis l’espace client sont indisponibles jusqu’à son activation.";
  }
  if (status === "supprimee") {
    return "Cette fiche a été supprimée. La consultation et les modifications depuis l’espace client sont indisponibles.";
  }
  return null;
}
