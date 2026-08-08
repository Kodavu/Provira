-- Adds the Skill.category grouping column used by the job-posting category
-- picker. Idempotent — safe to run repeatedly and on databases that already
-- have the column (e.g. production, where the 75-skill catalog was loaded with
-- categories directly).

ALTER TABLE "Skill" ADD COLUMN IF NOT EXISTS "category" TEXT;
