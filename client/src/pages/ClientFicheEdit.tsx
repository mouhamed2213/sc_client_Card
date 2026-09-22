import FicheStatusAlert from "@/components/client-space/FicheStatusAlert";
import ClientLayout from "@/components/ClientLayout";
import { PremiumUpgradeModal } from "@/components/PremiumFeature";
import { formuleLabels } from "@/lib/ficheStatus";
import { prepareImage } from "@/lib/imageProcessing";
import { trpc } from "@/lib/trpc";
import { getClientFicheCapabilities } from "@shared/clientFicheCapabilities";
import type { MediaKind } from "@shared/mediaRules";
import type { PlanName } from "@shared/planFeatures";
import { parseVideoUrl } from "@shared/videoUrls";
import {
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "wouter";

type LinkItem = { label: string; url: string };
type SocialItem = { label: string; url: string; actif?: boolean };
type GalleryItem = {
  type?: "image" | "video";
  url: string;
  alt: string;
  source?: "youtube" | "instagram" | "facebook" | "tiktok" | "vimeo" | "direct";
  embedUrl?: string;
};
type HoursItem = { jour: string; horaire: string };
type Article = { nom: string; description: string; prix: string };
type CatalogSection = { titre: string; articles: Article[] };

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
  googlePlaceId: string;
  photo: string;
  logo: string;
  data: {
    premierBouton: "whatsapp" | "appel" | "email";
    messageWhatsapp: string;
    presentation: string;
    reseauxSociaux: SocialItem[];
    liens: LinkItem[];
    horaires: HoursItem[];
    galerie: GalleryItem[];
    sections: CatalogSection[];
  };
};

const RESEAUX = [
  { label: "Facebook", domaine: "facebook.com", urlParDefaut: "https://facebook.com/votre-profil", placeholder: "https://facebook.com/...", icon: "f", description: "Page ou profil Facebook" },
  { label: "Instagram", domaine: "instagram.com", urlParDefaut: "https://instagram.com/votre-profil", placeholder: "https://instagram.com/...", icon: "◻", description: "Compte Instagram" },
  { label: "TikTok", domaine: "tiktok.com", urlParDefaut: "https://tiktok.com/@votre-compte", placeholder: "https://tiktok.com/@...", icon: "", description: "Compte TikTok" },
  { label: "LinkedIn", domaine: "linkedin.com", urlParDefaut: "https://linkedin.com/in/votre-profil", placeholder: "https://linkedin.com/in/...", icon: "in", description: "Profil ou page LinkedIn" },
  { label: "X / Twitter", domaine: "x.com", urlParDefaut: "https://x.com/votre-compte", placeholder: "https://x.com/...", icon: "𝕏", description: "Compte X (Twitter)" },
  { label: "YouTube", domaine: "youtube.com", urlParDefaut: "https://youtube.com/@votre-chanel", placeholder: "https://youtube.com/@...", icon: "▶", description: "Chaîne YouTube" },
  { label: "Site web", domaine: "", urlParDefaut: "", placeholder: "https://votre-site.com", icon: "🌐", description: "Lien vers votre site" },
] as const;

