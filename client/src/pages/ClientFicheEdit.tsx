import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Lock, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import { formuleLabels } from "@/lib/ficheStatus";

type FormState = {
  prenom: string;
  nom: string;
  fonction: string;
  entreprise: string;
  telephone: string;
  whatsapp: string;
  email: string;
  site: string;
  adresse: string;
  lienItineraire: string;
};

const FIELDS: { key: keyof FormState; label: string; required?: boolean }[] = [
  { key: "prenom", label: "Prénom", required: true },
  { key: "nom", label: "Nom", required: true },
  { key: "fonction", label: "Fonction", required: true },
  { key: "entreprise", label: "Entreprise", required: true },
  { key: "telephone", label: "Téléphone", required: true },
  { key: "whatsapp", label: "WhatsApp", required: true },
  { key: "email", label: "E-mail" },
  { key: "site", label: "Site web" },
  { key: "adresse", label: "Adresse" },
  { key: "lienItineraire", label: "Lien Google Maps" },
];

export default function ClientFicheEdit() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const id = Number(ficheId);
  const utils = trpc.useUtils();
  const fiche = trpc.clientSpaceRouter.ficheDetail.useQuery({ ficheId: id });
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (!fiche.data) return;
    setForm({
      prenom: fiche.data.prenom,
      nom: fiche.data.nom,
      fonction: fiche.data.fonction,
      entreprise: fiche.data.entreprise,
      telephone: fiche.data.telephone,
      whatsapp: fiche.data.whatsapp,
      email: fiche.data.email ?? "",
      site: fiche.data.site ?? "",
      adresse: fiche.data.adresse ?? "",
      lienItineraire: fiche.data.lienItineraire ?? "",
    });
  }, [fiche.data]);

  const save = trpc.clientSpaceRouter.updateContact.useMutation({
    onSuccess: async () => {
      toast.success("Fiche mise à jour");
      await Promise.all([
        utils.clientSpaceRouter.ficheDetail.invalidate({ ficheId: id }),
        utils.clientSpaceRouter.dashboard.invalidate({ ficheId: id }),
      ]);
    },
    onError: error => toast.error("Échec de la mise à jour", { description: error.message }),
  });

  if (fiche.isLoading || !fiche.data) {
    return (
      <ClientLayout ficheId={id}>
        <div className="panel m-4 sm:m-6 lg:m-8 py-16 text-center text-sm text-[#7d8798]">
          Chargement…
        </div>
      </ClientLayout>
    );
  }

  const isSignature = fiche.data.formule === "signature";

  if (!isSignature) {
    return (
      <ClientLayout ficheId={id}>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="id-card mx-auto max-w-md text-center" style={{ padding: "34px 28px" }}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Lock size={20} />
            </div>
            <p className="id-card-name" style={{ fontSize: 19, marginTop: 16, textAlign: "center" }}>
              Passez à la carte Signature
            </p>
            <p className="id-card-role" style={{ textAlign: "center" }}>
              La modification de vos informations depuis l'espace client est
              réservée à la formule Signature. Votre fiche est actuellement en{" "}
              {formuleLabels[fiche.data.formule] ?? fiche.data.formule}.
            </p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Bonjour, je souhaite passer ma fiche ${fiche.data.entreprise} à la formule Signature.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e5a86b] px-4 py-2.5 text-sm font-semibold text-[#172033] hover:bg-[#f0bd83]"
            >
              <Sparkles size={15} /> Passer à Signature
            </a>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout ficheId={id}>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-xl font-semibold text-[#172033]">Modifier ma fiche</h1>
          <p className="mt-1 text-sm text-[#7d8798]">
            Ces informations sont visibles sur votre fiche publique.
          </p>
        </div>

        <form
          className="panel"
          onSubmit={event => {
            event.preventDefault();
            if (!form) return;
            save.mutate({ ficheId: id, ...form });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(field => (
              <label key={field.key} className="block">
                <span className="text-xs font-medium text-[#52607a]">
                  {field.label}
                  {field.required && " *"}
                </span>
                <input
                  required={field.required}
                  value={form?.[field.key] ?? ""}
                  onChange={event =>
                    setForm(prev =>
                      prev ? { ...prev, [field.key]: event.target.value } : prev
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#e0e4e9] px-3 py-2 text-sm text-[#172033] outline-none focus:border-[#c98a4e]"
                />
              </label>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#f0f1f3] pt-5">
            <button
              type="submit"
              disabled={save.isPending || !form}
              className="flex items-center gap-2 rounded-xl bg-[#172033] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f1626] disabled:opacity-60"
            >
              <Save size={15} />
              {save.isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </ClientLayout>
  );
}
