import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FicheClientDetail() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const id = Number(ficheId);

  const ficheQuery = trpc.clientSpaceRouter.ficheDetail.useQuery({ ficheId: id });
  const scansQuery = trpc.clientSpaceRouter.scans.useQuery({ ficheId: id });
  const requestsQuery = trpc.clientSpaceRouter.contactRequests.useQuery({ ficheId: id });
  const cardsQuery = trpc.clientSpaceRouter.membershipCards.useQuery({ ficheId: id });

  if (ficheQuery.isLoading) return <p className="p-6 text-sm text-slate-500">Chargement…</p>;
  if (ficheQuery.error) return <p className="p-6 text-sm text-red-600">Fiche introuvable.</p>;

  const fiche = ficheQuery.data!;
  const totalScans = scansQuery.data?.reduce((sum, s) => sum + s.count, 0) ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">{fiche.prenom} {fiche.nom}</h1>
        <p className="text-slate-500">{fiche.entreprise} · {fiche.formule}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-slate-500">Scans (30 derniers jours)</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{totalScans}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-slate-500">Échéance</CardTitle></CardHeader>
          <CardContent><p className="text-lg">{new Date(fiche.dateEcheance).toLocaleDateString("fr-FR")}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Cartes membres</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {cardsQuery.data?.length ? cardsQuery.data.map(card => (
            <div key={card.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <span className="font-mono text-sm">{card.numero}</span>
              <Badge variant={card.statut === "active" ? "default" : "secondary"}>{card.statut}</Badge>
            </div>
          )) : <p className="text-sm text-slate-500">Aucune carte enregistrée.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Demandes reçues</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {requestsQuery.data?.length ? requestsQuery.data.map(req => (
            <div key={req.id} className="border-b py-2 last:border-0">
              <p className="font-medium">{req.name} — {req.phone}</p>
              <p className="text-sm text-slate-500">{req.message}</p>
            </div>
          )) : <p className="text-sm text-slate-500">Aucune demande pour le moment.</p>}
        </CardContent>
      </Card>
    </div>
  );
}