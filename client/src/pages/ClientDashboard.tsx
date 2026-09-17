import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ClientDashboard() {
  const [, navigate] = useLocation();
  const fichesQuery = trpc.client.myFiches.useQuery();

  useEffect(() => {
    if (fichesQuery.data?.length === 1) {
      navigate(`/espace-client/fiche/${fichesQuery.data[0].id}`);
    }
  }, [fichesQuery.data, navigate]);

  if (fichesQuery.isLoading)
    return <p className="p-6 text-sm text-slate-500">Chargement…</p>;
  if (!fichesQuery.data?.length)
    return (
      <p className="p-6 text-sm text-slate-500">
        Aucune fiche associée à ce compte.
      </p>
    );
  if (fichesQuery.data.length === 1) return null; // redirection en cours

  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">Vos fiches</h1>
      {fichesQuery.data.map(fiche => (
        <a
          key={fiche.id}
          href={`/espace-client/fiche/${fiche.id}`}
          className="block rounded-lg border p-4 hover:bg-slate-50"
        >
          <p className="font-medium">
            {fiche.prenom} {fiche.nom} — {fiche.entreprise}
          </p>
          <p className="text-sm text-slate-500">{fiche.formule}</p>
        </a>
      ))}
    </div>
  );
}
