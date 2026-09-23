import {
  BarChart3,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
} from "lucide-react";
import { Link } from "wouter";
import { formuleLabels, getEcheanceStatus } from "@/lib/ficheStatus";

export type ClientFicheRow = {
  id: number;
  isMain: boolean;
  slug: string;
  formule: string;
  statut: string;
  statutMetier?: string;
  nom: string;
  prenom: string;
  fonction: string;
  entreprise: string;
  logo?: string | null;
  telephone: string;
  whatsapp: string;
  email?: string | null;
  adresse?: string | null;
  scansTotal: number;
  lastScanAt?: Date | string | null;
  dateCreation: Date | string;
  dateEcheance: Date | string;
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  a_renouveler: "À renouveler",
  expiree: "Expirée",
  suspendue: "Suspendue",
  supprimee: "Supprimée",
  brouillon: "Brouillon",
};

export const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  a_renouveler: "bg-orange-50 text-orange-700 border-orange-100",
  expiree: "bg-red-50 text-red-700 border-red-100",
  suspendue: "bg-amber-50 text-amber-700 border-amber-100",
  supprimee: "bg-red-50 text-red-700 border-red-100",
  brouillon: "bg-slate-100 text-slate-600 border-slate-200",
};

const ECHEANCE_TEXT: Record<string, string> = {
  "status-pill-danger": "text-[#a3392f]",
  "status-pill-warn": "text-[#9a5c10]",
  "status-pill-ok": "text-[#216a48]",
};

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function businessStatus(fiche: ClientFicheRow) {
  return fiche.statutMetier ?? fiche.statut;
}

/** Same rule as the server (`isFicheOwnerEditable`): no edit when suspended or expired. */
function canEdit(fiche: ClientFicheRow) {
  const status = businessStatus(fiche);
  return status !== "suspendue" && status !== "expiree";
}

function hasStats(fiche: ClientFicheRow) {
  return fiche.formule === "signature";
}