const weekdays = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ClientFicheEdit() {
  const { ficheId } = useParams<{ ficheId: string }>();

  const id = Number(ficheId);
  const utils = trpc.useUtils();
  const fiche = trpc.clientSpaceRouter.ficheDetail.useQuery({ ficheId: id });
  const [form, setForm] = useState<FormState | null>(null);
  const [uploading, setUploading] = useState<MediaKind | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoAlt, setVideoAlt] = useState("");

  useEffect(() => {
    if (!fiche.data || form) return;
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
      googlePlaceId: fiche.data.googlePlaceId ?? "",
      photo: fiche.data.photo ?? "",
      logo: fiche.data.logo ?? "",
      data: {
        premierBouton: fiche.data.data?.premierBouton ?? "whatsapp",
        messageWhatsapp: fiche.data.data?.messageWhatsapp ?? "",
        presentation: fiche.data.data?.presentation ?? "",
        reseauxSociaux: fiche.data.data?.reseauxSociaux ?? RESEAUX.map(r => ({ label: r.label, url: r.urlParDefaut, actif: false })),
        liens: fiche.data.data?.liens ?? [],
        horaires:
          fiche.data.data?.horaires?.length === 7
            ? fiche.data.data?.horaires
            : weekdays.map(jour => ({ jour, horaire: "" })),
        galerie: fiche.data.data?.galerie ?? [],
        sections: fiche.data.data?.sections ?? [],
      },
    });
  }, [fiche.data, form]);

  const save = trpc.clientSpaceRouter.updateSignature.useMutation({
    onSuccess: async () => {
      toast.success("Fiche mise à jour");
      await Promise.all([
        utils.clientSpaceRouter.ficheDetail.invalidate({ ficheId: id }),
        utils.clientSpaceRouter.dashboard.invalidate({ ficheId: id }),
      ]);
    },
    onError: error =>
      toast.error("Échec de la mise à jour", { description: error.message }),
  });

  const upload = trpc.clientSpaceRouter.uploadMedia.useMutation();
  const addVideo = trpc.clientSpaceRouter.addVideo.useMutation();

  if (fiche.isLoading || !fiche.data || !form) {
    return (
      <ClientLayout ficheId={id}>
        <div className="panel m-4 sm:m-6 lg:m-8 py-16 text-center text-sm text-[#7d8798]">
          Chargement…
        </div>
      </ClientLayout>
    );
  }

  const lifecycleBlocked =
    fiche.data.statutMetier === "suspendue" ||
    fiche.data.statutMetier === "expiree";

  if (lifecycleBlocked) {
    return (
      <ClientLayout ficheId={id}>
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c98a4e]">
              Modifier ma fiche
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#172033]">
              Modification indisponible
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#7d8798]">
              Cette fiche ne peut pas être modifiée tant que son état n'est pas
              rétabli.
            </p>
          </div>
          <FicheStatusAlert
            status={fiche.data.statutMetier}
            dateEcheance={fiche.data.dateEcheance}
          />
        </div>
      </ClientLayout>
    );
  }

  const plan = fiche.data.formule;
  const capabilities = getClientFicheCapabilities(plan);
  const upgradeLabel = (key: keyof typeof capabilities): PlanName =>
    capabilities[key].upgradeTo ?? "pro";

  const setField = <K extends keyof Omit<FormState, "data">>(
    key: K,
    value: FormState[K]
  ) => setForm(current => (current ? { ...current, [key]: value } : current));

  const setData = <K extends keyof FormState["data"]>(
    key: K,
    value: FormState["data"][K]
  ) =>
    setForm(current =>
      current
        ? { ...current, data: { ...current.data, [key]: value } }
        : current
    );

  async function uploadImage(file: File, kind: MediaKind) {
    try {
      const capability =
        kind === "gallery" ? capabilities.gallery : capabilities.profile;
      if (!capability.editable) {
        toast.error("Fonction verrouillée", {
          description: `Disponible à partir du plan ${upgradeLabel(kind === "gallery" ? "gallery" : "profile")}.`,
        });
        return;
      }
      setUploading(kind);
      const prepared = await prepareImage(file, kind);
      const result = await upload.mutateAsync({
        ficheId: id,
        kind,
        filename: prepared.name,
        mimeType: "image/webp",
        contentBase64: await fileToDataUrl(prepared),
      });
      if (kind === "profile") setField("photo", result.url);
      if (kind === "logo") setField("logo", result.url);
      if (kind === "gallery")
        setData("galerie", [
          ...(form?.data.galerie ?? []),
          { type: "image", url: result.url, alt: prepared.name },
        ]);
      toast.success("Image ajoutée");
    } catch (error) {
      toast.error("Image refusée", {
        description:
          error instanceof Error ? error.message : "Le traitement a échoué.",
      });
    } finally {
      setUploading(null);
    }
  }

  function saveChanges(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (fiche.data?.plan.requiresProfile && (!form.photo || !form.logo)) {
      toast.error("Couverture et photo / logo obligatoires", {
        description:
          "Ajoutez une couverture et une photo / un logo avant d’enregistrer la fiche.",
      });
      return;
    }
    save.mutate({ ficheId: id, ...form });
  }

  return (
    <ClientLayout ficheId={id}>
      <div className="min-h-screen bg-[#f5f6f8] text-[#172033] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-[1300px] space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e8ed] pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c98a4e]">
                Formule {formuleLabels[plan] ?? plan}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#172033]">
                Modifier ma fiche
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-[#7d8798]">
                Vous pouvez modifier le contenu public de votre fiche. Les
                paramètres d’administration restent réservés au studio.
              </p>
            </div>
            <button
              type="submit"
              form="client-fiche-form"
              disabled={save.isPending || uploading !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172033] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#25324d] disabled:opacity-60"
            >
              <Save size={16} />
              {save.isPending
                ? "Enregistrement…"
                : "Enregistrer les modifications"}
            </button>
          </div>

          <form
            id="client-fiche-form"
            onSubmit={saveChanges}
            className="space-y-6"
          >
            {/* Section Identité & Contact */}
            <EditorSection
              title="Identité et contact"
              subtitle="Gérez l'ensemble de vos coordonnés et informations d'identification."
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[#172033] mb-3">
                    Informations personnelles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Prénom" required>
                      <input
                        required
                        value={form.prenom}
                        onChange={e => setField("prenom", e.target.value)}
                        className="editor-input"
                      />
                    </Field>
                    <Field label="Nom" required>
                      <input
                        required
                        value={form.nom}
                        onChange={e => setField("nom", e.target.value)}
                        className="editor-input"
                      />
                    </Field>
                    <Field label="Fonction" required>
                      <input
                        required
                        value={form.fonction}
                        onChange={e => setField("fonction", e.target.value)}
                        className="editor-input"
                      />
                    </Field>
                    <Field label="Entreprise" required>
                      <input
                        required
                        value={form.entreprise}
                        onChange={e => setField("entreprise", e.target.value)}
                        className="editor-input"
                      />
                    </Field>
                  </div>
                </div>

                <hr className="border-[#f0f2f5]" />

                <div>
                  <h3 className="text-sm font-semibold text-[#172033] mb-3">
                    Moyens de contact & localisation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Téléphone" required>
                      <input
                        required
                        value={form.telephone}
                        onChange={e => setField("telephone", e.target.value)}
                        className="editor-input"
                      />
                    </Field>
                    <Field label="WhatsApp" required>
                      <input
                        required
                        value={form.whatsapp}
                        onChange={e => setField("whatsapp", e.target.value)}
                        className="editor-input"
                      />
                    </Field>
                    <Field label="E-mail">
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setField("email", e.target.value)}
                        className="editor-input"
                      />
                    </Field>
                    <Field label="Adresse">
                      <input
                        value={form.adresse}
                        onChange={e => setField("adresse", e.target.value)}
                        className="editor-input"
                      />
                    </Field>
                    <Field
                      label="Site web"
                      upgradeRequired={!capabilities.site.editable}
                      upgradePlan={upgradeLabel("site")}
                    >
                      <input
                        disabled={!capabilities.site.editable}
                        value={form.site}
                        onChange={e => setField("site", e.target.value)}
                        className="editor-input"
                        placeholder="https://votre-site.com"
                      />
                    </Field>
                    <Field label="Lien Google Maps">
                      <input
                        value={form.lienItineraire}
                        onChange={e =>
                          setField("lienItineraire", e.target.value)
                        }
                        className="editor-input"
                        placeholder="https://maps.google.com/..."
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </EditorSection>

            {/* Section Couverture et Photo / logo */}
            <EditorSection title="Couverture et photo / logo">
              {!capabilities.profile.editable ? (
                <UpgradeNotice requiredPlan={upgradeLabel("profile")} />
              ) : (
                <fieldset
                  disabled={!capabilities.profile.editable}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <MediaCard
                    title="Couverture"
                    value={form.photo}
                    loading={uploading === "profile"}
                    onPick={file => uploadImage(file, "profile")}
                    onRemove={() => setField("photo", "")}
                  />
                  <MediaCard
                    title="Photo / logo"
                    value={form.logo}
                    loading={uploading === "logo"}
                    onPick={file => uploadImage(file, "logo")}
                    onRemove={() => setField("logo", "")}
                  />
                </fieldset>
              )}
            </EditorSection>

            {/* Section Présentation & Action principale */}
            <EditorSection title="Présentation et action principale">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Field label="Action prioritaire">
                  <select
                    value={form.data.premierBouton}
                    onChange={e =>
                      setData(
                        "premierBouton",
                        e.target.value as FormState["data"]["premierBouton"]
                      )
                    }
                    className="editor-input"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="appel">Appeler</option>
                    <option value="email">E-mail</option>
                  </select>
                </Field>
                <Field label="Message WhatsApp prérempli">
                  <input
                    value={form.data.messageWhatsapp}
                    onChange={e => setData("messageWhatsapp", e.target.value)}
                    className="editor-input"
                    placeholder="Bonjour, je souhaite plus d'informations..."
                  />
                </Field>
              </div>

              <div className="mt-4">
                {!capabilities.presentation.editable ? (
                  <UpgradeNotice requiredPlan={upgradeLabel("presentation")} />
                ) : (
                  <Field label="Présentation">
                    <textarea
                      disabled={!capabilities.presentation.editable}
                      className="editor-input"
                      rows={5}
                      value={form.data.presentation}
                      onChange={e => setData("presentation", e.target.value)}
                      placeholder="Présentez votre activité, vos services..."
                    />
                  </Field>
                )}
              </div>
            </EditorSection>


            {/* Section Réseaux sociaux */}
            <EditorSection
              title={`Réseaux sociaux (${form.data.reseauxSociaux.filter(r => r.actif).length}/${RESEAUX.length})`}
              subtitle="Cochez les réseaux à afficher. Vous pouvez personnaliser l'URL de chaque profil."
            >
              {!capabilities.socials.editable ? (
                <UpgradeNotice requiredPlan={upgradeLabel("socials")} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {RESEAUX.map(reseau => {
                    const existing = form.data.reseauxSociaux.find(r => r.label === reseau.label);
                    const actif = existing?.actif ?? false;
                    const currentUrl = existing?.url ?? reseau.urlParDefaut;
                    return (
                      <div
                        key={reseau.label}
                        className={`rounded-xl border p-4 transition ${
                          actif
                            ? "border-[#c98a4e] bg-[#fdfbf7] shadow-sm"
                            : "border-[#e5e8ed] bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-semibold text-[#172033]">
                              {reseau.label}
                            </span>
                            {reseau.icon && (
                              <span className="ml-2 text-base" aria-hidden="true">
                                {reseau.icon}
                              </span>
                            )}
                            {reseau.description && (
                              <p className="mt-0.5 text-xs text-[#6b7789]">{reseau.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const others = form.data.reseauxSociaux.filter(r => r.label !== reseau.label);
                              setData(
                                "reseauxSociaux",
                                actif
                                  ? others
                                  : [
                                      ...others,
                                      { label: reseau.label, url: currentUrl, actif: true },
                                    ]
                              );
                            }}
                            className={`shrink-0 rounded-lg p-1.5 text-sm font-semibold transition ${
                              actif
                                ? "bg-[#c98a4e] text-white"
                                : "bg-[#f0f2f5] text-[#6b7789] hover:bg-[#e5e8ed]"
                            }`}
                            aria-pressed={actif}
                            title={actif ? `Retirer ${reseau.label}` : `Ajouter ${reseau.label}`}
                          >
                            {actif ? "✓ Actif" : "Ajouter"}
                          </button>
                        </div>
                        {actif && (
                          <div className="mt-3 flex gap-2">
                            <input
                              className="flex-1 rounded-lg border border-[#cfd5dd] px-3 py-2 text-xs outline-none focus:border-[#c98a4e]"
                              type="url"
                              value={currentUrl}
                              onChange={e => {
                                setData(
                                  "reseauxSociaux",
                                  form.data.reseauxSociaux.map(r =>
                                    r.label === reseau.label ? { ...r, url: e.target.value } : r
                                  )
                                );
                              }}
                              placeholder={reseau.placeholder}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setData(
                                  "reseauxSociaux",
                                  form.data.reseauxSociaux.filter(r => r.label !== reseau.label)
                                );
                              }}
                              className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                              title={`Supprimer ${reseau.label}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </EditorSection>

            {/* Section Liens personnalisés */}
            <EditorSection
              title={`Liens personnalisés (${form.data.liens.length}/${capabilities.links.maxItems ?? fiche.data.plan.maxLinks})`}
              subtitle={`Maximum ${capabilities.links.maxItems ?? fiche.data.plan.maxLinks} liens autorisés.`}
            >
              {!capabilities.links.editable ? (
                <UpgradeNotice requiredPlan={upgradeLabel("links")} />
              ) : (
                <Repeater
                  items={form.data.liens}
                  onAdd={() => {
                    if (
                      form.data.liens.length <
                      (capabilities.links.maxItems ?? 0)
                    )
                      setData("liens", [
                        ...form.data.liens,
                        { label: "", url: "" },
                      ]);
                  }}
                  onRemove={index =>
                    setData(
                      "liens",
                      form.data.liens.filter((_, i) => i !== index)
                    )
                  }
                  render={(item, index) => (
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        className="editor-input"
                        placeholder="Libellé du lien"
                        value={item.label}
                        onChange={e =>
                          setData(
                            "liens",
                            form.data.liens.map((x, i) =>
                              i === index ? { ...x, label: e.target.value } : x
                            )
                          )
                        }
                      />
                      <input
                        className="editor-input"
                        type="url"
                        placeholder="https://..."
                        value={item.url}
                        onChange={e =>
                          setData(
                            "liens",
                            form.data.liens.map((x, i) =>
                              i === index ? { ...x, url: e.target.value } : x
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setData(
                            "liens",
                            form.data.liens.filter((_, i) => i !== index)
                          )
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                />
              )}
            </EditorSection>

            {/* Section Galerie */}
            <EditorSection
              title={`Galerie (${form.data.galerie.length}/${capabilities.gallery.maxItems ?? 0})`}
              subtitle={`Maximum ${capabilities.gallery.maxItems ?? 0} photos autorisées.`}
            >
              {!capabilities.gallery.editable ? (
                <UpgradeNotice requiredPlan={upgradeLabel("gallery")} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {form.data.galerie.map((item, index) => (
                    <div
                      key={item.url}
                      className="rounded-xl border border-[#e5e8ed] bg-white p-2.5 shadow-sm"
                    >
                      <div className="relative h-32 w-full overflow-hidden rounded-lg bg-[#f5f6f8]">
                        {item.type === "video" ? (
                          item.source === "direct" ? (
                            <video
                              src={item.url}
                              controls
                              playsInline
                              preload="metadata"
                              className="h-full w-full object-contain bg-black"
                              aria-label={item.alt || "Vidéo"}
                            />
                          ) : (
                            <iframe
                              src={item.embedUrl}
                              title={item.alt || "Vidéo"}
                              className="h-full w-full"
                              loading="lazy"
                              referrerPolicy="strict-origin-when-cross-origin"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          )
                        ) : (
                          <img
                            src={item.url}
                            alt={item.alt}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <input
                        className="mt-2 w-full rounded-lg border border-[#cfd5dd] px-2.5 py-1.5 text-xs outline-none focus:border-[#c98a4e]"
                        placeholder={
                          item.type === "video"
                            ? "Description de la vidéo"
                            : "Description (alt)"
                        }
                        aria-label={"Description " + (index + 1)}
                        value={item.alt}
                        onChange={e =>
                          setData(
                            "galerie",
                            form.data.galerie.map((x, i) =>
                              i === index ? { ...x, alt: e.target.value } : x
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setData(
                            "galerie",
                            form.data.galerie.filter((_, i) => i !== index)
                          )
                        }
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  ))}
                  {form.data.galerie.length <
                    (capabilities.gallery.maxItems ?? 0) && (
                    <label className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#cfd5dd] bg-gray-50/50 p-4 text-center text-sm font-medium text-[#667085] hover:bg-gray-100/50 transition">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        disabled={uploading !== null}
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file) await uploadImage(file, "gallery");
                          e.currentTarget.value = "";
                        }}
                      />
                      {uploading === "gallery" ? (
                        <Loader2 className="animate-spin text-[#c98a4e]" />
                      ) : (
                        <ImagePlus className="text-[#c98a4e]" />
                      )}
                      <span>Ajouter une photo</span>
                    </label>
                  )}
                </div>
              )}
            </EditorSection>
            {/* Section Vidéos */}
            <EditorSection
              title={`Vidéos (${form.data.galerie.filter(item => item.type === "video").length}/${capabilities.gallery.maxVideos ?? 0})`}
              subtitle="Ajoutez une vidéo par lien. Les vidéos sont affichées avant les photos sur la fiche publique."
            >
              {!capabilities.gallery.editable ? (
                <UpgradeNotice requiredPlan={upgradeLabel("gallery")} />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
                    <input
                      className="editor-input"
                      type="url"
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      aria-label="URL de la vidéo"
                    />
                    <input
                      className="editor-input"
                      value={videoAlt}
                      onChange={e => setVideoAlt(e.target.value)}
                      placeholder="Description de la vidéo"
                      aria-label="Description de la vidéo"
                    />
                    <button
                      type="button"
                      disabled={
                        !videoUrl.trim() ||
                        addVideo.isPending ||
                        form.data.galerie.filter(item => item.type === "video")
                          .length >= (capabilities.gallery.maxVideos ?? 0)
                      }
                      onClick={async () => {
                        const parsed = parseVideoUrl(videoUrl);
                        if (!parsed) {
                          toast.error("Lien vidéo non supporté", {
                            description:
                              "Utilisez YouTube, Instagram, Facebook, TikTok, Vimeo ou une URL vidéo directe HTTPS.",
                          });
                          return;
                        }
                        try {
                          const item = await addVideo.mutateAsync({
                            ficheId: id,
                            url: parsed.url,
                            alt: videoAlt,
                          });
                          setData("galerie", [
                            ...form.data.galerie,
                            item as GalleryItem,
                          ]);
                          setVideoUrl("");
                          setVideoAlt("");
                          await utils.clientSpaceRouter.ficheDetail.invalidate({
                            ficheId: id,
                          });
                          toast.success("Vidéo ajoutée");
                        } catch (error) {
                          toast.error("Vidéo refusée", {
                            description:
                              error instanceof Error
                                ? error.message
                                : "Impossible d'ajouter la vidéo.",
                          });
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172033] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {addVideo.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Video size={16} />
                      )}
                      Ajouter
                    </button>
                  </div>
                  <p className="text-xs text-[#7d8798]">
                    YouTube, Shorts, Instagram, Facebook, TikTok, Vimeo et URLs
                    directes HTTPS (.mp4/.webm/.ogg).
                  </p>
                </div>
              )}
            </EditorSection>

            {/* Section Horaires */}
            <EditorSection
              title="Horaires d'ouverture"
              subtitle="Renseignez vos horaires d'ouverture pour chaque jour de la semaine."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.data.horaires.map((row, index) => (
                  <div
                    key={row.jour}
                    className="flex items-center gap-3 bg-gray-50/60 p-2.5 rounded-lg border border-[#e5e8ed]"
                  >
                    <span className="w-24 text-sm font-semibold text-[#172033]">
                      {row.jour}
                    </span>
                    <input
                      className="editor-input flex-1"
                      value={row.horaire}
                      placeholder="Ex: 09:00 — 18:00 ou Fermé"
                      onChange={e =>
                        setData(
                          "horaires",
                          form.data.horaires.map((x, i) =>
                            i === index ? { ...x, horaire: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </EditorSection>

            {/* Section Avis Google */}
            <EditorSection title="Avis Google">
              {!capabilities.googleReview.editable ? (
                <UpgradeNotice requiredPlan={upgradeLabel("googleReview")} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Google Place ID">
                    <input
                      value={form.googlePlaceId}
                      onChange={e => setField("googlePlaceId", e.target.value)}
                      className="editor-input"
                      placeholder="ChIJ…"
                    />
                  </Field>
                </div>
              )}
            </EditorSection>

            {/* Section Catalogue / Menu */}
            <EditorSection title="Catalogue / Menu / Tarifs">
              {!capabilities.catalog.editable ? (
                <UpgradeNotice requiredPlan={upgradeLabel("catalog")} />
              ) : (
                <CatalogEditor
                  sections={form.data.sections}
                  onChange={sections => setData("sections", sections)}
                />
              )}
            </EditorSection>

            {/* Submit Bottom Action */}
            <div className="flex justify-end pt-4 border-t border-[#e5e8ed]">
              <button
                type="submit"
                disabled={save.isPending || uploading !== null}
                className="inline-flex items-center gap-2 rounded-xl bg-[#172033] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#25324d] disabled:opacity-60"
              >
                <Save size={16} />
                {save.isPending
                  ? "Enregistrement…"
                  : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ClientLayout>
  );
}

{
  /* Composant de notice d'upgrade Premium */
}
function UpgradeNotice({ requiredPlan }: { requiredPlan: PlanName }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-[#e2d0b5] bg-gradient-to-r from-[#fdfbf7] to-[#f9f4ec] p-4 text-left text-[#735028] transition hover:border-[#c98a4e]"
        aria-label={`Fonctionnalité Premium, disponible avec le plan ${requiredPlan}`}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#c98a4e]/15 text-[#c98a4e]">
            <Lock size={20} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[#543b1d]">
              Fonctionnalité Premium
            </span>
            <span className="block text-xs text-[#8c6537]">
              Cette option est disponible avec le plan{" "}
              <span className="font-bold underline">{requiredPlan}</span>.
            </span>
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#c98a4e] px-3.5 py-2 text-xs font-semibold text-white shadow-sm">
          <Sparkles size={14} aria-hidden="true" /> Voir le plan
        </span>
      </button>
      <PremiumUpgradeModal
        feature="Cette fonctionnalité"
        requiredPlan={requiredPlan}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function EditorSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe4ea] bg-white shadow-sm">
      <header className="border-b border-[#e9edf2] bg-[#f7f9fb] px-5 py-4 sm:px-6">
        <h2 className="text-base font-bold text-[#172033]">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-[#6b7789]">{subtitle}</p>}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  upgradeRequired,
  upgradePlan,
  children,
}: {
  label: string;
  required?: boolean;
  upgradeRequired?: boolean;
  upgradePlan?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#3a4761]">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
        {upgradeRequired && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c98a4e]">
            <Lock size={12} /> Plan {upgradePlan}
          </span>
        )}
      </div>
      <div>{children}</div>
    </label>
  );
}

function Repeater<T>({
  items,
  onAdd,
  onRemove,
  render,
}: {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map(render)}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-lg border border-[#cfd5dd] bg-white px-4 py-2.5 text-xs font-semibold text-[#52607a] hover:bg-gray-50 transition"
      >
        <Plus size={14} /> Ajouter un élément
      </button>
    </div>
  );
}

function MediaCard({
  title,
  value,
  loading,
  onPick,
  onRemove,
}: {
  title: string;
  value: string;
  loading: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#e5e8ed] bg-white p-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <strong className="text-sm font-semibold text-[#172033]">
          {title}
        </strong>
        <Upload size={16} className="text-[#7d8798]" />
      </div>
      <div className="mt-3 flex h-48 items-center justify-center overflow-hidden rounded-lg bg-[#f5f6f8]">
        {value ? (
          <img
            src={value}
            alt={title}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-sm text-[#9aa3b1]">
            <Upload size={24} />
            <span>Aucune image sélectionnée</span>
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {value && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#cfd5dd] bg-white px-4 py-2 text-xs font-semibold text-[#172033] hover:bg-gray-50 transition">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            disabled={loading}
            onChange={e => e.target.files?.[0] && onPick(e.target.files[0])}
          />
          {loading ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <Upload size={14} />
          )}
          Choisir un fichier
        </label>
      </div>
    </div>
  );
}

function CatalogEditor({
  sections,
  onChange,
}: {
  sections: CatalogSection[];
  onChange: (value: CatalogSection[]) => void;
}) {
  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="rounded-xl border border-[#dfe4ea] bg-[#f7f9fb] p-4 space-y-3"
        >
          <div className="flex gap-2 items-center">
            <input
              className="editor-input flex-1 font-semibold"
              placeholder="Nom de la section (Ex: Entrées, Services...)"
              value={section.titre}
              onChange={e =>
                onChange(
                  sections.map((x, i) =>
                    i === sectionIndex ? { ...x, titre: e.target.value } : x
                  )
                )
              }
            />
            <button
              type="button"
              onClick={() =>
                onChange(sections.filter((_, i) => i !== sectionIndex))
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition shrink-0"
              title="Supprimer la section"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="space-y-2 pl-2 border-l-2 border-[#c98a4e]/30">
            {section.articles.map((article, articleIndex) => (
              <div
                key={articleIndex}
                className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_120px_auto] gap-2 items-center"
              >
                <input
                  className="editor-input"
                  placeholder="Article / prestation"
                  value={article.nom}
                  onChange={e =>
                    onChange(
                      sections.map((x, i) =>
                        i === sectionIndex
                          ? {
                              ...x,
                              articles: x.articles.map((a, ai) =>
                                ai === articleIndex
                                  ? { ...a, nom: e.target.value }
                                  : a
                              ),
                            }
                          : x
                      )
                    )
                  }
                />
                <input
                  className="editor-input"
                  placeholder="Description"
                  value={article.description}
                  onChange={e =>
                    onChange(
                      sections.map((x, i) =>
                        i === sectionIndex
                          ? {
                              ...x,
                              articles: x.articles.map((a, ai) =>
                                ai === articleIndex
                                  ? { ...a, description: e.target.value }
                                  : a
                              ),
                            }
                          : x
                      )
                    )
                  }
                />
                <input
                  className="editor-input"
                  placeholder="Prix"
                  value={article.prix}
                  onChange={e =>
                    onChange(
                      sections.map((x, i) =>
                        i === sectionIndex
                          ? {
                              ...x,
                              articles: x.articles.map((a, ai) =>
                                ai === articleIndex
                                  ? { ...a, prix: e.target.value }
                                  : a
                              ),
                            }
                          : x
                      )
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      sections.map((x, i) =>
                        i === sectionIndex
                          ? {
                              ...x,
                              articles: x.articles.filter(
                                (_, ai) => ai !== articleIndex
                              ),
                            }
                          : x
                      )
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition shrink-0"
                  title="Supprimer l'article"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange(
                  sections.map((x, i) =>
                    i === sectionIndex
                      ? {
                          ...x,
                          articles: [
                            ...x.articles,
                            { nom: "", description: "", prix: "" },
                          ],
                        }
                      : x
                  )
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfd5dd] bg-white px-3 py-2 text-xs font-semibold text-[#52607a] hover:bg-gray-50 transition mt-2"
            >
              <Plus size={14} /> Ajouter un article
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...sections,
            { titre: "", articles: [{ nom: "", description: "", prix: "" }] },
          ])
        }
        className="inline-flex items-center gap-2 rounded-lg border border-[#cfd5dd] bg-white px-4 py-2.5 text-xs font-semibold text-[#52607a] hover:bg-gray-50 transition"
      >
        <Plus size={14} /> Ajouter une section
      </button>
    </div>
  );
}
