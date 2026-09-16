# Documentation — Migration progressive des templates

## 1. Contexte du projet

Le projet `sc_client_Card` permet de présenter une fiche de contact numérique. Une fiche peut être affichée selon plusieurs formules commerciales :

- `essentiel`
- `pro`
- `signature`

Le composant principal utilisé pour le rendu public est :

```text
templates/base/FicheTemplate.tsx
```

L’objectif de la migration est de conserver **un composant partagé** et de faire varier l’apparence et les fonctionnalités grâce à une configuration de thème, des design tokens CSS et des classes Tailwind.

Cette approche évite :

- de dupliquer tout le template pour chaque formule ;
- de mélanger les règles métier avec les styles ;
- de multiplier les couleurs codées en dur ;
- de rendre les futures évolutions difficiles.

> Important : l’application n’est pas encore considérée comme prête pour la production. Les changements sont réalisés progressivement et doivent être testés visuellement et fonctionnellement après chaque étape.

---

## 2. Situation initiale

Au début du travail, les styles étaient principalement répartis dans plusieurs fichiers CSS de thèmes :

```text
templates/themes.css
templates/themes/essentiel.css
templates/themes/pro.css
templates/themes/signature.css
templates/socials.css
```

Le rendu utilisait déjà un composant commun, mais plusieurs règles étaient encore fortement dépendantes de sélecteurs CSS, de couleurs codées en dur et de styles spécifiques à certaines formules.

La migration ne consiste donc pas à supprimer immédiatement tous les fichiers CSS. Elle consiste à déplacer progressivement les responsabilités vers le bon niveau :

- Tailwind pour la structure et les utilitaires simples ;
- variables CSS pour l’identité visuelle des thèmes ;
- CSS spécifique pour les effets complexes ou les comportements réellement propres à un thème.

---

## 3. Architecture cible

L’architecture retenue est une architecture **hybride Tailwind + CSS variables + CSS spécifique**.

### 3.1 Responsabilité de Tailwind

Tailwind doit gérer principalement :

- les marges et espacements ;
- les paddings ;
- les layouts `flex`, `grid` et les alignements ;
- les largeurs et contraintes responsive ;
- la typographie simple ;
- les bordures simples ;
- les états simples comme `hover`, `focus` et `disabled`.

### 3.2 Responsabilité des variables CSS

Les variables CSS centralisent les valeurs qui changent selon le thème :

- arrière-plan général ;
- arrière-plan des cartes ;
- couleur du texte ;
- couleur secondaire ;
- couleur d’accent ;
- couleur d’accent douce ;
- couleur des séparateurs ;
- couleur du hero ;
- couleur du texte du hero ;
- couleurs sémantiques de succès et d’erreur ;
- rayon des composants.

### 3.3 Responsabilité du CSS spécifique

Le CSS classique doit être conservé lorsque la règle correspond à :

- un effet visuel complexe ;
- une animation ;
- un hero particulier ;
- une galerie avec un comportement spécifique ;
- une composition difficile à exprimer proprement avec Tailwind ;
- une différence graphique importante entre Pro et Signature.

Le CSS spécifique doit cependant rester limité et documenté.

---

## 4. Formules et identité visuelle

### 4.1 Essentiel

Positionnement visuel :

- simple ;
- direct ;
- lisible ;
- professionnel sans surcharge graphique.

Caractéristiques fonctionnelles :

- maximum de 3 liens ;
- aucune photo supplémentaire ;
- pas de formulaire de contact ;
- pas d’avis Google ;
- profil non obligatoire ;
- horaires requis ;
- pas de catalogue.

### 4.2 Pro

Positionnement visuel :

- professionnel ;
- chaleureux ;
- plus riche visuellement ;
- adapté à une présentation commerciale.

Caractéristiques fonctionnelles :

- maximum de 10 liens ;
- jusqu’à 8 photos ;
- formulaire de contact activé ;
- avis Google activés ;
- profil requis ;
- horaires requis ;
- pas de catalogue.

### 4.3 Signature

Positionnement visuel :

- sombre ;
- éditorial ;
- premium ;
- accent doré.

Caractéristiques fonctionnelles :

- mêmes capacités principales que Pro ;
- catalogue activé ;
- possibilité de présenter des produits ou articles.

La formule `commerce` a été regroupée avec la formule `signature` afin d’éviter de multiplier les variantes de templates.

---

## 5. Fichiers importants

```text
templates/
├── base/
│   └── FicheTemplate.tsx       # Composant partagé de rendu
├── config.ts                   # Configuration des thèmes
├── model.ts                    # Types et modèle des formules
├── theme-tokens.css            # Variables et mappings Tailwind
├── themes.css                  # Styles historiques et styles encore nécessaires
├── socials.css                 # Styles des liens sociaux
├── themes/
│   ├── essentiel.css           # Styles spécifiques Essentiel
│   ├── pro.css                 # Styles spécifiques Pro
│   └── signature.css            # Styles spécifiques Signature
├── README.md
└── THEMES-TAILWIND.md          # Documentation de l’approche hybride
```

Le fichier actuel de suivi de migration est :

```text
docs/TEMPLATES-MIGRATION.md
```

