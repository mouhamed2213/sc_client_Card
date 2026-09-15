import "../themes.css";
import "../themes/essentiel.css";
import type { FormEvent, ReactNode } from "react";
import { ArrowUpRight, CalendarDays, Clock3, Download, ExternalLink, Globe2, Mail, MapPin, MessageCircle, Phone, Star, UserRound } from "lucide-react";
import type { FicheTemplateModel } from "../model";
import { getTemplateConfig } from "../config";

export type FicheTemplateActions = {
  phoneHref: string;
  whatsappHref: string;
  emailHref?: string;
  contactHref: string;
  buttonOrder: ("appel" | "whatsapp" | "email")[];
  contactOpen: boolean;
  contactSent: boolean;
  contactForm: { name: string; phone: string; message: string };
  contactPending: boolean;
  contactError?: string;
  onOpenContact: () => void;
  onCloseContact: () => void;
  onContactFormChange: (field: "name" | "phone" | "message", value: string) => void;
  onContactSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export type FicheTemplateProps = {
  fiche: FicheTemplateModel;
  actions: FicheTemplateActions;
  children?: ReactNode;
};

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return <div className="mb-4 flex items-center gap-2 text-[#60728c]"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef3f8]">{icon}</span><h2 className="text-xs font-bold uppercase tracking-[0.16em]">{title}</h2></div>;
}

function Hero({ fiche, actions }: FicheTemplateProps) {
  const identityImage = fiche.logo;
  const buttons = {
    appel: <a href={actions.phoneHref} className="public-action public-action-call"><Phone className="h-5 w-5" /><span>Appeler</span></a>,
    whatsapp: <a href={actions.whatsappHref} className="public-action public-action-whatsapp"><MessageCircle className="h-5 w-5" /><span>WhatsApp</span></a>,
    email: actions.emailHref ? <a href={actions.emailHref} className="public-action public-action-email"><Mail className="h-5 w-5" /><span>E-mail</span></a> : null,
  } as const;

  return <section className="public-hero">
    {fiche.photo && <div className="public-cover"><img src={fiche.photo} alt="" /></div>}
    <div className="public-hero-overlay" />
    <div className="public-topline"><span className="public-chip">Fiche de contact</span><span className="public-nfc">NFC · QR</span></div>
    <div className="public-identity">
      <div className="public-avatar">{identityImage ? <img src={identityImage} alt={`${fiche.prenom} ${fiche.nom}`} /> : <span>{fiche.prenom.slice(0, 1)}{fiche.nom.slice(0, 1)}</span>}</div>
      <p className="public-name">{fiche.prenom} {fiche.nom}</p>
      <p className="public-role">{fiche.fonction}<span className="mx-2 text-white/30">·</span>{fiche.entreprise}</p>
    </div>
    <div className="public-actions">{actions.buttonOrder.map((key) => <span key={key}>{buttons[key]}</span>)}</div>
  </section>;
}

