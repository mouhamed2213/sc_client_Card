// Textes de la page Contact (/contact).
// Sources : catalogue 2026 (« Votre prochain point de contact commence ici. », les 3 étapes),
// cahier des charges (textes validés), coordonnées fournies. « À VALIDER » = proposition.
import { CONTACT } from './apropos';
export { CONTACT };

// Réglage de l'envoi : laisser vide = ouverture de la messagerie avec la demande pré-remplie.
// Renseigner une URL (API, Formspree, CRM…) pour un envoi direct en JSON (POST).
const ENV = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
// Back-office : https://<PROJECT_REF>.supabase.co/functions/v1/lead-intake (variable VITE_LEAD_ENDPOINT du fichier .env)
export const LEAD_ENDPOINT = ENV.VITE_LEAD_ENDPOINT || '';

export const PLACE = {
  address: 'Saly Niakh Niakhal, Mbour', // À VÉRIFIER : adresse publique à afficher
  maps: 'https://www.google.com/maps/search/?api=1&query=Saly%20Niakh%20Niakhal%20Mbour',
};

export const C_HERO = {
  label: 'Contact',
  line1: 'Votre prochain point de contact',
  red: 'commence ici.',
  lead: 'Une équipe locale, réactive et à votre écoute.',
  channels: [
    { id: 'call', icon: 'i-phone', title: 'Appeler', value: CONTACT.phone, href: `tel:${CONTACT.tel}`, copy: CONTACT.phone },
    { id: 'mail', icon: 'i-mail', title: 'Écrire', value: CONTACT.email, href: `mailto:${CONTACT.email}`, copy: CONTACT.email },
    { id: 'form', icon: 'i-pen', title: 'Demander un devis', value: 'Devis chiffré et détaillé sous 48 heures, sans engagement.', href: '#formulaire', preset: 'devis' },
    { id: 'demo', icon: 'i-people', title: 'La démonstration', value: 'Nous venons avec les supports. Vous scannez, vous voyez ce que verront vos clients.', href: '#formulaire', preset: 'demo' },
  ],
  copied: 'Copié',
  copy: 'Copier',
};

export const C_MAP = {
  label: 'Où nous trouver',
  title: 'Basés à Saly,',
  red: 'nous venons à vous.', // À VALIDER
  text: 'Une équipe locale, réactive et à votre écoute.',
  schematic: 'Carte schématique',
  open: 'Ouvrir dans Google Maps',
  pins: [
    { id: 'dakar', label: 'Dakar', x: 22, y: 24 },
    { id: 'saly', label: 'Saly', x: 58, y: 64, main: true },
    { id: 'mbour', label: 'Mbour', x: 66, y: 72 },
  ],
};
