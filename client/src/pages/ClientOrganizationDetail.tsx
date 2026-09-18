import { ArrowLeft, Building2, Check, Clipboard, Lock, Plus, Users } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import ClientLayout from "@/components/ClientLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

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

  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [inviteFicheId, setInviteFicheId] = useState<number | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const inviteMember = trpc.clientSpaceRouter.inviteMember.useMutation({
    onSuccess: result => {
      setInviteUrl(new URL(result.url, window.location.origin).toString());
      toast.success("Invitation créée");
      query.refetch();
    },
    onError: error => toast.error("Impossible de créer l'invitation", { description: error.message }),
  });
  const grantAccess = trpc.clientSpaceRouter.grantOrganizationFicheAccess.useMutation({
    onSuccess: () => {
      toast.success("Accès accordé");
      query.refetch();
    },
    onError: error => toast.error("Impossible d'accorder l'accès", { description: error.message }),
  });
  const revokeAccess = trpc.clientSpaceRouter.revokeOrganizationFicheAccess.useMutation({
    onSuccess: () => {
      toast.success("Accès retiré");
      query.refetch();
    },
    onError: error => toast.error("Impossible de retirer l'accès", { description: error.message }),
  });

  const updateMemberRole = trpc.clientSpaceRouter.updateOrganizationMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      query.refetch();
    },
    onError: error => toast.error("Impossible de modifier le rôle", { description: error.message }),
  });
  const removeMember = trpc.clientSpaceRouter.removeOrganizationMember.useMutation({
    onSuccess: () => {
      toast.success("Membre retiré de l'organisation");
      query.refetch();
    },
    onError: error => toast.error("Impossible de retirer le membre", { description: error.message }),
  });

  const copyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Lien d'invitation copié");
  };

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

        {organization.canManage && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-[#e6e8ec] bg-white p-5">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#52607a]" />
                <h2 className="font-semibold text-[#172033]">Inviter un membre</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as typeof inviteRole)} className="rounded-lg border border-[#dfe3e8] px-3 py-2 text-sm">
                  <option value="MEMBER">Membre</option>
                  <option value="VIEWER">Lecteur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
                <select value={inviteFicheId ?? ""} onChange={e => setInviteFicheId(e.target.value ? Number(e.target.value) : null)} className="rounded-lg border border-[#dfe3e8] px-3 py-2 text-sm">
                  <option value="">Sans fiche pour l'instant</option>
                  {organization.fiches.map(fiche => (
                    <option key={fiche.id} value={fiche.id}>{fiche.prenom} {fiche.nom}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={inviteMember.isPending}
                  onClick={() => inviteMember.mutate({ organizationId, role: inviteRole, ficheId: inviteFicheId })}
                  className="rounded-lg bg-[#172033] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Créer le lien
                </button>
              </div>
              {inviteUrl && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f8f9fb] p-3">
                  <input readOnly value={inviteUrl} className="min-w-0 flex-1 bg-transparent text-xs text-[#344054] outline-none" />
                  <button type="button" onClick={copyInvite} className="inline-flex items-center gap-1 rounded-lg border border-[#dfe3e8] bg-white px-3 py-2 text-xs font-medium">
                    <Clipboard size={14} /> Copier
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {organization.members.filter(member => member.role !== "OWNER").map(member => (
                <div key={member.id} className="rounded-2xl border border-[#e6e8ec] bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#172033]">{member.name || "Utilisateur sans nom"}</p>
                      <p className="text-xs text-[#7d8798]">{member.email || "E-mail non renseigné"} · {roleLabels[member.role] ?? member.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        disabled={updateMemberRole.isPending || removeMember.isPending}
                        onChange={e => updateMemberRole.mutate({
                          organizationId,
                          membershipId: member.id,
                          role: e.target.value as "ADMIN" | "MEMBER" | "VIEWER",
                        })}
                        className="rounded-lg border border-[#dfe3e8] px-2 py-1 text-xs"
                      >
                        <option value="MEMBER">Membre</option>
                        <option value="VIEWER">Lecteur</option>
                        <option value="ADMIN">Administrateur</option>
                      </select>
                      <button
                        type="button"
                        disabled={removeMember.isPending}
                        onClick={() => {
                          if (window.confirm("Retirer ce membre de l'organisation et tous ses accès aux fiches ?")) {
                            removeMember.mutate({ organizationId, membershipId: member.id });
                          }
                        }}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {organization.fiches.map(fiche => {
                      const granted = member.ficheIds.includes(fiche.id);
                      return (
                        <button
                          key={fiche.id}
                          type="button"
                          disabled={grantAccess.isPending || revokeAccess.isPending}
                          onClick={() => granted
                            ? revokeAccess.mutate({ organizationId, ficheId: fiche.id, membershipId: member.id })
                            : grantAccess.mutate({ organizationId, ficheId: fiche.id, membershipId: member.id })}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${granted ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#dfe3e8] bg-white text-[#667085]"}`}
                        >
                          {granted ? <Check size={13} /> : <Plus size={13} />}
                          {fiche.prenom} {fiche.nom}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {organization.members.filter(member => member.role !== "OWNER").length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#d9dee6] bg-white p-6 text-sm text-[#667085]">
                  Aucun membre à gérer pour le moment.
                </div>
              )}
            </div>
          </section>
        )}

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
