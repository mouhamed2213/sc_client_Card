// Type declarations pour le projet Support Connecté

/// <reference types="vite/client" />

// CSS side-effect imports (Vite gère ça comme des effets de bord)
declare module '*.css' {
  const _: void;
  export default _;
}

// Declarations pour les props manquantes dans les pages
interface MediaSpot {
  src: string;
  alt: string;
  label: string;
  title: string;
  red: string;
  note?: string;
  text?: string;
  pos?: string;
  hotspots?: Array<{ x: number; y: number; label: string; far?: boolean }>;
  id?: string;
  bg?: string;
}

interface HeroSectionProps {
  label: string;
  title: string;
  red: string;
  text: string;
  cta1: string;
  cta2: string;
  bg?: string;
  href1?: string;
}

// Declarations globales pour window
declare global {
  interface Window {
    dataLayer?: Array<{ event: string; [key: string]: unknown }>;
  }
}

export {};
