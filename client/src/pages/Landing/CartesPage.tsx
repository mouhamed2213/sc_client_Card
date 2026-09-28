import "@/styles/cartes.css";
import "@/styles/contact.css";
import "@/styles/global.css";
import "@/styles/studio.css";
import CardsCTA from "../../components/cartes/CardsCTA";
import CardsHero from "../../components/cartes/CardsHero";
import JourneySection from "../../components/cartes/JourneySection";
import LiveUpdate from "../../components/cartes/LiveUpdate";
import PageAnatomy from "../../components/cartes/PageAnatomy";
import ResultsSection from "../../components/cartes/ResultsSection";
import StickerSection from "../../components/cartes/StickerSection";
import TiersSection from "../../components/cartes/TiersSection";
import UsesSection from "../../components/cartes/UsesSection";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { IconSprite } from "../../components/Icons";
import HandTrio from "../../components/media/HandTrio";
import PhotoBand from "../../components/media/PhotoBand";
import CardStudio from "../../components/studio/CardStudio";
import useReveal from "../../hooks/useReveal";

// Page 2 — /cartes-connectees
export default function CartesPage() {
  useReveal();
  return (
    <>
      <IconSprite />
      <Header current="/cartes-connectees" />
      <main className="cartes-page">
        <CardsHero />
        <JourneySection />
        <PageAnatomy />
        <PhotoBand
          src="/images/scene-arche-sunset.webp"
          alt="Carte connectée Support Connecté et page du restaurant Le Sunset sur téléphone"
          pos="top"
          label="Un geste"
          title="Un geste suffit."
          red="Votre univers s’ouvre immédiatement."
          hotspots={[
            { x: 48, y: 66, label: "Carte NFC" },
            { x: 72, y: 38, label: "Page connectée" },
          ]}
        />
        <UsesSection />
        <HandTrio />
        <TiersSection />
        <CardStudio designer />
        <StickerSection />
        <LiveUpdate />
        <ResultsSection />
        <CardsCTA />
      </main>
      <Footer current="/cartes-connectees" />
    </>
  );
}
