import Header from '../components/Header';
import Footer from '../components/Footer';
import { IconSprite } from '../components/Icons';
import useReveal from '../hooks/useReveal';
import PanHero from '../components/panneaux/PanHero';
import PanIndex from '../components/panneaux/PanIndex';
import ImmoStory from '../components/panneaux/ImmoStory';
import BacheSection from '../components/panneaux/BacheSection';
import AccueilSection from '../components/panneaux/AccueilSection';
import ChevaletSection from '../components/panneaux/ChevaletSection';
import FiveSteps from '../components/shared/FiveSteps';
import SimpleCTA from '../components/shared/SimpleCTA';
import PhotoBand from '../components/media/PhotoBand';
import { P_STEPS, P_CTA } from '../data/panneaux';
import '../styles/cartes.css';
import '../styles/qr.css';
import '../styles/panneaux.css';

// Page 4 — /panneaux-baches
export default function PanneauxPage() {
  useReveal();
  return (
    <>
      <IconSprite />
      <Header current="/panneaux-baches" />
      <main className="cartes-page qr-page pan-page">
        <PanHero />
        <PanIndex />
        <ImmoStory />
        <BacheSection />
        <AccueilSection />
        <ChevaletSection />
        <PhotoBand src="/images/univers-senegalais-immo.webp" alt="Panneau terrain à vendre, présentoir QR et page connectée d’une agence immobilière"
          label="En situation" title="Le panneau reste sur le terrain." red="Le bien se visite en ligne." note="Univers de démonstration conçu par Support Connecté."
          hotspots={[{ x: 76, y: 50, label: 'Panneau connecté' }, { x: 54, y: 50, label: 'Présentoir QR' }, { x: 39, y: 50, label: 'Page des biens', far: true }]} />
        <FiveSteps data={P_STEPS} />
        <SimpleCTA {...P_CTA} />
      </main>
      <Footer current="/panneaux-baches" />
    </>
  );
}
