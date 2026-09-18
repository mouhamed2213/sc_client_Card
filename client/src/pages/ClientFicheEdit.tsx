import { useEffect, useState } from "react";
import { useParams } from "wouter";
import {
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import { formuleLabels } from "@/lib/ficheStatus";
import { prepareImage } from "@/lib/imageProcessing";
import type { MediaKind } from "@shared/mediaRules";

type LinkItem = { label: string; url: string };
type SocialItem = { label: string; url: string };
type GalleryItem = { url: string; alt: string };
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
    premierBouton: "whatsapp" | "appel" | "contact";
    messageWhatsapp: string;
    presentation: string;
    rendezVous: LinkItem;
    reseauxSociaux: SocialItem[];
    liens: LinkItem[];
    horaires: HoursItem[];
    galerie: GalleryItem[];
    sections: CatalogSection[];
  };
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
        premierBouton: fiche.data.premierBouton ?? "whatsapp",
        messageWhatsapp: fiche.data.messageWhatsapp ?? "",
        presentation: fiche.data.presentation ?? "",
        rendezVous: fiche.data.rendezVous ?? {
          label: "Prendre rendez-vous",
          url: "",
        },
        reseauxSociaux: fiche.data.reseauxSociaux ?? [],
        liens: fiche.data.liens ?? [],
        horaires:
          fiche.data.horaires?.length === 7
            ? fiche.data.horaires
            : weekdays.map(jour => ({ jour, horaire: "" })),
        galerie: fiche.data.galerie ?? [],
        sections: fiche.data.sections ?? [],
      },
    });
  }, [fiche.data, form]);

  const save = trpc.clientSpaceRouter.updateSignature.useMutation({
    onSuccess: async () => {
      toast.success("Fiche Signature mise à jour");
      await Promise.all([
        utils.clientSpaceRouter.ficheDetail.invalidate({ ficheId: id }),
        utils.clientSpaceRouter.dashboard.invalidate({ ficheId: id }),
      ]);
    },
    onError: error =>
      toast.error("Échec de la mise à jour", { description: error.message }),
  });

  const upload = trpc.clientSpaceRouter.uploadMedia.useMutation();

  if (fiche.isLoading || !fiche.data || !form) {
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
            <p className="id-card-name" style={{ fontSize: 19, marginTop: 16 }}>
              Passez à la carte Signature
            </p>
            <p className="id-card-role">
              L’édition complète depuis l’espace client est réservée à la formule Signature.
              Votre fiche est actuellement en {formuleLabels[fiche.data.formule] ?? fiche.data.formule}.
            </p>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Bonjour, je souhaite passer ma fiche ${fiche.data.entreprise} à la formule Signature.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e5a86b] px-4 py-2.5 text-sm font-semibold text-[#172033]"
            >
              <Sparkles size={15} /> Passer à Signature
            </a>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const setField = <K extends keyof Omit<FormState, "data">>(
    key: K,
    value: FormState[K]
  ) => setForm(current => (current ? { ...current, [key]: value } : current));

  const setData = <K extends keyof FormState["data"]>(
    key: K,
    value: FormState["data"][K]
  ) =>
    setForm(current =>
      current ? { ...current, data: { ...current.data, [key]: value } } : current
    );

  async function uploadImage(file: File, kind: MediaKind) {
    try {
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
      if (kind === "gallery") {
        setData("galerie", [
          ...form.data.galerie,
          { url: result.url, alt: prepared.name },
        ]);
      }
      toast.success("Image ajoutée");
    } catch (error) {
      toast.error("Image refusée", {
        description: error instanceof Error ? error.message : "Le traitement a échoué.",
      });
    } finally {
      setUploading(null);
    }
  }

  function saveChanges(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    save.mutate({ ficheId: id, ...form });
  }

  return (
    <ClientLayout ficheId={id}>
      <div className="min-h-screen bg-[#f5f6f8] text-[#172033] p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-[1300px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c98a4e]">
              Formule Signature
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#172033]">Modifier ma fiche</h1>
            <p className="mt-1 max-w-2xl text-sm text-[#7d8798]">
              Vous pouvez modifier le contenu public de votre fiche. Les paramètres
              d’administration restent réservés au studio.
            </p>
          </div>
          <button
            type="submit"
            form="signature-fiche-form"
            disabled={save.isPending || uploading !== null}
            className="flex items-center gap-2 rounded-xl bg-[#172033] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Save size={15} />
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>

        <form id="signature-fiche-form" onSubmit={saveChanges} className="space-y-6">
          <EditorSection title="Identité et contact">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["prenom", "Prénom", true],
                ["nom", "Nom", true],
                ["fonction", "Fonction", true],
                ["entreprise", "Entreprise", true],
                ["telephone", "Téléphone", true],
                ["whatsapp", "WhatsApp", true],
                ["email", "E-mail", false],
                ["site", "Site web", false],
                ["adresse", "Adresse", false],
                ["lienItineraire", "Lien Google Maps", false],
                ["googlePlaceId", "Google Place ID", false],
              ].map(([key, label, required]) => (
                <label key={key} className="block">
                  <span className="text-xs font-medium text-[#52607a]">
                    {label}{required ? " *" : ""}
                  </span>
                  <input
                    required={Boolean(required)}
                    type={key === "email" ? "email" : "text"}
                    value={form[key as keyof Omit<FormState, "data">] as string}
                    onChange={event =>
                      setField(
                        key as keyof Omit<FormState, "data">,
                        event.target.value
                      )
                    }
                    className="editor-input mt-1.5"
                  />
                </label>
              ))}
            </div>
          </Section>

          <EditorSection title="Portrait et logo" note="Le traitement d’image et les limites Signature restent contrôlés par le serveur.">
            <div className="grid gap-5 md:grid-cols-2">
              <MediaCard
                title="Portrait"
                value={form.photo}
                loading={uploading === "profile"}
                onPick={file => uploadImage(file, "profile")}
                onRemove={() => setField("photo", "")}
              />
              <MediaCard
                title="Logo"
                value={form.logo}
                loading={uploading === "logo"}
                onPick={file => uploadImage(file, "logo")}
                onRemove={() => setField("logo", "")}
              />
            </div>
          </Section>

          <EditorSection title="Présentation et action principale">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Action prioritaire">
                <select
                  value={form.data.premierBouton}
                  onChange={e =>
                    setData("premierBouton", e.target.value as FormState["data"]["premierBouton"])
                  }
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="appel">Appeler</option>
                  <option value="contact">Formulaire de contact</option>
                </select>
              </Field>
              <Field label="Message WhatsApp prérempli">
                <input
                  value={form.data.messageWhatsapp}
                  onChange={e => setData("messageWhatsapp", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Présentation">
              <textarea className="editor-input mt-1.5" rows={6}
                value={form.data.presentation}
                onChange={e => setData("presentation", e.target.value)}
              />
            </Field>
          </Section>

          <EditorSection title="Rendez-vous">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Libellé du bouton">
                <input
                  value={form.data.rendezVous.label}
                  onChange={e =>
                    setData("rendezVous", { ...form.data.rendezVous, label: e.target.value })
                  }
                />
              </Field>
              <Field label="URL de réservation">
                <input className="editor-input mt-1.5"\n                  type="url"
                  value={form.data.rendezVous.url}
                  onChange={e =>
                    setData("rendezVous", { ...form.data.rendezVous, url: e.target.value })
                  }
                  placeholder="https://…"
                />
              </Field>
            </div>
          </Section>

          <EditorSection title={`Réseaux sociaux (${form.data.reseauxSociaux.length})`}>
            <Repeater
              items={form.data.reseauxSociaux}
              onAdd={() =>
                setData("reseauxSociaux", [...form.data.reseauxSociaux, { label: "", url: "" }])
              }
              onRemove={index =>
                setData("reseauxSociaux", form.data.reseauxSociaux.filter((_, i) => i !== index))
              }
              render={(item, index) => (
                <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
                  <input className="editor-input"\n                    placeholder="Instagram, LinkedIn…"
                    value={item.label}
                    onChange={e =>
                      setData(
                        "reseauxSociaux",
                        form.data.reseauxSociaux.map((x, i) =>
                          i === index ? { ...x, label: e.target.value } : x
                        )
                      )
                    }
                  />
                  <input className="editor-input"\n                    type="url"
                    placeholder="https://…"
                    value={item.url}
                    onChange={e =>
                      setData(
                        "reseauxSociaux",
                        form.data.reseauxSociaux.map((x, i) =>
                          i === index ? { ...x, url: e.target.value } : x
                        )
                      )
                    }
                  />
                  <button type="button" onClick={() => onRemove(index)} className="rounded-lg border px-3">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            />
          </Section>

          <EditorSection title={`Liens personnalisés (${form.data.liens.length}/10)`} note="Maximum Signature : 10 liens.">
            <Repeater
              items={form.data.liens}
              onAdd={() => {
                if (form.data.liens.length < 10)
                  setData("liens", [...form.data.liens, { label: "", url: "" }]);
              }}
              onRemove={index =>
                setData("liens", form.data.liens.filter((_, i) => i !== index))
              }
              render={(item, index) => (
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    placeholder="Libellé"
                    value={item.label}
                    onChange={e =>
                      setData("liens", form.data.liens.map((x, i) => i === index ? { ...x, label: e.target.value } : x))
                    }
                  />
                  <input
                    type="url"
                    placeholder="https://…"
                    value={item.url}
                    onChange={e =>
                      setData("liens", form.data.liens.map((x, i) => i === index ? { ...x, url: e.target.value } : x))
                    }
                  />
                  <button type="button" onClick={() => onRemove(index)} className="rounded-lg border px-3">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            />
          </Section>

          <EditorSection title={`Galerie (${form.data.galerie.length}/8)`} note="Maximum Signature : 8 photos.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {form.data.galerie.map((image, index) => (
                <div key={image.url} className="rounded-xl border border-[#e5e8ed] p-2">
                  <img src={image.url} alt={image.alt} className="h-32 w-full rounded-lg object-cover" />
                  <input
                    className="mt-2 w-full rounded-lg border px-2 py-1.5 text-xs"
                    aria-label={`Texte alternatif ${index + 1}`}
                    value={image.alt}
                    onChange={e =>
                      setData("galerie", form.data.galerie.map((x, i) => i === index ? { ...x, alt: e.target.value } : x))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setData("galerie", form.data.galerie.filter((_, i) => i !== index))}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs"
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              ))}
              {form.data.galerie.length < 8 && (
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfd5dd] text-sm text-[#667085]">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    disabled={uploading === "gallery"}
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) await uploadImage(file, "gallery");
                      e.currentTarget.value = "";
                    }}
                  />
                  {uploading === "gallery" ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                  Ajouter une photo
                </label>
              )}
            </div>
          </Section>

          <EditorSection title="Horaires" note="Les 7 jours sont conservés et validés côté serveur.">
            <div className="space-y-2">
              {form.data.horaires.map((row, index) => (
                <div key={row.jour} className="grid gap-2 sm:grid-cols-[150px_1fr]">
                  <div className="flex items-center text-sm font-medium">{row.jour}</div>
                  <input className="editor-input"\n                    value={row.horaire}
                    placeholder="09:00 — 18:00 ou Fermé"
                    onChange={e =>
                      setData("horaires", form.data.horaires.map((x, i) => i === index ? { ...x, horaire: e.target.value } : x))
                    }
                  />
                </div>
              ))}
            </div>
          </Section>

          <EditorSection title="Avis Google">
            <Field label="Google Place ID">
              <input
                value={form.googlePlaceId}
                onChange={e => setField("googlePlaceId", e.target.value)}
                placeholder="ChIJ…"
              />
            </Field>
          </Section>

          <EditorSection title="Catalogue / menu / tarifs" note="Signature peut gérer ses sections et articles.">
            <CatalogEditor
              sections={form.data.sections}
              onChange={sections => setData("sections", sections)}
            />
          </Section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={save.isPending || uploading !== null}
              className="flex items-center gap-2 rounded-xl bg-[#172033] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save size={15} />
              {save.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div></div>
    </ClientLayout>
  );
}

