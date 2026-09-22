-- Merge the former Commerce formula into Signature.
-- Existing Commerce fiches are preserved as Signature fiches.

CREATE TYPE "Formule_new" AS ENUM ('essentiel', 'pro', 'signature');

ALTER TABLE "fiches"
  ALTER COLUMN "formule" TYPE "Formule_new"
  USING (
    CASE
      WHEN "formule"::text = 'commerce' THEN 'signature'::"Formule_new"
      ELSE "formule"::text::"Formule_new"
    END
  );

DROP TYPE "Formule";
ALTER TYPE "Formule_new" RENAME TO "Formule";
