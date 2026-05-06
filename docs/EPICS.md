---
doc: EPICS_INDEX
version: 2.2.0
last_updated: 2026-05-06
synced_with: [../CLAUDE.md, PRD.md, REQUIREMENTS.md, ARCHITECTURE.md, ../PROGRESS.md, epics/]
---

# Index des épiques — SeedComparator V1

Index synthétique des épiques. Détail dans `epics/EPIC-X-slug/_epic.md`.

## Structure

```
docs/epics/
├── EPIC-1-fondations-techniques/
│   ├── _epic.md
│   ├── STORY-001-scaffolding.md
│   ├── STORY-002-postgres-prisma.md
│   └── STORY-003-seed-models.md
├── EPIC-2-config-securite-cles-api/
│   ├── _epic.md
│   ├── STORY-010-safestorage-ipc.md
│   ├── STORY-011-endpoint-keys.md
│   ├── STORY-012-test-cle-api.md (proposed)
│   ├── STORY-013-models-disabled-without-key.md
│   ├── STORY-014-ui-seuil-cout.md (proposed)
│   └── STORY-015-check-secrets.md
├── EPIC-3-adapters-providers/
│   ├── _epic.md
│   ├── STORY-020-interface-registry.md
│   ├── STORY-021-022-openrouter.md
│   └── STORY-023-024-fal.md
├── EPIC-4-generation-batch/
│   ├── _epic.md
│   ├── STORY-030-cost-estimator.md
│   ├── STORY-031-batch-orchestrator.md
│   ├── STORY-032-endpoint-generate.md
│   └── STORY-033-persistance-auto.md
├── EPIC-5-ui-exploration/
│   ├── _epic.md
│   ├── STORY-040-prompt-inputs.md
│   ├── STORY-041-model-selector.md
│   ├── STORY-042-cost-meter.md
│   ├── STORY-043-generation-card.md
│   ├── STORY-044-generation-grid.md
│   ├── STORY-045-page-index-streaming.md
│   ├── STORY-046-modal-estimate.md
│   ├── STORY-047-stop-button.md
│   └── STORY-048-lightbox.md
├── EPIC-6-vue-approfondie/
│   ├── _epic.md
│   ├── STORY-050-page-detail.md
│   └── STORY-051-relance-modele.md (proposed)
├── EPIC-7-sauvegarde-galerie/
│   ├── _epic.md
│   ├── STORY-060-image-cache.md
│   ├── STORY-061-save-image.md
│   ├── STORY-062-save-session.md
│   ├── STORY-063-galerie.md
│   └── STORY-064-reouverture-session.md
├── EPIC-8-activation-modeles/
│   ├── _epic.md
│   ├── STORY-070-ui-toggle-models.md
│   └── STORY-071-endpoint-toggle.md
└── EPIC-9-refonte-ux-exploration/
    ├── _epic.md
    ├── STORY-080-sidepanel-tabs-collapse.md
    ├── STORY-081-prompts-top-tabs.md
    ├── STORY-082-cards-idle-quality-nbimages.md
    ├── STORY-083-flex-view-switch-prompt.md
    ├── STORY-084-spacing-tokens.md
    ├── STORY-085-brand-classification.md
    ├── STORY-086-gateway-ui.md
    ├── STORY-087-brand-grouping-grid-flex.md
    ├── STORY-088-app-shell-collapse-spacing.md
    ├── STORY-089-ui-fixes-and-polish.md
    ├── STORY-091-prompt-switcher-universal.md
    └── STORY-094-budget-slider.md
├── EPIC-10-imagen-google-ai/
│   ├── _epic.md
│   └── STORY-090-google-ai-adapter.md
├── EPIC-11-brief-assistant/
│   ├── _epic.md
│   ├── STORY-092-brief-assistant.md
│   └── STORY-093-prefixes-and-completion.md
├── EPIC-12-openai-direct/
│   ├── _epic.md
│   └── STORY-095-openai-adapter.md
├── EPIC-13-sessions-and-likes/
│   ├── _epic.md
│   ├── STORY-096-sessions-persistantes.md
│   ├── STORY-097-likes-and-save.md
│   └── STORY-098-galerie-filtree.md
├── EPIC-14-testing-fixtures-providers/
│   ├── _epic.md
│   ├── STORY-100-mock-real-adapter.md
│   ├── STORY-101-models-test-view.md
│   ├── STORY-102-provider-mode-setting.md
│   ├── STORY-103-disable-models-without-fixture.md
│   └── STORY-104-probe-scripts-and-openrouter-refactor.md
├── EPIC-15-phasage-workflow-generation/
│   ├── _epic.md
│   ├── STORY-105-selecteur-phase-9-prompts.md
│   ├── STORY-106-cycle-vie-memoire-vive-db.md
│   ├── STORY-107-historique-enrichi-filtres-phase.md
│   └── STORY-112-vocabulaire-v1-2-prompt-morphing.md
├── EPIC-16-assistant-creatif-llm/
│   ├── _epic.md
│   ├── STORY-108-adapter-gemini-text-route-helper.md
│   └── STORY-109-modale-chatbot-insertion-prompts.md
├── EPIC-17-splitpane-layout/
│   ├── _epic.md
│   ├── STORY-110-splitpane-composable-component.md
│   └── STORY-111-auto-collapse-generation.md
└── EPIC-18-parametres-avances-par-modele/
    ├── _epic.md
    ├── STORY-120-catalogue-traits-profils-modeles.md
    ├── STORY-121-adapters-consommation-params.md
    ├── STORY-122-composants-vue-atomiques.md
    ├── STORY-123-info-tooltip-reutilisable.md
    ├── STORY-124-panneau-global-modelparamspopover.md
    ├── STORY-125-estimation-cout-reactive.md
    ├── STORY-126-persistance-generation-params.md
    ├── STORY-127-documentation-fr.md
    └── STORY-128-ui-per-generation-seed-relance.md
```

