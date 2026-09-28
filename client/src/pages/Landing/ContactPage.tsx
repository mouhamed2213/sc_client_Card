import Header from '../components/Header';
import Footer from '../components/Footer';
import { IconSprite } from '../components/Icons';
import useReveal from '../hooks/useReveal';
import ContactHero from '../components/contact/ContactHero';
import CardStudio from '../components/studio/CardStudio';
import MapSection from '../components/contact/MapSection';
import '../styles/cartes.css';
import '../styles/qr.css';
import '../styles/apropos.css';
import '../styles/contact.css';
import '../styles/studio.css';

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