---

## 6. Travail déjà réalisé

### 6.1 Centralisation des design tokens

Le fichier suivant a été créé :

```text
templates/theme-tokens.css
```

Il contient :

- les valeurs par défaut ;
- les variables de la formule Essentiel ;
- les variables de la formule Pro ;
- les variables de la formule Signature ;
- les mappings `@theme inline` permettant d’utiliser les tokens dans les classes Tailwind.

Exemples de classes disponibles :

```tsx
text-theme-text
text-theme-muted
bg-theme-accent
bg-theme-accent-soft
border-theme-line
text-theme-danger
bg-theme-success-bg
text-theme-success-text
```

### 6.2 Nettoyage de la configuration

Le fichier `templates/config.ts` centralise maintenant la correspondance entre la formule, le thème et les fonctionnalités.

La fonction principale est :

```ts
getTemplateConfig(formule)
```

Elle permet au composant de récupérer la configuration adaptée sans créer un composant différent pour chaque formule.

### 6.3 Adaptation du composant principal

Le composant `FicheTemplate.tsx` importe maintenant les tokens :

```tsx
import "../theme-tokens.css";
```

Des couleurs codées en dur ont été remplacées par des classes de tokens pour plusieurs éléments :

- titres de sections ;
- icônes des titres ;
- titre et description des avis Google ;
- état de fermeture des horaires ;
- message de succès ;
- titre et description du catalogue ;
- description du footer.

La logique métier n’a pas été modifiée pendant cette étape.

### 6.4 Adaptation des réseaux sociaux

Le fichier `templates/socials.css` utilise désormais les variables du thème pour les styles communs, avec des adaptations spécifiques pour Pro et Signature lorsque cela est nécessaire.

### 6.5 Documentation de l’approche

Le fichier suivant a été ajouté :

```text
templates/THEMES-TAILWIND.md
```

Il décrit le principe hybride et la progression recommandée.

---

## 7. Règle fondamentale de la migration

Ne jamais supprimer une règle CSS avant d’avoir ajouté et vérifié son équivalent dans le JSX ou dans un autre fichier de styles.

La séquence correcte est :

1. identifier une règle CSS ;
2. ajouter son équivalent Tailwind dans le composant ;
3. vérifier que le rendu reste identique ;
4. supprimer uniquement la règle devenue inutile ;
5. tester les trois formules ;
6. valider le commit.

Cette méthode limite les régressions visuelles.

---

## 8. Migration progressive restante

### Phase 1 — Éléments structurels simples

Cette phase doit migrer progressivement les styles de base suivants :

- `.public-content` ;
- `.public-section` ;
- `.link-list` ;
- `.public-link` ;
- `.public-address` ;
- `.public-footer`.

Les responsabilités concernées sont principalement :

- padding ;
- gap ;
- `display: grid` ou `display: flex` ;
- bordures ;
- couleurs utilisant les tokens ;
- tailles de texte ;
- alignements.

Exemples de classes possibles :

```tsx
className="grid gap-2"
```

```tsx
className="text-xs leading-[1.7] text-theme-muted"
```

```tsx
className="border-theme-line text-theme-text"
```

Les classes doivent être adaptées au JSX réel et ne doivent pas être ajoutées aveuglément si une règle CSS spécifique est encore nécessaire.

### Phase 2 — Carte principale et conteneur général

Évaluer ensuite la migration de :

- largeur maximale ;
- centrage ;
- padding global ;
- bordure ;
- rayon ;
- overflow ;
- ombre.

Les valeurs dépendant du thème, notamment le rayon et les couleurs, doivent rester pilotées par les variables CSS.

### Phase 3 — Boutons et liens d’action

Analyser les sélecteurs :

```css
.public-primary-link
.public-secondary-link
```

Migrer vers Tailwind les propriétés simples :

- `inline-flex` ;
- alignement ;
- gap ;
- padding ;
- taille du texte ;
- rayon.

Conserver les variables CSS pour les couleurs d’accent et les bordures si celles-ci varient selon la formule.

### Phase 4 — Horaires, avis et catalogue

Migrer progressivement les styles simples des composants suivants :

- panneau d’avis ;
- liste des horaires ;
- lignes horaires ;
- cartes du catalogue.

Ne pas modifier la logique d’accès aux fonctionnalités. La matrice des plans doit continuer à être la source de vérité.

### Phase 5 — Galerie et formulaire de contact

Ces éléments doivent être traités avec prudence, car ils peuvent contenir des règles plus spécifiques :

- dimensions des images ;
- positionnement ;
- états d’interaction ;
- validation ;
- affichage responsive ;
- styles d’erreur et de succès.

Migrer uniquement ce qui apporte un gain clair en lisibilité et en cohérence.

### Phase 6 — Hero et effets visuels

Le hero, les animations et les effets spécifiques doivent être migrés en dernier.

Il n’est pas nécessaire de convertir chaque règle CSS en classe Tailwind. Si une règle est plus lisible et plus stable dans un fichier CSS dédié, elle peut y rester.

### Phase 7 — Nettoyage final

Après validation des trois formules :

