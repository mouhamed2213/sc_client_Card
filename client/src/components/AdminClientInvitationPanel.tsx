import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Check,
  Clipboard,
  Link2,
  Loader2,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

type Invitation = {
  id: number;
  token: string;
  utilisee: boolean;
  expireLe: string | Date;
  createdAt: string | Date;
  revokedAt?: string | Date | null;
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminClientInvitationPanel() {
  const [location] = useLocation();
  const { slug = "" } = useParams<{ slug: string }>();
  const [open, setOpen] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [attachQuery, setAttachQuery] = useState("");
  const [attachMode, setAttachMode] = useState<"invite" | "existing">("invite");
  const utils = trpc.useUtils();

  const ficheQuery = trpc.fiches.getBySlug.useQuery(
    { slug },
    { enabled: location.startsWith("/studio/fiche/") && !!slug }
  );
  const ficheId = ficheQuery.data?.id;
  const organizationId = ficheQuery.data?.organizationId as number | null | undefined;
  const invitationsQuery = trpc.admin.listInvitations.useQuery(
    { organizationId: organizationId! },
    { enabled: open && !!organizationId && attachMode === "invite" }
  );
  const clientUsersQuery = trpc.admin.searchClientUsers.useQuery(
    { query: attachQuery },
    { enabled: open && attachMode === "existing" }
  );
  const createOrganizationMutation = trpc.admin.createPersonalOrganizationInvitationForFiche.useMutation({
    onSuccess: async result => {
      const absoluteUrl = new URL(result.url, window.location.origin).toString();
      setCreatedUrl(absoluteUrl);
      await utils.fiches.getBySlug.invalidate({ slug });
      toast.success("Invitation client créée", {
        description: "Le lien est prêt à être envoyé au client.",
      });
    },
    onError: error => toast.error("Impossible de créer l'invitation", { description: error.message }),
  });

  const revokeMutation = trpc.admin.revokeInvitation.useMutation({
    onSuccess: async () => {
      await utils.admin.listInvitations.invalidate({ organizationId: organizationId! });
      toast.success("Invitation révoquée");
    },
    onError: error =>
      toast.error("Impossible de révoquer l’invitation", {
        description: error.message,
      }),
  });
  const attachMutation = trpc.admin.assignFicheToClientOrganization.useMutation({
    onSuccess: async () => {
      toast.success("Fiche rattachée au compte", {
        description: "Ce client verra maintenant plusieurs fiches dans son espace.",
      });
      await utils.fiches.getBySlug.invalidate({ slug });
      setOpen(false);
    },
    onError: error =>
      toast.error("Impossible de rattacher la fiche", {
        description: error.message,
      }),
  });

  const invitations = (invitationsQuery.data ?? []) as Invitation[];
  const activeInvitation = useMemo(
    () =>
      invitations.find(
        invitation =>
          !invitation.utilisee &&
          !invitation.revokedAt &&
          new Date(invitation.expireLe).getTime() > Date.now()
      ),
    [invitations]
  );

  if (!location.startsWith("/studio/fiche/") || !slug || ficheQuery.isLoading || !ficheQuery.data) {
    return null;
  }

  const organizationId = ficheQuery.data.organizationId as number | null | undefined;
  const hasOrganization = Boolean(organizationId);

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="gap-2 rounded-full bg-[#172033] px-5 text-white shadow-lg hover:bg-[#27334a]"
        >
          <UserPlus className="h-4 w-4" />
          Accès client
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl border border-[#e4e7eb] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#edf0f2] px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b93a1]">
                  Espace client
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[#172033]">
                  Accès à {ficheQuery.data.prenom} {ficheQuery.data.nom}
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Créez et gérez le lien d’accès à cette fiche.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="icon-button"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              {!hasOrganization && (
                <div className="flex gap-1.5 rounded-lg border border-[#e5e7eb] bg-[#f8f9fb] p-1">
                  <button
                    type="button"
                    onClick={() => setAttachMode("invite")}
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                      attachMode === "invite"
                        ? "bg-white text-[#172033] shadow-sm"
                        : "text-[#667085] hover:text-[#172033]"
                    }`}
                  >
                    Nouveau compte
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachMode("existing")}
                    className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                      attachMode === "existing"
                        ? "bg-white text-[#172033] shadow-sm"
                        : "text-[#667085] hover:text-[#172033]"
                    }`}
                  >
                    Compte existant
                  </button>
                </div>
              )}

              {!hasOrganization && attachMode === "existing" ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#667085]">
                    Rattachez cette fiche à un compte client déjà créé — utile
                    pour donner à une même entreprise plusieurs cartes (une
                    par employé) visibles dans un seul espace client.
                  </p>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                    <input
                      value={attachQuery}
                      onChange={event => setAttachQuery(event.target.value)}
                      placeholder="Rechercher par nom ou e-mail…"
                      className="w-full rounded-lg border border-[#e0e4e9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#172033]"
                    />
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {clientUsersQuery.isFetching ? (
                      <p className="py-6 text-center text-sm text-[#98a2b3]">
                        Recherche…
                      </p>
                    ) : !clientUsersQuery.data?.length ? (
                      <p className="py-6 text-center text-sm text-[#98a2b3]">
                        Aucun compte client trouvé.
                      </p>
                    ) : (
                      clientUsersQuery.data.map(user => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#edf0f2] p-3"
                        >
                          <div className="min-w-0 flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2f6] text-[#52607a]">
                              <Users className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#172033]">
                                {user.name || "Sans nom"}
                              </p>
                              <p className="truncate text-xs text-[#98a2b3]">
                                {user.email} · {user._count.fiche} fiche
                                {user._count.fiche > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={attachMutation.isPending}
                            onClick={() =>
                              attachMutation.mutate({
                                ficheId: ficheId!,
                                userId: user.id,
                              })
                            }
                            className="shrink-0 bg-[#172033] text-white hover:bg-[#27334a]"
                          >
                            Attacher
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : hasOrganization ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Cette fiche est déjà rattachée à un compte client. Une nouvelle invitation ne peut pas être créée.
                </div>
              ) : activeInvitation ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <Link2 className="mt-0.5 h-4 w-4 text-blue-700" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-blue-900">Invitation en attente</p>
                      <p className="mt-1 text-xs text-blue-700">
                        Expire le {formatDate(activeInvitation.expireLe)}.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <input
                          readOnly
                          value={new URL(`/espace-client/invite/${activeInvitation.token}`, window.location.origin).toString()}
                          className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-[#344054]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => copyLink(new URL(`/espace-client/invite/${activeInvitation.token}`, window.location.origin).toString())}
                          className="shrink-0 gap-2"
                        >
                          <Clipboard className="h-4 w-4" />
                          Copier
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#e5e7eb] bg-[#f8f9fb] p-4">
                  <p className="text-sm font-medium text-[#172033]">Aucun lien actif</p>
                  <p className="mt-1 text-sm text-[#667085]">
                    L’invitation est valable 7 jours et permettra au client de rattacher cette fiche à son compte.
                  </p>
                  <Button
                    type="button"
                    onClick={() => createOrganizationMutation.mutate({ ficheId: ficheId!, name: `${ficheQuery.data.prenom} ${ficheQuery.data.nom}`.trim() })}
                    disabled={createOrganizationMutation.isPending}
                    className="mt-4 gap-2 bg-[#172033] text-white hover:bg-[#27334a]"
                  >
                    {createOrganizationMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Créer une invitation
                  </Button>
                </div>
              )}

              {attachMode === "invite" && createdUrl && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <Check className="h-4 w-4" /> Invitation créée
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      readOnly
                      value={createdUrl}
                      className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-[#344054]"
                    />
                    <Button type="button" variant="outline" onClick={() => copyLink(createdUrl)} className="shrink-0 gap-2">
                      <Clipboard className="h-4 w-4" />
                      Copier
                    </Button>
                  </div>
                </div>
              )}

              {attachMode === "invite" && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#172033]">Historique des invitations</h3>
                  {invitationsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-[#98a2b3]" />}
                </div>
                {invitations.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#dfe3e8] px-4 py-5 text-center text-sm text-[#667085]">
                    Aucune invitation créée pour cette fiche.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invitations.map(invitation => {
                      const expired = new Date(invitation.expireLe).getTime() <= Date.now();
                      const status = invitation.revokedAt
                        ? "Révoquée"
                        : invitation.utilisee
                          ? "Utilisée"
                          : expired
                            ? "Expirée"
                            : "En attente";
                      const url = new URL(`/espace-client/invite/${invitation.token}`, window.location.origin).toString();
                      return (
                        <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#edf0f2] p-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#344054]">{status}</p>
                            <p className="text-xs text-[#98a2b3]">
                              Créée le {formatDate(invitation.createdAt)} · expire le {formatDate(invitation.expireLe)}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            {!invitation.utilisee && !invitation.revokedAt && !expired && (
                              <>
                                <Button type="button" variant="outline" size="sm" onClick={() => copyLink(url)}>
                                  <Clipboard className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={revokeMutation.isPending}
                                  onClick={() => revokeMutation.mutate({ invitationId: invitation.id })}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Révoquer
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
