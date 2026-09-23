-- Mark the first fiche owned by each client account as the primary fiche.
ALTER TABLE "fiches"
ADD COLUMN "isMain" BOOLEAN NOT NULL DEFAULT false;

-- Existing accounts did not have an explicit primary marker. Use the oldest
-- currently owned fiche as the safest deterministic backfill.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "ownerId"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "fiches"
  WHERE "ownerId" IS NOT NULL
)
UPDATE "fiches"
SET "isMain" = true
WHERE id IN (
  SELECT id
  FROM ranked
  WHERE rn = 1
);

-- At most one primary fiche may exist for a client account.
CREATE UNIQUE INDEX "fiches_one_main_per_owner"
ON "fiches" ("ownerId")
WHERE "isMain" = true AND "ownerId" IS NOT NULL;
