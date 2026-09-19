import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Check,
  Globe2,
  MapPin,
  Menu,
  MessageCircle,
  MousePointer2,
  QrCode,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const WHATSAPP_URL =
  "https://wa.me/221778096713?text=Bonjour%20Support%20Connect%C3%A9%2C%20je%20souhaite%20demander%20une%20carte%20connect%C3%A9e.";

const plans = [
  {
    name: "Essentielle",
    price: "12 000",
    description: "L'essentiel pour être trouvé et contacté.",
    audience: "Artisan · commerçant · indépendant",
    features: [
      "Appel direct",
      "WhatsApp & e-mail",
      "Google Maps",
      "QR code + NFC",
      "Jusqu'à 3 liens",
    ],
  },
  {
    name: "Pro",
    price: "15 000",
    description: "Plus d'opportunités pour votre activité.",
    audience: "Commercial · restaurateur · cabinet",
    features: [
      "Tout l'Essentielle",
      "Jusqu'à 10 liens",
      "Galerie 8 photos",
      "Avis Google",
      "Statistiques",
    ],
    featured: true,
  },
  {
    name: "Signature",
    price: "75 000",
    suffix: "3 cartes",
    description: "Un design exclusif, à votre image.",
    audience: "Dirigeant · profession libérale · direction",
    features: [
      "Tout le Pro",
      "Design sur mesure",
      "3 cartes premium",
      "Rédaction des textes",
      "Traitement prioritaire",
    ],
  },

];