export function FicheTemplate({ fiche, actions, children }: FicheTemplateProps) {
  const config = getTemplateConfig(fiche.formule);
  const { features } = config;
  const links = (fiche.data.liens ?? []).slice(0, features.maxLinks);
  const gallery = (fiche.data.galerie ?? []).slice(0, features.maxPhotos);

  return <div className={`public-page fiche-template fiche-template--${config.theme}`} data-formule={fiche.formule}>
    <div className="public-card fiche-template__card">
      <Hero fiche={fiche} actions={actions} />
      <main className="public-content">
        {fiche.formule === "essentiel" && <div className="essential-save-row"><a href={actions.contactHref} download={`${fiche.slug}.vcf`} className="public-save-contact"><Download className="h-4 w-4" /> Enregistrer le contact</a></div>}
        {(links.length || fiche.site) ? <section className="public-section"><SectionTitle icon={<Globe2 className="h-4 w-4" />} title="Liens utiles" /><div className="link-list">{fiche.site && <a href={fiche.site} target="_blank" rel="noreferrer" className="public-link"><span>Site internet</span><ExternalLink className="h-4 w-4" /></a>}{links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="public-link"><span>{link.label}</span><ExternalLink className="h-4 w-4" /></a>)}</div></section> : null}
        {fiche.adresse ? <section className="public-section"><SectionTitle icon={<MapPin className="h-4 w-4" />} title="Localisation" /><p className="public-address">{fiche.adresse}</p>{fiche.lienItineraire && <a href={fiche.lienItineraire} target="_blank" rel="noreferrer" className="public-primary-link">Ouvrir Google Maps <ArrowUpRight className="h-4 w-4" /></a>}</section> : null}
        {features.hasGoogleReview && fiche.googlePlaceId ? <section className="review-panel"><div><p className="text-sm font-semibold text-[#3b3024]">Votre expérience compte</p><p className="mt-1 text-xs leading-5 text-[#806c58]">Partagez votre avis sur Google en un clic.</p></div><a href={`https://search.google.com/local/writereview?placeid=${fiche.googlePlaceId}`} target="_blank" rel="noreferrer" className="review-button"><Star className="h-4 w-4" /> Laisser un avis</a></section> : null}
        {features.requiresHours && fiche.data.horaires?.length ? <section className="public-section"><SectionTitle icon={<Clock3 className="h-4 w-4" />} title="Horaires" /><div className="hours-list">{fiche.data.horaires.map((row) => <div key={row.jour} className="hours-row"><span>{row.jour}</span><strong className={row.horaire.toLowerCase().includes("fermé") ? "text-[#a86155]" : ""}>{row.horaire}</strong></div>)}</div></section> : null}
        {features.hasForm ? <section className="public-section"><SectionTitle icon={<MessageCircle className="h-4 w-4" />} title="Être rappelé" />{actions.contactSent ? <div className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">Votre demande a bien été transmise. L’établissement peut maintenant vous rappeler.</div> : actions.contactOpen ? <form className="contact-form" onSubmit={actions.onContactSubmit}><input required minLength={2} placeholder="Votre nom" value={actions.contactForm.name} onChange={(event) => actions.onContactFormChange("name", event.target.value)} /><input required minLength={8} placeholder="Votre téléphone" value={actions.contactForm.phone} onChange={(event) => actions.onContactFormChange("phone", event.target.value)} /><textarea required minLength={2} placeholder="Votre message" value={actions.contactForm.message} onChange={(event) => actions.onContactFormChange("message", event.target.value)} /><div className="flex gap-2"><button type="button" className="public-secondary-link" onClick={actions.onCloseContact}>Annuler</button><button disabled={actions.contactPending} className="public-primary-link" type="submit">{actions.contactPending ? "Envoi…" : "Envoyer ma demande"}</button></div>{actions.contactError && <p className="text-xs font-medium text-red-600">{actions.contactError}</p>}</form> : <><p className="public-address">Laissez vos coordonnées, l’établissement vous recontactera directement.</p><button className="public-primary-link" onClick={actions.onOpenContact}>Demander un rappel <ArrowUpRight className="h-4 w-4" /></button></>}</section> : null}
        {features.hasCatalog && fiche.data.sections?.length ? <section className="public-section"><SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="Carte & prestations" />{fiche.data.sections.map((section) => <div key={section.titre} className="catalog-section"><h3>{section.titre}</h3>{section.articles.map((article) => <div key={article.nom} className="catalog-row"><div><p className="font-semibold text-[#26344a]">{article.nom}</p><p className="mt-1 text-xs leading-5 text-[#8891a0]">{article.description}</p></div><span>{article.prix}</span></div>)}</div>)}</section> : null}
        {gallery.length ? <section className="public-section"><SectionTitle icon={<UserRound className="h-4 w-4" />} title="Galerie" /><div className="gallery-grid">{gallery.map((image) => <img key={image.url} src={image.url} alt={image.alt} loading="lazy" />)}</div></section> : null}
        {children}
        <section className="public-footer"><div className="flex items-center justify-between gap-3"><p>Mentions légales · Confidentialité</p><a href="/" className="public-brand">Support Connecté <ArrowUpRight className="h-3 w-3" /></a></div><p className="mt-3 max-w-sm text-[11px] leading-5 text-[#9aa3b1]">Les informations envoyées via cette fiche servent uniquement à répondre à votre demande. Vous pouvez demander leur suppression en contactant l'établissement.</p></section>
      </main>
    </div>
  </div>;
}
