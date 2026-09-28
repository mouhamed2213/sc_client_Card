import "@/styles/branding.css";
import "@/styles/cartes.css";
import "@/styles/global.css";
import "@/styles/panneaux.css";
import "@/styles/qr.css";
import "@/styles/secteurs.css";

import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { IconSprite } from "../../components/Icons";
import UniversGallery from "../../components/media/UniversGallery";
import ChainSection from "../../components/secteurs/ChainSection";
import SecHero from "../../components/secteurs/SecHero";
import SectorExplorer from "../../components/secteurs/SectorExplorer";
import SectorMatrix from "../../components/secteurs/SectorMatrix";
import SimpleCTA from "../../components/shared/SimpleCTA";
import { S_CTA } from "../../data/secteurs";
import useReveal from "../../hooks/useReveal";

// Page 6 — /secteurs
export default function SecteursPage() {
  useReveal();
  return (
    <>
      <IconSprite />
      <Header current="/secteurs" />
      <main className="cartes-page qr-page sec-page">
        <SecHero />
        <SectorExplorer />
        <UniversGallery />
        <SectorMatrix />
        <ChainSection />
        <SimpleCTA {...S_CTA} />
      </main>
      <Footer current="/secteurs" />
    </>
  );
}
