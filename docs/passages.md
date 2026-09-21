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
| Robots, aperçus de lien, scripts, requêtes sans User-Agent | ❌ | `bot` |
| Fiche brouillon / suspendue / supprimée | ❌ | `not_active` |
| Plus de 40 tentatives / 10 min depuis une IP sur une fiche | ❌ | `rate_limited` |
| Onglet en arrière-plan / pré-rendu | ⏳ compté à l'affichage | — |
| Copie hors-ligne | ❌ | (aucune requête) |

## Marqueurs de support
- QR : `/fiche/<slug>?s=qr` — puce NFC : `/fiche/<slug>?s=nfc` (affichés dans « Liens & QR »).
- Les cartes déjà imprimées (`/fiche/<slug>` sans marqueur) restent comptées (source `direct`).
- Quand toutes les cartes portent un marqueur : `SCAN_REQUIRE_SOURCE=true` → seuls `?s=qr|nfc` comptent.

## Stockage
Chaque passage écrit **atomiquement** : un événement (`fiche_scan_events`, clé visiteur hachée), `fiches.scansTotal` et l'agrégat du jour (`fiche_scans`). Un verrou consultatif PostgreSQL par visiteur rend l'anti-doublon exact même avec des requêtes simultanées.

## Audit
`npx tsx scripts/audit-scans.ts` compare total / quotidien / événements et signale les écarts.
`npx tsx scripts/audit-scans.ts --reset <slug> --yes` remet une fiche à zéro (destructif).

## Limites connues
- Un visiteur qui efface son stockage local, ou change de navigateur, peut être recompté après 30 min.
- Un attaquant qui change d'IP et d'identifiant peut gonfler le compteur ; le plafond par IP limite seulement le rythme.
- Les passages antérieurs à l'historique d'événements (« legacy ») ne sont pas vérifiables.
