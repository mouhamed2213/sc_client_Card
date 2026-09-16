# Guide rapide — thèmes et Tailwind

## Objectif

Le dossier `templates/` utilise un **template React unique** pour les trois formules : `essentiel`, `pro` et `signature`.

La direction retenue est :

- **Tailwind CSS** : structure, spacing, responsive, typographie et états simples.
- **CSS variables** : couleurs et tokens visuels propres à chaque thème.
- **CSS de thème existant** : conservé temporairement pour les effets et règles spécifiques pendant la migration.

Cette migration est volontairement progressive afin de ne pas casser le rendu actuel.

## Fichiers essentiels

| Fichier | Rôle |
|---|---|
| `base/FicheTemplate.tsx` | Template React unique et rendu des blocs selon la formule. |
| `model.ts` | Types des données consommées par le template. |
| `config.ts` | Association formule → thème + fonctionnalités. |
| `../shared/planFeatures.ts` | Règles fonctionnelles des formules et limites. |
| `theme-tokens.css` | Source centrale des variables visuelles des trois thèmes. |
| `themes.css` | Styles partagés historiques ; à réduire progressivement au profit de Tailwind. |
| `themes/essentiel.css` | Règles spécifiques au rendu Essentiel. |
| `themes/pro.css` | Règles spécifiques au rendu Pro. |
| `themes/signature.css` | Règles spécifiques au rendu Signature. |
| `socials.css` | Styles spécifiques des boutons sociaux ; candidat à une migration Tailwind ultérieure. |
| `README.md` | Architecture métier et principe du template unique. |

## Thèmes

### Essentiel

Positionnement visuel : simple, direct et lisible.

Variables principales : bleu/gris clair, carte blanche, accent bleu.

### Pro

Positionnement visuel : présentation professionnelle avec palette chaude.

Variables principales : crème, brun, bronze et carte ivoire.

### Signature

Positionnement visuel : éditorial/premium.

Variables principales : noir, gris profond, texte ivoire et accent doré.

## Règle importante

Le composant React ne doit pas contenir de couleurs métier comme `#315f91` ou `#c9a46a` lorsque la couleur dépend du thème.

Préférer :

```tsx
className="text-[var(--theme-text)] bg-[var(--theme-card)]"
```

plutôt que :

```tsx
className="text-[#203047] bg-[#ffffff]"
```

Les classes Tailwind peuvent être combinées avec les tokens :

```tsx
className="rounded-xl border border-[var(--theme-line)] bg-[var(--theme-card)] p-4 text-[var(--theme-text)]"
```

## Flux du thème

```text
fiche.formule
     ↓
getTemplateConfig()
     ↓
fiche-template--essentiel / pro / signature
     ↓
variables --theme-*
     ↓
classes Tailwind
```

## Migration progressive

1. Centraliser les tokens dans `theme-tokens.css`.
2. Remplacer les couleurs Tailwind codées en dur par `var(--theme-*)`.
3. Migrer les layouts et espacements de `themes.css` vers Tailwind dans `FicheTemplate.tsx`.
4. Garder uniquement les effets réellement spécifiques dans les CSS de thème.
5. Supprimer progressivement les anciennes règles devenues inutiles.
6. Vérifier le rendu des trois formules après chaque étape.

## À éviter

- Créer un `FicheTemplate` différent pour chaque formule.
- Copier/coller toute la structure HTML pour chaque thème.
- Ajouter de nouvelles couleurs directement dans JSX sans passer par les tokens lorsqu'elles sont liées au thème.
- Ajouter des overrides CSS pour compenser une classe Tailwind arbitraire si une classe sémantique peut être utilisée.
