import "@/styles/cartes.css";
import "@/styles/global.css";
import "@/styles/panneaux.css";
import "@/styles/qr.css";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { IconSprite } from "../../components/Icons";
import PhotoBand from "../../components/media/PhotoBand";
import AccueilSection from "../../components/panneaux/AccueilSection";
import BacheSection from "../../components/panneaux/BacheSection";
import ChevaletSection from "../../components/panneaux/ChevaletSection";
import ImmoStory from "../../components/panneaux/ImmoStory";
import PanHero from "../../components/panneaux/PanHero";
import PanIndex from "../../components/panneaux/PanIndex";
import FiveSteps from "../../components/shared/FiveSteps";
import SimpleCTA from "../../components/shared/SimpleCTA";
import { P_CTA, P_STEPS } from "../../data/panneaux";
import useReveal from "../../hooks/useReveal";

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
        <PhotoBand
          src="/images/univers-senegalais-immo.webp"
          alt="Panneau terrain à vendre, présentoir QR et page connectée d’une agence immobilière"
          label="En situation"
          title="Le panneau reste sur le terrain."
          red="Le bien se visite en ligne."
          note="Univers de démonstration conçu par Support Connecté."
          hotspots={[
            { x: 76, y: 50, label: "Panneau connecté" },
            { x: 54, y: 50, label: "Présentoir QR" },
            { x: 39, y: 50, label: "Page des biens", far: true },
          ]}
        />
        <FiveSteps data={P_STEPS} />
        <SimpleCTA {...P_CTA} />
      </main>
      <Footer current="/panneaux-baches" />
    </>
  );
}
