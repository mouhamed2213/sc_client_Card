import { useState } from "react";
import { useParams } from "wouter";
import { BarChart3, ScanLine } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientStats() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const id = Number(ficheId);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const fiche = trpc.clientSpaceRouter.ficheDetail.useQuery({ ficheId: id });
  const scans = trpc.clientSpaceRouter.scans.useQuery({ ficheId: id, days });
  const total = scans.data?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const max = Math.max(...(scans.data?.map(item => item.count) ?? [1]), 1);

  return <ClientLayout ficheId={id}><div className="space-y-6 p-4 sm:p-6 lg:p-8">
    <div><p className="text-sm text-slate-500">{fiche.data?.entreprise}</p><h1 className="text-2xl font-semibold">Statistiques</h1><p className="mt-1 text-sm text-slate-500">Suivez les scans de votre fiche publique.</p></div>
    <div className="flex flex-wrap gap-2">{([7,30,90] as const).map(value => <button key={value} onClick={() => setDays(value)} className={`rounded-lg px-4 py-2 text-sm font-medium ${days === value ? "bg-slate-900 text-white" : "border bg-white text-slate-600 hover:bg-slate-50"}`}>{value} jours</button>)}</div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ScanLine size={18}/> Scans — {days} jours</CardTitle></CardHeader><CardContent><p className="text-4xl font-semibold">{total}</p><p className="text-sm text-slate-500">scans enregistrés</p></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 size={18}/> Évolution quotidienne</CardTitle></CardHeader><CardContent>{scans.isLoading ? <p className="py-8 text-sm text-slate-500">Chargement…</p> : !scans.data?.length ? <p className="py-8 text-sm text-slate-500">Aucun scan sur cette période.</p> : <div className="flex h-64 items-end gap-1 overflow-x-auto border-b pb-2">{scans.data.map(item => <div key={item.scanDate} className="group flex h-full min-w-6 flex-1 flex-col justify-end" title={`${item.scanDate}: ${item.count}`}><div className="rounded-t bg-slate-800 transition group-hover:bg-slate-600" style={{ height: `${Math.max((item.count / max) * 90, 4)}%` }} /><span className="mt-2 truncate text-center text-[10px] text-slate-400">{item.scanDate.slice(5)}</span></div>)}</div>}</CardContent></Card>
  </div></ClientLayout>;
}
