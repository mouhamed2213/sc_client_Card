/**
 * Passages audit: compares, for every fiche, the three places a passage is
 * stored — the `scansTotal` counter, the daily aggregates (`fiche_scans`) and
 * the event log (`fiche_scan_events`) — and reports any drift.
 *
 *   npx tsx scripts/audit-scans.ts            # report only
 *   npx tsx scripts/audit-scans.ts --reset <slug> --yes   # zero one fiche
 *
 * "legacy" = passages counted before the event log existed (they cannot be
 * verified: admin previews and reloads may be mixed in).
 */
import { prisma } from "../server/database/prisma-client";

async function main() {
  const args = process.argv.slice(2);
  const resetIndex = args.indexOf("--reset");
  if (resetIndex >= 0) {
    const slug = args[resetIndex + 1];
    if (!slug || !args.includes("--yes")) {
      console.error(
        "Usage: --reset <slug> --yes (destructive: zeroes total, daily aggregates and events)"
      );
      process.exit(1);
    }
    const fiche = await prisma.fiche.findUnique({ where: { slug } });
    if (!fiche) {
      console.error(`Fiche introuvable: ${slug}`);
      process.exit(1);
    }
    await prisma.$transaction([
      prisma.ficheScanEvent.deleteMany({ where: { ficheId: fiche.id } }),
      prisma.ficheScan.deleteMany({ where: { ficheId: fiche.id } }),
      prisma.fiche.update({
        where: { id: fiche.id },
        data: { scansTotal: 0, lastScanAt: null },
      }),
    ]);
    console.log(
      `Passages remis à zéro pour ${slug} (était ${fiche.scansTotal}).`
    );
    return;
  }

  const fiches = await prisma.fiche.findMany({
    select: { id: true, slug: true, statut: true, scansTotal: true },
    orderBy: { id: "asc" },
  });
  const daily = await prisma.ficheScan.groupBy({
    by: ["ficheId"],
    _sum: { count: true },
  });
  const events = await prisma.ficheScanEvent.groupBy({
    by: ["ficheId", "source"],
    _count: { _all: true },
  });
  const dailyByFiche = new Map(
    daily.map((row : any) => [row.ficheId, row._sum.count ?? 0])
  );
  const eventsByFiche = new Map<
    number,
    { total: number; qr: number; nfc: number; direct: number }
  >();
  for (const row of events) {
    const entry = eventsByFiche.get(row.ficheId) ?? {
      total: 0,
      qr: 0,
      nfc: 0,
      direct: 0,
    };
    entry.total += row._count._all;
    if (row.source === "qr" || row.source === "nfc" || row.source === "direct")
      entry[row.source] += row._count._all;
    eventsByFiche.set(row.ficheId, entry);
  }

  let drift = 0;
  console.log(
    "slug".padEnd(34),
    "statut".padEnd(10),
    "total",
    "quotidien",
    "événements",
    "qr/nfc/direct",
    "legacy"
  );
  for (const fiche of fiches) {
    const day = dailyByFiche.get(fiche.id) ?? 0;
    const ev = eventsByFiche.get(fiche.id) ?? {
      total: 0,
      qr: 0,
      nfc: 0,
      direct: 0,
    };
    const legacy = Math.max(0, fiche.scansTotal - ev.total);
    const consistent = fiche.scansTotal === day && day >= ev.total;
    if (!consistent) drift++;
    console.log(
      fiche.slug.padEnd(34),
      fiche.statut.padEnd(10),
      String(fiche.scansTotal).padStart(5),
      String(day).padStart(9),
      String(ev.total).padStart(10),
      `${ev.qr}/${ev.nfc}/${ev.direct}`.padStart(13),
      String(legacy).padStart(6),
      consistent ? "" : "  ⚠ écart total/quotidien"
    );
  }
  console.log(
    drift ? `\n${drift} fiche(s) avec un écart.` : "\nCompteurs cohérents."
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
