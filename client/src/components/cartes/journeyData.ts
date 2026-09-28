import { DEMO_PAGE } from '../../data/content';
export { JOURNEY } from '../../data/cartes';
// Démo de taps : reprend la page de démonstration commune (PLACEHOLDER, voir PhoneMockup.jsx)
// tileFor : index de l'action de la page → index de la tuile qui s'allume en même temps
export const DEMO = { taps: DEMO_PAGE.taps, tileFor: { 1: 2, 2: 0, 3: 1, 4: 5, 5: 4 } };
