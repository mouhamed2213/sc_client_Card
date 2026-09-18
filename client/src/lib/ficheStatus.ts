export type EcheanceStatus = {
  daysLeft: number;
  label: string;
  pillClass: "status-pill-ok" | "status-pill-warn" | "status-pill-danger";
};

/** Renewal status of a fiche's `dateEcheance`, used for the échéance pill. */
export function getEcheanceStatus(dateEcheance: string | Date): EcheanceStatus {
  const due = new Date(dateEcheance);
  const daysLeft = Math.ceil(
    (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft < 0) {
    return {
      daysLeft,
      label: "Abonnement expiré",
      pillClass: "status-pill-danger",
    };
  }
  if (daysLeft <= 30) {
    return {
      daysLeft,
      label: `Renouvelle dans ${daysLeft} j`,
      pillClass: "status-pill-warn",
    };
  }
  return {
    daysLeft,
    label: "Abonnement à jour",
    pillClass: "status-pill-ok",
  };
}

export const formuleLabels: Record<string, string> = {
  essentiel: "Essentiel",
  pro: "Pro",
  signature: "Signature",
};

export const cardStatusLabels: Record<string, string> = {
  active: "Active",
  perdue: "Perdue",
  revoquee: "Révoquée",
};
