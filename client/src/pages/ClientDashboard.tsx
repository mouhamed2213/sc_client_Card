import { useLocation } from "wouter";
import { BarChart3, CreditCard, ExternalLink, MessageSquare, ScanLine } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ClientDashboard() {
  const [, navigate] = useLocation();
  const fiches = trpc.client.myFiches.useQuery();
  const ficheId = fiches.data?.length === 1 ? fiches.data[0].id : undefined;
  const dashboard = trpc.client.dashboard.useQuery({ ficheId: ficheId! }, { enabled: !!ficheId });
  if (fiches.isLoading) return <div className="p-6 text-sm text-slate-500">Chargement de votre espace…</div>;
  if (!fiches.data?.length) return <ClientLayout><div className="mx-auto max-w-2xl p-6"><Card><CardContent className="py-12 text-center"><h1 className="text-xl font-semibold">Aucune fiche associée</h1><p className="mt-2 text-sm text-slate-500">Votre compte client n'est pas encore rattaché à une fiche.</p></CardContent></Card></div></ClientLayout>;
  if (fiches.data.length > 1) return <ClientLayout><div className="space-y-5 p-4 sm:p-6 lg:p-8"><h1 className="text-2xl font-semibold">Vos fiches</h1>{fiches.data.map(fiche => <button key={fiche.id} onClick={() => navigate(`/espace-client/fiche/${fiche.id}`)} className="block w-full rounded-xl border bg-white p-5 text-left shadow-sm hover:border-slate-400"><p className="font-semibold">{fiche.prenom} {fiche.nom}</p><p className="text-sm text-slate-500">{fiche.entreprise} · {fiche.formule}</p></button>)}</div></ClientLayout>;
  if (dashboard.isLoading) return <div className="p-6 text-sm text-slate-500">Chargement de votre tableau de bord…</div>;
  const data = dashboard.data;
  const fiche = data?.fiche;
  if (!fiche) return <div className="p-6 text-sm text-red-600">Impossible de charger votre fiche.</div>;
  const scans = data.scans.reduce((sum, item) => sum + item.count, 0);
  return <ClientLayout ficheId={ficheId}><div className="space-y-6 p-4 sm:p-6 lg:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-sm text-slate-500">Bienvenue dans votre espace client</p><h1 className="mt-1 text-2xl font-semibold">{fiche.prenom} {fiche.nom}</h1><p className="text-slate-500">{fiche.entreprise}</p></div><div className="flex flex-wrap gap-2"><Badge>{fiche.formule}</Badge><Badge variant="secondary">{fiche.statut}</Badge><a href={`/fiche/${fiche.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"><ExternalLink size={15}/> Fiche publique</a></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={ScanLine} label="Scans · 30 jours" value={scans}/><Stat icon={MessageSquare} label="Demandes reçues" value={data.requestCount}/><Stat icon={CreditCard} label="Cartes membres" value={data.cardCount}/><Stat icon={BarChart3} label="Échéance" value={new Date(fiche.dateEcheance).toLocaleDateString("fr-FR")} small/></div><div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Dernières demandes</CardTitle></CardHeader><CardContent className="space-y-4">{!data.recentRequests.length ? <p className="text-sm text-slate-500">Aucune demande reçue.</p> : data.recentRequests.map(req => <div key={req.id} className="border-b pb-4 last:border-0 last:pb-0"><p className="font-medium">{req.name}</p><p className="mt-1 line-clamp-2 text-sm text-slate-500">{req.message}</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Dernières cartes</CardTitle></CardHeader><CardContent className="space-y-3">{!data.recentCards.length ? <p className="text-sm text-slate-500">Aucune carte enregistrée.</p> : data.recentCards.map(card => <div key={card.id} className="flex items-center justify-between border-b pb-3 last:border-0"><span className="font-mono text-sm">{card.numero}</span><Badge variant={card.statut === "active" ? "default" : "secondary"}>{card.statut}</Badge></div>)}</CardContent></Card></div></div></ClientLayout>;
}
function Stat({ icon: Icon, label, value, small }: { icon: typeof ScanLine; label: string; value: string | number; small?: boolean }) { return <Card><CardContent className="p-5"><Icon size={18} className="text-slate-500"/><p className="mt-4 text-sm text-slate-500">{label}</p><p className={small ? "mt-1 text-lg font-semibold" : "mt-1 text-3xl font-semibold"}>{value}</p></CardContent></Card>; }
