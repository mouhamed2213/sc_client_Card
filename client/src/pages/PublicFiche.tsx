import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowUpRight, CalendarDays, ChevronRight, Clock3, Download, ExternalLink, Globe2, MapPin, MessageCircle, Phone, Star, UserRound, XCircle } from "lucide-react";

type PublicData = {
  premierBouton?: "whatsapp" | "appel" | "contact";
  messageWhatsapp?: string;
  liens?: { label: string; url: string }[];
  horaires?: { jour: string; horaire: string }[];
  galerie?: { url: string; alt: string }[];
  sections?: { titre: string; articles: { nom: string; description: string; prix: string }[] }[];
};

function parseError(error: unknown) { return error instanceof Error ? error.message : "Cette fiche n'existe pas."; }

export default function PublicFiche() {
  const { slug = "" } = useParams<{ slug: string }>();
  const ficheQuery = trpc.fiches.getBySlug.useQuery({ slug });
  const scanMutation = trpc.fiches.recordScan.useMutation();
  const contactMutation = trpc.fiches.contact.useMutation();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const fiche = ficheQuery.data;
  useEffect(() => { if (fiche?.statut === "active") scanMutation.mutate({ slug }); }, [fiche?.statut, slug]);

  if (ficheQuery.isLoading) return <div className="public-page public-loading"><div className="loading-pulse" /><p>Chargement de la fiche…</p></div>;
  if (ficheQuery.error || !fiche) return <div className="public-page flex min-h-screen items-center justify-center p-6"><div className="max-w-sm text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500"><XCircle className="h-7 w-7" /></div><h1 className="mt-5 text-2xl font-semibold">Fiche introuvable</h1><p className="mt-2 text-sm leading-6 text-[#6d7789]">{parseError(ficheQuery.error)}</p><Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#244775]">Retour au studio <ArrowUpRight className="h-4 w-4" /></Link></div></div>;
  if (fiche.statut === "suspendue" || fiche.statut === "supprimee") return <UnavailableFiche entreprise={fiche.entreprise} />;

  const data = fiche.data as PublicData;
  const hasForm = fiche.plan?.hasForm ?? ["pro", "signature", "commerce"].includes(fiche.formule);
  const phoneHref = `tel:${fiche.telephone}`;
  const whatsappHref = `https://wa.me/${fiche.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(data.messageWhatsapp || `Bonjour, je souhaite échanger avec ${fiche.prenom}.`)}`;
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
  ].filter(Boolean).join("\n");
  const contactHref = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCard)}`;
  const primaryButton = data.premierBouton || "whatsapp";
  const buttonOrder = primaryButton === "appel" ? ["appel", "contact", "whatsapp"] : primaryButton === "contact" ? ["contact", "appel", "whatsapp"] : ["whatsapp", "appel", "contact"];
  const buttons = {
    appel: <a href={phoneHref} className="public-action public-action-call"><Phone className="h-5 w-5" /><span>Appeler</span></a>,
    whatsapp: <a href={whatsappHref} className="public-action public-action-whatsapp"><MessageCircle className="h-5 w-5" /><span>WhatsApp</span></a>,
    contact: <a href={contactHref} download={`${fiche.slug}.vcf`} className="public-action public-action-contact"><Download className="h-5 w-5" /><span>Enregistrer</span></a>,
  } as const;

  return <div className="public-page"><div className="public-card"><section className="public-hero"><div className="public-topline"><span className="public-chip">Fiche vérifiée</span><span className="public-nfc">NFC · QR</span></div><div className="public-identity"><div className="public-avatar">{fiche.logo ? <img src={fiche.logo} alt="" /> : <span>{fiche.prenom.slice(0, 1)}{fiche.nom.slice(0, 1)}</span>}</div><p className="public-name">{fiche.prenom} {fiche.nom}</p><p className="public-role">{fiche.fonction}<span className="mx-2 text-white/30">·</span>{fiche.entreprise}</p></div><div className="public-actions">{buttonOrder.map((key) => <span key={key}>{buttons[key as keyof typeof buttons]}</span>)}</div></section>
  <main className="public-content"><div className="public-section intro-note"><span className="accent-line" /><p>Une fiche simple pour trouver la bonne information, sans détour.</p></div>
    {(data.liens?.length || fiche.site) ? <section className="public-section"><SectionTitle icon={<Globe2 className="h-4 w-4" />} title="Liens utiles" /> <div className="link-list">{fiche.site && <a href={fiche.site} target="_blank" rel="noreferrer" className="public-link"><span>Site internet</span><ExternalLink className="h-4 w-4" /></a>}{data.liens?.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="public-link"><span>{link.label}</span><ExternalLink className="h-4 w-4" /></a>)}</div></section> : null}
    {fiche.adresse ? <section className="public-section"><SectionTitle icon={<MapPin className="h-4 w-4" />} title="Nous trouver" /><p className="public-address">{fiche.adresse}</p>{fiche.lienItineraire && <a href={fiche.lienItineraire} target="_blank" rel="noreferrer" className="public-primary-link">Ouvrir l'itinéraire <ArrowUpRight className="h-4 w-4" /></a>}</section> : null}
    {fiche.googlePlaceId && (fiche.plan?.hasGoogleReview ?? fiche.formule === "commerce") && <section className="review-panel"><div><p className="text-sm font-semibold text-[#3b3024]">Votre expérience compte</p><p className="mt-1 text-xs leading-5 text-[#806c58]">Partagez votre avis sur Google en un clic.</p></div><a href={`https://search.google.com/local/writereview?placeid=${fiche.googlePlaceId}`} target="_blank" rel="noreferrer" className="review-button"><Star className="h-4 w-4" /> Laisser un avis</a></section>}
    {data.horaires?.length ? <section className="public-section"><SectionTitle icon={<Clock3 className="h-4 w-4" />} title="Horaires" /><div className="hours-list">{data.horaires.map((row) => <div key={row.jour} className="hours-row"><span>{row.jour}</span><strong className={row.horaire.toLowerCase().includes("fermé") ? "text-[#a86155]" : ""}>{row.horaire}</strong></div>)}</div></section> : null}
    {hasForm ? <section className="public-section"><SectionTitle icon={<MessageCircle className="h-4 w-4" />} title="Être rappelé" />{contactOpen ? <form className="contact-form" onSubmit={(event) => { event.preventDefault(); contactMutation.mutate({ slug, ...contactForm }, { onSuccess: () => { setContactForm({ name: "", phone: "", message: "" }); setContactOpen(false); }, onError: () => undefined }); }}><input required minLength={2} placeholder="Votre nom" value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} /><input required minLength={8} placeholder="Votre téléphone" value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} /><textarea required minLength={2} placeholder="Votre message" value={contactForm.message} onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })} /><div className="flex gap-2"><button type="button" className="public-secondary-link" onClick={() => setContactOpen(false)}>Annuler</button><button disabled={contactMutation.isPending} className="public-primary-link" type="submit">{contactMutation.isPending ? "Envoi…" : "Envoyer ma demande"}</button></div></form> : <><p className="public-address">Laissez vos coordonnées, l’établissement vous recontactera directement.</p><button className="public-primary-link" onClick={() => setContactOpen(true)}>Demander un rappel <ArrowUpRight className="h-4 w-4" /></button></>}</section> : null}
    {data.sections?.length ? <section className="public-section"><SectionTitle icon={<CalendarDays className="h-4 w-4" />} title={fiche.formule === "commerce" ? "Carte & prestations" : "À découvrir"} />{data.sections.map((section) => <div key={section.titre} className="catalog-section"><h3>{section.titre}</h3>{section.articles.map((article) => <div key={article.nom} className="catalog-row"><div><p className="font-semibold text-[#26344a]">{article.nom}</p><p className="mt-1 text-xs leading-5 text-[#8891a0]">{article.description}</p></div><span>{article.prix}</span></div>)}</div>)}</section> : null}
    {data.galerie?.length ? <section className="public-section"><SectionTitle icon={<UserRound className="h-4 w-4" />} title="Galerie" /><div className="gallery-grid">{data.galerie.map((image) => <img key={image.url} src={image.url} alt={image.alt} loading="lazy" />)}</div></section> : null}
    <section className="public-footer"><div className="flex items-center justify-between gap-3"><p>Mentions légales · Confidentialité</p><Link href="/" className="public-brand">Support Connecté <ArrowUpRight className="h-3 w-3" /></Link></div><p className="mt-3 max-w-sm text-[11px] leading-5 text-[#9aa3b1]">Les informations envoyées via cette fiche servent uniquement à répondre à votre demande. Vous pouvez demander leur suppression en contactant l'établissement.</p></section>
  </main></div></div>;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="mb-4 flex items-center gap-2 text-[#60728c]"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef3f8]">{icon}</span><h2 className="text-xs font-bold uppercase tracking-[0.16em]">{title}</h2></div>; }
function UnavailableFiche({ entreprise }: { entreprise: string }) { return <div className="public-page flex min-h-screen items-center justify-center p-6"><div className="max-w-sm text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf0f4] text-[#657084]"><XCircle className="h-8 w-8" /></div><h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em]">Cette fiche est temporairement indisponible</h1><p className="mt-3 text-sm leading-6 text-[#6d7789]">La fiche de {entreprise} est momentanément hors ligne. Pour toute question, contactez Support Connecté.</p><a href="tel:+221770000000" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#172033] px-5 py-3 text-sm font-semibold text-white"><Phone className="h-4 w-4" /> +221 77 000 00 00</a></div></div>; }
