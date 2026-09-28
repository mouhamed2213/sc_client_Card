import "@/styles/cartes.css";
import "@/styles/global.css";
import "@/styles/qr.css";

import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { IconSprite } from "../../components/Icons";
import PhotoBand from "../../components/media/PhotoBand";
import FormatsSection from "../../components/qr/FormatsSection";
import GameSection from "../../components/qr/GameSection";
import QrCTA from "../../components/qr/QrCTA";
import QrHero from "../../components/qr/QrHero";
import UseCasesSection from "../../components/qr/UseCasesSection";
import useReveal from "../../hooks/useReveal";

// Page 3 — /qr-smart
export default function QrSmartPage() {
  useReveal();
  return (
    <>
      <IconSprite />
      <Header current="/qr-smart" />
      <main className="cartes-page qr-page">
        <QrHero />
        <UseCasesSection />
        <FormatsSection />
        <GameSection />
        <PhotoBand
          src="/images/univers-chez-homard.webp"
          alt="Supports QR et NFC d’un restaurant : chevalet, sous-verres, carte et page menu"
          label="En situation"
          title="Un QR sur chaque table,"
          red="le menu dans chaque main."
          note="Univers de démonstration conçu par Support Connecté."
          hotspots={[
            { x: 13, y: 52, label: "Chevalet" },
            { x: 30, y: 52, label: "Sticker rond" },
            { x: 44, y: 45, label: "Page menu" },
            { x: 58, y: 70, label: "Carte NFC", far: true },
          ]}
        />
        <QrCTA />
      </main>
      <Footer current="/qr-smart" />
    </>
  );
}
