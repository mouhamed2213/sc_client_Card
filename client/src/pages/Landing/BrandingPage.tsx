import "@/styles/branding.css";
import "@/styles/cartes.css";
import "@/styles/global.css";
import "@/styles/panneaux.css";
import "@/styles/qr.css";
import BrandHero from "../../components/branding/BrandHero";
import ObjectsBand from "../../components/branding/ObjectsBand";
import WearProducts from "../../components/branding/WearProducts";
import WearStory from "../../components/branding/WearStory";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { IconSprite } from "../../components/Icons";
import PhotoBand from "../../components/media/PhotoBand";
import QrCTA from "../../components/qr/QrCTA";
import useReveal from "../../hooks/useReveal";

// Page 5 — /branding-intelligent
export default function BrandingPage() {
  useReveal();
  return (
    <>
      <IconSprite />
      <Header current="/branding-intelligent" />
      <main className="cartes-page qr-page brand-page">
        <BrandHero />
        <WearStory />
        <WearProducts />
        <ObjectsBand />
        <PhotoBand
          src="/images/moodboard-1.webp"
          alt="Univers Support Connecté : carte, polo, sticker de table, enseigne, marquage de véhicule et présentoir Wi-Fi"
          label="Partout où l’on vous voit"
          title="Polo, véhicule, enseigne :"
          red="chaque surface devient un point de contact."
        />
        <QrCTA />
      </main>
      <Footer current="/branding-intelligent" />
    </>
  );
}
