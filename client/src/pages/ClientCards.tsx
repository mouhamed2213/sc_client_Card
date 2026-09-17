import { useParams } from "wouter";
import { CreditCard } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const labels = { active: "Active", perdue: "Perdue", revoquee: "Révoquée" } as const;

export default function ClientCards() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const id = Number(ficheId);
  const fiche = trpc.clientSpaceRouter.ficheDetail.useQuery({ ficheId: id });
  const cards = trpc.clientSpaceRouter.membershipCards.useQuery({ ficheId: id });
  return <ClientLayout ficheId={id}><div className="space-y-6 p-4 sm:p-6 lg:p-8"><div><p className="text-sm text-slate-500">{fiche.data?.entreprise}</p><h1 className="text-2xl font-semibold">Cartes membres</h1><p className="mt-1 text-sm text-slate-500">Consultez l'état de vos cartes attribuées.</p></div>{cards.isLoading ? <p className="text-sm text-slate-500">Chargement…</p> : !cards.data?.length ? <Card><CardContent className="flex flex-col items-center py-12 text-center"><CreditCard className="mb-3 text-slate-400"/><p className="font-medium">Aucune carte</p><p className="mt-1 text-sm text-slate-500">Aucune carte membre n'est actuellement associée à cette fiche.</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{cards.data.map(card => <Card key={card.id} className="overflow-hidden"><CardContent className="p-0"><div className="bg-slate-900 p-6 text-white"><p className="text-xs uppercase tracking-[0.2em] text-slate-300">Carte membre</p><p className="mt-8 font-mono text-xl tracking-widest">{card.numero}</p></div><div className="flex items-center justify-between p-5"><div><p className="text-sm font-medium">Statut</p><p className="mt-1 text-xs text-slate-500">Créée le {new Date(card.createdAt).toLocaleDateString("fr-FR")}</p></div><Badge variant={card.statut === "active" ? "default" : "secondary"}>{labels[card.statut]}</Badge></div></CardContent></Card>)}</div>}</div></ClientLayout>;
}