const steps = [
  [
    "01",
    "Vous commandez",
    "Écrivez-nous sur WhatsApp. Nous vous envoyons un devis gratuit sous 24 h.",
  ],
  [
    "02",
    "Vous validez",
    "Vous transmettez vos informations et validez le bon à tirer avant impression.",
  ],
  [
    "03",
    "Nous fabriquons",
    "Impression, encodage NFC et tests sur deux téléphones dans notre atelier de Saly.",
  ],
  [
    "04",
    "Vous êtes connecté",
    "Vous tendez votre carte. Votre client ouvre votre fiche en quelques secondes.",
  ],
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const orbY = useTransform(scrollYProgress, [0, 1], [0, -180]);

  const goToWhatsApp = () => {
    window.location.href = WHATSAPP_URL;
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f3ef] text-[#142033] selection:bg-[#dca66b]/30">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#111a2b]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <a
            href="#top"
            className="flex items-center gap-3"
            onClick={() => setMenuOpen(false)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dfa56a] text-[#111a2b] shadow-lg shadow-black/10">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">
                Support
              </span>
              <span className="block text-[17px] font-semibold tracking-[-0.03em] text-white">
                Connecté
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#principe"
              className="text-sm text-white/65 transition hover:text-white"
            >
              Le principe
            </a>
            <a
              href="#gammes"
              className="text-sm text-white/65 transition hover:text-white"
            >
              Les cartes
            </a>
            <a
              href="#parcours"
              className="text-sm text-white/65 transition hover:text-white"
            >
              Comment ça marche
            </a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/espace-client/connexion"
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Se connecter
            </Link>
            <button
              onClick={goToWhatsApp}
              className="group flex items-center gap-2 rounded-full bg-[#dfa56a] px-5 py-2.5 text-sm font-bold text-[#111a2b] transition hover:-translate-y-0.5 hover:bg-[#efb97e]"
            >
              Demander une carte
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white md:hidden"
            onClick={() => setMenuOpen(value => !value)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/10 bg-[#111a2b] px-5 pb-5 md:hidden"
          >
            <nav className="grid gap-1 pt-3">
              {[
                ["#principe", "Le principe"],
                ["#gammes", "Les cartes"],
                ["#parcours", "Comment ça marche"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm text-white/75 hover:bg-white/5"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/espace-client/connexion"
                className="mt-2 rounded-xl border border-white/10 px-3 py-3 text-center text-sm font-semibold text-white"
              >
                Se connecter
              </Link>
              <button
                onClick={goToWhatsApp}
                className="rounded-xl bg-[#dfa56a] px-3 py-3 text-sm font-bold text-[#111a2b]"
              >
                Demander une carte
              </button>
            </nav>
          </motion.div>
        )}
      </header>

      <main id="top">
        <section className="relative isolate min-h-[760px] overflow-hidden bg-[#111a2b] pt-[74px] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(223,165,106,.18),transparent_28%),radial-gradient(circle_at_15%_80%,rgba(53,104,151,.16),transparent_32%)]" />
          <motion.div
            style={{ y: orbY }}
            className="pointer-events-none absolute -right-32 top-28 h-[520px] w-[520px] rounded-full border border-[#dfa56a]/20"
          >
            <div className="absolute inset-12 rounded-full border border-white/10" />
            <div className="absolute inset-28 rounded-full border border-[#dfa56a]/15" />
          </motion.div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-28">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e8b17a]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#dfa56a]" />
                  Cartes connectées · Édition 2026
                </div>
                <h1 className="max-w-3xl text-[clamp(3.2rem,7vw,6.4rem)] font-semibold leading-[.91] tracking-[-0.065em]">
                  Scannez.
                  <br />
                  <span className="text-[#dfa56a]">Vous verrez.</span>
                </h1>
                <p className="mt-7 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
                  Une carte de visite qui ne finit pas dans un tiroir. Un geste
                  suffit pour ouvrir votre identité, vos contacts, WhatsApp,
                  votre adresse et tout ce qui compte pour votre activité.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={goToWhatsApp}
                    className="group flex items-center justify-center gap-3 rounded-full bg-[#dfa56a] px-7 py-4 text-sm font-bold text-[#111a2b] shadow-[0_14px_40px_rgba(223,165,106,.2)] transition hover:-translate-y-1 hover:bg-[#efb97e]"
                  >
                    Demander une carte
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </button>
                  <Link
                    href="/espace-client/connexion"
                    className="flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    Se connecter
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/45">
                  {[
                    "NFC + QR code",
                    "Aucune application",
                    "Fabriquée à Saly",
                  ].map(item => (
                    <span key={item} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#dfa56a]" /> {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              className="relative mx-auto w-full max-w-[510px]"
            >
              <div className="absolute -inset-8 rounded-[42px] bg-[#dfa56a]/10 blur-3xl" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-[#24324a] via-[#18243a] to-[#0c1422] p-5 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[.2em] text-white/35">
                  <span>Support Connecté</span>
                  <span>NFC / QR</span>
                </div>
                <div className="absolute inset-x-8 top-24 h-44 rounded-[28px] bg-gradient-to-br from-[#dca66b] via-[#b97842] to-[#6d4228] opacity-90">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.35),transparent_25%)]" />
                  <div className="absolute bottom-5 left-5 text-[#111a2b]">
                    <div className="text-[9px] font-bold uppercase tracking-[.2em] opacity-60">
                      Carte Pro
                    </div>
                    <div className="mt-1 text-xl font-semibold tracking-[-.04em]">
                      Votre identité.
                    </div>
                  </div>
                  <div className="absolute right-5 top-5 h-11 w-11 rounded-xl border border-[#111a2b]/20 bg-white/15 backdrop-blur">
                    <div className="m-2 h-7 w-7 rounded-lg border-2 border-[#111a2b]/40" />
                  </div>
                </div>
                <div className="absolute inset-x-8 bottom-8 rounded-[24px] border border-white/10 bg-white/[.06] p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                      <Smartphone className="h-5 w-5 text-[#dfa56a]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        Un geste. Une fiche.
                      </div>
                      <div className="mt-1 text-xs text-white/40">
                        Votre client n'installe rien.
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {["WhatsApp", "Appeler", "Maps"].map(label => (
                      <div
                        key={label}
                        className="rounded-xl bg-white/[.06] px-2 py-2.5 text-center text-[10px] text-white/55"
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-5 -left-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1b2940]/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:-left-8"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfa56a] text-[#111a2b]">
                  <QrCode className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-xs font-semibold text-white">
                    Sans contact
                  </span>
                  <span className="block text-[10px] text-white/40">
                    ou QR code
                  </span>
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section
          id="principe"
          className="scroll-mt-24 bg-[#f5f3ef] py-24 lg:py-32"
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#b67843]">
                  Le principe
                </p>
                <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[.98] tracking-[-.05em] sm:text-6xl">
                  Une carte se donne une fois.
                  <br />
                  <span className="text-[#b67843]">Celle-ci reste.</span>
                </h2>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.1 }}
                className="max-w-2xl text-lg leading-8 text-[#667083]"
              >
                Votre client approche son téléphone. En quelques secondes, il
                retrouve votre numéro, votre WhatsApp, votre adresse et votre
                fiche. Vous changez de numéro demain ? Vous nous écrivez : la
                carte continue de fonctionner.
              </motion.p>
            </div>

            <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-[#dedbd5] bg-[#dedbd5] sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  Smartphone,
                  "Un geste",
                  "Le téléphone ouvre directement votre fiche.",
                ],
                [
                  MousePointer2,
                  "Aucune app",
                  "Votre client n'installe rien pour vous contacter.",
                ],
                [
                  Globe2,
                  "Votre présence",
                  "WhatsApp, site, réseaux, Maps et avis au même endroit.",
                ],
                [
                  Zap,
                  "Toujours à jour",
                  "Une modification en ligne vaut mieux qu'une réimpression.",
                ],
              ].map(([Icon, title, text], index) => (
                <motion.div
                  key={String(title)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="group bg-[#f5f3ef] p-7 transition hover:bg-white"
                >
                  <div className="mb-12 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8e1d8] text-[#a76d3b] transition group-hover:scale-110 group-hover:bg-[#dfa56a] group-hover:text-[#111a2b]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-[-.025em]">
                    {String(title)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#7c8492]">
                    {String(text)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#111a2b] py-24 text-white lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#dfa56a]">
                Pourquoi maintenant
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-[1] tracking-[-.05em] sm:text-6xl">
                Le téléphone est devenu
                <br />
                <span className="text-[#dfa56a]">votre vitrine.</span>
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  "122%",
                  "taux de pénétration mobile au Sénégal",
                  "23,3 M de connexions actives fin 2025.",
                ],
                [
                  "60,6%",
                  "de la population connectée à internet",
                  "11,5 M de personnes, presque toutes par mobile.",
                ],
                [
                  "97%",
                  "des consommateurs lisent les avis",
                  "La réputation numérique compte avant le choix.",
                ],
                [
                  "71%",
                  "des lectures d'avis se font sur Google",
                  "Votre fiche Google est un point de décision.",
                ],
              ].map(([number, title, note], index) => (
                <motion.div
                  key={number}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-3xl border border-white/10 bg-white/[.045] p-7"
                >
                  <div className="text-5xl font-semibold tracking-[-.06em] text-[#dfa56a]">
                    {number}
                  </div>
                  <div className="mt-5 text-sm font-semibold text-white/90">
                    {title}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-white/40">
                    {note}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="gammes"
          className="scroll-mt-24 bg-[#f5f3ef] py-24 lg:py-32"
        >
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#b67843]">
                  La gamme
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">
                  Quatre cartes.
                  <br />
                  Une seule logique.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#7a8290]">
                Chaque gamme contient tout ce que fait la précédente. Choisissez
                simplement le niveau qui correspond à votre activité.
              </p>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-4">
              {plans.map((plan, index) => (
                <motion.article
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{ delay: index * 0.08 }}
                  className={`relative flex flex-col rounded-3xl border p-6 transition hover:-translate-y-2 hover:shadow-xl ${plan.featured ? "border-[#dfa56a] bg-[#111a2b] text-white shadow-[0_20px_60px_rgba(17,26,43,.16)]" : "border-[#dfddd8] bg-white"}`}
                >
                  {plan.featured && (
                    <div className="absolute right-5 top-5 rounded-full bg-[#dfa56a] px-3 py-1 text-[9px] font-bold uppercase tracking-[.14em] text-[#111a2b]">
                      Populaire
                    </div>
                  )}
                  <div
                    className={`text-[11px] font-bold uppercase tracking-[.22em] ${plan.featured ? "text-[#dfa56a]" : "text-[#b67843]"}`}
                  >
                    {plan.name}
                  </div>
                  <div className="mt-8 flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-[-.05em]">
                      {plan.price}
                    </span>
                    <span
                      className={`pb-1 text-xs ${plan.featured ? "text-white/40" : "text-[#9299a5]"}`}
                    >
                      F CFA {plan.suffix ? `· ${plan.suffix}` : ""}
                    </span>
                  </div>
                  <p
                    className={`mt-4 min-h-12 text-sm leading-5 ${plan.featured ? "text-white/55" : "text-[#687181]"}`}
                  >
                    {plan.description}
                  </p>
                  <p
                    className={`mt-4 text-[10px] font-semibold uppercase tracking-[.08em] ${plan.featured ? "text-white/35" : "text-[#a1a7b0]"}`}
                  >
                    {plan.audience}
                  </p>
                  <div
                    className={`my-6 h-px ${plan.featured ? "bg-white/10" : "bg-[#ebe9e5]"}`}
                  />
                  <ul className="space-y-3">
                    {plan.features.map(feature => (
                      <li
                        key={feature}
                        className={`flex items-start gap-2 text-xs ${plan.featured ? "text-white/65" : "text-[#626c7b]"}`}
                      >
                        <Check
                          className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${plan.featured ? "text-[#dfa56a]" : "text-[#b67843]"}`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={goToWhatsApp}
                    className={`mt-auto pt-8 text-left text-xs font-bold ${plan.featured ? "text-[#dfa56a]" : "text-[#142033]"}`}
                  >
                    Demander cette carte{" "}
                    <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="parcours" className="scroll-mt-24 bg-white py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#b67843]">
                De la commande à la pose
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-6xl">
                Simple côté client.
                <br />
                Précis côté atelier.
              </h2>
            </div>
            <div className="mt-16 grid gap-0 border-y border-[#e8e7e4] lg:grid-cols-4">
              {steps.map(([number, title, description], index) => (
                <motion.div
                  key={number}
                  initial={{ opacity: 0, x: index === 0 ? -10 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="relative border-b border-[#e8e7e4] px-0 py-8 lg:border-b-0 lg:border-r lg:px-7 lg:py-10 first:lg:pl-0 last:lg:border-r-0"
                >
                  <span className="text-xs font-bold tracking-[.2em] text-[#b67843]">
                    {number}
                  </span>
                  <h3 className="mt-12 text-xl font-semibold tracking-[-.03em]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#7c8490]">
                    {description}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 flex flex-col justify-between gap-6 rounded-3xl bg-[#f5f3ef] p-7 sm:flex-row sm:items-center sm:p-9">
              <div>
                <p className="text-sm font-semibold">
                  Fabriqué, imprimé et encodé à Saly.
                </p>
                <p className="mt-1 text-xs text-[#7b8390]">
                  Chaque carte est testée sur deux téléphones avant remise.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#566172]">
                <MapPin className="h-4 w-4 text-[#b67843]" /> Saly Niakh
                Niakhal, Sénégal
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#dca66b] py-20 lg:py-28">
          <div className="absolute -right-20 -top-40 h-96 w-96 rounded-full border border-[#111a2b]/10" />
          <div className="absolute -right-4 -top-24 h-64 w-64 rounded-full border border-[#111a2b]/10" />
          <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-9 px-5 lg:flex-row lg:items-end lg:px-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.25em] text-[#111a2b]/55">
                Votre prochaine rencontre
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[.95] tracking-[-.05em] text-[#111a2b] sm:text-6xl">
                Ne donnez plus seulement un numéro.
                <br />
                Donnez un point de contact.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-shrink-0">
              <button
                onClick={goToWhatsApp}
                className="flex items-center justify-center gap-3 rounded-full bg-[#111a2b] px-7 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-[#1c2940]"
              >
                <MessageCircle className="h-4 w-4" />
                Demander une carte
              </button>
              <Link
                href="/espace-client/connexion"
                className="flex items-center justify-center gap-3 rounded-full border border-[#111a2b]/20 px-7 py-4 text-sm font-bold text-[#111a2b] transition hover:-translate-y-1 hover:bg-white/20"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#111a2b] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfa56a] text-[#111a2b]">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-semibold tracking-[-.02em]">
                Support Connecté
              </span>
            </div>
            <p className="mt-4 max-w-sm text-xs leading-5 text-white/35">
              Cartes connectées conçues, imprimées et encodées dans notre
              atelier de Saly.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/40">
            <a href="#principe" className="hover:text-white">
              Le principe
            </a>
            <a href="#gammes" className="hover:text-white">
              Les cartes
            </a>
            <a href="#parcours" className="hover:text-white">
              Le parcours
            </a>
            <Link href="/espace-client/connexion" className="hover:text-white">
              Espace client
            </Link>
          </div>
          <div className="text-xs text-white/30">
            © 2026 Support Connecté · Saly, Sénégal
          </div>
        </div>
      </footer>
    </div>
  );
}
