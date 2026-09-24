import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  Facebook,
  Globe2,
  Images,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Star,
  UserRound,
  X,
  Youtube,
} from "lucide-react";
import type { FormEvent, ReactNode, TouchEvent } from "react";
import { useId, useState } from "react";
import { parseVideoUrl } from "../../shared/videoUrls";
import { getTemplateConfig } from "../config";
import "../hero.css";
import type {
  FicheTemplateModel,
  TemplateArticle,
  TemplateGalleryItem,
} from "../model";
import "../sections.css";

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
    <div className="fh-section-title mb-4 flex items-center gap-2 text-theme-muted">
      <span className="fh-section-icon flex h-7 w-7 items-center justify-center rounded-lg bg-theme-accent-soft">
        {icon}
      </span>
      <h2 className="text-xs font-bold uppercase tracking-[0.16em]">{title}</h2>
    </div>
  );
}

/**
 * Foldable section (Présentation, Horaires). The header is a real button
 * (keyboard + screen-reader friendly: aria-expanded / aria-controls); the body
 * is simply hidden, so its content stays in the page for assistive tech when open.
 * `summary` is shown in the header while the section is folded.
 */
function CollapsibleSection({
  icon,
  title,
  summary,
  defaultOpen = true,
  className = "public-section",
  open: controlledOpen,
  onToggle,
  children,
}: {
  icon: ReactNode;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  className?: string;
  /** Pass open + onToggle to drive this from a parent (accordion behaviour);
   * omit both to let the section manage its own open/closed state. */
  open?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen(value => !value));
  const bodyId = useId();
  return (
    <section className={`${className} fh-collapsible`} data-open={open}>
      <button
        type="button"
        className="fh-collapse-toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
      >
        <SectionTitle icon={icon} title={title} />
        {!open && summary ? (
          <span className="fh-collapse-summary">{summary}</span>
        ) : null}
        <ChevronDown className="fh-collapse-chevron" aria-hidden="true" />
      </button>
      <div id={bodyId} className="fh-collapse-body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}

const WEEK_DAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

function normalizeDay(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** True when a row label ("Lundi", "Lundi — Samedi"…) covers today. */
function coversToday(label: string, today = new Date().getDay()) {
  const text = normalizeDay(label);
  const found = WEEK_DAYS.map((day, index) => ({
    index,
    at: text.indexOf(day),
  }))
    .filter(entry => entry.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map(entry => entry.index);
  if (found.length === 0) return false;
  if (found.length === 1) return found[0] === today;
  // Range such as "Lundi — Samedi" (weeks start on Monday, wrap on Sunday).
  const offset = (day: number) => (day + 6) % 7;
  return (
    offset(today) >= offset(found[0]) &&
    offset(today) <= offset(found[found.length - 1])
  );
}

/** "Aujourd'hui : 08:00 – 18:00", shown in the folded Horaires header. */
function todayHoursSummary(rows: { jour: string; horaire: string }[]) {
  const today = rows.find(row => coversToday(row.jour));
  return today ? `Aujourd’hui : ${today.horaire}` : undefined;
}

const catalogBadgeLabels: Record<
  NonNullable<TemplateArticle["badge"]>,
  string
> = {
  populaire: "Populaire",
  nouveau: "Nouveau",
  promo: "Promo",
};

const currencySuffix: Record<NonNullable<TemplateArticle["devise"]>, string> = {
  XOF: "FCFA",
  EUR: "€",
};

/** Appends the currency suffix only when the price is a plain number (an
 * article like "À partir de 5 000" keeps its own free-text price as-is). */
function formatArticlePrice(article: TemplateArticle) {
  const price = article.prix.trim();
  if (!price) return "";
  const suffix = currencySuffix[article.devise ?? "XOF"];
  if (/^\d[\d\s.,]*$/.test(price) && !price.endsWith(suffix)) {
    return `${price} ${suffix}`;
  }
  return price;
}

/** WhatsApp deep link pre-filled with the article's name and price, so a
 * visitor can order it in one tap without leaving the fiche. */
function catalogOrderHref(whatsapp: string, article: TemplateArticle) {
  const price = formatArticlePrice(article);
  const message = `Bonjour, je souhaite commander : ${article.nom}${price ? ` — ${price}` : ""}`;
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

type ActionKey = "appel" | "whatsapp" | "email";

const ACTION_CONFIG: Record<
  ActionKey,
  {
    label: string;
    className: string;
    Icon: typeof Phone;
    href: (actions: FicheTemplateProps["actions"]) => string | undefined;
  }
> = {
  appel: {
    label: "Appeler",
    className: "fh-action--call",
    Icon: Phone,
    href: actions => actions.phoneHref,
  },
  whatsapp: {
    label: "WhatsApp",
    className: "fh-action--whatsapp",
    Icon: MessageCircle,
    href: actions => actions.whatsappHref,
  },
  email: {
    label: "E-mail",
    className: "fh-action--email",
    Icon: Mail,
    href: actions => actions.emailHref,
  },
};

/**
 * Round identity picture shown beside the name (same on every plan). The image
 * always covers its whole container, whether it is a photo or a logo.
 */
function IdentityAvatar({ src, alt }: { src: string; alt: string }) {
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const measure = (img: HTMLImageElement | null) => {
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    const next =
      img.naturalWidth / img.naturalHeight > 1.45 ? "contain" : "cover";
    setFit(current => (current === next ? current : next));
  };
  return (
    <div className="fh-avatar">
      <img src={src} alt={alt} />
    </div>
  );
}

function Hero({ fiche, actions }: FicheTemplateProps) {
  // `photo` is the cover picture (shown large and sharp behind the identity),
  // `logo` is the brand mark shown above the name. Both are optional in
  // Essentiel; initials are the fallback when there is no logo.
  const cover = fiche.photo?.trim() || "";
  const logo = fiche.logo?.trim() || "";
  const fullName = `${fiche.prenom} ${fiche.nom}`.trim();
  // The preferred action is the first one in the configured order that can
  // actually be used (e.g. no e-mail address → it cannot be "preferred").
  const preferredKey = actions.buttonOrder.find(key =>
    Boolean(ACTION_CONFIG[key].href(actions))
  );

  return (
    <header
      className="fh"
      data-cover={cover ? "yes" : "no"}
      data-logo={logo ? "yes" : "no"}
    >
      <div className="fh-bg" aria-hidden="true">
        {cover && <img className="fh-cover-img" src={cover} alt="" />}
        <span className="fh-bg-pattern" />
        <span className="fh-bg-shade" />
      </div>

      <div className="fh-top">
        <span className="fh-tag">Fiche de contact</span>
        <span className="fh-tag fh-tag--nfc">NFC · QR</span>
      </div>

      <div className="fh-body">
        {logo ? (
          <IdentityAvatar
            src={logo}
            alt={`${fullName} — ${fiche.entreprise}`}
          />
        ) : (
          <div className="fh-initials" aria-hidden="true">
            {fiche.prenom.slice(0, 1)}
            {fiche.nom.slice(0, 1)}
          </div>
        )}
        <h1 className="fh-name">{fullName}</h1>
        <span className="fh-ornament" aria-hidden="true" />
        <p className="fh-role">{fiche.fonction}</p>
        <p className="fh-company">{fiche.entreprise}</p>
      </div>

      <div className="fh-actions">
        {actions.buttonOrder.map(key => {
          const { label, className, Icon, href } = ACTION_CONFIG[key];
          const target = href(actions);
          const preferred = key === preferredKey;
          return (
            <div key={key} className="fh-action-cell">
              {target ? (
                <a
                  href={target}
                  className={`fh-action ${className}${preferred ? " is-preferred" : ""}`}
                  aria-label={preferred ? `${label} (action préférée)` : label}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{label}</span>
                </a>
              ) : (
                <div className="fh-action fh-action--missing" role="status">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{label}</span>
                  <small>Non fourni</small>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </header>
  );
}

/**
 * Applies the plan limits to photos and videos independently, keeping the
 * order chosen by the client (a video must not eat a photo slot).
 */
function galleryForPlan(
  items: TemplateGalleryItem[] | undefined,
  maxPhotos: number,
  maxVideos: number
) {
  let photos = 0;
  let videos = 0;
  const result: TemplateGalleryItem[] = [];
  for (const item of items ?? []) {
    if (item.type === "video") {
      if (videos < maxVideos) {
        videos += 1;
        result.push(item);
      }
    } else if (photos < maxPhotos) {
      photos += 1;
      result.push(item);
    }
  }
  return result;
}

function GalleryVideo({ item }: { item: TemplateGalleryItem }) {
  // The embed URL is re-derived from the source URL: a stored `embedUrl`
  // is never trusted as-is.
  const parsed = parseVideoUrl(item.url);
  if (!parsed) {
    return (
      <div className="gallery-fallback">
        <Play className="h-6 w-6" aria-hidden="true" />
        <span>Vidéo indisponible</span>
      </div>
    );
  }
  if (parsed.source === "direct") {
    return (
      <video
        className="gallery-media gallery-video"
        src={parsed.url}
        controls
        playsInline
        preload="metadata"
        aria-label={item.alt || "Vidéo"}
      />
    );
  }
  const portrait = parsed.source === "instagram" || parsed.source === "tiktok";
  return (
    <iframe
      className={`gallery-embed${portrait ? " gallery-embed--portrait" : ""}`}
      src={parsed.embedUrl}
      title={item.alt || "Vidéo"}
      loading="lazy"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
    />
  );
}

function GalleryCarousel({ items }: { items: TemplateGalleryItem[] }) {
  const [requested, setRequested] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  if (!items.length) return null;

  const current = Math.min(requested, items.length - 1);
  const item = items[current];
  const isVideo = item.type === "video";
  const go = (index: number) =>
    setRequested((index + items.length) % items.length);

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (Math.abs(delta) > 40) go(current + (delta < 0 ? 1 : -1));
  };

  return (
    <div
      className="pro-gallery w-full"
      role="region"
      aria-roledescription="carrousel"
      aria-label="Galerie"
    >
      {/* Fixed-ratio stage: its size never depends on the media shown. */}
      <div
        className="pro-gallery-stage gallery-stage"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === "ArrowLeft") go(current - 1);
          if (event.key === "ArrowRight") go(current + 1);
        }}
        onTouchStart={event => setTouchStartX(event.touches[0].clientX)}
        onTouchEnd={onTouchEnd}
      >
        {isVideo ? (
          <GalleryVideo key={`${current}-${item.url}`} item={item} />
        ) : (
          <>
            <img
              className="gallery-backdrop"
              src={item.url}
              alt=""
              aria-hidden="true"
            />
            <img
              className="gallery-media"
              src={item.url}
              alt={item.alt}
              loading="lazy"
              draggable={false}
            />
          </>
        )}
        {items.length > 1 && (
          <>
            <button
              type="button"
              className="pro-gallery-control gallery-control gallery-control--prev"
              onClick={() => go(current - 1)}
              aria-label="Précédent"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="pro-gallery-control gallery-control gallery-control--next"
              onClick={() => go(current + 1)}
              aria-label="Suivant"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      <div className="pro-gallery-meta mt-2.5 flex items-center justify-between gap-3 text-[10px] font-bold text-theme-muted">
        <span aria-live="polite">
          {isVideo ? "Vidéo" : "Photo"} {current + 1} / {items.length}
        </span>
        {items.length > 1 && (
          <div className="pro-gallery-dots flex items-center gap-[5px]">
            {items.map((entry, index) => (
              <button
                key={entry.id ?? `${entry.url}-${index}`}
                type="button"
                className={`pro-gallery-dot ${index === current ? "is-active" : ""}`}
                onClick={() => go(index)}
                aria-label={`Aller à l’élément ${index + 1}`}
                aria-current={index === current}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogCarousel({
  articles,
  whatsapp,
}: {
  articles: TemplateArticle[];
  whatsapp?: string;
}) {
  const [requested, setRequested] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  if (!articles.length) return null;

  const current = Math.min(requested, articles.length - 1);
  const article = articles[current];
  const go = (index: number) =>
    setRequested((index + articles.length) % articles.length);

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (Math.abs(delta) > 40) go(current + (delta < 0 ? 1 : -1));
  };

  return (
    <div
      className="catalog-carousel"
      role="region"
      aria-roledescription="carrousel"
      aria-label="Articles de la section"
    >
      <div
        className="catalog-carousel-stage"
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === "ArrowLeft") go(current - 1);
          if (event.key === "ArrowRight") go(current + 1);
        }}
        onTouchStart={event => setTouchStartX(event.touches[0].clientX)}
        onTouchEnd={onTouchEnd}
      >
        {article.photo ? (
          <div className="catalog-carousel-media">
            <img src={article.photo} alt="" loading="lazy" draggable={false} />
          </div>
        ) : (
          <div
            className="catalog-carousel-media catalog-carousel-media--empty"
            aria-hidden="true"
          >
            <CalendarDays className="h-8 w-8" />
          </div>
        )}

        {articles.length > 1 && (
          <>
            <button
              type="button"
              className="pro-gallery-control gallery-control gallery-control--prev"
              onClick={() => go(current - 1)}
              aria-label="Article précédent"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="pro-gallery-control gallery-control gallery-control--next"
              onClick={() => go(current + 1)}
              aria-label="Article suivant"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="catalog-carousel-content">
        <div className="catalog-carousel-heading">
          <p className="catalog-carousel-name">
            {article.nom || "Article sans nom"}
            {article.badge ? (
              <span className={"catalog-badge catalog-badge--" + article.badge}>
                {catalogBadgeLabels[article.badge]}
              </span>
            ) : null}
          </p>
          {article.prix ? (
            <span className="catalog-carousel-price">
              {formatArticlePrice(article)}
            </span>
          ) : null}
        </div>

        {article.description ? (
          <p className="catalog-carousel-description">{article.description}</p>
        ) : null}

        {whatsapp && article.nom ? (
          <a
            href={catalogOrderHref(whatsapp, article)}
            target="_blank"
            rel="noreferrer"
            className="catalog-order-button catalog-carousel-order"
            aria-label={"Commander " + article.nom + " sur WhatsApp"}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Commander</span>
          </a>
        ) : null}
      </div>

      <div className="catalog-carousel-meta">
        <span aria-live="polite">
          Article {current + 1} / {articles.length}
        </span>
        {articles.length > 1 && (
          <div className="catalog-carousel-dots">
            {articles.map((entry, index) => (
              <button
                key={(entry.nom || "article") + "-" + index}
                type="button"
                className={
                  "catalog-carousel-dot" +
                  (index === current ? " is-active" : "")
                }
                onClick={() => go(index)}
                aria-label={"Aller à l’article " + (index + 1)}
                aria-current={index === current}
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
  if (value.includes("tiktok")) return "tiktok";
  if (
    value.includes("x.com") ||
    value.includes("twitter") ||
    value.includes("x /")
  )
    return "x";
  return "other";
}

function SocialIcon({ label, url }: { label: string; url: string }) {
  const key = socialKey(label, url);
  if (key === "instagram") return <Instagram className="h-5 w-5" />;
  if (key === "facebook") return <Facebook className="h-5 w-5" />;
  if (key === "linkedin") return <Linkedin className="h-5 w-5" />;
  if (key === "youtube") return <Youtube className="h-5 w-5" />;
  if (key === "tiktok") return <Globe2 className="h-5 w-5" />;
  if (key === "x") return <X className="h-5 w-5" />;
  return <Globe2 className="h-5 w-5" />;
}

function PresentationContent({ fiche }: { fiche: FicheTemplateModel }) {
  const presentation = fiche.data.presentation?.trim();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CollapsibleSection
      className="public-section pro-presentation"
      icon={<UserRound className="h-4 w-4" />}
      title="Présentation"
      defaultOpen
    >
      <p className="pro-presentation-text">{presentation}</p>
    </CollapsibleSection>
  );
}

function ProContent({ fiche }: { fiche: FicheTemplateModel }) {
  const socials = (fiche.data.reseauxSociaux ?? []).filter(social =>
    social.url?.trim()
  );
  if (!socials.length) return null;
  return (
    <>
      {socials.length > 0 && (
        <section className="public-section">
          <SectionTitle
            icon={<Globe2 className="h-4 w-4" />}
            title="Réseaux sociaux"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-[9px] gap-2">
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
  const [isOpenHoraire, setIsOpenHoraire] = useState(false);
  const gallery = galleryForPlan(
    fiche.data.galerie,
    features.maxPhotos,
    features.maxVideos
  );
  // Catalogue: accordion behaviour — opening a category folds any other open
  // one, so the page never has to show several long lists at once. The first
  // category starts open.
  const [openCatalogSection, setOpenCatalogSection] = useState<number | null>(
    0
  );

  return (
    <div
      className={`public-page fiche-template fiche-template--${config.theme} min-h-screen px-3 pt-6 pb-10 text-theme-text`}
      data-formule={fiche.formule}
    >
      <div className="public-card fiche-template__card mx-auto w-full max-w-[520px] overflow-hidden rounded-[var(--theme-radius)] border border-theme-line bg-theme-card">
        <Hero fiche={fiche} actions={actions} />
        <main className="public-content px-5 pt-2">
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

          {/*  */}

          {features.requiresHours && fiche.data.horaires?.length ? (
            <CollapsibleSection
              className="public-section py-[22px] border-b border-theme-line"
              icon={<Clock3 className="h-4 w-4" />}
              title="Horaires"
              summary={todayHoursSummary(fiche.data.horaires)}
              defaultOpen={false}
            >
              <div className="hours-list grid gap-2">
                {fiche.data.horaires.map(row => (
                  <div
                    key={row.jour}
                    className={`hours-row flex items-center justify-between gap-3${
                      coversToday(row.jour) ? " is-today" : ""
                    }`}
                    aria-current={coversToday(row.jour) ? "date" : undefined}
                  >
                    <span>
                      {row.jour}
                      {coversToday(row.jour) && (
                        <em className="hours-today ml-2">Aujourd’hui</em>
                      )}
                    </span>
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
            </CollapsibleSection>
          ) : null}
          {features.hasForm ? (
            <section className="public-section py-[22px] border-b border-theme-line">
              <SectionTitle
                icon={<MessageCircle className="h-4 w-4" />}
                title="Être rappelé"
              />
              {actions.contactSent ? (
                <div className="rounded-xl bg-theme-success-bg p-4 text-sm font-medium text-theme-success-text">
                  Votre demande a bien été transmise.
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
{/* --------------------------- */}
          {features.hasCatalog && fiche.data.sections?.length ? (
            <CollapsibleSection
              className="public-section py-[22px] border-b border-theme-line"
              icon={<CalendarDays className="h-4 w-4" />}
              title="Carte & prestations"
              summary={`${fiche.data.sections.length} section${fiche.data.sections.length > 1 ? "s" : ""}`}
              defaultOpen
            >
              <div className="catalog-accordion">
                {fiche.data.sections.map((section, sectionIndex) => (
                  <CollapsibleSection
                    key={section.titre}
                    className="catalog-section"
                    icon={<UserRound className="h-3.5 w-3.5" />}
                    title={section.titre}
                    summary={`${section.articles.length} article${section.articles.length > 1 ? "s" : ""}`}
                    open={openCatalogSection === sectionIndex}
                    onToggle={() =>
                      setOpenCatalogSection(current =>
                        current === sectionIndex ? null : sectionIndex
                      )
                    }
                  >
                    <CatalogCarousel
                      articles={section.articles}
                      whatsapp={fiche.whatsapp}
                    />
                  </CollapsibleSection>
                ))}
              </div>
            </CollapsibleSection>
          ) : null}




          {gallery.length ? (
            <section className="public-section py-[22px] border-b border-theme-line">
              <SectionTitle
                icon={<Images className="h-4 w-4" />}
                title="Galerie"
              />
              <GalleryCarousel items={gallery} />
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

      {/* Fixed, pill-shaped, always visible while scrolling (same on all 3 plans). */}
      {fiche.formule && (
        <div className="fh-save-contact-bar">
          <a
            href={actions.contactHref}
            download={`${fiche.slug}.vcf`}
            className="public-save-contact"
          >
            <Download className="h-4 w-4" /> Enregistrer le contact
          </a>
        </div>
      )}
    </div>
  );
}
