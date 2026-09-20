import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Download,
  ExternalLink,
  Facebook,
  Globe2,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  UserRound,
  Youtube,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { getTemplateConfig } from "../config";
import type { FicheTemplateModel } from "../model";
import "../socials.css";
import "../theme-tokens.css";
import "../themes.css";
import "../themes/essentiel.css";
import "../themes/pro.css";
import "../themes/signature.css";

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
  onContactFormChange: (
    field: "name" | "phone" | "message",
    value: string
  ) => void;
  onContactSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export type FicheTemplateProps = {
  fiche: FicheTemplateModel;
  actions: FicheTemplateActions;
  children?: ReactNode;
};

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-theme-muted">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent-soft">
        {icon}
      </span>
      <h2 className="text-xs font-bold uppercase tracking-[0.16em]">{title}</h2>
    </div>
  );
}

function Hero({ fiche, actions }: FicheTemplateProps) {
  const identityImage = fiche.logo;
  const preferredAction = actions.buttonOrder[0];

  const hasAction = (key: "appel" | "whatsapp" | "email") =>
    actions.buttonOrder.includes(key);

  const preferredBadge = (
    <span className="mt-1 inline-block rounded-full border border-white/15 bg-black/45 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/85 shadow-sm backdrop-blur-sm">
      Action préférée
    </span>
  );

  const renderActionButton = (key: "appel" | "whatsapp" | "email") => {
    switch (key) {
      case "appel":
        return (
          <div className="flex flex-col items-center gap-0.5">
            {hasAction("appel") ? (
              <a
                href={actions.phoneHref}
                className="public-action public-action-call"
              >
                <Phone className="h-5 w-5" />
                <span>Appeler</span>
              </a>
            ) : (
              <div
                className="public-action public-action--missing"
                role="status"
              >
                <Phone className="h-5 w-5" />
                <span>Numéro non fourni</span>
              </div>
            )}
            {preferredAction === "appel" && preferredBadge}
          </div>
        );

      case "whatsapp":
        return (
          <div className="flex flex-col items-center gap-0.5">
            {hasAction("whatsapp") ? (
              <a
                href={actions.whatsappHref}
                className="public-action public-action-whatsapp"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Message WhatsApp</span>
              </a>
            ) : (
              <div
                className="public-action public-action--missing"
                role="status"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Message WhatsApp non fourni</span>
              </div>
            )}
            {preferredAction === "whatsapp" && preferredBadge}
          </div>
        );

      case "email":
        return (
          <div className="flex flex-col items-center gap-0.5">
            {hasAction("email") && actions.emailHref ? (
              <a
                href={actions.emailHref}
                className="public-action public-action-email"
              >
                <Mail className="h-5 w-5" />
                <span>E-mail</span>
              </a>
            ) : (
              <div
                className="public-action public-action--missing"
                role="status"
              >
                <Mail className="h-5 w-5" />
                <span>E-mail non fourni</span>
              </div>
            )}
            {preferredAction === "email" && preferredBadge}
          </div>
        );
    }
  };

  return (
    <section className="public-hero">
      {fiche.photo && (
        <div className="public-cover">
          <img src={fiche.photo} alt="" />
        </div>
      )}
      <div className="public-hero-overlay" />
      <div className="public-topline">
        <span className="public-chip">Fiche de contact</span>
        <span className="public-nfc">NFC · QR</span>
      </div>
      <div className="public-identity">
        <div className="public-avatar">
          {identityImage ? (
            <img src={identityImage} alt={`${fiche.prenom} ${fiche.nom}`} />
          ) : (
            <span>
              {fiche.prenom.slice(0, 1)}
              {fiche.nom.slice(0, 1)}
            </span>
          )}
        </div>
        <div className="public-identity-copy">
          <p className="public-name">
            {fiche.prenom} {fiche.nom}
          </p>
          <p className="public-role">
            {fiche.fonction}
            <span className="mx-2 text-white/30">·</span>
            {fiche.entreprise}
          </p>
        </div>
      </div>
      <div className="public-actions">
        {actions.buttonOrder.map(key => (
          <div key={key}>{renderActionButton(key)}</div>
        ))}
      </div>
    </section>
  );
}

