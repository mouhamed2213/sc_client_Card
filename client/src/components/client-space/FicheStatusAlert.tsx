import { AlertTriangle, LockKeyhole } from "lucide-react";

type FicheStatus = "active" | "a_renouveler" | "expiree" | "suspendue" | "supprimee" | "brouillon";

export default function FicheStatusAlert({
  status,
  dateEcheance,
}: {
  status?: FicheStatus;
  dateEcheance?: string | Date;
}) {
  if (status !== "suspendue" && status !== "expiree") return null;

  const expired = status === "expiree";
  const title = expired ? "Votre fiche est expirée" : "Votre fiche est suspendue";
  const description = expired
    ? "La fiche n'est plus visible publiquement. Les demandes reçues et les modifications sont indisponibles jusqu'au renouvellement."
    : "La fiche n'est plus visible publiquement. Les demandes reçues et les modifications sont temporairement indisponibles.";

  return (
    <div
      role="alert"
      className="rounded-2xl border border-[#f0d2a8] bg-[#fff8ed] p-4 text-[#6f4b1e] shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f7e2bd]">
          {expired ? (
            <AlertTriangle size={18} aria-hidden="true" />
          ) : (
            <LockKeyhole size={18} aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-5 text-[#7d5a2d]">{description}</p>
          {expired && dateEcheance && (
            <p className="mt-2 text-xs font-medium text-[#8b5e20]">
              Échéance : {new Date(dateEcheance).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
