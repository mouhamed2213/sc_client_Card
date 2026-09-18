import { Building2, ChevronRight, Crown, Users } from "lucide-react";
import { useLocation } from "wouter";
import ClientLayout from "@/components/ClientLayout";
import { trpc } from "@/lib/trpc";

const roleLabels: Record<string, string> = {
  OWNER: "Directeur / propriétaire",
  ADMIN: "Administrateur",
  MEMBER: "Membre",
  VIEWER: "Lecteur",
};

export default function ClientOrganizations() {
  const [, navigate] = useLocation();
  const organizations = trpc.clientSpaceRouter.myOrganizations.useQuery();

  return (
    <ClientLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <p className="eyebrow text-[#7d8798]">Organisation</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#172033]">
            Mes organisations
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[#667085]">
            Une organisation regroupe les fiches et les accès de ses membres.
            Votre rôle détermine les ressources que vous pouvez consulter.
          </p>
        </div>

        {organizations.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
        ) : !organizations.data?.length ? (
          <div className="rounded-2xl border border-dashed border-[#d9dee6] bg-white p-10 text-center">
            <Building2 className="mx-auto text-[#98a2b3]" size={28} />
            <h2 className="mt-4 font-semibold text-[#172033]">
              Aucune organisation
            </h2>
            <p className="mt-2 text-sm text-[#7d8798]">
              Votre compte n'a encore reçu aucune organisation.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {organizations.data.map(item => (
              <button
                key={item.organizationId}
                type="button"
                onClick={() => navigate(`/espace-client/organisation/${item.organizationId}`)}
                className="group rounded-2xl border border-[#e6e8ec] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#c98a4e] hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3f5f8]">
                      <Building2 size={20} className="text-[#52607a]" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-[#172033]">
                        {item.organization.name}
                      </h2>
                      <p className="text-xs text-[#7d8798]">
                        {item.organization.type === "BUSINESS" ? "Business" : "Personnel"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-[#98a2b3] transition group-hover:translate-x-0.5" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#f8f9fb] p-3">
                    <div className="flex items-center gap-2 text-xs text-[#7d8798]">
                      <Crown size={14} />
                      Rôle
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#172033]">
                      {roleLabels[item.role] ?? item.role}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f8f9fb] p-3">
                    <div className="flex items-center gap-2 text-xs text-[#7d8798]">
                      <Users size={14} />
                      Fiches accessibles
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#172033]">
                      {item.role === "OWNER" ? "Toutes" : "Selon attribution"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
