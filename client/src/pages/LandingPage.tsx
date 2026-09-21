import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Check,
  CircleCheck,
  Clock,
  FileText,
  Gem,
  Headset,
  Infinity as InfinityIcon,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Phone,
  Play,
  QrCode,
  RefreshCw,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  BlackCard,
  BrandMark,
  CopperCard,
  WhiteCard,
} from "../landing/CardMock";
import "../landing/landing.css";

const whatsapp = (message: string) =>
  `https://wa.me/221778096713?text=${encodeURIComponent(message)}`;
const WHATSAPP_URL = whatsapp(
  "Bonjour Support Connecté, je souhaite demander une carte connectée."
);
const WHATSAPP_ENTERPRISE_URL = whatsapp(
  "Bonjour Support Connecté, je souhaite un devis pour une offre Entreprise."
);

const NAV = [
  ["#principe", "Le principe"],
  ["#gammes", "Les cartes"],
  ["#parcours", "Comment ça marche"],
] as const;

const PRINCIPLES = [
  {
    Icon: Smartphone,
    title: "Un geste",
    text: "Le téléphone ouvre directement votre fiche, sans effort.",
  },
  {
    Icon: Send,
    title: "Aucune app",
    text: "Votre client n’installe rien pour vous contacter.",
  },
  {
    Icon: Users,
    title: "Votre présence",
    text: "WhatsApp, site, réseaux, Maps et avis au même endroit.",
  },
  {
    Icon: RefreshCw,
    title: "Toujours à jour",
    text: "Une modification en ligne vaut mieux qu’une réimpression.",
  },
];

const WHY = [
  { Icon: Zap, title: "1 geste", text: "NFC + QR, sans application." },
  {
    Icon: User,
    title: "1 fiche",
    text: "Contacts, WhatsApp, réseaux, adresse.",
  },
  {
    Icon: RefreshCw,
    title: "Toujours à jour",
    text: "Une modification, aucune réimpression.",
  },
  {
    Icon: Share2,
    title: "Plus de points de contact",
    text: "Partageable partout.",
  },
];

const SAME = [
  { Icon: Smartphone, title: "Même technologie", text: "NFC + QR code" },
  { Icon: Settings, title: "Même simplicité", text: "Aucune application" },
  { Icon: InfinityIcon, title: "Même mise à jour", text: "En temps réel" },
  {
    Icon: BarChart3,
    title: "Plus d’opportunités",
    text: "Pour votre activité",
  },
];

const PLANS = [
  {
    name: "Essentielle",
    Icon: User,
    price: "12 000",
    pitch: "L’essentiel pour être trouvé et contacté.",
    features: [
      "Appel direct",
      "WhatsApp & e-mail",
      "Google Maps",
      "QR code + NFC",
      "Jusqu’à 3 liens",
    ],
    cta: "Demander cette carte",
  },
  {
    name: "Pro",
    price: "15 000",
    pitch: "Plus d’opportunités pour développer votre activité.",
    popular: true,
    features: [
      "Tout l’Essentiel",
      "Jusqu’à 10 liens",
      "Galerie photos",
      "Avis Google",
      "Statistiques de vues",
    ],
    cta: "Demander cette carte",
  },
  {
    name: "Signature",
    Icon: Gem,
    price: "75 000",
    pitch: "Un design exclusif, à votre image.",
    features: [
      "Tout le Pro",
      "Design sur mesure",
      "3 cartes premium",
      "Rédaction des textes",
      "Traitement prioritaire",
    ],
    cta: "Demander cette carte",
  },
  {
    name: "Entreprise",
    Icon: Users,
    price: null,
    pitch: "Pour les équipes et réseaux de grande envergure.",
    features: [
      "Tout le Signature",
      "Cartes en volume",
      "Gestion multi-profils",
      "Tableau de bord dédié",
      "Accompagnement personnalisé",
    ],
    cta: "Nous contacter",
    enterprise: true,
  },
];

const STEPS = [
  {
    Icon: ShoppingCart,
    title: "Vous choisissez",
    text: "Choisissez votre carte et votre niveau de service.",
  },
  {
    Icon: FileText,
    title: "Vous transmettez",
    text: "Envoyez vos informations, liens et visuels.",
  },
  {
    Icon: Settings,
    title: "Nous préparons",
    text: "Nous fabriquons, imprimons, encodons et testons votre carte.",
  },
  {
    Icon: CircleCheck,
    title: "Vous êtes connecté",
    text: "Vous recevez une carte prête à partager, sans application.",
  },
];

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <a href="#top" className="lp-brand" onClick={onClick} aria-label="Support Connecté">
      <BrandMark tone="dark" className="lp-brand-mark" />
      <span className="lp-brand-word">
        <b>SUPPORT</b>
        <i>CONNECTÉ</i>
      </span>
    </a>
  );
}

