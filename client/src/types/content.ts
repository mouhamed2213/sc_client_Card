// Types pour les données du projet

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

export interface NavFlatItem {
  label: string;
  href: string;
  icon: string;
}

export interface Pillar {
  icon: string;
  title: string;
  sub: string;
}

export interface Metier {
  id: string;
  num: string;
  title: string[];
  sub: string;
  items: string[];
  image: string | null;
}

export interface SupportItem {
  title: string;
  text: string;
  image: string;
  alt: string;
  href: string;
  badge?: string;
}

export interface ProcessStep {
  icon: string;
  n: string;
  title: string;
  sub: string;
}

export interface ProcessFan {
  label: string;
  image: string;
}

export interface SectorItem {
  icon: string;
  label: string[];
  href: string;
}

export interface SocialLink {
  icon: string;
  label: string;
  href: string;
}

export interface DemopageAction {
  icon: string;
  label: string;
}

export interface DemoPageTaps {
  tapIndex: number;
  title: string;
  subtitle: string;
}

export interface DemoPage {
  name: string;
  place: string;
  actions: DemopageAction[];
  taps: DemoPageTaps[];
}

// Types pour les props des composants
export interface IconProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
}

export type PageComponent = React.ComponentType<{ current?: string }>;

// Types pour le routage
export type RoutePath = '/' | '/cartes-connectees' | '/qr-smart' | '/panneaux-baches' | '/branding-intelligent' | '/secteurs' | '/a-propos' | '/contact';

export type RoutesMap = Record<RoutePath, PageComponent>;

// Types pour les scènes
export interface SceneSupport {
  id: string;
  img: string;
  label: string;
  x: number;
  y: number;
  w: number;
  d: number;
  cx: number;
  cy: number;
}

export interface SceneMetier {
  visual: string;
  img?: string;
  href: string;
}

export interface ProcessChoose {
  img: string;
  label: string;
}

export interface HMetiersVisual {
  visual: string;
  img?: string;
  href: string;
}

export interface SectorImage {
  src: string;
  x: number;
  y: number;
  w: number;
  r?: number;
}

export interface SectorPage {
  brand: string;
  sub: string;
  color: string;
  actions: string[];
}

export interface SectorData {
  id: string;
  icon: string;
  name: string;
  short: string;
  hook: string;
  supports: Array<{ cat: string; title: string; text: string }>;
  imgs: SectorImage[];
  page: SectorPage;
}

export interface ChainPole {
  n: string;
  title: string;
  sub: string;
}

export interface ChainData {
  label: string;
  title: string;
  red: string;
  text: string;
  poles: ChainPole[];
  quote: string;
}

// Types pour le studio / configurateur
export interface DesignerPreset {
  id: string;
  label: string;
  ink: string;
  img?: string;
}

export interface DesignerAccent {
  id: string;
  label: string;
  ink: string;
}

export interface DesignerData {
  label: string;
  title: string;
  red: string;
  text: string;
  essNote: string;
  panel: string;
  faceFront: string;
  faceBack: string;
  logoLabel: string;
  logoSize: string;
  logoHint: string;
  bgLabel: string;
  backLabel: string;
  sameAsFront: string;
  accentLabel: string;
  inkLabel: string;
  inkAuto: string;
  tuneLabel: string;
  upload: string;
  uploadLogo: string;
  replace: string;
  remove: string;
  drop: string;
  zoom: string;
  posX: string;
  posY: string;
  dim: string;
  backDim: string;
  reset: string;
  fileHint: string;
  fileErr: { type: string; size: string };
  attach: string;
  presets: DesignerPreset[];
  accents: string[];
  inks: string[];
  send: { essentielle: string; pro: string; signature: string };
}

export interface StudioIntent {
  id: string;
  label: string;
  send: string;
}

export interface StudioTier {
  id: string;
  label: string;
  note: string;
  twoSided: boolean;
}

export interface StudioField {
  k: string;
  label: string;
  ph: string;
  auto: string;
  req?: boolean;
  type?: string;
}

export interface StudioBackData {
  title: string[];
  links: string[];
}

export interface StudioData {
  intentLabel: string;
  intents: StudioIntent[];
  label: string;
  title: string;
  red: string;
  text: string;
  tiers: StudioTier[];
  fields: StudioField[];
  back: { pro: StudioBackData; signature: StudioBackData };
  flip: string;
  front: string;
  oneSide: string;
  info: string;
  optin: string;
  send: string;
  errors: { name: string; reach: string; email: string; phone: string };
  done: { title: string; text: string; promise: string; edit: string };
}

// Types pour le lead
export interface LeadPayload {
  intentLabel: string;
  products: string[];
  sector?: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  city?: string;
  prefer: string;
  message?: string;
  consent_marketing?: boolean;
  consent_text?: string;
  consent_at?: string;
  design?: Record<string, unknown>;
  fond_fichier?: string;
  logo_fichier?: string;
}
