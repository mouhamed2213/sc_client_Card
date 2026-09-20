import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Phone, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  FicheTemplate,
  type FicheTemplateActions,
} from "../../../templates/base/FicheTemplate";
import type { FicheTemplateModel } from "../../../templates/model";
import { readCachedFiche, saveCachedFiche } from "../offline/ficheCache";

type PublicData = FicheTemplateModel["data"];
type PublicFicheData = FicheTemplateModel & {
  statut?: string;
  statutMetier?: string;
  dateEcheance?: string | Date;
};

function parseError(error: unknown) {
  return error instanceof Error ? error.message : "Cette fiche n'existe pas.";
}

function isCachedFicheUsable(fiche: PublicFicheData | null) {
  if (!fiche) return false;
  if (fiche.statut === "suspendue" || fiche.statut === "supprimee") return false;
  if (!fiche.dateEcheance) return true;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(fiche.dateEcheance) >= startOfToday;
}


export default function PublicFiche() {
  const { slug = "" } = useParams<{ slug: string }>();
  const ficheQuery = trpc.fiches.getBySlug.useQuery({ slug });
  const scanMutation = trpc.fiches.recordScan.useMutation();
  const contactMutation = trpc.fiches.contact.useMutation();
  const cachedFiche = useMemo(() => readCachedFiche(slug), [slug]);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const usableCachedFiche = isCachedFicheUsable(cachedFiche as PublicFicheData | null);
  const fiche = (ficheQuery.data ?? (!ficheQuery.error && usableCachedFiche ? cachedFiche : null)) as
    | PublicFicheData
    | null
    | undefined;
  const isOfflineVersion = !ficheQuery.data && !ficheQuery.error && usableCachedFiche;

  useEffect(() => {
    if (!ficheQuery.data) return;
    const freshFiche = ficheQuery.data as PublicFicheData;
    if (
      freshFiche.statut !== "suspendue" &&
      freshFiche.statut !== "supprimee"
    ) {
      saveCachedFiche(slug, freshFiche);
    }
  }, [ficheQuery.data, slug]);

  useEffect(() => {
    if (ficheQuery.data && (ficheQuery.data.statutMetier === "active" || ficheQuery.data.statutMetier === "a_renouveler")) scanMutation.mutate({ slug });
  }, [ficheQuery.data?.statutMetier, slug]);

  if (ficheQuery.isLoading && !usableCachedFiche) {
    return (
      <div className="public-page public-loading">
        <div className="loading-pulse" />
        <p>Chargement de la fiche…</p>
      </div>
    );
  }

  if ((ficheQuery.error && !cachedFiche) || !fiche) {
    return (
      <div className="public-page flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <XCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Fiche introuvable</h1>
          <p className="mt-2 text-sm leading-6 text-[#6d7789]">
            {parseError(ficheQuery.error)}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#244775]"
          >
            Retour à l’accueil <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (fiche.statut === "suspendue" || fiche.statut === "supprimee")
    return <UnavailableFiche entreprise={fiche.entreprise} />;

  const data = fiche.data as PublicData;
  const phoneHref = `tel:${fiche.telephone}`;
  const whatsappHref = `https://wa.me/${fiche.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(data.messageWhatsapp || `Bonjour, je souhaite échanger avec ${fiche.prenom}.`)}`;
  const emailHref = fiche.email ? `mailto:${fiche.email}` : undefined;
  const vCard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${fiche.nom};${fiche.prenom};;;`,
    `FN:${fiche.prenom} ${fiche.nom}`,
    `ORG:${fiche.entreprise}`,
    `TITLE:${fiche.fonction}`,
    `TEL;TYPE=CELL:${fiche.telephone}`,
    fiche.email ? `EMAIL:${fiche.email}` : "",
    fiche.adresse ? `ADR;TYPE=WORK:;;${fiche.adresse};;;;` : "",
    `URL:${window.location.origin}/fiche/${fiche.slug}`,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
  const contactHref = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCard)}`;
  const primaryButton =
    data.premierBouton === "appel" || data.premierBouton === "email"
      ? data.premierBouton
      : "whatsapp";
  const buttonOrder: FicheTemplateActions["buttonOrder"] =
    primaryButton === "appel"
      ? ["appel", "whatsapp", "email"]
      : primaryButton === "email"
        ? ["email", "appel", "whatsapp"]
        : ["whatsapp", "appel", "email"];

  const templateFiche: FicheTemplateModel = {
    slug: fiche.slug,
    formule: fiche.formule,
    nom: fiche.nom,
    prenom: fiche.prenom,
    fonction: fiche.fonction,
    entreprise: fiche.entreprise,
    photo: fiche.photo,
    logo: fiche.logo,
    telephone: fiche.telephone,
    whatsapp: fiche.whatsapp,
    email: fiche.email,
    site: fiche.site,
    adresse: fiche.adresse,
    lienItineraire: fiche.lienItineraire,
    googlePlaceId: fiche.googlePlaceId,
    data,
  };
  const actions: FicheTemplateActions = {
    phoneHref,
    whatsappHref,
    emailHref,
    contactHref,
    buttonOrder,
    contactOpen,
    contactSent,
    contactForm,
    contactPending: contactMutation.isPending,
    contactError: contactMutation.error?.message,
    onOpenContact: () => setContactOpen(true),
    onCloseContact: () => setContactOpen(false),
    onContactFormChange: (field, value) =>
      setContactForm(current => ({ ...current, [field]: value })),
    onContactSubmit: event => {
      event.preventDefault();
      if (isOfflineVersion) return;
      contactMutation.mutate(
        { slug, ...contactForm },
        {
          onSuccess: () => {
            setContactForm({ name: "", phone: "", message: "" });
            setContactOpen(false);
            setContactSent(true);
          },
        }
      );
    },
  };

  return (
    <>
      <FicheTemplate fiche={templateFiche} actions={actions} />
      {isOfflineVersion && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#172033] px-4 py-2 text-xs font-medium text-white shadow-lg">
          Version enregistrée · Hors connexion
        </div>
      )}
    </>
  );
}

function UnavailableFiche({ entreprise }: { entreprise: string }) {
  return (
    <div className="public-page flex min-h-screen items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf0f4] text-[#657084]">
          <XCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">
          Cette fiche est temporairement indisponible
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6d7789]">
          La fiche de {entreprise} est momentanément hors ligne. Pour toute
          question, contactez Support Connecté.
        </p>
        <a
          href="tel:+221770000000"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#172033] px-5 py-3 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4" /> +221 77 000 00 00
        </a>
      </div>
    </div>
  );
}
