---
doc: EPIC
id: EPIC-14
title: Testing fixtures providers (mode mock-real + vue /models/test)
priority: P1
status: done
stories_total: 5
stories_done: 5
stories_in_progress: 0
progress: 100
last_updated: 2026-05-04
synced_with: [../../EPICS.md, ../../REQUIREMENTS.md, ../../../PROGRESS.md, ../../../CLAUDE.md]
requirements: [FR-061, FR-062, FR-063, FR-064, FR-067, FR-068]
---

# EPIC-14 — Testing fixtures providers

## Objectif

Permettre de **tester chaque modèle en réel une seule fois**, capturer la réponse brute du provider, puis rejouer ces réponses **hors-ligne** sans recoût d'API. Le but : avoir un mode de test fidèle aux vraies réponses providers, sans payer à chaque session de dev.

## Contexte

Actuellement le projet a 2 modes provider :
- **`mock`** : données fictives (PNG placeholder + rawResponse synthétique). Suffit pour le dev UI mais ne reflète pas les vraies réponses.
- **`live`** (implicite via `mockMode=false`) : appels réels API. Coûte de l'argent à chaque clic.

Le besoin : **un 3ᵉ mode `mock-real`** qui rejoue des fixtures capturées une fois en live. Permet de tester les chemins de parsing/affichage avec des vraies réponses, à coût nul.

## Exigences couvertes

- **FR-061** — Mode provider `mock-real` qui rejoue des fixtures capturées
- **FR-062** — Vue `/models/test` pour tester un modèle isolément et capturer sa fixture
- **FR-063** — Configuration runtime du mode provider via dropdown dans Réglages

## Stories

| ID | Titre | Statut |
|---|---|---|
| [STORY-100](STORY-100-mock-real-adapter.md) | Mode provider mock-real + chargement fixture | done |
| [STORY-102](STORY-102-provider-mode-setting.md) | Setting runtime + dropdown Paramètres | done |
| [STORY-101](STORY-101-models-test-view.md) | Vue /models/test + capture fixture | done |
| [STORY-103](STORY-103-disable-models-without-fixture.md) | Désactiver modèles sans fixture en mode mock-real | done |
| [STORY-104](STORY-104-probe-scripts-and-openrouter-refactor.md) | Refonte providers (OpenRouter sortant) + scripts probe CLI | done |

> Ordre d'implémentation : 100 → 102 → 101. La vue test consomme le mode et le setting.

## Critère de fin

- 3 modes provider : `mock`, `mock-real`, `live`. Configurable `.env` + UI.
- Vue `/models/test` permet de tester un modèle (live) avec 3 prompts A/B/C dans une `GenerationCard` réutilisée.
- À chaque succès live depuis cette vue, la fixture est sauvegardée (avec confirmation si écrasement).
- Format fixture : JSON métadonnées + PNG voisin référencé par sha256.
- Tests TDD passants pour l'adapter mock-real et le service fixtureWriter.
- Lint + typecheck + build verts.
