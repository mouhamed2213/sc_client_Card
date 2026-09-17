import { useParams } from "wouter";
import { MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientRequests() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const id = Number(ficheId);
  const fiche = trpc.client.ficheDetail.useQuery({ ficheId: id });
  const requests = trpc.client.contactRequests.useQuery({ ficheId: id });
  return <ClientLayout ficheId={id}><div className="space-y-6 p-4 sm:p-6 lg:p-8"><div><p className="text-sm text-slate-500">{fiche.data?.entreprise}</p><h1 className="text-2xl font-semibold">Demandes reçues</h1><p className="mt-1 text-sm text-slate-500">Les demandes envoyées depuis votre fiche publique.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare size={18}/> Historique</CardTitle></CardHeader><CardContent className="space-y-0">{requests.isLoading ? <p className="py-8 text-sm text-slate-500">Chargement…</p> : !requests.data?.length ? <p className="py-8 text-sm text-slate-500">Aucune demande reçue pour le moment.</p> : requests.data.map(request => <article key={request.id} className="border-b py-5 last:border-0"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><p className="font-semibold">{request.name}</p><p className="text-sm text-slate-500">{request.phone}</p></div><time className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleString("fr-FR")}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.message}</p></article>)}</CardContent></Card></div></ClientLayout>;
}
