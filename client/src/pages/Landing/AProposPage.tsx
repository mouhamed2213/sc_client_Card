import "@/styles/apropos.css";
import "@/styles/branding.css";
import "@/styles/cartes.css";
import "@/styles/global.css";
import "@/styles/panneaux.css";
import "@/styles/qr.css";
import "@/styles/secteurs.css";
import AboutEnd from "../../components/apropos/AboutEnd";
import AboutHero from "../../components/apropos/AboutHero";
import Diagnostic from "../../components/apropos/Diagnostic";
import Faq from "../../components/apropos/Faq";
import Manifesto from "../../components/apropos/Manifesto";
import Promises from "../../components/apropos/Promises";
import StickyCTA from "../../components/apropos/StickyCTA";
import VerbsBand from "../../components/apropos/VerbsBand";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { IconSprite } from "../../components/Icons";
import PhotoBand from "../../components/media/PhotoBand";
import useReveal from "../../hooks/useReveal";

// Page À propos — /a-propos
export default function AProposPage() {
  useReveal();
  return (
    <>
      <IconSprite />
      <Header current="/a-propos" />
      <main className="cartes-page qr-page about-page">
        <AboutHero />
        <Manifesto />
        <VerbsBand />
        <PhotoBand
          src="/images/moodboard-2.webp"
          alt="Univers de marque Support Connecté : carte, page connectée, casquette, chevalet, présentoirs"
          label="Notre univers"
          title="Scannez."
          red="Vous verrez."
        />
        <Promises />
        <Diagnostic />
        <Faq />
        <AboutEnd />
      </main>
      <StickyCTA />
      <Footer current="/a-propos" />
    </>
  );
}