function EditorSection({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="editor-card">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[#172033]">{title}</h2>
        {note && <p className="mt-1 text-xs text-[#7d8798]">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#52607a]">{label}</span>
      <div className="mt-1.5">{children}</div>
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
        className="inline-flex items-center gap-2 rounded-lg border border-[#e0e4e9] px-3 py-2 text-xs font-semibold text-[#52607a]"
      >
        <Plus size={14} /> Ajouter
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
    <div className="rounded-xl border border-[#e5e8ed] p-4">
      <div className="flex items-center justify-between">
        <strong className="text-sm">{title}</strong>
        <Upload size={16} className="text-[#7d8798]" />
      </div>
      <div className="mt-3 overflow-hidden rounded-lg bg-[#f5f6f8]">
        {value ? (
          <img src={value} alt={title} className="h-48 w-full object-contain" />
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-[#9aa3b1]">Aucune image</div>
        )}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {value && (
          <button type="button" onClick={onRemove} className="rounded-lg border px-3 py-2 text-xs">
            <Trash2 size={14} />
          </button>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            disabled={loading}
            onChange={e => e.target.files?.[0] && onPick(e.target.files[0])}
          />
          {loading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
          Choisir
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
        <div key={sectionIndex} className="rounded-xl border border-[#e5e8ed] p-4">
          <div className="flex gap-2">
            <input
              className="flex-1"
              placeholder="Nom de la section"
              value={section.titre}
              onChange={e =>
                onChange(sections.map((x, i) => i === sectionIndex ? { ...x, titre: e.target.value } : x))
              }
            />
            <button type="button" onClick={() => onChange(sections.filter((_, i) => i !== sectionIndex))} className="rounded-lg border px-3">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {section.articles.map((article, articleIndex) => (
              <div key={articleIndex} className="grid gap-2 md:grid-cols-[1fr_1.5fr_120px_auto]">
                <input className="editor-input"\n                  placeholder="Article / prestation"
                  value={article.nom}
                  onChange={e =>
                    onChange(sections.map((x, i) => i === sectionIndex ? {
                      ...x,
                      articles: x.articles.map((a, ai) => ai === articleIndex ? { ...a, nom: e.target.value } : a),
                    } : x))
                  }
                />
                <input
                  placeholder="Description"
                  value={article.description}
                  onChange={e =>
                    onChange(sections.map((x, i) => i === sectionIndex ? {
                      ...x,
                      articles: x.articles.map((a, ai) => ai === articleIndex ? { ...a, description: e.target.value } : a),
                    } : x))
                  }
                />
                <input
                  placeholder="Prix"
                  value={article.prix}
                  onChange={e =>
                    onChange(sections.map((x, i) => i === sectionIndex ? {
                      ...x,
                      articles: x.articles.map((a, ai) => ai === articleIndex ? { ...a, prix: e.target.value } : a),
                    } : x))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange(sections.map((x, i) => i === sectionIndex ? {
                      ...x,
                      articles: x.articles.filter((_, ai) => ai !== articleIndex),
                    } : x))
                  }
                  className="rounded-lg border px-3"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange(sections.map((x, i) => i === sectionIndex ? {
                  ...x,
                  articles: [...x.articles, { nom: "", description: "", prix: "" }],
                } : x))
              }
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"
            >
              <Plus size={14} /> Article
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...sections, { titre: "", articles: [{ nom: "", description: "", prix: "" }] }])
        }
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"
      >
        <Plus size={14} /> Ajouter une section
      </button>
    </div>
  );
}