## Épiques V1 — état réel

| ID | Titre | Priorité | Stories | Statut | Avancement |
|---|---|---|---|---|---|
| [EPIC-1](epics/EPIC-1-fondations-techniques/_epic.md) | Fondations techniques | P0 | 3/3 | done | 100% |
| [EPIC-2](epics/EPIC-2-config-securite-cles-api/_epic.md) | Configuration & sécurité clés API | P0 | 4/6 | in_progress | 67% |
| [EPIC-3](epics/EPIC-3-adapters-providers/_epic.md) | Adapters providers | P0 | 5/5 | done | 100% |
| [EPIC-4](epics/EPIC-4-generation-batch/_epic.md) | Génération & batch | P0 | 4/4 | done | 100% |
| [EPIC-5](epics/EPIC-5-ui-exploration/_epic.md) | UI exploration | P0 | 9/9 | done | 100% |
| [EPIC-6](epics/EPIC-6-vue-approfondie/_epic.md) | Vue approfondie | P0 | 1/2 | in_progress | 50% |
| [EPIC-7](epics/EPIC-7-sauvegarde-galerie/_epic.md) | Sauvegarde & galerie | P0 | 5/5 | done | 100% |
| [EPIC-8](epics/EPIC-8-activation-modeles/_epic.md) | Activation modèles | P1 | 2/2 | done | 100% |
| [EPIC-9](epics/EPIC-9-refonte-ux-exploration/_epic.md) | Refonte UX exploration | P1 | 12/12 | done | 100% |
| [EPIC-10](epics/EPIC-10-imagen-google-ai/_epic.md) | Imagen via Google AI Studio | P1 | 1/1 | done | 100% |
| [EPIC-11](epics/EPIC-11-brief-assistant/_epic.md) | Brief Assistant — page Accueil | P1 | 2/2 | done | 100% |
| [EPIC-12](epics/EPIC-12-openai-direct/_epic.md) | OpenAI direct (gateway openai + 5 modèles) | P1 | 1/1 | done | 100% |
| [EPIC-13](epics/EPIC-13-sessions-and-likes/_epic.md) | Sessions persistantes + likes + galerie filtrée | P1 | 4/4 | done | 100% |
| [EPIC-14](epics/EPIC-14-testing-fixtures-providers/_epic.md) | Testing fixtures providers (mock-real + /models/test + filtrage + probe CLI) | P1 | 5/5 | done | 100% |
| [EPIC-15](epics/EPIC-15-phasage-workflow-generation/_epic.md) | Phasage workflow génération (Wireframe / Mood / UI-UX Design) | P1 | 1/4 | in_progress | 25% |
| [EPIC-16](epics/EPIC-16-assistant-creatif-llm/_epic.md) | Assistant créatif LLM (chatbot Gemini par phase) | P2 | 0/2 | proposed | 0% |
| [EPIC-17](epics/EPIC-17-splitpane-layout/_epic.md) | Split-pane layout (zone prompts / zone générations) | P1 | 0/2 | in_progress | 0% |
| [EPIC-18](epics/EPIC-18-parametres-avances-par-modele/_epic.md) | Paramètres avancés mutualisés par modèle (UI playground-grade) | P1 | 9/9 | done | 100% |

**Total : 70 stories done / 78 prévues = 90%.** 3 stories backlog post-V1 (STORY-012, STORY-014, STORY-051) + 8 stories EPIC-15/16/17 (1 done : STORY-112 ; 7 proposed/in_progress) + EPIC-18 livré intégralement.

## Sprint futur — Édition d'image (post-V1)

Pas d'épique formalisé. Voir `ARCHITECTURE.md` §9 pour la roadmap.