- supprimer les règles CSS réellement inutilisées ;
- supprimer les doublons ;
- vérifier les sélecteurs devenus obsolètes ;
- vérifier les imports ;
- mettre à jour les commentaires ;
- vérifier que chaque variable possède une utilisation réelle ;
- conserver une structure simple pour les prochains développeurs.

---

## 9. Points à ne pas modifier sans demande explicite

Pendant la migration visuelle, ne pas modifier inutilement :

- la logique métier ;
- la matrice des fonctionnalités ;
- les règles d’accès au catalogue ;
- les formulaires ;
- les traitements des réseaux sociaux ;
- les données de la fiche ;
- les règles de sauvegarde ;
- les comportements backend ;
- les noms de propriétés du modèle.

Les éventuelles corrections indépendantes, comme les fautes de classe ou les problèmes de logique, doivent faire l’objet d’un changement séparé afin de faciliter la revue et le retour arrière.

---

## 10. Procédure de test après chaque étape

### 10.1 Mettre à jour la branche

```bash
git checkout templates-models1
git pull origin templates-models1
```

### 10.2 Installer les dépendances si nécessaire

```bash
npm install
```

Utiliser la commande correspondant au gestionnaire de paquets réellement utilisé par le projet si elle est différente.

### 10.3 Démarrer le projet

```bash
npm run dev
```

### 10.4 Vérifications visuelles

Tester chaque formule :

- Essentiel ;
- Pro ;
- Signature.

Pour chaque formule, vérifier :

- affichage général ;
- largeur et centrage ;
- responsive mobile ;
- responsive desktop ;
- couleurs du texte ;
- couleurs d’arrière-plan ;
- bordures et rayons ;
- liens sociaux ;
- boutons d’action ;
- horaires ;
- avis Google ;
- galerie ;
- formulaire ;
- catalogue pour Signature ;
- états de succès et d’erreur ;
- absence de débordement horizontal.

### 10.5 Vérifications techniques

Avant de valider une étape :

```bash
npm run lint
```

Si le projet possède une commande de type-check :

```bash
npm run typecheck
```

Lancer également le build si la commande est disponible :

```bash
npm run build
```

Les commandes exactes doivent être confirmées dans le `package.json` du projet.

---

## 11. Stratégie Git recommandée

Travailler sur la branche :

```text
templates-models1
```

Faire des commits courts et ciblés, par exemple :

```text
refactor: migrate public content spacing to tailwind
refactor: migrate public links to theme tokens
refactor: migrate footer styles
cleanup: remove obsolete theme selectors
```

Éviter de regrouper dans le même commit :

- migration CSS ;
- changement de logique métier ;
- refonte du modèle ;
- correction de bugs non liés.

Avant chaque commit :

```bash
git diff
```

Après le commit :

```bash
git status
git log -1 --oneline
```

---

## 12. Risques connus

### 12.1 Conflit entre Tailwind et CSS historique

Une règle CSS existante peut continuer à prendre le dessus sur une classe Tailwind, notamment en présence de :

- sélecteurs plus spécifiques ;
- `!important` ;
- ordre d’import différent ;
- styles propres à une formule.

Il faut vérifier le style réellement appliqué dans les DevTools du navigateur avant de supprimer une règle.

### 12.2 Régression entre les formules

Une modification du composant partagé affecte potentiellement les trois formules. Toute modification doit donc être testée sur Essentiel, Pro et Signature.

### 12.3 Confusion entre style et fonctionnalité

Une fonctionnalité désactivée par la matrice des plans ne doit pas être réactivée uniquement parce qu’un style a été déplacé.

### 12.4 Migration trop agressive

Le but n’est pas de supprimer tout le CSS. Le but est de réduire la complexité tout en gardant les effets utiles et les identités visuelles propres à chaque formule.

---

## 13. État actuel du chantier

La base de l’architecture hybride est en place :

- tokens de thème créés ;
- configuration centralisée ;
- composant partagé conservé ;
- plusieurs couleurs codées en dur remplacées ;
- styles sociaux adaptés ;
- documentation de l’approche ajoutée.

La migration complète de `themes.css` n’est pas terminée. Les styles structurels doivent encore être déplacés progressivement vers le JSX, puis les règles CSS devenues inutiles doivent être supprimées après vérification.

---

## 14. Ordre recommandé pour continuer

1. Tester l’état actuel sur les trois formules.
2. Migrer `.public-content`.
3. Migrer `.public-section`.
4. Migrer `.link-list` et `.public-link`.
5. Migrer `.public-address`.
6. Migrer `.public-footer`.
7. Supprimer les règles CSS correspondantes devenues inutiles.
8. Tester les trois formules et les différentes tailles d’écran.
9. Continuer avec les boutons, les horaires, les avis et le catalogue.
10. Traiter en dernier la galerie, le formulaire, le hero et les effets spécifiques.
11. Faire un nettoyage final après validation.

---

## 15. Principe à retenir

> Un seul composant partagé, une configuration claire, des tokens centralisés et une migration CSS progressive contrôlée par des tests visuels.

La priorité est la stabilité et la lisibilité du code. Chaque étape doit produire un changement limité, vérifiable et facilement réversible.