function FicheIdentity({ fiche }: { fiche: ClientFicheRow }) {
  const initials =
    `${fiche.prenom?.[0] ?? ""}${fiche.nom?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div className="flex items-center gap-3">
      {fiche.logo ? (
        <img
          src={fiche.logo}
          alt=""
          className="h-10 w-10 shrink-0 rounded-xl border border-[#edf0f2] object-cover"
        />
      ) : (
        <div
          className={`avatar ${fiche.formule === "signature" ? "avatar-copper" : ""}`}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#29344a]">
          {fiche.prenom} {fiche.nom}
        </p>
        <p className="truncate text-xs text-[#8b94a3]">
          {[fiche.fonction, fiche.entreprise].filter(Boolean).join(" · ")}
        </p>
        <p className="truncate font-mono text-[10px] text-[#a3abb8]">
          /fiche/{fiche.slug}
        </p>
      </div>
    </div>
  );
}

function StatusPill({ fiche }: { fiche: ClientFicheRow }) {
  const status = businessStatus(fiche);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.brouillon}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function Actions({ fiche }: { fiche: ClientFicheRow }) {
  const name = `${fiche.prenom} ${fiche.nom}`;
  return (
    <div className="flex justify-end gap-1">
      <Link
        href={`/espace-client/fiche/${fiche.id}`}
        className="table-action"
        title="Ouvrir la fiche"
        aria-label={`Ouvrir la fiche de ${name}`}
      >
        <BarChart3 className="h-4 w-4" />
      </Link>
      {canEdit(fiche) ? (
        <Link
          href={`/espace-client/fiche/${fiche.id}/modifier`}
          className="table-action"
          title="Modifier la fiche"
          aria-label={`Modifier la fiche de ${name}`}
        >
          <Pencil className="h-4 w-4" />
        </Link>
      ) : (
        <span
          className="table-action cursor-not-allowed opacity-40"
          title="Modification indisponible (fiche suspendue ou expirée)"
          aria-label="Modification indisponible"
          role="img"
        >
          <Pencil className="h-4 w-4" />
        </span>
      )}
      <a
        href={`/fiche/${fiche.slug}?preview=1`}
        target="_blank"
        rel="noreferrer"
        className="table-action"
        title="Voir la fiche publique"
        aria-label={`Voir la fiche publique de ${name}`}
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

function ContactCell({ fiche }: { fiche: ClientFicheRow }) {
  return (
    <div className="min-w-0 space-y-1 text-xs text-[#657084]">
      <p className="flex items-center gap-1.5">
        <Phone className="h-3.5 w-3.5 shrink-0 text-[#9aa3b1]" aria-hidden="true" />
        <span className="whitespace-nowrap">{fiche.telephone}</span>
      </p>
      {fiche.email ? (
        <p className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 shrink-0 text-[#9aa3b1]" aria-hidden="true" />
          <span className="max-w-[200px] truncate" title={fiche.email}>
            {fiche.email}
          </span>
        </p>
      ) : null}
      {fiche.adresse ? (
        <p className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9aa3b1]" aria-hidden="true" />
          <span className="max-w-[200px] truncate" title={fiche.adresse}>
            {fiche.adresse}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function PassagesCell({ fiche }: { fiche: ClientFicheRow }) {
  if (!hasStats(fiche)) {
    return (
      <span className="text-xs text-[#a3abb8]" title="Statistiques disponibles avec la formule Signature">
        —
      </span>
    );
  }
  return (
    <div>
      <p className="text-sm font-medium text-[#42506a]">{fiche.scansTotal}</p>
      <p className="text-[11px] text-[#9aa3b1]">
        {fiche.lastScanAt ? `Dernier : ${formatDate(fiche.lastScanAt)}` : "Aucun passage"}
      </p>
    </div>
  );
}

function EcheanceCell({ fiche }: { fiche: ClientFicheRow }) {
  const echeance = getEcheanceStatus(fiche.dateEcheance);
  return (
    <div>
      <p className="whitespace-nowrap text-sm text-[#657084]">
        {formatDate(fiche.dateEcheance)}
      </p>
      <p className={`text-[11px] font-medium ${ECHEANCE_TEXT[echeance.pillClass]}`}>
        {echeance.label}
      </p>
    </div>
  );
}

export default function FichesTable({ fiches }: { fiches: ClientFicheRow[] }) {
  return (
    <section className="rounded-2xl border border-[#e6e8ec] bg-white shadow-[0_12px_32px_rgba(23,32,51,0.04)]">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#edf0f2] text-left text-[11px] uppercase tracking-[0.13em] text-[#99a1ad]">
              <th scope="col" className="px-7 py-4 font-semibold">Fiche</th>
              <th scope="col" className="px-4 py-4 font-semibold">Formule</th>
              <th scope="col" className="px-4 py-4 font-semibold">Statut</th>
              <th scope="col" className="px-4 py-4 font-semibold">Contact</th>
              <th scope="col" className="px-4 py-4 font-semibold">Passages</th>
              <th scope="col" className="px-4 py-4 font-semibold">Créée le</th>
              <th scope="col" className="px-4 py-4 font-semibold">Échéance</th>
              <th scope="col" className="px-7 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fiches.map(fiche => (
              <tr
                key={fiche.id}
                className="border-b border-[#f0f2f4] align-top transition-colors last:border-0 hover:bg-[#fcfcfd]"
              >
                <td className="px-7 py-4">
                  <Link href={`/espace-client/fiche/${fiche.id}`}>
                    <FicheIdentity fiche={fiche} />
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-[#657084]">
                  {formuleLabels[fiche.formule] ?? fiche.formule}
                </td>
                <td className="px-4 py-4"><StatusPill fiche={fiche} /></td>
                <td className="px-4 py-4"><ContactCell fiche={fiche} /></td>
                <td className="px-4 py-4"><PassagesCell fiche={fiche} /></td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-[#657084]">
                  {formatDate(fiche.dateCreation)}
                </td>
                <td className="px-4 py-4"><EcheanceCell fiche={fiche} /></td>
                <td className="px-7 py-4"><Actions fiche={fiche} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {fiches.map(fiche => (
          <div key={fiche.id} className="rounded-xl border border-[#edf0f2] p-4">
            <div className="flex items-start justify-between gap-3">
              <FicheIdentity fiche={fiche} />
              <StatusPill fiche={fiche} />
            </div>
            <div className="mt-4"><ContactCell fiche={fiche} /></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[#9aa3b1]">Formule</p>
                <p className="mt-1 font-medium">{formuleLabels[fiche.formule] ?? fiche.formule}</p>
              </div>
              <div>
                <p className="text-[#9aa3b1]">Passages</p>
                <div className="mt-1"><PassagesCell fiche={fiche} /></div>
              </div>
              <div>
                <p className="text-[#9aa3b1]">Créée le</p>
                <p className="mt-1 font-medium">{formatDate(fiche.dateCreation)}</p>
              </div>
              <div>
                <p className="text-[#9aa3b1]">Échéance</p>
                <div className="mt-1"><EcheanceCell fiche={fiche} /></div>
              </div>
            </div>
            <div className="mt-4 border-t border-[#f0f2f4] pt-3">
              <Actions fiche={fiche} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
