-- Migration: add preferences.language_variant
--
-- Adds the per-profile British/American English toggle introduced for
-- task #15. The column is nullable-safe via the DEFAULT, so existing
-- rows backfill to 'en-GB' (the product default) without a separate
-- UPDATE statement. Drizzle-kit `push` applies the equivalent change
-- in dev; this file documents the production migration path so
-- deployments without `push` access (or with row-level safety
-- requirements) can apply it manually.

ALTER TABLE "preferences"
  ADD COLUMN IF NOT EXISTS "language_variant" text NOT NULL DEFAULT 'en-GB';

-- Defensive backfill in case the column existed without a default
-- (e.g. a partially-applied earlier attempt).
UPDATE "preferences"
  SET "language_variant" = 'en-GB'
  WHERE "language_variant" IS NULL;
