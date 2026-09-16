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
import "../theme-tokens.css";
import "../themes/essentiel.css";
import "../themes/pro.css";
import "../themes/signature.css";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { getTemplateConfig } from "../config";
import type { FicheTemplateModel } from "../model";
import "../socials.css";
import "../themes.css";

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
  const hasAction = (key: "appel" | "whatsapp" | "email") =>
    actions.buttonOrder.includes(key);
  const buttons = {
    appel: hasAction("appel") ? (
      <a href={actions.phoneHref} className="public-action public-action-call">
        <Phone className="h-5 w-5" />
        <span>Appeler</span>
      </a>
    ) : (
      <div className="public-action public-action--missing" role="status">
        <Phone className="h-5 w-5" />
        <span>Numéro non fourni</span>
      </div>
    ),
    whatsapp: hasAction("whatsapp") ? (
      <a
        href={actions.whatsappHref}
        className="public-action public-action-whatsapp"
      >
        <MessageCircle className="h-5 w-5" />
        <span>WhatsApp</span>
      </a>
    ) : (
      <div className="public-action public-action--missing" role="status">
        <MessageCircle className="h-5 w-5" />
        <span>WhatsApp non fourni</span>
      </div>
    ),
    email: hasAction("email") && actions.emailHref ? (
      <a href={actions.emailHref} className="public-action public-action-email">
        <Mail className="h-5 w-5" />
        <span>E-mail</span>
      </a>
    ) : (
      <div className="public-action public-action--missing" role="status">
        <Mail className="h-5 w-5" />
        <span>E-mail non fourni</span>
      </div>
    ),
  } as const;
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
        {["appel", "whatsapp", "email"] as const}.map((key) => (
          <span key={key}>{buttons[key]}</span>
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
    setCurrent((index) => (index - 1 + gallery.length) % gallery.length);
  const next = () => setCurrent((index) => (index + 1) % gallery.length);
  const image = gallery[current];
  return (
    <div className="pro-gallery w-full">
      <div className="pro-gallery-stage relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <img className="block h-full w-full object-cover" src={image.url} alt={image.alt} loading="lazy" />
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
      {gallery.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-label="Navigation de la galerie">
          {gallery.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              className={`pro-gallery-dot h-1.5 w-1.5 ${index === current ? "is-active w-4" : ""}`}
              onClick={() => setCurrent(index)}
              aria-label={`Afficher la photo ${index + 1}`}
              aria-current={index === current}
            />
          ))}
        </div>
      )}
    </div>
  );
}
