# Passages (scans) — règles de comptage

Un **passage** = un vrai visiteur qui ouvre une fiche **active** via la carte (NFC) ou son QR code.

## Ce qui est compté / ignoré

| Cas | Compté ? | Raison (`reason`) |
|---|---|---|
| Visiteur qui scanne la carte ou le QR | ✅ | — |
| Même visiteur qui recharge / rouvre < 30 min | ❌ | `duplicate` |
| Administrateur connecté (aperçu du studio) | ❌ | `staff` |
| Propriétaire connecté qui regarde sa fiche | ❌ | `owner` |
| Lien avec `?preview=1` (boutons « Prévisualiser », « Fiche publique ») | ❌ | `preview` |
| Ouverture directe `/fiche/<slug>` sans marqueur | ❌ | `missing_source` |
| Robots, aperçus de lien, scripts, requêtes sans User-Agent | ❌ | `bot` |
| Fiche brouillon / suspendue / supprimée | ❌ | `not_active` |
| Plus de 40 tentatives / 10 min depuis une IP sur une fiche | ❌ | `rate_limited` |
| Onglet en arrière-plan / pré-rendu | ⏳ compté à l'affichage | — |
| Copie hors-ligne | ❌ | (aucune requête) |

## Marqueurs de support
- QR : `/fiche/<slug>?s=qr` — puce NFC : `/fiche/<slug>?s=nfc` (affichés dans « Liens & QR »).
- **Seuls** les accès portant `?s=qr` ou `?s=nfc` peuvent être comptés.
- Un accès direct sans marqueur n'est pas un passage. Il peut correspondre à une navigation classique ou à une prévisualisation, mais il ne contribue jamais aux statistiques.
- Le serveur ne déduit pas le support depuis le navigateur : le marqueur indique le canal attendu, sans constituer une preuve cryptographique qu'un QR a réellement été scanné ou qu'une puce NFC a réellement été approchée.

## Stockage
Chaque passage écrit **atomiquement** : un événement (`fiche_scan_events`, clé visiteur hachée), `fiches.scansTotal` et l'agrégat du jour (`fiche_scans`). Un verrou consultatif PostgreSQL par visiteur rend l'anti-doublon exact même avec des requêtes simultanées.

## Audit
`npx tsx scripts/audit-scans.ts` compare total / quotidien / événements et signale les écarts.
`npx tsx scripts/audit-scans.ts --reset <slug> --yes` remet une fiche à zéro (destructif).

## Fenêtre des statistiques
- Les vues « 30 jours » couvrent exactement **30 dates calendaires**, de J-29 à J inclus.
- Le total affiché comme « Total des scans » utilise `fiches.scansTotal` et représente l'historique complet de la fiche.
- Les moyennes et graphiques restent calculés sur la période sélectionnée.

## Limites connues
- Un visiteur qui efface son stockage local, ou change de navigateur, peut être recompté après 30 min.
- Un attaquant qui change d'IP et d'identifiant peut gonfler le compteur ; le plafond par IP limite seulement le rythme.
- Un accès avec un marqueur `?s=qr|nfc` peut être partagé ou saisi manuellement : l'URL seule ne permet pas de prouver un scan physique réel.
