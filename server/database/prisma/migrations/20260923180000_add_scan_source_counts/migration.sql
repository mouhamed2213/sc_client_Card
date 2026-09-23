-- Add source-specific passage counters while preserving historical totals.
ALTER TABLE "fiche_scans"
  ADD COLUMN "qrCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nfcCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "unclassifiedCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill source counters from the immutable scan-event audit trail.
UPDATE "fiche_scans" AS fs
SET
  "qrCount" = (
    SELECT COUNT(*)
    FROM "fiche_scan_events" AS e
    WHERE e."ficheId" = fs."ficheId"
      AND e."createdAt" >= fs."scanDate"::date
      AND e."createdAt" < fs."scanDate"::date + INTERVAL '1 day'
      AND e."source" = 'qr'
  ),
  "nfcCount" = (
    SELECT COUNT(*)
    FROM "fiche_scan_events" AS e
    WHERE e."ficheId" = fs."ficheId"
      AND e."createdAt" >= fs."scanDate"::date
      AND e."createdAt" < fs."scanDate"::date + INTERVAL '1 day'
      AND e."source" = 'nfc'
  );

-- Any historical aggregate not attributable to QR/NFC remains explicitly
-- unclassified instead of being silently assigned to one source.
UPDATE "fiche_scans"
SET "unclassifiedCount" = GREATEST("count" - "qrCount" - "nfcCount", 0);
