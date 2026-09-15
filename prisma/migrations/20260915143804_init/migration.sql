-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "Formule" AS ENUM ('essentiel', 'pro', 'signature', 'commerce');

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('active', 'suspendue', 'supprimee', 'brouillon');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "openId" VARCHAR(64) NOT NULL,
    "name" TEXT,
    "email" VARCHAR(320),
    "loginMethod" VARCHAR(64),
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSignedIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiches" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "formule" "Formule" NOT NULL,
    "statut" "Statut" NOT NULL DEFAULT 'brouillon',
    "nom" VARCHAR(120) NOT NULL,
    "prenom" VARCHAR(120) NOT NULL,
    "fonction" VARCHAR(160) NOT NULL,
    "entreprise" VARCHAR(180) NOT NULL,
    "photo" TEXT,
    "logo" TEXT,
    "telephone" VARCHAR(32) NOT NULL,
    "whatsapp" VARCHAR(32) NOT NULL,
    "email" VARCHAR(320),
    "site" TEXT,
    "adresse" TEXT,
    "lienItineraire" TEXT,
    "googlePlaceId" VARCHAR(180),
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "dataJson" TEXT NOT NULL,
    "scansTotal" INTEGER NOT NULL DEFAULT 0,
    "lastScanAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiche_scans" (
    "id" SERIAL NOT NULL,
    "ficheId" INTEGER NOT NULL,
    "scanDate" VARCHAR(10) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiche_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" SERIAL NOT NULL,
    "ficheId" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_openId_key" ON "users"("openId");

-- CreateIndex
CREATE UNIQUE INDEX "fiches_slug_key" ON "fiches"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "fiche_scans_ficheId_scanDate_key" ON "fiche_scans"("ficheId", "scanDate");

-- CreateIndex
CREATE INDEX "contact_requests_ficheId_createdAt_idx" ON "contact_requests"("ficheId", "createdAt");

-- AddForeignKey
ALTER TABLE "fiche_scans" ADD CONSTRAINT "fiche_scans_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "fiches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "fiches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
