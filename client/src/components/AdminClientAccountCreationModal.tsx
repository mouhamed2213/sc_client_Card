import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getPlanFeatures } from "@shared/planFeatures";
import { Check, Clipboard, Copy, CreditCard, Loader2, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AdminClientAccountCreationModal({ open, onClose }: Props) {
  const utils = trpc.useUtils();
  const features = getPlanFeatures("essentiel");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [fonction, setFonction] = useState("");
  const [telephone, setTelephone] = useState("+221");
  const [whatsapp, setWhatsapp] = useState("+221");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [slug, setSlug] = useState("");
  const [hours, setHours] = useState(() =>
    days.map(jour => ({ jour, horaire: "Sur rendez-vous" }))
  );
  const [createCard, setCreateCard] = useState(false);
  const [cardNumero, setCardNumero] = useState("");
  const [credentials, setCredentials] = useState<{
    username: string;
    temporaryPassword: string;
    cardId: number | null;
  } | null>(null);

  const mutation = trpc.admin.createClientAccountWithFiche.useMutation({
    onSuccess: async result => {
      await Promise.all([
        utils.fiches.list.invalidate(),
        utils.fiches.overview.invalidate(),
      ]);
      setCredentials({
        username: result.username,
        temporaryPassword: result.temporaryPassword,
        cardId: result.cardId,
      });
      toast.success("Compte client et fiche Essentiel créés");
    },
    onError: error => {
      toast.error("Création impossible", { description: error.message });
    },
  });

  const generatedSlug = useMemo(() => {
    const value = `${prenom} ${nom}`.trim();
    return value
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }, [prenom, nom]);

  if (!open) return null;

  function updateHour(index: number, horaire: string) {
    setHours(current =>
      current.map((row, i) => (i === index ? { ...row, horaire } : row))
    );
  }

  function reset() {
    setPrenom("");
    setNom("");
    setEntreprise("");
    setFonction("");
    setTelephone("+221");
    setWhatsapp("+221");
    setEmail("");
    setAdresse("");
    setSlug("");
    setHours(days.map(jour => ({ jour, horaire: "Sur rendez-vous" })));
    setCreateCard(false);
    setCardNumero("");
    setCredentials(null);
  }

  function close() {
    if (mutation.isPending) return;
    reset();
    onClose();
  }

  async function copyCredentials() {
    if (!credentials) return;
    const text = [
      "Support Connecté — accès à votre espace client",
      "",
      `Identifiant : ${credentials.username}`,
      `Mot de passe temporaire : ${credentials.temporaryPassword}`,
      "",
      "À votre première connexion, le changement du mot de passe sera obligatoire.",
      "Connexion : /espace-client/connexion",
    ].join("\\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Identifiants copiés");
    } catch {
      toast.error("Impossible de copier les identifiants");
    }
  }

  function copyWhatsAppMessage() {
    if (!credentials) return;
    const text = [
      `Bonjour ${prenom}, votre espace client Support Connecté est prêt.`,
      "",
      `Identifiant : ${credentials.username}`,
      `Mot de passe temporaire : ${credentials.temporaryPassword}`,
      "",
      "Connectez-vous ici : /espace-client/connexion",
      "Le changement du mot de passe sera demandé lors de votre première connexion.",
    ].join("\\n");
    navigator.clipboard?.writeText(text);
    toast.success("Message WhatsApp copié");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const finalSlug = (slug.trim() || generatedSlug).trim();
    if (!finalSlug) {
      toast.error("Le slug est obligatoire");
      return;
    }

    mutation.mutate({
      name: `${prenom.trim()} ${nom.trim()}`.trim(),
      email: email.trim(),
      formule: "essentiel",
      createCard,
      cardNumero: cardNumero.trim() || undefined,
      fiche: {
        slug: finalSlug,
        formule: "essentiel",
        statut: "active",
        nom: nom.trim(),
        prenom: prenom.trim(),
        fonction: fonction.trim(),
        entreprise: entreprise.trim(),
        telephone: telephone.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        site: "",
        adresse: adresse.trim(),
        lienItineraire: "",
        googlePlaceId: "",
        photo: "",
        logo: "",
        data: {
          premierBouton: "whatsapp",
          messageWhatsapp: "Bonjour, je souhaite échanger avec vous.",
          presentation: "",
          rendezVous: undefined,
          reseauxSociaux: [],
          liens: [],
          horaires: hours,
          galerie: [],
          sections: [],
          notesInternes: "Compte Essentiel créé depuis le studio.",
        },
      },
    });
  }

  if (credentials) {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="client-account-created-title">
        <div className="modal-panel max-w-xl">
          <div className="flex items-start justify-between border-b border-[#edf0f2] px-6 py-5">
            <div>
              <p className="eyebrow text-emerald-600">Création terminée</p>
              <h2 id="client-account-created-title" className="mt-1 text-xl font-semibold">
                Compte client Essentiel créé
              </h2>
              <p className="mt-1 text-sm text-[#7d8798]">
                Les identifiants temporaires sont affichés maintenant pour être transmis au client.
              </p>
            </div>
            <button type="button" onClick={close} className="icon-button" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <Check className="h-4 w-4" />
                Transaction validée
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Credential label="Identifiant" value={credentials.username} />
                <Credential label="Mot de passe temporaire" value={credentials.temporaryPassword} secret />
              </div>
              <p className="mt-4 text-xs leading-5 text-emerald-800">
                Le mot de passe n'est pas stocké en clair. Il vient d'être généré par le serveur et doit être transmis au client maintenant.
              </p>
            </div>

            {credentials.cardId && (
              <div className="flex items-center gap-3 rounded-xl border border-[#e6e8ec] bg-[#f8f9fb] p-4 text-sm">
                <CreditCard className="h-4 w-4 text-[#52607a]" />
                <span>Carte associée créée avec succès.</span>
              </div>
            )}

            <div className="rounded-xl border border-[#e6e8ec] p-4">
              <p className="text-sm font-semibold text-[#172033]">Transmission au client</p>
              <p className="mt-1 text-sm text-[#7d8798]">
                Copiez les identifiants ou le message complet avant de fermer cette fenêtre.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={copyCredentials} className="gap-2">
                  <Clipboard className="h-4 w-4" /> Copier les identifiants
                </Button>
                <Button type="button" onClick={copyWhatsAppMessage} className="gap-2 bg-[#172033] text-white hover:bg-[#27334a]">
                  <Copy className="h-4 w-4" /> Copier le message WhatsApp
                </Button>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#edf0f2] pt-5">
              <Button type="button" onClick={close} className="bg-[#172033] text-white hover:bg-[#27334a]">
                Terminer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-client-account-title">
      <div className="modal-panel">
        <div className="flex items-start justify-between border-b border-[#edf0f2] px-6 py-5">
          <div>
            <p className="eyebrow">Nouveau compte client</p>
            <h2 id="new-client-account-title" className="mt-1 text-xl font-semibold">
              Compte + fiche Essentiel
            </h2>
            <p className="mt-1 text-sm text-[#7d8798]">
              Le serveur génère l'identifiant et le mot de passe temporaire. La fiche et le compte sont créés dans la même transaction.
            </p>
          </div>
          <button type="button" onClick={close} className="icon-button" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 overflow-y-auto px-6 py-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            Formule fixée à <strong>Essentiel</strong> pour cette phase de test.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom">
              <input required value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Marie" autoComplete="given-name" />
            </Field>
            <Field label="Nom">
              <input required value={nom} onChange={e => setNom(e.target.value)} placeholder="Diallo" autoComplete="family-name" />
            </Field>
            <Field label="Entreprise">
              <input required value={entreprise} onChange={e => setEntreprise(e.target.value)} placeholder="Saly Immo Conseil" />
            </Field>
            <Field label="Fonction">
              <input required value={fonction} onChange={e => setFonction(e.target.value)} placeholder="Conseillère immobilière" />
            </Field>
            <Field label="Téléphone">
              <input required value={telephone} onChange={e => setTelephone(e.target.value)} autoComplete="tel" />
            </Field>
            <Field label="WhatsApp">
              <input required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} autoComplete="tel" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail du compte (optionnel)">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Adresse (optionnelle)">
              <input value={adresse} onChange={e => setAdresse(e.target.value)} />
            </Field>
          </div>

          <Field label="Slug public">
            <input
              required
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder={generatedSlug || "prenom-nom"}
              pattern="[a-zA-Z0-9-]{3,160}"
            />
            <p className="mt-1.5 text-xs text-[#9aa3b1]">
              La fiche sera accessible sur /fiche/{slug || generatedSlug || "votre-slug"}.
            </p>
          </Field>

          <div className="rounded-xl border border-[#e6e8ec] p-4">
            <div className="flex items-start gap-3">
              <input
                id="create-card"
                type="checkbox"
                checked={createCard}
                onChange={e => setCreateCard(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <label htmlFor="create-card" className="text-sm">
                <span className="font-semibold text-[#172033]">Créer la carte maintenant</span>
                <span className="mt-1 block text-xs leading-5 text-[#7d8798]">
                  Si elle existe déjà physiquement, indiquez son numéro. Sinon laissez le champ vide et la plateforme créera un numéro.
                </span>
              </label>
            </div>
            {createCard && (
              <div className="mt-4">
                <Field label="Numéro de carte (optionnel)">
                  <input value={cardNumero} onChange={e => setCardNumero(e.target.value)} placeholder="NFC-000123" />
                </Field>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e6e8ec] p-4">
            <p className="text-sm font-semibold text-[#172033]">Horaires Essentiel</p>
            <p className="mt-1 text-xs text-[#7d8798]">
              Les 7 jours sont initialisés pour satisfaire la règle de la formule.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {hours.map((row, index) => (
                <label key={row.jour} className="grid grid-cols-[90px_1fr] items-center gap-2 text-xs">
                  <span className="font-medium text-[#52607a]">{row.jour}</span>
                  <input value={row.horaire} onChange={e => updateHour(index, e.target.value)} />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#edf0f2] pt-5">
            <Button type="button" variant="outline" onClick={close}>Annuler</Button>
            <Button type="submit" disabled={mutation.isPending} className="gap-2 bg-[#172033] text-white hover:bg-[#27334a]">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {mutation.isPending ? "Création…" : "Créer le compte + la fiche"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Credential({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7d8798]">{label}</p>
      <p className={`mt-1 break-all font-mono text-sm font-semibold text-[#172033] ${secret ? "select-all" : ""}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#7d8798]">{label}</span>
      {children}
    </label>
  );
}
