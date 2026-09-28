import "@/styles/apropos.css";
import "@/styles/cartes.css";
import "@/styles/contact.css";
import "@/styles/qr.css";
import "@/styles/studio.css";
import ContactHero from "../../components/contact/ContactHero";
import MapSection from "../../components/contact/MapSection";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { IconSprite } from "../../components/Icons";
import CardStudio from "../../components/studio/CardStudio";
import useReveal from "../../hooks/useReveal";

// Page Contact — /contact
export default function ContactPage() {
  useReveal();
  return (
    <>
      <IconSprite />
      <Header current="/contact" />
      <main className="cartes-page qr-page contact-page">
        <ContactHero />
        <CardStudio id="formulaire" withIntent />
        <MapSection />
      </main>
      <Footer current="/contact" />
    </>
  );
}
