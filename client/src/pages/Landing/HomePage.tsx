import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { IconSprite } from '../../components/Icons';
import useReveal from '../../hooks/useReveal';
import HomeHero from '../../components/home/HomeHero';
import MetiersPanels from '../../components/home/MetiersPanels';
import SupportsBento from '../../components/home/SupportsBento';
import PhotoBand from '../../components/media/PhotoBand';
import ProcessScrubber from '../../components/home/ProcessScrubber';
import SectorsMarquee from '../../components/home/SectorsMarquee';
import TypeTeaser from '../../components/home/TypeTeaser';
import SimpleCTA from '../../components/shared/SimpleCTA';
import { CTA } from '../../data/content';
import { useContent } from '../../lib/content';
import '../styles/cartes.css';
import '../styles/qr.css';
import '../styles/studio.css';
import '../styles/home.css';

// Accueil V2 — structure et textes du cahier des charges (sections 06 à 17), mise en scène nouvelle.
export default function HomePage() {
  useReveal();
  const C = useContent('home.cta', CTA);
  return (
    <>
      <IconSprite />
      <Header current="/" />
      <main className="cartes-page qr-page home-page">
        <HomeHero />
        <MetiersPanels />
        <SupportsBento />
        <PhotoBand src="/images/gamme-supports.webp" alt="Carte NFC, page connectée, stickers, présentoir Wi-Fi et porte-clés Support Connecté"
          label="Nos supports" title="Le support reste." red="Le contenu évolue." pos="top"
          hotspots={[{ x: 19, y: 72, label: 'Carte NFC' }, { x: 41, y: 40, label: 'Page connectée' }, { x: 61, y: 58, label: 'Stickers QR Smart' }, { x: 85, y: 42, label: 'Wi-Fi', far: true }, { x: 86, y: 86, label: 'Porte-clés', far: true }]} />
        <ProcessScrubber />
        <SectorsMarquee />
        <TypeTeaser />
        <SimpleCTA label={C.label} title={C.title[0]} red={C.title[1]} text={C.sub} cta1={C.cta1} cta2={C.cta2} href1="/contact?sujet=devis#formulaire" bg="/images/scene-table-sunset.webp" />
      </main>
      <Footer current="/" />
    </>
  );
}
