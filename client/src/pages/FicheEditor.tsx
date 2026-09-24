import { Button } from "@/components/ui/button";
import { ADMIN_HOME_PATH } from "@/const";
import { prepareImage } from "@/lib/imageProcessing";
import { trpc } from "@/lib/trpc";
import type { MediaKind } from "@shared/mediaRules";
import { MAX_CATALOG_ARTICLE_DESCRIPTION_LENGTH } from "@shared/catalogRules";
import { getPlanFeatures, type PlanName } from "@shared/planFeatures";
import {
  ArrowLeft,
  Check,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useParams } from "wouter";
const planLabels: Record<PlanName, string> = {
  essentiel: "Essentiel",
  pro: "Pro",
  signature: "Signature",
};
const weekdays = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
type Status = "active" | "suspendue" | "supprimee" | "brouillon";
type LinkItem = { label: string; url: string };
type SocialItem = { label: string; url: string };
type GalleryItem = { url: string; alt: string };
type HoursItem = { jour: string; horaire: string };
type ArticleBadge = "populaire" | "nouveau" | "promo";
type Article = {
  nom: string;
  description: string;
  prix: string;
  devise?: "XOF" | "EUR";
  photo?: string;
  badge?: ArticleBadge;
};
type CatalogSection = { titre: string; articles: Article[] };
type EditorForm = {
  id: number;
  slug: string;
  formule: PlanName;
  statut: Status;
  nom: string;
  prenom: string;
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
    notesInternes: string;
  };
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function FicheEditor() {
  const { slug = "" } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const ficheQuery = trpc.fiches.getBySlug.useQuery({ slug });
  const requestsQuery = trpc.fiches.contactRequests.useQuery({ slug });
  const updateMutation = trpc.fiches.update.useMutation();
  const uploadMutation = trpc.media.upload.useMutation();
  const [form, setForm] = useState<EditorForm | null>(null);
  const [uploading, setUploading] = useState<MediaKind | null>(null);
  const [uploadingArticlePhoto, setUploadingArticlePhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!ficheQuery.data || form) return;
    const fiche = ficheQuery.data;
    setForm({
      id: fiche.id,
      slug: fiche.slug,
      formule: fiche.formule,
      statut: fiche.statut,
      nom: fiche.nom,
      prenom: fiche.prenom,
      fonction: fiche.fonction,
      entreprise: fiche.entreprise,
      telephone: fiche.telephone,
      whatsapp: fiche.whatsapp,
      email: fiche.email ?? "",
      site: fiche.site ?? "",
      adresse: fiche.adresse ?? "",
      lienItineraire: fiche.lienItineraire ?? "",
      googlePlaceId: fiche.googlePlaceId ?? "",
      photo: fiche.photo ?? "",
      logo: fiche.logo ?? "",
      data: {
        premierBouton: fiche.data.premierBouton ?? "whatsapp",
        messageWhatsapp: fiche.data.messageWhatsapp ?? "",
        presentation: fiche.data.presentation ?? "",
        reseauxSociaux: fiche.data.reseauxSociaux ?? [],
        liens: fiche.data.liens ?? [],
        horaires: fiche.data.horaires ?? [],
        galerie: fiche.data.galerie ?? [],
        sections: fiche.data.sections ?? [],
        notesInternes: fiche.data.notesInternes ?? "",
      },
    });
  }, [ficheQuery.data, form]);

  const features = useMemo(
    () => (form ? getPlanFeatures(form.formule) : null),
    [form?.formule]
  );
  if (ficheQuery.isLoading || !form || !features)
    return (
      <div className="public-loading">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Chargement de l’éditeur…</p>
      </div>
    );
  if (ficheQuery.error)
    return <div className="p-10 text-center">Fiche introuvable.</div>;

  const setField = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) =>
    setForm(current => (current ? { ...current, [key]: value } : current));
  const setData = <K extends keyof EditorForm["data"]>(
    key: K,
    value: EditorForm["data"][K]
  ) =>
    setForm(current =>
      current
        ? { ...current, data: { ...current.data, [key]: value } }
        : current
    );

  function selectPlan(plan: PlanName) {
    const next = getPlanFeatures(plan);
    setForm(current => {
      if (!current) return current;
      const horaires =
        next.requiresHours && current.data.horaires.length !== 7
          ? weekdays.map(jour => ({ jour, horaire: "" }))
          : current.data.horaires;
      return { ...current, formule: plan, data: { ...current.data, horaires } };
    });
  }

  async function upload(file: File, kind: MediaKind) {
    if (!form) return;
    try {
      setUploading(kind);
      const prepared = await prepareImage(file, kind);
      const result = await uploadMutation.mutateAsync({
        formula: form.formule,
        kind,
        filename: prepared.name,
        mimeType: "image/webp",
        contentBase64: await fileToDataUrl(prepared),
      });
      if (kind === "profile") setField("photo", result.url);
      if (kind === "logo") setField("logo", result.url);
      if (kind === "gallery")
        setForm(current =>
          current
            ? {
                ...current,
                data: {
                  ...current.data,
                  galerie: [
                    ...current.data.galerie,
                    { url: result.url, alt: prepared.name },
                  ].slice(0, getPlanFeatures(current.formule).maxPhotos),
                },
              }
            : current
        );
      toast.success("Image préparée et enregistrée", {
        description: `${Math.round(result.bytes / 1024)} ko`,
      });
    } catch (error) {
      toast.error("Image refusée", {
        description:
          error instanceof Error ? error.message : "Le traitement a échoué.",
      });
    } finally {
      setUploading(null);
    }
  }

  async function uploadCatalogPhoto(
    file: File,
    sectionIndex: number,
    articleIndex: number
  ) {
    if (!form) return;
    const key = `${sectionIndex}-${articleIndex}`;
    try {
      setUploadingArticlePhoto(key);
      const prepared = await prepareImage(file, "catalogArticle");
      const result = await uploadMutation.mutateAsync({
        formula: form.formule,
        kind: "catalogArticle",
        filename: prepared.name,
        mimeType: "image/webp",
        contentBase64: await fileToDataUrl(prepared),
      });
      setForm(current =>
        current
          ? {
              ...current,
              data: {
                ...current.data,
                sections: current.data.sections.map((section, si) =>
                  si === sectionIndex
                    ? {
                        ...section,
                        articles: section.articles.map((article, ai) =>
                          ai === articleIndex
                            ? { ...article, photo: result.url }
                            : article
                        ),
                      }
                    : section
                ),
              },
            }
          : current
      );
      toast.success("Photo ajoutée");
    } catch (error) {
      toast.error("Image refusée", {
        description:
          error instanceof Error ? error.message : "Le traitement a échoué.",
      });
    } finally {
      setUploadingArticlePhoto(null);
    }
  }

  async function save(status: Status) {
    if (!form) return;
    try {
      const result = await updateMutation.mutateAsync({
        ...form,
        statut: status,
      });
      setField("statut", status);
      toast.success(
        status === "active" ? "Fiche validée et active" : "Brouillon enregistré"
      );
      if (result.slug !== slug) navigate(`/studio/fiche/${result.slug}`);
    } catch (error) {
      toast.error("La fiche n’est pas conforme au plan", {
        description:
          error instanceof Error
            ? error.message
            : "Vérifiez les champs obligatoires.",
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-[#172033]">
      <header className="sticky top-0 z-20 border-b border-[#e3e6ea] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1300px] items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href={ADMIN_HOME_PATH} className="icon-button" title="Retour">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="eyebrow">Éditeur de fiche</p>
              <h1 className="font-semibold">
                {form.prenom} {form.nom}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button>
              <Eye className="h4 w-4" /> Voir la fiche
            </Button>

            <Button
              variant="outline"
              onClick={() => save("brouillon")}
              disabled={updateMutation.isPending}
            >
              <Save className="h-4 w-4" /> Enregistrer
            </Button>
            <Button
              onClick={() => save("active")}
              disabled={updateMutation.isPending}
              className="bg-[#172033] text-white"
            >
              <Check className="h-4 w-4" /> Valider et activer
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-[1300px] gap-6 px-5 py-7 lg:grid-cols-[290px_1fr]">
        <aside className="space-y-5">
          <section className="editor-card sticky top-24">
            <p className="eyebrow">Formule</p>
            <div className="mt-3 grid gap-2">
              {(Object.keys(planLabels) as PlanName[]).map(plan => (
                <button
                  type="button"
                  key={plan}
                  onClick={() => selectPlan(plan)}
                  className={`plan-choice ${form.formule === plan ? "plan-choice-active" : ""}`}
                >
                  <span>{planLabels[plan]}</span>
                  {form.formule === plan && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-[#f5f7fa] p-4 text-xs leading-6 text-[#667085]">
              <p>
                <strong>{features.maxLinks}</strong> liens personnalisés
              </p>
              <p>
                <strong>{features.maxPhotos}</strong> photos de galerie
              </p>
              <p>
                Couverture et photo / logo{" "}
                {features.requiresProfile ? "obligatoire" : "optionnel"}
              </p>
              <p>Formulaire {features.hasForm ? "inclus" : "non inclus"}</p>
              <p>
                Avis Google{" "}
                {features.hasGoogleReview ? "obligatoire" : "non inclus"}
              </p>
              <p>Catalogue {features.hasCatalog ? "inclus" : "non inclus"}</p>
            </div>
            {form.data.liens.length > features.maxLinks && (
              <p className="mt-3 text-xs font-medium text-red-600">
                Supprimez {form.data.liens.length - features.maxLinks} lien(s)
                avant validation.
              </p>
            )}
            {form.data.galerie.length > features.maxPhotos && (
              <p className="mt-2 text-xs font-medium text-red-600">
                Supprimez {form.data.galerie.length - features.maxPhotos}{" "}
                photo(s) avant validation.
              </p>
            )}
          </section>
        </aside>
        <div className="space-y-6">
          <EditorSection
            title="Identité"
            note="Visible dans la première zone, sans défilement"
          >
            <div className="editor-grid">
              <EditorField label="Prénom">
                <input
                  value={form.prenom}
                  onChange={e => setField("prenom", e.target.value)}
                />
              </EditorField>
              <EditorField label="Nom">
                <input
                  value={form.nom}
                  onChange={e => setField("nom", e.target.value)}
                />
              </EditorField>
              <EditorField label="Fonction">
                <input
                  value={form.fonction}
                  onChange={e => setField("fonction", e.target.value)}
                />
              </EditorField>
              <EditorField label="Entreprise">
                <input
                  value={form.entreprise}
                  onChange={e => setField("entreprise", e.target.value)}
                />
              </EditorField>
              <EditorField label="Adresse publique (non modifiable)">
                <input
                  value={`/fiche/${form.slug}`}
                  readOnly
                  aria-readonly="true"
                  className="cursor-not-allowed bg-[#f5f6f8] text-[#657084]"
                />
              </EditorField>
              <EditorField label="Action prioritaire">
                <select
                  value={form.data.premierBouton}
                  onChange={e =>
                    setData(
                      "premierBouton",
                      e.target.value as EditorForm["data"]["premierBouton"]
                    )
                  }
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="appel">Appeler</option>
                  <option value="email">E-mail</option>
                </select>
              </EditorField>
            </div>
          </EditorSection>
          <EditorSection
            title="Couverture et photo / logo"
            note="Couverture : grande image en haut de la fiche (recadrée à 400 × 400 sous 30 ko). Photo / logo : affiché en rond au-dessus du nom, pour reconnaître la personne (sous 80 ko)."
          >
            <div className="media-pair">
              <MediaPicker
                title="Couverture"
                value={form.photo}
                required={features.requiresProfile}
                loading={uploading === "profile"}
                onPick={file => upload(file, "profile")}
                onRemove={() => setField("photo", "")}
              />
              <MediaPicker
                title="Photo / logo"
                value={form.logo}
                required={features.requiresProfile}
                loading={uploading === "logo"}
                onPick={file => upload(file, "logo")}
                onRemove={() => setField("logo", "")}
              />
            </div>
          </EditorSection>
          <EditorSection title="Contact et localisation">
            <div className="editor-grid">
              <EditorField label="Téléphone">
                <input
                  value={form.telephone}
                  onChange={e => setField("telephone", e.target.value)}
                />
              </EditorField>
              <EditorField label="WhatsApp">
                <input
                  value={form.whatsapp}
                  onChange={e => setField("whatsapp", e.target.value)}
                />
              </EditorField>
              <EditorField label="E-mail">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setField("email", e.target.value)}
                />
              </EditorField>
              {form.formule !== "essentiel" && (
                <EditorField label="Site">
                  <input
                    value={form.site}
                    onChange={e => setField("site", e.target.value)}
                  />
                </EditorField>
              )}
              <EditorField label="Adresse">
                <input
                  value={form.adresse}
                  onChange={e => setField("adresse", e.target.value)}
                />
              </EditorField>
              <EditorField label="Lien itinéraire">
                <input
                  value={form.lienItineraire}
                  onChange={e => setField("lienItineraire", e.target.value)}
                />
              </EditorField>
            </div>
            <EditorField label="Message WhatsApp prérempli">
              <textarea
                value={form.data.messageWhatsapp}
                onChange={e => setData("messageWhatsapp", e.target.value)}
              />
            </EditorField>
          </EditorSection>
          {form.formule !== "essentiel" && (
            <>
              <EditorSection
                title="Présentation Pro"
                note="Bloc affiché sur les formules Pro et Signature"
              >
                <EditorField label="Présentation de l’activité">
                  <textarea
                    rows={6}
                    placeholder="Présentez l’activité, les services, l’expertise ou le positionnement de l’établissement…"
                    value={form.data.presentation}
                    onChange={e => setData("presentation", e.target.value)}
                  />
                </EditorField>
              </EditorSection>
              <EditorSection
                title={`Réseaux sociaux (${form.data.reseauxSociaux.length})`}
                note="Ils seront affichés comme des boutons avec leur icône, adaptés au thème de la fiche"
              >
                <div className="space-y-3">
                  {form.data.reseauxSociaux.map((social, index) => (
                    <div
                      className="repeater-row"
                      key={`${social.url}-${index}`}
                    >
                      <input
                        placeholder="Instagram, Facebook, LinkedIn…"
                        value={social.label}
                        onChange={e =>
                          setData(
                            "reseauxSociaux",
                            form.data.reseauxSociaux.map((item, i) =>
                              i === index
                                ? { ...item, label: e.target.value }
                                : item
                            )
                          )
                        }
                      />
                      <input
                        type="url"
                        placeholder="https://…"
                        value={social.url}
                        onChange={e =>
                          setData(
                            "reseauxSociaux",
                            form.data.reseauxSociaux.map((item, i) =>
                              i === index
                                ? { ...item, url: e.target.value }
                                : item
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setData(
                            "reseauxSociaux",
                            form.data.reseauxSociaux.filter(
                              (_, i) => i !== index
                            )
                          )
                        }
                        aria-label="Supprimer ce réseau social"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setData("reseauxSociaux", [
                        ...form.data.reseauxSociaux,
                        { label: "", url: "" },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" /> Ajouter un réseau social
                  </Button>
                </div>
              </EditorSection>
            </>
          )}
          {features.maxLinks > 0 && (
            <>
          <EditorSection
            title={`Liens personnalisés (${form.data.liens.length}/${features.maxLinks})`}
            note="Le serveur refuse tout dépassement du plafond"
          >
            <Repeater
              items={form.data.liens}
              max={features.maxLinks}
              addLabel="Ajouter un lien"
              onAdd={() =>
                setData("liens", [...form.data.liens, { label: "", url: "" }])
              }
              render={(link, index) => (
                <div className="repeater-row">
                  <input
                    placeholder="Libellé"
                    value={link.label}
                    onChange={e =>
                      setData(
                        "liens",
                        form.data.liens.map((item, i) =>
                          i === index
                            ? { ...item, label: e.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <input
                    placeholder="https://…"
                    value={link.url}
                    onChange={e =>
                      setData(
                        "liens",
                        form.data.liens.map((item, i) =>
                          i === index ? { ...item, url: e.target.value } : item
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
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            />
          </EditorSection>
            </>
          )}
          {features.maxPhotos > 0 && (
            <EditorSection
              title={`Galerie (${form.data.galerie.length}/${features.maxPhotos})`}
              note="1200 px maximum, WebP, moins de 80 ko, chargement différé"
            >
              <div className="gallery-editor">
                {form.data.galerie.map((image, index) => (
                  <div className="gallery-editor-item" key={image.url}>
                    <img src={image.url} alt={image.alt} />
                    <input
                      aria-label={`Texte alternatif ${index + 1}`}
                      value={image.alt}
                      onChange={e =>
                        setData(
                          "galerie",
                          form.data.galerie.map((item, i) =>
                            i === index
                              ? { ...item, alt: e.target.value }
                              : item
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
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {form.data.galerie.length < features.maxPhotos && (
                  <label className="gallery-add">
                    <input
                      aria-label="Ajouter des photos à la galerie"
                      className="hidden"
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploading === "gallery"}
                      onChange={async e => {
                        const files = Array.from(e.target.files ?? []);
                        const remaining =
                          features.maxPhotos - form.data.galerie.length;
                        for (const file of files.slice(0, remaining)) {
                          await upload(file, "gallery");
                        }
                        e.currentTarget.value = "";
                      }}
                    />
                    {uploading === "gallery" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-5 w-5" />
                    )}
                    <span>Ajouter une ou plusieurs photos</span>
                  </label>
                )}
              </div>
            </EditorSection>
          )}
          {features.requiresHours && (
            <EditorSection
              title="Horaires des 7 jours"
              note="Chaque jour doit contenir un horaire ou la mention Fermé"
            >
              <div className="hours-editor">
                {form.data.horaires.map((row, index) => (
                  <div key={row.jour} className="hours-editor-row">
                    <strong>{row.jour}</strong>
                    <input
                      placeholder="09:00 — 18:00 ou Fermé"
                      value={row.horaire}
                      onChange={e =>
                        setData(
                          "horaires",
                          form.data.horaires.map((item, i) =>
                            i === index
                              ? { ...item, horaire: e.target.value }
                              : item
                          )
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </EditorSection>
          )}
          {features.hasGoogleReview && (
            <EditorSection
              title="Avis Google"
              note="Le bouton public ouvre directement l’écran de dépôt d’avis Google"
            >
              <EditorField label="Google Place ID (obligatoire)">
                <input
                  value={form.googlePlaceId}
                  onChange={e => setField("googlePlaceId", e.target.value)}
                  placeholder="ChIJ…"
                />
              </EditorField>
              <p className="mt-3 text-xs leading-5 text-[#7b8494]">
                Le Place ID sert à générer automatiquement le bouton « Laisser
                un avis ». Aucun lien Google manuel n’est nécessaire.
              </p>
            </EditorSection>
          )}
          {features.hasCatalog && (
            <EditorSection
              title="Catalogue / menu / tarifs"
              note={
                form.formule === "signature"
                  ? "Au moins une section est exigée pour activer une fiche Signature"
                  : `Jusqu'à ${features.maxCatalogSections} sections et ${features.maxCatalogArticlesPerSection} articles par section`
              }
            >
              <CatalogEditor
                sections={form.data.sections}
                onChange={sections => setData("sections", sections)}
                maxSections={features.maxCatalogSections}
                maxArticlesPerSection={features.maxCatalogArticlesPerSection}
                uploadingPhotoKey={uploadingArticlePhoto}
                onUploadPhoto={(file, sectionIndex, articleIndex) =>
                  uploadCatalogPhoto(file, sectionIndex, articleIndex)
                }
              />
            </EditorSection>
          )}
          {features.hasForm && (
            <EditorSection
              title="Formulaire de rappel"
              note="Inclus automatiquement sur la fiche publique; les demandes sont conservées en base"
            >
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                Le formulaire Nom + Téléphone + Message est actif pour cette
                formule.
              </div>
              <div className="mt-4 space-y-2">
                {requestsQuery.data?.length ? (
                  requestsQuery.data.map(request => (
                    <div
                      className="rounded-xl border border-[#e5e8ed] p-4"
                      key={request.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-sm">{request.name}</strong>
                        <a
                          className="text-xs font-semibold text-[#2c6dcc]"
                          href={`tel:${request.phone}`}
                        >
                          {request.phone}
                        </a>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#657084]">
                        {request.message}
                      </p>
                      <p className="mt-2 text-[11px] text-[#9aa3b1]">
                        {new Date(request.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#8b94a3]">
                    Aucune demande reçue pour le moment.
                  </p>
                )}
              </div>
            </EditorSection>
          )}
          <EditorSection
            title="Notes internes"
            note="Jamais affichées au public"
          >
            <EditorField label="Suivi de production">
              <textarea
                value={form.data.notesInternes}
                onChange={e => setData("notesInternes", e.target.value)}
              />
            </EditorField>
          </EditorSection>
        </div>
      </main>
    </div>
  );
}

function EditorSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="editor-card">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {note && <p className="mt-1 text-sm text-[#7b8494]">{note}</p>}
      </div>
      {children}
    </section>
  );
}
function EditorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Repeater<T>({
  items,
  max,
  addLabel,
  onAdd,
  render,
}: {
  items: T[];
  max: number;
  addLabel: string;
  onAdd: () => void;
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map(render)}
      <Button
        type="button"
        variant="outline"
        disabled={items.length >= max}
        onClick={onAdd}
      >
        <Plus className="h-4 w-4" /> {addLabel}
      </Button>
    </div>
  );
}
function MediaPicker({
  title,
  value,
  required,
  loading,
  onPick,
  onRemove,
}: {
  title: string;
  value: string;
  required: boolean;
  loading: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className={`media-picker ${required ? "media-picker-required" : ""}`}>
      {value ? (
        <img src={value} alt={title} />
      ) : (
        <div className="media-placeholder">
          <Upload className="h-5 w-5" />
          <span>{required ? "Obligatoire" : "Optionnel"}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <strong>{title}</strong>
        <div className="flex gap-1">
          {value && (
            <button type="button" className="table-action" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#e5e8ed] px-2.5 py-2 text-xs font-semibold text-[#657084]">
            <input
              aria-label={`Téléverser ${title.toLowerCase()}`}
              className="hidden"
              type="file"
              accept="image/*"
              disabled={loading}
              onChange={e => e.target.files?.[0] && onPick(e.target.files[0])}
            />
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}{" "}
            Choisir
          </label>
        </div>
      </div>
    </div>
  );
}
function CatalogEditor({
  sections,
  onChange,
  maxSections,
  maxArticlesPerSection,
  uploadingPhotoKey,
  onUploadPhoto,
}: {
  sections: CatalogSection[];
  onChange: (value: CatalogSection[]) => void;
  maxSections: number;
  maxArticlesPerSection: number;
  uploadingPhotoKey: string | null;
  onUploadPhoto: (file: File, sectionIndex: number, articleIndex: number) => void;
}) {
  function updateArticle(
    sectionIndex: number,
    articleIndex: number,
    patch: Partial<Article>
  ) {
    onChange(
      sections.map((section, si) =>
        si === sectionIndex
          ? {
              ...section,
              articles: section.articles.map((article, ai) =>
                ai === articleIndex ? { ...article, ...patch } : article
              ),
            }
          : section
      )
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, sectionIndex) => {
        const atArticleLimit = section.articles.length >= maxArticlesPerSection;
        return (
          <div
            key={sectionIndex}
            className="rounded-xl border border-[#dfe4ea] bg-[#f7f9fb] p-3 space-y-2"
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
              {section.articles.map((article, articleIndex) => {
                const photoKey = `${sectionIndex}-${articleIndex}`;
                const isUploadingPhoto = uploadingPhotoKey === photoKey;
                return (
                  <div
                    key={articleIndex}
                    className="rounded-lg border border-[#e5e8ed] bg-white p-2.5 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <label
                        className={`relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition ${
                          article.photo
                            ? "border-transparent"
                            : "border-[#cfd5dd] hover:bg-gray-50"
                        }`}
                        title="Photo de l'article"
                      >
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          disabled={isUploadingPhoto}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) onUploadPhoto(file, sectionIndex, articleIndex);
                            e.currentTarget.value = "";
                          }}
                        />
                        {isUploadingPhoto ? (
                          <Loader2 size={18} className="animate-spin text-[#c98a4e]" />
                        ) : article.photo ? (
                          <img
                            src={article.photo}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImagePlus size={18} className="text-[#98a2b3]" />
                        )}
                      </label>
                      <input
                        className="editor-input min-w-0 flex-1"
                        placeholder="Article / prestation"
                        value={article.nom}
                        onChange={e =>
                          updateArticle(sectionIndex, articleIndex, {
                            nom: e.target.value,
                          })
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
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                        title="Supprimer l'article"
                        aria-label="Supprimer l'article"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div>
                      <textarea
                        className="editor-input min-h-[72px] resize-y"
                        placeholder="Description (optionnel)"
                        value={article.description}
                        maxLength={MAX_CATALOG_ARTICLE_DESCRIPTION_LENGTH}
                        onChange={e =>
                          updateArticle(sectionIndex, articleIndex, {
                            description: e.target.value,
                          })
                        }
                      />
                      <div className="mt-1 text-right text-[11px] text-[#8b94a3]">
                        {article.description.length}/{MAX_CATALOG_ARTICLE_DESCRIPTION_LENGTH}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        className="editor-input min-w-[100px] flex-1"
                        placeholder="Prix (ex: 3 000)"
                        value={article.prix}
                        onChange={e =>
                          updateArticle(sectionIndex, articleIndex, {
                            prix: e.target.value,
                          })
                        }
                      />
                      <select
                        className="editor-input w-[92px] shrink-0"
                        value={article.devise ?? "XOF"}
                        onChange={e =>
                          updateArticle(sectionIndex, articleIndex, {
                            devise: e.target.value as "XOF" | "EUR",
                          })
                        }
                      >
                        <option value="XOF">FCFA</option>
                        <option value="EUR">EUR</option>
                      </select>
                      <select
                        className="editor-input w-[124px] shrink-0"
                        value={article.badge ?? ""}
                        onChange={e =>
                          updateArticle(sectionIndex, articleIndex, {
                            badge: (e.target.value || undefined) as
                              | ArticleBadge
                              | undefined,
                          })
                        }
                      >
                        <option value="">Aucun badge</option>
                        <option value="populaire">Populaire</option>
                        <option value="nouveau">Nouveau</option>
                        <option value="promo">Promo</option>
                      </select>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  disabled={atArticleLimit}
                  onClick={() =>
                    onChange(
                      sections.map((x, i) =>
                        i === sectionIndex
                          ? {
                              ...x,
                              articles: [
                                ...x.articles,
                                { nom: "", description: "", prix: "", devise: "XOF" },
                              ],
                            }
                          : x
                      )
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#cfd5dd] bg-white px-3 py-2 text-xs font-semibold text-[#52607a] hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={14} /> Ajouter un article
                </button>
                <span className="text-[11px] text-[#98a2b3]">
                  {section.articles.length} / {maxArticlesPerSection} articles
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={sections.length >= maxSections}
          onClick={() =>
            onChange([
              ...sections,
              {
                titre: "",
                articles: [{ nom: "", description: "", prix: "", devise: "XOF" }],
              },
            ])
          }
          className="inline-flex items-center gap-2 rounded-lg border border-[#cfd5dd] bg-white px-4 py-2.5 text-xs font-semibold text-[#52607a] hover:bg-gray-50 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={14} /> Ajouter une section
        </button>
        <span className="text-[11px] text-[#98a2b3]">
          {sections.length} / {maxSections} sections
        </span>
      </div>
    </div>
  );
}
