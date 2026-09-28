import Header from '../components/Header';
import Footer from '../components/Footer';
import { IconSprite } from '../components/Icons';
import useReveal from '../hooks/useReveal';
import CardsHero from '../components/cartes/CardsHero';
import JourneySection from '../components/cartes/JourneySection';
import PageAnatomy from '../components/cartes/PageAnatomy';
import UsesSection from '../components/cartes/UsesSection';
import TiersSection from '../components/cartes/TiersSection';
import StickerSection from '../components/cartes/StickerSection';
import LiveUpdate from '../components/cartes/LiveUpdate';
import ResultsSection from '../components/cartes/ResultsSection';
import CardsCTA from '../components/cartes/CardsCTA';
import CardStudio from '../components/studio/CardStudio';
import PhotoBand from '../components/media/PhotoBand';
import HandTrio from '../components/media/HandTrio';
import '../styles/cartes.css';
import '../styles/contact.css';
import '../styles/studio.css';

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
        <PhotoBand src="/images/scene-arche-sunset.webp" alt="Carte connectée Support Connecté et page du restaurant Le Sunset sur téléphone"
          pos="top" label="Un geste" title="Un geste suffit." red="Votre univers s’ouvre immédiatement."
          hotspots={[{ x: 48, y: 66, label: 'Carte NFC' }, { x: 72, y: 38, label: 'Page connectée' }]} />
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