function Eyebrow({ children, tone = "red" }: { children: ReactNode; tone?: "red" | "copper" }) {
  return (
    <p className={`lp-eyebrow lp-eyebrow--${tone}`}>
      {tone === "red" && <span className="lp-eyebrow-dash" />}
      {children}
      {tone === "copper" && <span className="lp-eyebrow-line" />}
    </p>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="sc-landing">
      {/* ------------------------------ header ------------------------------ */}
      <header className={`lp-header${scrolled || menuOpen ? " is-solid" : ""}`}>
        <div className="lp-header-inner">
          <Brand onClick={closeMenu} />
          <nav className="lp-nav" aria-label="Navigation principale">
            {NAV.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <div className="lp-header-cta">
            <Link href="/espace-client/connexion" className="lp-link">
              Se connecter
            </Link>
            <a href={WHATSAPP_URL} className="lp-btn lp-btn--copper lp-btn--sm">
              Demander une carte <ArrowRight />
            </a>
          </div>
          <button
            className="lp-burger"
            onClick={() => setMenuOpen(open => !open)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <div className="lp-mobile-menu">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} onClick={closeMenu}>
                {label}
              </a>
            ))}
            <Link href="/espace-client/connexion" className="lp-mobile-login">
              Se connecter
            </Link>
            <a href={WHATSAPP_URL} className="lp-btn lp-btn--copper">
              Demander une carte <ArrowRight />
            </a>
          </div>
        )}
      </header>

      <main id="top">
        {/* -------------------------------- hero ------------------------------- */}
        <section className="lp-hero">
          <span className="lp-hero-swoosh" aria-hidden="true" />
          <span className="lp-hero-rings" aria-hidden="true" />
          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <Reveal>
                <p className="lp-pill">
                  <span className="lp-dot" /> CARTES CONNECTÉES – ÉDITION 2026
                </p>
                <h1 className="lp-h1">
                  Scannez.
                  <br />
                  <span className="lp-copper">Créez du lien.</span>
                </h1>
                <p className="lp-lead">
                  Une carte de visite intelligente qui centralise vos contacts,
                  vos réseaux, votre adresse, vos services et bien plus. Un
                  simple geste suffit pour tout partager.
                </p>
                <div className="lp-actions">
                  <a href={WHATSAPP_URL} className="lp-btn lp-btn--copper lp-btn--lg">
                    Demander une carte <ArrowRight />
                  </a>
                  <a href="#parcours" className="lp-btn lp-btn--ghost lp-btn--lg">
                    <Play className="lp-play" /> Voir comment ça marche
                  </a>
                </div>
                <ul className="lp-checks">
                  {["NFC + QR code", "Aucune application", "Personnalisée pour vous"].map(
                    item => (
                      <li key={item}>
                        <Check /> {item}
                      </li>
                    )
                  )}
                </ul>
                <dl className="lp-stats">
                  {[
                    ["+10 000", "cartes en circulation"],
                    ["98%", "de clients satisfaits"],
                    ["0", "application à installer"],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <dt>{value}</dt>
                      <dd>{label}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            <Reveal delay={0.12} className="lp-hero-visual">
              <div className="lp-device">
                <div className="lp-device-top">
                  <span>SUPPORT CONNECTÉ</span>
                  <span>NFC / QR</span>
                </div>
                <CopperCard className="lp-device-card" />
                <div className="lp-fiche-panel">
                  <div className="lp-fiche-head">
                    <span className="lp-fiche-icon">
                      <Smartphone />
                    </span>
                    <div>
                      <strong>Votre client accède à votre fiche.</strong>
                      <small>Vos informations, toujours à jour.</small>
                    </div>
                  </div>
                  <div className="lp-fiche-buttons">
                    <span className="is-whatsapp">
                      <MessageCircle /> WhatsApp
                    </span>
                    <span>
                      <Phone /> Appeler
                    </span>
                    <span>
                      <MapPin /> Maps
                    </span>
                  </div>
                </div>
              </div>
              <div className="lp-chip">
                <span>
                  <QrCode />
                </span>
                <div>
                  <strong>Sans contact</strong>
                  <small>ou QR code</small>
                </div>
              </div>
              <p className="lp-note lp-note--one">
                <svg viewBox="0 0 90 40" aria-hidden="true">
                  <path d="M88 8C62 2 30 8 8 30" />
                  <path d="M8 30l12-1M8 30l3-12" />
                </svg>
                Un geste.
                <br />
                Toutes vos infos.
              </p>
              <p className="lp-note lp-note--two">
                Plus simple.
                <br />
                Plus rapide.
                <br />
                Plus d’opportunités.
                <span className="lp-note-underline" />
              </p>
              <p className="lp-hero-tag">
                <span className="lp-red-line" /> DES RELATIONS
                <br />
                QUI DURENT.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------ principe ----------------------------- */}
        <section id="principe" className="lp-principle">
          <div className="lp-principle-glow" aria-hidden="true" />
          <div className="lp-container lp-principle-grid">
            <div className="lp-scene" aria-hidden="true">
              <span className="lp-scene-blob" />
              <span className="lp-scene-ring" />
              <BlackCard className="lp-scene-card" />
              <div className="lp-scene-foot">
                <span>SUPPORT CONNECTÉ</span>
                <span className="lp-red-line" />
                <span>DES RELATIONS QUI DURENT.</span>
              </div>
            </div>
            <div className="lp-principle-body">
              <Reveal>
                <div className="lp-principle-head">
                  <div>
                    <Eyebrow>LE PRINCIPE</Eyebrow>
                    <h2 className="lp-h2 lp-h2--dark">
                      Une carte se
                      <br />
                      donne une fois.
                      <br />
                      <span className="lp-red">Celle-ci reste.</span>
                    </h2>
                  </div>
                  <p className="lp-principle-text">
                    Votre client approche son téléphone. En quelques secondes,
                    il retrouve votre numéro, votre WhatsApp, votre adresse et
                    votre fiche. Vous changez de numéro demain ? Vous nous
                    écrivez : la carte continue de fonctionner.
                  </p>
                </div>
              </Reveal>
              <div className="lp-principle-cards">
                {PRINCIPLES.map(({ Icon, title, text }, index) => (
                  <Reveal key={title} delay={index * 0.07}>
                    <article className="lp-tile">
                      <span className="lp-tile-icon">
                        <Icon />
                      </span>
                      <h3>{title}</h3>
                      <p>{text}</p>
                      <span className="lp-tile-bar" />
                    </article>
                  </Reveal>
                ))}
              </div>
              <ul className="lp-vertical" aria-hidden="true">
                <li>NFC</li>
                <li>QR CODE</li>
                <li>SIMPLE</li>
                <li>DURABLE</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------- pourquoi ---------------------------- */}
        <section className="lp-why">
          <span className="lp-why-rings" aria-hidden="true" />
          <div className="lp-container lp-why-grid">
            <Reveal>
              <Eyebrow tone="copper">POURQUOI ÇA COMPTE</Eyebrow>
              <h2 className="lp-h2 lp-h2--why">
                Votre client est déjà sur son téléphone.{" "}
                <span className="lp-copper">
                  Donnez-lui un accès-direct à votre activité.
                </span>
              </h2>
              <p className="lp-body">
                Aujourd’hui, être joignable ne suffit plus. Votre numéro,
                WhatsApp, adresse, réseaux et avis doivent être accessibles au
                même endroit, en un geste.
              </p>
              <a href="#gammes" className="lp-scroll-cue">
                <span>
                  <ArrowDown />
                </span>
                C’est exactement ce que fait une carte Support Connecté.
              </a>
            </Reveal>
            <div className="lp-why-cards">
              {WHY.map(({ Icon, title, text }, index) => (
                <Reveal key={title} delay={index * 0.07}>
                  <article className="lp-glass-tile">
                    <span className="lp-glass-icon">
                      <Icon />
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------- gamme ------------------------------ */}
        <section id="gammes" className="lp-range">
          <span className="lp-range-swoosh" aria-hidden="true" />
          <div className="lp-container">
            <div className="lp-range-head">
              <Reveal>
                <Eyebrow>LA GAMME</Eyebrow>
                <h2 className="lp-h2">
                  Quatre cartes.
                  <br />
                  <span className="lp-copper">Une seule logique.</span>
                </h2>
                <p className="lp-body">
                  Quel que soit votre métier, une carte Support Connecté
                  s’adapte à vos besoins. Même simplicité, plus de possibilités.
                </p>
              </Reveal>
              <ul className="lp-same">
                {SAME.map(({ Icon, title, text }) => (
                  <li key={title}>
                    <span>
                      <Icon />
                    </span>
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lp-plans">
              {PLANS.map(
                ({ name, Icon, price, pitch, features, cta, popular, enterprise }, index) => (
                  <Reveal key={name} delay={index * 0.07}>
                    <article className={`lp-plan${popular ? " is-popular" : ""}`}>
                      {popular && <span className="lp-plan-badge">POPULAIRE</span>}
                      <header>
                        <span className="lp-plan-name">{name.toUpperCase()}</span>
                        {Icon && (
                          <span className="lp-plan-icon">
                            <Icon />
                          </span>
                        )}
                      </header>
                      <p className="lp-plan-price">
                        {price ? (
                          <>
                            <strong>{price}</strong> <small>FCFA</small>
                          </>
                        ) : (
                          <strong>Sur devis</strong>
                        )}
                      </p>
                      <p className="lp-plan-pitch">{pitch}</p>
                      <ul>
                        {features.map(feature => (
                          <li key={feature}>
                            <Check /> {feature}
                          </li>
                        ))}
                      </ul>
                      <a
                        href={enterprise ? WHATSAPP_ENTERPRISE_URL : WHATSAPP_URL}
                        className={`lp-btn ${popular ? "lp-btn--red" : "lp-btn--dim"} lp-btn--block`}
                      >
                        {cta} <ArrowRight />
                      </a>
                    </article>
                  </Reveal>
                )
              )}
            </div>
            <aside className="lp-range-aside">
              <p>
                Plus qu’une carte de visite, un levier pour{" "}
                <span className="lp-red">votre croissance.</span>
              </p>
              <BlackCard className="lp-range-card" />
            </aside>
          </div>
        </section>

        {/* ------------------------------- parcours ---------------------------- */}
        <section id="parcours" className="lp-journey">
          <span className="lp-journey-rings" aria-hidden="true" />
          <div className="lp-container">
            <div className="lp-journey-head">
              <Reveal>
                <Eyebrow>DE LA COMMANDE À LA CONNEXION</Eyebrow>
                <h2 className="lp-h2">
                  Vous commandez.
                  <br />
                  Nous nous occupons <span className="lp-red">du reste.</span>
                </h2>
              </Reveal>
              <p className="lp-journey-text">
                Choisissez votre carte, transmettez vos informations et
                validez. Support Connecté fabrique, encode, teste et remet
                votre carte prête à l’emploi.
                <small>SIMPLE. RAPIDE. FIABLE.</small>
              </p>
            </div>

            <ol className="lp-steps">
              {STEPS.map(({ Icon, title, text }, index) => (
                <li key={title}>
                  <Reveal delay={index * 0.07}>
                    <article className="lp-step">
                      <span className="lp-step-no">{`0${index + 1}`}</span>
                      <span className="lp-step-icon">
                        <Icon />
                      </span>
                      <span className="lp-step-bar" />
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ol>

            <div className="lp-guarantee">
              <div className="lp-guarantee-main">
                <span className="lp-guarantee-icon">
                  <ShieldCheck />
                </span>
                <div>
                  <strong>Fabriquée, imprimée, encodée et testée à Saly.</strong>
                  <small>UN CONTRÔLE AVANT REMISE.</small>
                </div>
              </div>
              <ul className="lp-guarantee-list">
                <li>
                  <Package /> Qualité garantie
                </li>
                <li>
                  <Clock /> Délais maîtrisés
                </li>
                <li>
                  <Headset /> Un vrai support
                </li>
              </ul>
              <a href={WHATSAPP_URL} className="lp-btn lp-btn--red">
                Demander ma carte <ArrowRight />
              </a>
            </div>
          </div>
        </section>

        {/* ---------------------------------- CTA ------------------------------ */}
        <section className="lp-final">
          <div className="lp-container lp-final-grid">
            <Reveal>
              <Eyebrow tone="copper">VOTRE PROCHAINE RENCONTRE</Eyebrow>
              <h2 className="lp-h2">
                Ne donnez plus seulement un numéro.
                <br />
                <span className="lp-copper">Donnez un point de contact.</span>
              </h2>
              <div className="lp-actions">
                <a href={WHATSAPP_URL} className="lp-btn lp-btn--copper lp-btn--lg">
                  <MessageCircle /> Demander une carte
                </a>
                <Link href="/espace-client/connexion" className="lp-btn lp-btn--ghost lp-btn--lg">
                  Se connecter
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="lp-final-visual">
              <WhiteCard className="lp-final-card" />
            </Reveal>
          </div>
        </section>
      </main>

      {/* -------------------------------- footer ------------------------------- */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div>
            <Brand />
            <p>
              Cartes connectées conçues, imprimées et encodées dans notre
              atelier de Saly.
            </p>
          </div>
          <nav aria-label="Pied de page">
            <a href="#principe">Le principe</a>
            <a href="#gammes">Les cartes</a>
            <a href="#parcours">Le parcours</a>
            <Link href="/espace-client/connexion">Espace client</Link>
          </nav>
          <small>© 2026 Support Connecté · Saly, Sénégal</small>
        </div>
      </footer>
    </div>
  );
}
