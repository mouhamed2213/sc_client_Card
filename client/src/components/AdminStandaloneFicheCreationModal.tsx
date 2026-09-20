import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { planLabels, type PlanName } from "@shared/planFeatures";
import { Check, Loader2, Search, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const plans: PlanName[] = ["essentiel", "pro", "signature"];
const days = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

type Props = { open: boolean; onClose: () => void };

export default function AdminStandaloneFicheCreationModal({ open, onClose }: Props) {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [plan, setPlan] = useState<PlanName>("essentiel");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [fonction, setFonction] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [telephone, setTelephone] = useState("+221");
  const [whatsapp, setWhatsapp] = useState("+221");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerPickerOpen, setOwnerPickerOpen] = useState(false);

  const usersQuery = trpc.admin.searchClientUsers.useQuery(
    { query: ownerSearch },
    { enabled: open && ownerPickerOpen }
  );
  const mutation = trpc.admin.createStandaloneFiche.useMutation({
    onSuccess: async result => {
      await Promise.all([
        utils.fiches.list.invalidate(),
        utils.fiches.overview.invalidate(),
      ]);
      toast.success(ownerId ? "Fiche créée et rattachée au compte" : "Fiche créée sans propriétaire");
      onClose();
      navigate(`/studio/fiche/${result.slug}`);
    },
    onError: error => toast.error("Création impossible", { description: error.message }),
  });

  const generatedSlug = useMemo(
    () => `${prenom} ${nom}`.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    [prenom, nom]
  );

  function reset() {
    setPlan("essentiel"); setPrenom(""); setNom(""); setFonction(""); setEntreprise("");
    setTelephone("+221"); setWhatsapp("+221"); setEmail(""); setSlug("");
    setOwnerId(null); setOwnerSearch(""); setOwnerPickerOpen(false);
  }

  function close() {
    if (mutation.isPending) return;
    reset(); onClose();
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const finalSlug = (slug.trim() || generatedSlug).trim();
    if (!finalSlug) return toast.error("Le slug est obligatoire");
    mutation.mutate({
      ownerId,
      fiche: {
        slug: finalSlug,
        formule: plan,
        statut: "brouillon",
        nom: nom.trim(),
        prenom: prenom.trim(),
        fonction: fonction.trim(),
        entreprise: entreprise.trim(),
        telephone: telephone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        site: "",
        adresse: "",
        lienItineraire: "",
        googlePlaceId: "",
        photo: "",
        logo: "",
        data: {
          premierBouton: "whatsapp",
          messageWhatsapp: "Bonjour, je souhaite échanger avec vous.",
          presentation: "",
          rendezVous: { label: "Prendre rendez-vous", url: "" },
          reseauxSociaux: [],
          liens: [],
          horaires: days.map(jour => ({ jour, horaire: "Sur rendez-vous" })),
          galerie: [],
          sections: [],
          notesInternes: `Fiche ${planLabels[plan]} créée indépendamment du compte client.`,
        },
      },
    });
  }

  if (!open) return null;
  const selectedOwner = usersQuery.data?.find(user => user.id === ownerId);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-fiche-title">
      <div className="modal-panel max-w-2xl">
        <div className="flex items-start justify-between border-b border-[#edf0f2] px-6 py-5">
          <div>
            <p className="eyebrow">Nouvelle fiche</p>
            <h2 id="new-fiche-title" className="mt-1 text-xl font-semibold">Créer une fiche indépendante</h2>
            <p className="mt-1 text-sm text-[#7d8798]">
              La fiche peut rester sans compte ou être rattachée immédiatement à un compte client existant.
            </p>
          </div>
          <button type="button" onClick={close} className="icon-button" aria-label="Fermer"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 overflow-y-auto px-6 py-6">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#7d8798]">Formule</span>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Formule de la fiche">
              {plans.map(option => (
                <button key={option} type="button" role="radio" aria-checked={plan === option}
                  onClick={() => setPlan(option)}
                  className={`rounded-xl border p-3 text-left ${plan === option ? "border-[#172033] bg-[#f3f5f9] ring-2 ring-[#172033]/10" : "border-[#e6e8ec]"}`}>
                  <span className="flex items-center justify-between text-sm font-semibold">{planLabels[option]}{plan === option && <Check className="h-4 w-4" />}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom"><input required value={prenom} onChange={e => setPrenom(e.target.value)} /></Field>
            <Field label="Nom"><input required value={nom} onChange={e => setNom(e.target.value)} /></Field>
            <Field label="Fonction"><input required value={fonction} onChange={e => setFonction(e.target.value)} /></Field>
            <Field label="Entreprise"><input required value={entreprise} onChange={e => setEntreprise(e.target.value)} /></Field>
            <Field label="Téléphone"><input required value={telephone} onChange={e => setTelephone(e.target.value)} /></Field>
            <Field label="WhatsApp"><input required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} /></Field>
            <Field label="E-mail"><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
            <Field label="Slug"><input required value={slug} onChange={e => setSlug(e.target.value)} placeholder={generatedSlug || "prenom-nom"} /></Field>
          </div>

          <div className="rounded-xl border border-[#e6e8ec] p-4">
            <p className="text-sm font-semibold">Compte propriétaire (optionnel)</p>
            <p className="mt-1 text-xs text-[#7d8798]">Vous pouvez créer la fiche sans propriétaire et l'associer plus tard depuis l'éditeur.</p>
            {selectedOwner ? (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-[#f5f7fa] p-3">
                <div><p className="text-sm font-medium">{selectedOwner.name || "Sans nom"}</p><p className="text-xs text-[#7d8798]">{selectedOwner.email || "Sans e-mail"} · {selectedOwner._count.fiche} fiche{selectedOwner._count.fiche > 1 ? "s" : ""}</p></div>
                <Button type="button" variant="outline" onClick={() => setOwnerId(null)}>Retirer</Button>
              </div>
            ) : (
              <>
                <Button type="button" variant="outline" className="mt-3 gap-2" onClick={() => setOwnerPickerOpen(value => !value)}>
                  <UserPlus className="h-4 w-4" /> Choisir un compte existant
                </Button>
                {ownerPickerOpen && (
                  <div className="mt-3 space-y-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                      <input value={ownerSearch} onChange={e => setOwnerSearch(e.target.value)} placeholder="Nom ou e-mail…" className="w-full rounded-lg border border-[#e0e4e9] py-2.5 pl-9 pr-3 text-sm outline-none" autoFocus />
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {usersQuery.isFetching ? <p className="py-4 text-center text-sm text-[#98a2b3]">Recherche…</p> :
                        !(usersQuery.data?.length) ? <p className="py-4 text-center text-sm text-[#98a2b3]">Aucun compte client trouvé.</p> :
                        usersQuery.data.map(user => (
                          <button key={user.id} type="button" onClick={() => { setOwnerId(user.id); setOwnerPickerOpen(false); }}
                            className="flex w-full items-center justify-between rounded-lg border border-[#edf0f2] p-3 text-left hover:bg-[#f8f9fb]">
                            <span><strong className="block text-sm">{user.name || "Sans nom"}</strong><span className="text-xs text-[#98a2b3]">{user.email || "Sans e-mail"} · {user._count.fiche} fiche{user._count.fiche > 1 ? "s" : ""}</span></span>
                            <span className="text-xs font-semibold text-[#172033]">Sélectionner</span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">La fiche sera créée en brouillon</p>
            <p className="mt-1 text-xs leading-5">Après création, complétez les éléments requis dans l’éditeur puis activez la fiche.</p>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#edf0f2] pt-5">
            <Button type="button" variant="outline" onClick={close}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending} className="gap-2 bg-[#172033] text-white hover:bg-[#27334a]">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {mutation.isPending ? "Création…" : "Créer la fiche"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#7d8798]">{label}</span>{children}</label>;
}
