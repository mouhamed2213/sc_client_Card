// Textes de la page Branding intelligent (/branding-intelligent).
// Sources : catalogue 2026 (page Branding QR, couverture), cahier des charges,
// et textes imprimés sur vos visuels. « À VALIDER » = proposition de rédaction.

export const B_HERO = {
  label: 'Branding intelligent · Édition 2026',
  line1: 'Vos tenues deviennent',
  red: 'des points de contact.',
  lead: 'Sérigraphie ou transfert. Le logo devant, le QR code au dos : votre équipe travaille, et votre marque aussi.',
  cta1: 'Demander un devis',
  cta2: 'Voir en mouvement', // À VALIDER
  badges: [
    { icon: 'i-pen', label: 'Sérigraphie ou transfert' },
    { icon: 'i-scan', label: 'Logo devant, QR au dos' },
    { icon: 'i-people', label: 'Staff, événement, vente' },
  ],
  front: 'Logo devant', back: 'QR au dos',
};

// Scène « caméra » : chaque tenue a un point logo et un point QR (en % du visuel)
export const B_STORY = {
  label: 'Branding QR',
  title: 'Le logo devant,',
  red: 'le QR code au dos.',
  outro: 'Votre équipe travaille, et votre marque aussi.',
  wears: [
    {
      id: 'tshirt', name: 'T-shirt', img: '/images/tshirt.webp', logo: [35, 27], qr: [75.1, 41.5],
      a: 'Logo poitrine,', b: 'grand QR au dos lisible à distance.', use: 'Staff, événement, vente.',
      page: { brand: 'L’ÉPICERIE NOMADE', sub: 'Des saveurs d’ici et d’ailleurs', color: '#e9b44c', actions: ['Produits locaux', 'Recettes du monde', 'Bonnes rencontres', 'Nous trouver'] },
    },
    {
      id: 'polo', name: 'Polo', img: '/images/polo.webp', logo: [37.8, 30], qr: [76.8, 42.2],
      a: 'La tenue d’équipe', b: 'du personnel en contact avec le client.', use: 'Programme, infos, billetterie.' /* libellés du visuel */,
      page: { brand: 'TERANGA FESTIVAL', sub: 'Musique · Culture · Partage', color: '#f5a524', actions: ['Programme', 'Infos', 'Billetterie', 'Plus qu’un festival'] },
    },
    {
      id: 'casquette', name: 'Casquette', img: '/images/casquette-qr.webp', logo: [55.3, 44], qr: [90.5, 54.7],
      a: 'Logo sur la face avant,', b: 'QR sur le côté.', use: 'Le support le plus visible en extérieur.',
      page: { brand: 'L’ÉPICERIE NOMADE', sub: 'Des saveurs d’ici et d’ailleurs', color: '#e9b44c', actions: ['Produits locaux', 'Recettes du monde', 'Bonnes rencontres', 'Nous trouver'] },
    },
  ],
};

export const B_PRODUCTS = {
  label: 'Nos tenues',
  title: 'Textile et objets de marque',
  red: 'qui créent du lien.',
  zoom: 'Survolez pour zoomer sur le QR', // À VALIDER
  items: [
    { id: 'casquette', name: 'Casquette', img: '/images/casquette-qr.webp', qr: [90.5, 54.7], text: 'Logo sur la face avant, QR sur le côté. Le support le plus visible en extérieur.' },
    { id: 'tshirt', name: 'T-shirt', img: '/images/tshirt.webp', qr: [75.1, 41.5], text: 'Logo poitrine, grand QR au dos lisible à distance. Staff, événement, vente.' },
    { id: 'polo', name: 'Polo', img: '/images/polo.webp', qr: [76.8, 42.2], text: 'La tenue d’équipe du personnel en contact avec le client.' },
  ],
};

export const B_OBJECTS = {
  label: 'Objets de marque connectés',
  title: 'Plus qu’un objet.',
  red: 'Une expérience.',
  text: 'Des supports qui créent du lien.',
  // Positions en % sur ambiance-saly.webp
  spots: [
    { label: 'Casquette', x: 21, y: 18 },
    { label: 'Présentoir', x: 55, y: 12 },
    { label: 'Gourde', x: 92, y: 22 },
    { label: 'Carte connectée', x: 17, y: 46 },
    { label: 'Stickers', x: 42, y: 40 },
    { label: 'Polo', x: 77, y: 52 },
    { label: 'Badge staff', x: 27, y: 74 },
    { label: 'Page connectée', x: 53, y: 70 },
    { label: 'Tote bag', x: 88, y: 84 },
  ],
};
