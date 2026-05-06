---
doc: STORY
id: STORY-123
epic: EPIC-18
title: Composant InfoTooltip réutilisable (icône i + tooltip accessible)
slug: info-tooltip-reutilisable
status: done
priority: P1
requirements: [FR-081]
version: 1.0.0
last_updated: 2026-05-06
synced_with: [_epic.md, ../../../PROGRESS.md, ../../REQUIREMENTS.md]
---

# STORY-123 — InfoTooltip réutilisable

## Analyse

Chaque paramètre du panneau doit afficher un tooltip pédagogique au hover ou au focus de l'icône `i`. La rédaction des tooltips est dans `paramTraits.ts` (STORY-120) — ici on construit le **rendu** générique et accessible.

Composant unique `app/components/ui/InfoTooltip.vue` :
- Props : `text: string`, `placement?: 'top' | 'bottom' | 'right' = 'right'`.
- Rendu : icône `i` 14×14 dans un cercle subtil glassmorphique, hover → tooltip 280px max apparait à côté.
- Accessibilité : `aria-describedby` sur le contrôle parent, ouverture au focus clavier (Tab → focus icône → tooltip s'affiche), fermeture sur Esc / clic extérieur / blur.
- Réutilisable au-delà du panneau de params (n'importe quelle vue peut en bénéficier).

**Risques** :
- Positionnement : le tooltip ne doit pas dépasser de la fenêtre Electron. On gère un fallback simple (top → bottom si pas de place) sans dépendance lourde.
- Si on ajoute Floating UI plus tard, on doit pouvoir migrer sans casser l'API du composant.

**Inconnues** :
- Vérifier si Electron 42 supporte le `popover` natif HTML. Si oui, l'utiliser ; sinon, positionnement CSS classique avec `position: absolute`.

## Critères d'acceptation

| Critère | FR |
|---|---|
| `app/components/ui/InfoTooltip.vue` existe avec props `text: string` et `placement?: 'top' \| 'bottom' \| 'right'` | FR-081 |
| L'icône `i` est rendue dans un cercle 14×14 cohérent avec les tokens du design system (couleur `text-dim`, hover `text-muted`) | FR-081 |
| Le tooltip s'affiche au hover souris ET au focus clavier (Tab) | FR-081 |
| Le tooltip se ferme sur Escape, blur, et clic extérieur | FR-081 |
| Le tooltip est ancré côté `placement` mais bascule automatiquement si la fenêtre est trop petite (au moins fallback top↔bottom) | FR-081 |
| L'icône a `aria-label="Informations sur ce paramètre"` et le tooltip porte un `role="tooltip"` avec `id` lié au contrôle parent via `aria-describedby` | FR-081 |
| Largeur max 280 px, `text-wrap`, fond glassmorphique, ombre légère | FR-081 |
| Test Vue Test Utils : ouverture au focus, fermeture à Esc, contenu correctement injecté | FR-081 |
| Le composant est intégré dans `ParamRow.vue` (STORY-122) à la place du placeholder, en lisant `field.tooltip` | FR-081 |

## Tâches techniques

1. Créer `InfoTooltip.vue` standalone.
2. Test composant : focus → tooltip visible, Esc → caché, contenu = prop `text`.
3. Brancher dans `ParamRow.vue` une fois le composant atomique livré.
4. QA visuelle sur la page `/dev/params` (créée en STORY-122).

## Notes d'implémentation

- Pas de dépendance externe (pas de Floating UI en V1). Simple `position: absolute` + détection basique du débordement.
- Pour la migration future vers Floating UI, garder l'API du composant minimaliste (`text`, `placement`).
- Tooltip = pure information descriptive. **Pas** de boutons d'action, pas de liens cliquables — sinon ce n'est plus un tooltip mais un popover (composant différent, hors scope).
