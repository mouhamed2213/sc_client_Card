-- Organization / membership / explicit fiche access foundation.
-- Existing ownerId is intentionally retained for the transition.

CREATE TYPE "OrganizationType" AS ENUM ('PERSONAL', 'BUSINESS');
CREATE TYPE "OrganizationMembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');
CREATE TYPE "InvitationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

CREATE TABLE "organizations" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(180) NOT NULL,
  "type" "OrganizationType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organization_memberships" (
  "id" SERIAL NOT NULL,
  "organizationId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "role" "OrganizationMembershipRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_memberships_organizationId_userId_key"
  ON "organization_memberships"("organizationId", "userId");
CREATE INDEX "organization_memberships_userId_idx"
  ON "organization_memberships"("userId");

CREATE TABLE "fiche_access" (
  "id" SERIAL NOT NULL,
  "ficheId" INTEGER NOT NULL,
  "membershipId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fiche_access_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fiche_access_ficheId_membershipId_key"
  ON "fiche_access"("ficheId", "membershipId");
CREATE INDEX "fiche_access_membershipId_idx"
  ON "fiche_access"("membershipId");

ALTER TABLE "fiches" ADD COLUMN "organizationId" INTEGER;
CREATE INDEX "fiches_organizationId_idx" ON "fiches"("organizationId");

ALTER TABLE "InvitationClient" DROP CONSTRAINT IF EXISTS "InvitationClient_ficheId_fkey";
ALTER TABLE "InvitationClient" ALTER COLUMN "ficheId" DROP NOT NULL;
ALTER TABLE "InvitationClient" ADD COLUMN "organizationId" INTEGER;
ALTER TABLE "InvitationClient" ADD COLUMN "role" "InvitationRole" NOT NULL DEFAULT 'MEMBER';
ALTER TABLE "InvitationClient" ADD COLUMN "invitedUserId" INTEGER;
ALTER TABLE "InvitationClient" ADD COLUMN "acceptedAt" TIMESTAMP(3);

CREATE INDEX "InvitationClient_organizationId_idx" ON "InvitationClient"("organizationId");
CREATE INDEX "InvitationClient_invitedUserId_idx" ON "InvitationClient"("invitedUserId");

-- Transitional migration:
-- For every existing client user owning one or more fiches, create one PERSONAL
-- organization and an OWNER membership. No organization is inferred from
-- Fiche.entreprise.
CREATE TEMP TABLE "_personal_org_map" (
  "userId" INTEGER NOT NULL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL
);

INSERT INTO "organizations" ("name", "type")
SELECT 'Compte personnel #' || u."id", 'PERSONAL'::"OrganizationType"
FROM "users" u
WHERE EXISTS (
  SELECT 1 FROM "fiches" f WHERE f."ownerId" = u."id"
);

INSERT INTO "_personal_org_map" ("userId", "organizationId")
SELECT u."id", o."id"
FROM "users" u
JOIN "organizations" o
  ON o."name" = 'Compte personnel #' || u."id"
 AND o."type" = 'PERSONAL'::"OrganizationType"
WHERE EXISTS (
  SELECT 1 FROM "fiches" f WHERE f."ownerId" = u."id"
);

INSERT INTO "organization_memberships"
  ("organizationId", "userId", "role")
SELECT "organizationId", "userId", 'OWNER'::"OrganizationMembershipRole"
FROM "_personal_org_map";

UPDATE "fiches" f
SET "organizationId" = m."organizationId"
FROM "_personal_org_map" m
WHERE f."ownerId" = m."userId";

UPDATE "InvitationClient" i
SET "organizationId" = f."organizationId",
    "role" = 'OWNER'::"InvitationRole"
FROM "fiches" f
WHERE i."ficheId" = f."id";

DROP TABLE "_personal_org_map";

ALTER TABLE "organization_memberships"
  ADD CONSTRAINT "organization_memberships_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_memberships"
  ADD CONSTRAINT "organization_memberships_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fiche_access"
  ADD CONSTRAINT "fiche_access_ficheId_fkey"
  FOREIGN KEY ("ficheId") REFERENCES "fiches"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fiche_access"
  ADD CONSTRAINT "fiche_access_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "organization_memberships"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fiches"
  ADD CONSTRAINT "fiches_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InvitationClient"
  ADD CONSTRAINT "InvitationClient_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvitationClient"
  ADD CONSTRAINT "InvitationClient_ficheId_fkey"
  FOREIGN KEY ("ficheId") REFERENCES "fiches"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvitationClient"
  ADD CONSTRAINT "InvitationClient_invitedUserId_fkey"
  FOREIGN KEY ("invitedUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
