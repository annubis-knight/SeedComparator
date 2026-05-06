-- STORY-126 / EPIC-18 — Persistance des paramètres figés par génération.
-- Nullable pour rétrocompat avec les générations antérieures.
ALTER TABLE "Generation" ADD COLUMN "params" JSONB;
