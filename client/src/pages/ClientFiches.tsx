import { LayoutGrid, Plus, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import FichesTable from "@/components/client-space/FichesTable";

export default function ClientFiches() {
  const [, navigate] = useLocation();
  const fiches = trpc.clientSpaceRouter.myFiches.useQuery();

  if (fiches.isLoading) {
    return (
      <ClientLayout>
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl">
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#e1e5ea]" />
            <div className="mt-3 h-8 w-64 animate-pulse rounded-lg bg-[#e1e5ea]" />
            <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-[#edf0f2]" />
          </div>
          <div className="space-y-px overflow-hidden rounded-2xl border border-[#e6e8ec] bg-white">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[76px] animate-pulse border-b border-[#f0f2f4] bg-white" />
            ))}
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (!fiches.data?.length) {
    return (
      <ClientLayout>
        <div className="mx-auto max-w-xl p-6 pt-16 text-center lg:pt-24">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2f6] text-[#7d8798]">
            <LayoutGrid size={25} />
          </div>
          <p className="eyebrow mt-5">Espace client</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-[#172033]">
            Aucune fiche associée
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#7d8798]">
            Votre compte n'est pas encore relié à une fiche. Contactez notre
            équipe pour rattacher une fiche à votre compte.
          </p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-7 p-4 sm:p-6 lg:p-8">
        <section className="relative overflow-hidden rounded-[24px] bg-[#172033] px-5 py-6 text-white shadow-[0_18px_42px_rgba(23,32,51,0.10)] sm:px-7 sm:py-7">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-[#e5a86b]/20" aria-hidden />
          <div className="absolute -right-4 -top-10 h-40 w-40 rounded-full border border-white/10" aria-hidden />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
              <Sparkles size={11} />
              Votre espace
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Mes fiches
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              Retrouvez toutes vos fiches Support Connecté au même endroit.
              Chaque ligne correspond à une fiche que vous pouvez ouvrir,
              consulter et gérer.
            </p>
          </div>
          <div className="relative z-10 mt-5 flex items-center gap-2 text-xs text-white/45">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 font-semibold text-white">
              {fiches.data.length}
            </span>
            {fiches.data.length === 1 ? "fiche associée" : "fiches associées"} à votre compte
          </div>
        </section>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Vos fiches</p>
            <h2 className="mt-1 text-lg font-semibold text-[#172033]">
              Sélectionnez une fiche
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/espace-client")}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-[#e1e5ea] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#52607a] shadow-sm transition hover:border-[#cbd2dc] hover:bg-[#fafbfc] sm:self-auto"
          >
            <Plus size={14} />
            Retour au tableau de bord
          </button>
        </div>

        <FichesTable fiches={fiches.data} />
      </div>
    </ClientLayout>
  );
}
