# Plan d’implémentation — Formules Support Connecté

## Architecture centrale

Toutes les capacités sont déclarées une seule fois dans `shared/planFeatures.ts`. Le serveur utilise cette matrice pour refuser les données ou activations non conformes; le studio l’utilise pour afficher les bons champs et plafonds; la fiche publique l’utilise pour replier les blocs non inclus.

| Formule | Liens | Galerie | Portrait/logo | Formulaire | Avis Google | Horaires | Catalogue |
|---|---:|---:|---|---|---|---|---|
| Essentiel | 3 | 0 | Optionnel | Non | Non | Non requis | Non |
| Pro | 10 | 3 | Obligatoire | Oui | Non | Non requis | Non |
| Signature | 10 | 8 | Obligatoire | Oui | Non | Non requis | Non |
| Commerce | 10 | 8 | Obligatoire | Oui | Obligatoire | 7 jours | Oui |

## Fonctionnalités

- [x] **Architecture `planFeatures`** partagée par serveur et client.
- [x] **Validation serveur** des plafonds de liens et galerie et des champs obligatoires avant activation.
- [x] **Éditeur de fiche** avec changement de formule et récapitulatif des capacités.
- [x] **Portrait/logo** : sélection, recadrage portrait 400 × 400, WebP et plafond 30 ko.
- [x] **Galerie** : redimensionnement 1200 px, WebP, plafond 80 ko, ajout/suppression et texte alternatif.
- [x] **Liens personnalisés** : ajout/suppression avec plafond 3 ou 10.
- [x] **Formulaire de rappel** : affichage conditionnel, enregistrement Prisma et consultation dans le studio.
- [x] **Avis Google Commerce** : `google_place_id` obligatoire et lien direct.
- [x] **Horaires Commerce** : sept jours obligatoires avec fermeture explicite acceptée.
- [x] **Catalogue Commerce** : sections, articles, descriptions et prix.
- [x] **Repli des blocs** : galerie, formulaire, avis, horaires et catalogue ne laissent aucun espace lorsqu’ils ne sont pas inclus ou sont vides.
- [x] **Tests automatisés** : matrice des quatre formules, limites, activation, formulaire, stockage et persistance.
- [x] **Validation visuelle et fonctionnelle navigateur** : transitions Pro/Commerce/Essentiel, upload galerie, upload portrait, activation Commerce refusée si incomplète, formulaire de rappel persisté puis nettoyé.
- [x] **Build de production et test du serveur compilé** avec une requête Prisma réelle.
