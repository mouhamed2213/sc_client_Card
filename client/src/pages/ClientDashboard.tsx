import { useLocation } from "wouter";
import { LayoutGrid } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import FicheOverview from "@/components/client-space/FicheOverview";
import AllFichesOverview from "@/components/client-space/AllFichesOverview";

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
            Votre compte n'est pas encore relié à une fiche. Contactez notre
            équipe pour rattacher une fiche à votre compte.
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
      <AllFichesOverview fiches={fiches.data} />
    </ClientLayout>
  );
}
