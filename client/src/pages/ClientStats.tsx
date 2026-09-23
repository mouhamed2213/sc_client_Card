import { useState } from "react";
import { useParams } from "wouter";
import { BarChart3, ScanLine } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import ScanChart from "@/components/client-space/ScanChart";
import { PremiumUpgradeModal } from "@/components/PremiumFeature";

const RANGES = [
  { value: 7 as const, label: "7 jours" },
  { value: 30 as const, label: "30 jours" },
  { value: 90 as const, label: "90 jours" },
];

export default function ClientStats() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const id = Number(ficheId);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const fiche = trpc.clientSpaceRouter.ficheDetail.useQuery({ ficheId: id });
  const isSignature = fiche.data?.formule === "signature";
  const scans = trpc.clientSpaceRouter.scans.useQuery(
    { ficheId: id, days },
    { enabled: isSignature }
  );

  const periodTotal = scans.data?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const lifetimeTotal = fiche.data?.scansTotal ?? 0;
  const daysCount = scans.data?.length || days;
  const average = daysCount ? Math.round((periodTotal / daysCount) * 10) / 10 : 0;
  const best = scans.data?.reduce(
    (top, item) => (item.count > (top?.count ?? -1) ? item : top),
    undefined as NonNullable<typeof scans.data>[number] | undefined
  );

  return (
    <ClientLayout ficheId={id}>
      {fiche.data && !isSignature && (
        <PremiumUpgradeModal
          feature="Statistiques"
          requiredPlan="signature"
          open
          onClose={() => window.history.back()}
        />
      )}
      <div className={"space-y-6 p-4 sm:p-6 lg:p-8 " + (isSignature ? "" : "hidden")}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-xl font-semibold text-[#172033]">Statistiques</h1>
            <p className="mt-1 text-sm text-[#7d8798]">
              Suivez les scans de votre fiche publique dans le temps.
            </p>
          </div>
          <div className="flex gap-1.5 rounded-lg border border-[#e6e8ec] bg-white p-1">
            {RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setDays(range.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  days === range.value
                    ? "bg-[#172033] text-white"
                    : "text-[#52607a] hover:bg-[#f4f5f7]"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="client-kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="kpi-tile">
            <ScanLine size={17} className="text-[#7d8798]" />
            <p className="kpi-tile-value">{lifetimeTotal}</p>
            <p className="kpi-tile-label">Total des scans</p>
          </div>
          <div className="kpi-tile">
            <BarChart3 size={17} className="text-[#7d8798]" />
            <p className="kpi-tile-value">{average}</p>
            <p className="kpi-tile-label">Moyenne par jour</p>
          </div>
          <div className="kpi-tile">
            <ScanLine size={17} className="text-[#7d8798]" />
            <p className="kpi-tile-value">{best?.count ?? 0}</p>
            <p className="kpi-tile-label">
              Meilleur jour
              {best ? ` · ${best.scanDate.slice(5).split("-").reverse().join("/")}` : ""}
            </p>
          </div>
        </div>

        <div className="panel">
          <p className="panel-title">Évolution quotidienne</p>
          <p className="panel-sub">{RANGES.find(r => r.value === days)?.label}</p>
          <div className="mt-4">
            {scans.isLoading ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-[#7d8798]">
                Chargement…
              </div>
            ) : (
              <ScanChart data={scans.data ?? []} height={260} />
            )}
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
