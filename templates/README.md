# Templates de fiches

Ce dossier contient le gabarit commun et le modèle de rendu des fiches clients.

## Principe

Une seule structure HTML est maintenue pour les fiches. La `formule` détermine les fonctionnalités autorisées et le thème visuel appliqué au gabarit.

Formules supportées :

- `essentiel`
- `pro`
- `signature`

`commerce` n'est plus une formule distincte : ses besoins sont intégrés à `signature`.

Le template ne doit pas dupliquer la structure HTML par formule. Les différences doivent être exprimées par des blocs conditionnels et des variantes CSS/thème.

## Modèle conceptuel

```text
Client data
   ↓
formule
   ↓
plan features / règles
   ↓
template unique
   ↓
thème + blocs autorisés
   ↓
fichier de fiche rendu
```

Le PDF de référence décrit une progression ESSENTIELLE → PRO → SIGNATURE : chaque gamme reprend les éléments de la précédente, avec des ajouts progressifs. La SIGNATURE ajoute notamment le design exclusif et le traitement prioritaire.

Le contenu métier doit rester séparé de la présentation : les données client décrivent la fiche, tandis que le template décide comment les afficher.