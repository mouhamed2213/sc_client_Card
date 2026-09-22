import { slugBaseFromFiche } from "@shared/slug";
import { Button } from "@/components/ui/button";
import { prepareImage } from "@/lib/imageProcessing";
import { trpc } from "@/lib/trpc";
import {
  getPlanFeatures,
  planLabels,
  type PlanName,
} from "@shared/planFeatures";
import { validatePlanPayload } from "@shared/planValidation";
import {
  Check,
  Clipboard,
  Copy,
  CreditCard,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const days = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

const planOrder: PlanName[] = ["essentiel", "pro", "signature"];

// Derived from the shared plan matrix so the cards can never drift from what
// the server actually enforces.
function planHighlights(plan: PlanName): string[] {
  const features = getPlanFeatures(plan);
  return [
    features.maxLinks > 0
      ? `${features.maxLinks} liens personnalisés`
      : "Pas de liens personnalisés",
    features.maxPhotos > 0
      ? `Galerie de ${features.maxPhotos} photos`
      : "Pas de galerie photo",
    features.requiresProfile
      ? "Couverture et photo / logo obligatoires"
      : "Couverture et photo / logo optionnels",
    features.hasGoogleReview && "Avis Google",
    features.hasForm && "Formulaire de rappel",
    features.hasCatalog && "Catalogue",
    features.hasPanel && "Panneau de gestion avancé",
  ].filter((item): item is string => Boolean(item));
}

type MediaKind = "profile" | "logo" | "gallery";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AdminClientAccountCreationModal({
  open,
  onClose,
}: Props) {
  const utils = trpc.useUtils();
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [fonction, setFonction] = useState("");
  const [telephone, setTelephone] = useState("+221");
  const [whatsapp, setWhatsapp] = useState("+221");
  const [email, setEmail] = useState("");
  const [adresse, setAdresse] = useState("");
  const [plan, setPlan] = useState<PlanName>("essentiel");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [logoFile, setLogoFile] = useState<File | undefined>();
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const [hours, setHours] = useState(() =>
    days.map(jour => ({ jour, horaire: "Sur rendez-vous" }))
  );
  const [createCard, setCreateCard] = useState(false);
  const [cardNumero, setCardNumero] = useState("");
  const [credentials, setCredentials] = useState<{
    username: string;
    temporaryPassword: string;
    cardId: number | null;
    slug: string;
    plan: PlanName;
    statut: "active" | "brouillon";
  } | null>(null);

  const mediaMutation = trpc.media.upload.useMutation();
  const mutation = trpc.admin.createClientAccountWithFiche.useMutation({
    onSuccess: async (result, variables) => {
      await Promise.all([
        utils.fiches.list.invalidate(),
        utils.fiches.overview.invalidate(),
      ]);
      setCredentials({
        username: result.username,
        temporaryPassword: result.temporaryPassword,
        cardId: result.cardId,
        slug: result.slug,
        plan: variables.formule,
        statut: variables.fiche.statut === "active" ? "active" : "brouillon",
      });
      toast.success(
        `Compte client et fiche ${planLabels[variables.formule]} créés`
      );
    },
    onError: error => {
      toast.error("Création impossible", { description: error.message });
    },
  });

  const previewSlug = useMemo(
    () =>
      prenom.trim() || nom.trim()
        ? slugBaseFromFiche({ prenom, nom, entreprise })
        : "",
    [prenom, nom, entreprise]
  );

  const features = getPlanFeatures(plan);

  // Same rules as the server (shared/planValidation). No blocker → the fiche
  // can be activated right away; otherwise it is created as a draft, exactly
  // like the former "Nouvelle fiche" flow, and completed in the editor.
  const activationBlockers = useMemo(
    () =>
      validatePlanPayload({
        formule: plan,
        photo: photoFile ? "pending-upload" : "",
        logo: logoFile ? "pending-upload" : "",
        googlePlaceId: googlePlaceId.trim(),
        site: "",
        data: {
          liens: [],
          galerie: galleryFiles
            .slice(0, getPlanFeatures(plan).maxPhotos)
            .map(file => ({
              type: "image" as const,
              url: "pending-upload",
              alt: file.name,
            })),
          horaires: hours,
          sections: [],
        },
      }).map(message =>
        message.startsWith(`${plan}: `)
          ? message.slice(plan.length + 2)
          : message
      ),
    [plan, photoFile, logoFile, googlePlaceId, galleryFiles, hours]
  );
  const statut = activationBlockers.length === 0 ? "active" : "brouillon";

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
    setPlan("essentiel");
    setGooglePlaceId("");
    setPhotoFile(undefined);
    setLogoFile(undefined);
    setGalleryFiles([]);
    setHours(days.map(jour => ({ jour, horaire: "Sur rendez-vous" })));
    setCreateCard(false);
    setCardNumero("");
    setCredentials(null);
  }

  function close() {
    if (mutation.isPending || isPreparing) return;
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
      `Connexion : ${window.location.origin}/espace-client/connexion`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Identifiants copiés");
    } catch {
      toast.error("Impossible de copier les identifiants");
    }
  }

  function buildWhatsAppMessage() {
    if (!credentials) return "";
    return [
      `Bonjour ${prenom}, votre espace client Support Connecté est prêt.`,
      "",
      `Identifiant : ${credentials.username}`,
      `Mot de passe temporaire : ${credentials.temporaryPassword}`,
      "",
      `Connectez-vous ici : ${window.location.origin}/espace-client/connexion`,
      "Le changement du mot de passe sera demandé lors de votre première connexion.",
    ].join("\n");
  }

  function openWhatsApp() {
    const message = buildWhatsAppMessage();
    const phone = whatsapp.replace(/\D/g, "");
    if (!phone) {
      toast.error("Le numéro WhatsApp est vide");
      return;
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function copyWhatsAppMessage() {
    if (!credentials) return;
    const text = buildWhatsAppMessage();
    navigator.clipboard?.writeText(text);
    toast.success("Message WhatsApp copié");
  }

  async function uploadMedia(file: File | undefined, kind: MediaKind) {
    if (!file) return "";
    const prepared = await prepareImage(file, kind);
    const contentBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(prepared);
    });
    const result = await mediaMutation.mutateAsync({
      formula: plan,
      kind,
      filename: prepared.name,
      mimeType: "image/webp",
      contentBase64,
    });
    return result.url;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mutation.isPending || isPreparing) return;

    let photo = "";
    let logo = "";
    let galerie: { url: string; alt: string }[] = [];
    setIsPreparing(true);
    try {
      photo = await uploadMedia(photoFile, "profile");
      logo = await uploadMedia(logoFile, "logo");
      if (features.maxPhotos > 0) {
        galerie = await Promise.all(
          galleryFiles.slice(0, features.maxPhotos).map(async file => ({
            url: await uploadMedia(file, "gallery"),
            alt: file.name,
          }))
        );
      }
    } catch (error) {
      toast.error("Médias non valides", {
        description:
          error instanceof Error
            ? error.message
            : "Vérifiez les images sélectionnées.",
      });
      return;
    } finally {
      setIsPreparing(false);
    }

    mutation.mutate({
      name: `${prenom.trim()} ${nom.trim()}`.trim(),
      email: email.trim(),
      formule: plan,
      createCard,
      cardNumero: createCard ? cardNumero.trim() : undefined,
      fiche: {
        formule: plan,
        statut,
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
        googlePlaceId: features.hasGoogleReview ? googlePlaceId.trim() : "",
        photo,
        logo,
        data: {
          premierBouton: "whatsapp",
          messageWhatsapp: "Bonjour, je souhaite échanger avec vous.",
          presentation: "",
          reseauxSociaux: [],
          liens: [],
          horaires: hours,
          galerie,
          sections: [],
          notesInternes: `Compte ${planLabels[plan]} créé depuis le studio.`,
        },
      },
    });
  }

  if (credentials) {
    return (
      <div
        className="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-account-created-title"
      >
        <div className="modal-panel max-w-xl">
          <div className="flex items-start justify-between border-b border-[#edf0f2] px-6 py-5">
            <div>
              <p className="eyebrow text-emerald-600">Création terminée</p>
              <h2
                id="client-account-created-title"
                className="mt-1 text-xl font-semibold"
              >
                Compte client {planLabels[credentials.plan]} créé
              </h2>
              <p className="mt-1 text-sm text-[#7d8798]">
                Les identifiants temporaires sont affichés maintenant pour être
                transmis au client.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="icon-button"
              aria-label="Fermer"
            >
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
                <Credential
                  label="Mot de passe temporaire"
                  value={credentials.temporaryPassword}
                  secret
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-emerald-800">
                Le mot de passe n'est pas stocké en clair. Il vient d'être
                généré par le serveur et doit être transmis au client
                maintenant.
              </p>
            </div>

            {credentials.statut === "brouillon" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Fiche créée en brouillon</p>
                <p className="mt-1 text-xs leading-5">
                  Complétez les éléments obligatoires de la formule{" "}
                  {planLabels[credentials.plan]} dans l'éditeur, puis activez la
                  fiche.
                </p>
                <Link
                  href={`/studio/fiche/${credentials.slug}`}
                  onClick={close}
                  className="mt-3 inline-flex text-xs font-semibold underline"
                >
                  Compléter la fiche
                </Link>
              </div>
            )}

            {credentials.cardId && (
              <div className="flex items-center gap-3 rounded-xl border border-[#e6e8ec] bg-[#f8f9fb] p-4 text-sm">
                <CreditCard className="h-4 w-4 text-[#52607a]" />
                <span>Carte associée créée avec succès.</span>
              </div>
            )}

            <div className="rounded-xl border border-[#e6e8ec] p-4">
              <p className="text-sm font-semibold text-[#172033]">
                Transmission au client
              </p>
              <p className="mt-1 text-sm text-[#7d8798]">
                Copiez les identifiants ou le message complet avant de fermer
                cette fenêtre.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyCredentials}
                  className="gap-2"
                >
                  <Clipboard className="h-4 w-4" /> Copier les identifiants
                </Button>
                <Button
                  type="button"
                  onClick={copyWhatsAppMessage}
                  variant="outline"
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" /> Copier le message WhatsApp
                </Button>
                <Button
                  type="button"
                  onClick={openWhatsApp}
                  className="gap-2 bg-[#172033] text-white hover:bg-[#27334a]"
                >
                  Ouvrir WhatsApp
                </Button>
              </div>
            </div>

            <div className="flex justify-end border-t border-[#edf0f2] pt-5">
              <Button
                type="button"
                onClick={close}
                className="bg-[#172033] text-white hover:bg-[#27334a]"
              >
                Terminer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="modal-backdrop overflow-scroll"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-client-account-title"
    >
      <div className="modal-panel">
        <div className="flex items-start justify-between border-b border-[#edf0f2] px-6 py-5">
          <div>
            <p className="eyebrow">Nouveau compte client</p>
            <h2
              id="new-client-account-title"
              className="mt-1 text-xl font-semibold"
            >
              Compte + fiche {planLabels[plan]}
            </h2>
            <p className="mt-1 text-sm text-[#7d8798]">
              Le serveur génère l'identifiant et le mot de passe temporaire. La
              fiche et le compte sont créés dans la même transaction.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="icon-button"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 overflow-y-auto px-6 py-6">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#7d8798]">
              Formule
            </span>
            <div
              role="radiogroup"
              aria-label="Formule du compte"
              className="grid gap-3 sm:grid-cols-3"
            >
              {planOrder.map(option => {
                const selected = option === plan;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPlan(option)}
                    className={`rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-[#172033] bg-[#f3f5f9] ring-2 ring-[#172033]/10"
                        : "border-[#e6e8ec] hover:border-[#c5ccd8]"
                    }`}
                  >
                    <span className="flex items-center justify-between text-sm font-semibold text-[#172033]">
                      {planLabels[option]}
                      {selected && <Check className="h-4 w-4" />}
                    </span>
                    <ul className="mt-2 space-y-1 text-[11px] leading-4 text-[#6d7789]">
                      {planHighlights(option).map(item => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            {activationBlockers.length === 0 ? (
              <p className="mt-2 text-xs text-emerald-700">
                La fiche sera activée dès la création.
              </p>
            ) : (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-semibold">
                  La fiche sera créée en brouillon. Il manque pour l'activer :
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {activationBlockers.map(message => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom">
              <input
                required
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                placeholder="Marie"
                autoComplete="given-name"
              />
            </Field>
            <Field label="Nom">
              <input
                required
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Diallo"
                autoComplete="family-name"
              />
            </Field>
            <Field label="Entreprise">
              <input
                required
                value={entreprise}
                onChange={e => setEntreprise(e.target.value)}
                placeholder="Saly Immo Conseil"
              />
            </Field>
            <Field label="Fonction">
              <input
                required
                value={fonction}
                onChange={e => setFonction(e.target.value)}
                placeholder="Conseillère immobilière"
              />
            </Field>
            <Field label="Téléphone">
              <input
                required
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                autoComplete="tel"
              />
            </Field>
            <Field label="WhatsApp">
              <input
                required
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                autoComplete="tel"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="E-mail du compte (optionnel)">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Adresse (optionnelle)">
              <input
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={`Couverture ${features.requiresProfile ? "(obligatoire)" : "(optionnel)"}`}
            >
              <input
                accept="image/jpeg,image/png,image/webp"
                type="file"
                onChange={e => setPhotoFile(e.target.files?.[0])}
              />
            </Field>
            <Field label={`Photo / logo ${features.requiresProfile ? "(obligatoire)" : "(optionnel)"}`}>
              <input
                accept="image/jpeg,image/png,image/webp"
                type="file"
                onChange={e => setLogoFile(e.target.files?.[0])}
              />
            </Field>
          </div>

          {features.maxPhotos > 0 && (
            <Field label={`Galerie (${features.maxPhotos} maximum)`}>
              <input
                multiple
                accept="image/jpeg,image/png,image/webp"
                type="file"
                onChange={e => {
                  setGalleryFiles(
                    Array.from(e.target.files ?? []).slice(0, features.maxPhotos)
                  );
                }}
              />
              <p className="mt-1.5 text-xs text-[#9aa3b1]">
                {galleryFiles.length > 0
                  ? `${galleryFiles.length} photo${galleryFiles.length > 1 ? "s" : ""} sélectionnée${galleryFiles.length > 1 ? "s" : ""}. `
                  : ""}
                Chaque photo est préparée automatiquement (80 ko maximum).
              </p>
            </Field>
          )}

          {features.hasGoogleReview && (
            <Field label="Google Place ID (avis Google)">
              <input
                value={googlePlaceId}
                onChange={e => setGooglePlaceId(e.target.value)}
                placeholder="ChIJ…"
              />
            </Field>
          )}

          <Field label="Adresse publique">
            <p className="text-sm text-[#172033]">
              /fiche/{previewSlug || "prenom-nom"}
            </p>
            <p className="mt-1.5 text-xs text-[#9aa3b1]">
              Générée automatiquement à la création, puis figée (elle est
              imprimée sur la carte). Un numéro est ajouté si elle existe déjà.
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
                <span className="font-semibold text-[#172033]">
                  Créer la carte maintenant
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#7d8798]">
                  Si elle existe déjà physiquement, indiquez son numéro. Sinon
                  laissez le champ vide et la plateforme créera un numéro.
                </span>
              </label>
            </div>
            {createCard && (
              <div className="mt-4">
                <Field label="Numéro de carte (optionnel)">
                  <input
                    value={cardNumero}
                    onChange={e => setCardNumero(e.target.value)}
                    placeholder="NFC-000123"
                  />
                </Field>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e6e8ec] p-4">
            <p className="text-sm font-semibold text-[#172033]">
              Horaires
            </p>
            <p className="mt-1 text-xs text-[#7d8798]">
              Les 7 jours sont initialisés : chaque ligne doit contenir un
              horaire ou « Fermé ».
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {hours.map((row, index) => (
                <label
                  key={row.jour}
                  className="grid grid-cols-[90px_1fr] items-center gap-2 text-xs"
                >
                  <span className="font-medium text-[#52607a]">{row.jour}</span>
                  <input
                    value={row.horaire}
                    onChange={e => updateHour(index, e.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#edf0f2] pt-5">
            <Button type="button" variant="outline" onClick={close}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || isPreparing}
              className="gap-2 bg-[#172033] text-white hover:bg-[#27334a]"
            >
              {mutation.isPending || isPreparing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isPreparing
                ? "Préparation des médias…"
                : mutation.isPending
                  ? "Création…"
                  : "Créer le compte + la fiche"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Credential({
  label,
  value,
  secret,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7d8798]">
        {label}
      </p>
      <p
        className={`mt-1 break-all font-mono text-sm font-semibold text-[#172033] ${secret ? "select-all" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#7d8798]">
        {label}
      </span>
      {children}
    </label>
  );
}
