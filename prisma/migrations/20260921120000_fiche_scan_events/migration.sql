-- CreateTable
CREATE TABLE "fiche_scan_events" (
    "id" SERIAL NOT NULL,
    "ficheId" INTEGER NOT NULL,
    "visitorKey" VARCHAR(64) NOT NULL,
    "source" VARCHAR(16) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiche_scan_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fiche_scan_events_ficheId_visitorKey_createdAt_idx" ON "fiche_scan_events"("ficheId", "visitorKey", "createdAt");

-- CreateIndex
CREATE INDEX "fiche_scan_events_ficheId_createdAt_idx" ON "fiche_scan_events"("ficheId", "createdAt");

-- AddForeignKey
ALTER TABLE "fiche_scan_events" ADD CONSTRAINT "fiche_scan_events_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "fiches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
