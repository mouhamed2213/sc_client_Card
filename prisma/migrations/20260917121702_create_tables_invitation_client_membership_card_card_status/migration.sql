-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('active', 'perdue', 'revoquee');

-- AlterTable
ALTER TABLE "fiches" ADD COLUMN     "ownerId" INTEGER;

-- CreateTable
CREATE TABLE "InvitationClient" (
    "id" SERIAL NOT NULL,
    "ficheId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "utilisee" BOOLEAN NOT NULL DEFAULT false,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipCard" (
    "id" SERIAL NOT NULL,
    "ficheId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "statut" "CardStatus" NOT NULL DEFAULT 'active',
    "dateActivation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitationClient_token_key" ON "InvitationClient"("token");

-- CreateIndex
CREATE INDEX "InvitationClient_ficheId_idx" ON "InvitationClient"("ficheId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipCard_numero_key" ON "MembershipCard"("numero");

-- CreateIndex
CREATE INDEX "MembershipCard_ficheId_idx" ON "MembershipCard"("ficheId");

-- AddForeignKey
ALTER TABLE "fiches" ADD CONSTRAINT "fiches_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitationClient" ADD CONSTRAINT "InvitationClient_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "fiches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipCard" ADD CONSTRAINT "MembershipCard_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "fiches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