function GalleryCarousel({
  images,
}: {
  images: FicheTemplateModel["data"]["galerie"];
}) {
  const gallery = images ?? [];
  const [current, setCurrent] = useState(0);
  if (!gallery.length) return null;

  const previous = () =>
    setCurrent(index => (index - 1 + gallery.length) % gallery.length);
  const next = () => setCurrent(index => (index + 1) % gallery.length);
  const image = gallery[current];

  return (
    <div className="pro-gallery w-full">
      <div className="pro-gallery-stage relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <img
          className="block h-full w-full object-cover"
          src={image.url}
          alt={image.alt}
          loading="lazy"
        />
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              className="pro-gallery-control absolute top-1/2 left-3 flex h-[38px] w-[38px] -translate-y-1/2 items-center justify-center"
              onClick={previous}
              aria-label="Photo précédente"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="pro-gallery-control absolute top-1/2 right-3 flex h-[38px] w-[38px] -translate-y-1/2 items-center justify-center"
              onClick={next}
              aria-label="Photo suivante"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      <div className="pro-gallery-meta mt-2.5 flex items-center justify-between gap-3 text-[10px] font-bold text-theme-muted">
        <span>
          Photo {current + 1} / {gallery.length}
        </span>
        {gallery.length > 1 && (
          <div className="pro-gallery-dots flex items-center gap-[5px]">
            {gallery.map((item, index) => (
              <button
                key={item.id ?? `${item.url}-${index}`}
                type="button"
                className={`pro-gallery-dot ${index === current ? "is-active" : ""}`}
                onClick={() => setCurrent(index)}
                aria-label={`Aller à la photo ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function socialKey(label: string, url: string) {
  const value = `${label} ${url}`.toLowerCase();
  if (value.includes("instagram")) return "instagram";
  if (value.includes("facebook")) return "facebook";
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("youtube")) return "youtube";
  return "other";
}

function SocialIcon({ label, url }: { label: string; url: string }) {
  const key = socialKey(label, url);
  if (key === "instagram") return <Instagram className="h-5 w-5" />;
  if (key === "facebook") return <Facebook className="h-5 w-5" />;
  if (key === "linkedin") return <Linkedin className="h-5 w-5" />;
  if (key === "youtube") return <Youtube className="h-5 w-5" />;
  return <Globe2 className="h-5 w-5" />;
}

function PresentationContent({ fiche }: { fiche: FicheTemplateModel }) {
  const presentation = fiche.data.presentation?.trim();
  if (!presentation) return null;
  return (
    <section className="public-section pro-presentation">
      <SectionTitle
        icon={<UserRound className="h-4 w-4" />}
        title="Présentation"
      />
      <p className="pro-presentation-text">{presentation}</p>
    </section>
  );
}

function ProContent({ fiche }: { fiche: FicheTemplateModel }) {
  const appointment = fiche.data.rendezVous?.url?.trim()
    ? fiche.data.rendezVous
    : null;
  const socials = (fiche.data.reseauxSociaux ?? []).filter(social =>
    social.url?.trim()
  );
  if (!appointment && !socials.length) return null;
  return (
    <>
      {appointment && (
        <section className="public-section pro-appointment">
          <div>
            <SectionTitle
              icon={<CalendarDays className="h-4 w-4" />}
              title="Rendez-vous"
            />
            <p className="public-address">
              Choisissez directement votre créneau.
            </p>
          </div>
          <a
            href={appointment.url}
            target="_blank"
            rel="noreferrer"
            className="public-primary-link"
          >
            {appointment.label || "Prendre rendez-vous"}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </section>
      )}
      {socials.length > 0 && (
        <section className="public-section">
          <SectionTitle
            icon={<Globe2 className="h-4 w-4" />}
            title="Réseaux sociaux"
          />
          <div className="pro-social-grid">
            {socials.map(social => (
              <a
                key={`${social.label}-${social.url}`}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className={`pro-social-button pro-social-${socialKey(social.label, social.url)}`}
              >
                <span className="pro-social-icon">
                  <SocialIcon label={social.label} url={social.url} />
                </span>
                <span className="pro-social-label">{social.label}</span>
                <ExternalLink className="h-3.5 w-3.5 pro-social-arrow" />
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function FicheTemplate({
  fiche,
  actions,
  children,
}: FicheTemplateProps) {
  const config = getTemplateConfig(fiche.formule);
  const { features } = config;
  const links = (fiche.data.liens ?? []).slice(0, features.maxLinks);
  const gallery = (fiche.data.galerie ?? []).slice(0, features.maxPhotos);

  return (
    <div
      className={`public-page fiche-template fiche-template--${config.theme} min-h-screen px-3 pt-6 pb-10 text-theme-text`}
      data-formule={fiche.formule}
    >
      <div className="public-card fiche-template__card mx-auto w-full max-w-[520px] overflow-hidden rounded-[var(--theme-radius)] border border-theme-line bg-theme-card">
        <Hero fiche={fiche} actions={actions} />
        <main className="public-content px-5 pt-2">
          {fiche.formule && (
            <div className="essential-save-row">
              <a
                href={actions.contactHref}
                download={`${fiche.slug}.vcf`}
                className="public-save-contact"
              >
                <Download className="h-4 w-4" /> Enregistrer le contact
              </a>
            </div>
          )}
          <PresentationContent fiche={fiche} />
          {fiche.formule !== "essentiel" && <ProContent fiche={fiche} />}
          {fiche.formule !== "essentiel" && (links.length || fiche.site) ? (
            <section className="public-section py-[22px] border-b border-theme-line">
              <SectionTitle
                icon={<Globe2 className="h-4 w-4" />}
                title="Liens utiles"
              />
              <div className="link-list grid gap-2">
                {fiche.formule !== "essentiel" && fiche.site && (
                  <a
                    href={fiche.site}
                    target="_blank"
                    rel="noreferrer"
                    className="public-link flex min-h-12 items-center justify-between gap-3 rounded-xl border border-theme-line px-[13px] text-xs font-semibold text-theme-text"
                  >
                    <span>Site internet</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {links.map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="public-link flex min-h-12 items-center justify-between gap-3 rounded-xl border border-theme-line px-[13px] text-xs font-semibold text-theme-text"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}
          {fiche.adresse ? (
            <section className="public-section py-[22px] border-b border-theme-line">
              <SectionTitle
                icon={<MapPin className="h-4 w-4" />}
                title="Localisation"
              />
              <p className="public-address">{fiche.adresse}</p>
              {fiche.lienItineraire && (
                <a
                  href={fiche.lienItineraire}
                  target="_blank"
                  rel="noreferrer"
                  className="public-primary-link"
                >
                  Ouvrir Google Maps <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </section>
          ) : null}
          {features.hasGoogleReview && fiche.googlePlaceId ? (
            <section className="review-panel">
              <div>
                <p className="text-sm font-semibold text-theme-text">
                  Votre expérience compte
                </p>
                <p className="mt-1 text-xs leading-5 text-theme-muted">
                  Partagez votre avis sur Google en un clic.
                </p>
              </div>
              <a
                href={`https://search.google.com/local/writereview?placeid=${fiche.googlePlaceId}`}
                target="_blank"
                rel="noreferrer"
                className="review-button"
              >
                <Star className="h-4 w-4" /> Laisser un avis
              </a>
            </section>
          ) : null}
          {features.requiresHours && fiche.data.horaires?.length ? (
            <section className="public-section py-[22px] border-b border-theme-line">
              <SectionTitle
                icon={<Clock3 className="h-4 w-4" />}
                title="Horaires"
              />
              <div className="hours-list grid gap-2">
                {fiche.data.horaires.map(row => (
                  <div
                    key={row.jour}
                    className="hours-row flex items-center justify-between gap-3"
                  >
                    <span>{row.jour}</span>
                    <strong
                      className={
                        row.horaire.toLowerCase().includes("fermé")
                          ? "text-theme-danger"
                          : ""
                      }
                    >
                      {row.horaire}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {features.hasForm ? (
            <section className="public-section py-[22px] border-b border-theme-line">
              <SectionTitle
                icon={<MessageCircle className="h-4 w-4" />}
                title="Être rappelé"
              />
              {actions.contactSent ? (
                <div className="rounded-xl bg-theme-success-bg p-4 text-sm font-medium text-theme-success-text">
                  Votre demande a bien été transmise. L’établissement peut
                  maintenant vous rappeler.
                </div>
              ) : actions.contactOpen ? (
                <form
                  className="contact-form"
                  onSubmit={actions.onContactSubmit}
                >
                  <input
                    required
                    minLength={2}
                    placeholder="Votre nom"
                    value={actions.contactForm.name}
                    onChange={event =>
                      actions.onContactFormChange("name", event.target.value)
                    }
                  />
                  <input
                    required
                    minLength={8}
                    placeholder="Votre téléphone"
                    value={actions.contactForm.phone}
                    onChange={event =>
                      actions.onContactFormChange("phone", event.target.value)
                    }
                  />
                  <textarea
                    required
                    minLength={2}
                    placeholder="Votre message"
                    value={actions.contactForm.message}
                    onChange={event =>
                      actions.onContactFormChange("message", event.target.value)
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="public-secondary-link"
                      onClick={actions.onCloseContact}
                    >
                      Annuler
                    </button>
                    <button
                      disabled={actions.contactPending}
                      className="public-primary-link"
                      type="submit"
                    >
                      {actions.contactPending ? "Envoi…" : "Envoyer ma demande"}
                    </button>
                  </div>
                  {actions.contactError && (
                    <p className="text-xs font-medium text-red-600">
                      {actions.contactError}
                    </p>
                  )}
                </form>
              ) : (
                <>
                  <p className="public-address">
                    Laissez vos coordonnées, l’établissement vous recontactera
                    directement.
                  </p>
                  <button
                    className="public-primary-link"
                    onClick={actions.onOpenContact}
                  >
                    Demander un rappel <ArrowUpRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </section>
          ) : null}
          {features.hasCatalog && fiche.data.sections?.length ? (
            <section className="public-section py-[22px] border-b border-theme-line">
              <SectionTitle
                icon={<CalendarDays className="h-4 w-4" />}
                title="Carte & prestations"
              />
              {fiche.data.sections.map(section => (
                <div key={section.titre} className="catalog-section">
                  <h3>{section.titre}</h3>
                  {section.articles.map(article => (
                    <div key={article.nom} className="catalog-row">
                      <div>
                        <p className="font-semibold text-theme-text">
                          {article.nom}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-theme-muted">
                          {article.description}
                        </p>
                      </div>
                      <span>{article.prix}</span>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ) : null}
          {gallery.length ? (
            <section className="public-section py-[22px] border-b border-theme-line">
              <SectionTitle
                icon={<UserRound className="h-4 w-4" />}
                title="Galerie"
              />
              <GalleryCarousel images={gallery} />
            </section>
          ) : null}
          {children}
          <section className="public-footer py-[22px] pb-6 text-[10px]">
            <div className="flex items-center justify-between gap-3">
              <p>Mentions légales · Confidentialité</p>
              <a href="/" className="public-brand">
                Support Connecté <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <p className="mt-3 max-w-sm text-[11px] leading-5 text-theme-muted">
              Les informations envoyées via cette fiche servent uniquement à
              répondre à votre demande. Vous pouvez demander leur suppression en
              contactant l’établissement.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
