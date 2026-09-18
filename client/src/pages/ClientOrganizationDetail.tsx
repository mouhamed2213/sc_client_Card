import { ArrowLeft, Building2, Check, Lock, Users } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import ClientLayout from "@/components/ClientLayout";
import { trpc } from "@/lib/trpc";

const roleLabels: Record<string, string> = {
  OWNER: "Directeur / propriétaire",
  ADMIN: "Administrateur",
  MEMBER: "Membre",
  VIEWER: "Lecteur",
};

export default function ClientOrganizationDetail() {
  const [, params] = useRoute("/espace-client/organisation/:organizationId");
  const [, navigate] = useLocation();
  const organizationId = Number(params?.organizationId);
  const query = trpc.clientSpaceRouter.organization.useQuery(
    { organizationId },
    { enabled: Number.isInteger(organizationId) && organizationId > 0 }
  );

  if (query.isLoading) {
    return <ClientLayout><div className="p-6"><div className="h-48 animate-pulse rounded-2xl bg-white" /></div></ClientLayout>;
  }

  if (!query.data) {
    return (
      <ClientLayout>
        <div className="p-6">
          <button onClick={() => navigate("/espace-client/organisations")} className="inline-flex items-center gap-2 text-sm text-[#667085]">
            <ArrowLeft size={16} /> Organisations
          </button>
          <div className="mt-10 rounded-2xl border border-dashed border-[#d9dee6] bg-white p-10 text-center">
            <Lock className="mx-auto text-[#98a2b3]" size={28} />
            <h1 className="mt-4 font-semibold text-[#172033]">Organisation inaccessible</h1>
            <p className="mt-2 text-sm text-[#7d8798]">Cette organisation n'est pas accessible avec votre compte.</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const organization = query.data;

  return (
    <ClientLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <button onClick={() => navigate("/espace-client/organisations")} className="inline-flex items-center gap-2 text-sm text-[#667085] hover:text-[#172033]">
          <ArrowLeft size={16} /> Organisations
        </button>

        <section className="rounded-2xl border border-[#e6e8ec] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3f5f8]">
                <Building2 size={22} className="text-[#52607a]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-[#98a2b3]">{organization.type === "BUSINESS" ? "Business" : "Personnel"}</p>
                <h1 className="text-2xl font-semibold text-[#172033]">{organization.name}</h1>
              </div>
            </div>
            <span className="rounded-full bg-[#f3f5f8] px-3 py-1.5 text-xs font-semibold text-[#52607a]">
              {roleLabels[organization.role] ?? organization.role}
            </span>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Users size={18} className="text-[#52607a]" />
            <h2 className="font-semibold text-[#172033]">Membres</h2>
          </div>
          {organization.role !== "OWNER" ? (
            <div className="rounded-2xl border border-[#e6e8ec] bg-white p-5 text-sm text-[#667085]">
              La gestion détaillée des membres est réservée au directeur de l'organisation.
            </div>
          ) : organization.members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d9dee6] bg-white p-8 text-sm text-[#667085]">
              Aucun membre supplémentaire.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#e6e8ec] bg-white">
              {organization.members.map(member => (
                <div key={member.id} className="flex flex-col gap-3 border-b border-[#eef0f3] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-[#172033]">{member.name || "Utilisateur sans nom"}</p>
                    <p className="text-xs text-[#7d8798]">{member.email || "E-mail non renseigné"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#f8f9fb] px-2.5 py-1 text-xs font-medium text-[#52607a]">
                      {roleLabels[member.role] ?? member.role}
                    </span>
                    {member.role !== "OWNER" && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#7d8798]">
                        <Check size={13} /> {member.accessCount} fiche(s)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Building2 size={18} className="text-[#52607a]" />
            <h2 className="font-semibold text-[#172033]">Fiches de l'organisation</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {organization.fiches.map(fiche => (
              <button
                key={fiche.id}
                onClick={() => navigate(`/espace-client/fiche/${fiche.id}`)}
                className="rounded-xl border border-[#e6e8ec] bg-white p-4 text-left transition hover:border-[#c98a4e] hover:shadow-sm"
              >
                <p className="font-semibold text-[#172033]">{fiche.prenom} {fiche.nom}</p>
                <p className="mt-1 text-sm text-[#7d8798]">{fiche.entreprise}</p>
              </button>
            ))}
          </div>
          {!organization.fiches.length && (
            <div className="rounded-2xl border border-dashed border-[#d9dee6] bg-white p-8 text-sm text-[#667085]">
              Aucune fiche n'est encore rattachée à cette organisation.
            </div>
          )}
        </section>

        {organization.canManage && (
          <div className="rounded-2xl border border-[#e8dfd5] bg-[#fffaf5] p-4 text-sm text-[#6b5a48]">
            <strong>Gestion des accès :</strong> les invitations et attributions de fiches restent contrôlées côté serveur et par l'administration de la plateforme. Le rôle Directeur donne automatiquement accès à toutes les fiches de cette organisation.
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
