import { useLocation } from "wouter";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import FicheOverview from "@/components/client-space/FicheOverview";
import { formuleLabels } from "@/lib/ficheStatus";

export default function ClientDashboard() {
  const [, navigate] = useLocation();
  const fiches = trpc.clientSpaceRouter.myFiches.useQuery();

  if (fiches.isLoading) {
    return (
      <ClientLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="id-card animate-pulse opacity-50" style={{ minHeight: 180 }} />
        </div>
      </ClientLayout>
    );
  }

  if (!fiches.data?.length) {
    return (
      <ClientLayout>
        <div className="mx-auto max-w-lg p-6 pt-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2f6]">
            <LayoutGrid size={22} className="text-[#7d8798]" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-[#172033]">
            Aucune fiche associée
          </h1>
          <p className="mt-2 text-sm text-[#7d8798]">
            Votre compte n'est pas encore relié à une fiche. Si vous venez de
            recevoir une invitation, ouvrez-la depuis l'e-mail ou le lien
            fourni par notre équipe pour l'activer.
          </p>
        </div>
      </ClientLayout>
    );
  }

  if (fiches.data.length === 1) {
    const id = fiches.data[0].id;
    return (
      <ClientLayout ficheId={id}>
        <FicheOverview ficheId={id} />
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-xl font-semibold text-[#172033]">Vos fiches</h1>
          <p className="mt-1 text-sm text-[#7d8798]">
            Choisissez une fiche pour accéder à son tableau de bord.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {fiches.data.map(fiche => (
            <button
              key={fiche.id}
              onClick={() => navigate(`/espace-client/fiche/${fiche.id}`)}
              className="group flex w-full items-center justify-between rounded-xl border border-[#e6e8ec] bg-white p-5 text-left transition hover:border-[#c98a4e] hover:shadow-[0_12px_30px_rgba(23,32,51,0.06)]"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#172033]">
                  {fiche.prenom} {fiche.nom}
                </p>
                <p className="truncate text-sm text-[#7d8798]">
                  {fiche.entreprise} · {formuleLabels[fiche.formule] ?? fiche.formule}
                </p>
              </div>
              <ArrowRight
                size={18}
                className="shrink-0 text-[#c1c8d3] transition group-hover:translate-x-0.5 group-hover:text-[#c98a4e]"
              />
            </button>
          ))}
        </div>
      </div>
    </ClientLayout>
  );
}
