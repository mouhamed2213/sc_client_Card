import { Share2, SquareArrowOutUpRight } from "lucide-react";
import { formuleLabels } from "@/lib/ficheStatus";

type IdCardFiche = {
  slug: string;
  nom: string;
  prenom: string;
  entreprise: string;
  fonction: string;
  formule: string;
};

export default function IdCard({ fiche }: { fiche: IdCardFiche }) {
  const publicUrl = `${window.location.origin}/fiche/${fiche.slug}`;

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: fiche.entreprise, url: publicUrl });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      // clipboard unavailable, nothing more we can do silently
    }
  };

  return (
    <div className="id-card">
      <div className="id-card-row">
        <div>
          <div className="id-card-chip" aria-hidden />
          <p className="id-card-brand" style={{ marginTop: 12 }}>
            Support Connecté
          </p>
        </div>
        <span className="public-chip">{formuleLabels[fiche.formule] ?? fiche.formule}</span>
      </div>

      <p className="id-card-name">
        {fiche.prenom} {fiche.nom}
      </p>
      <p className="id-card-role">
        {fiche.fonction ? `${fiche.fonction} · ` : ""}
        {fiche.entreprise}
      </p>

      <div className="id-card-foot">
        <span className="id-card-slug">
          {window.location.host}/fiche/{fiche.slug}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={share}
            className="icon-button"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.16)", color: "white" }}
            aria-label="Partager ma fiche"
          >
            <Share2 size={15} />
          </button>
          <a
            href={`/fiche/${fiche.slug}`}
            target="_blank"
            rel="noreferrer"
            className="icon-button"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.16)", color: "white" }}
            aria-label="Voir ma fiche publique"
          >
            <SquareArrowOutUpRight size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
