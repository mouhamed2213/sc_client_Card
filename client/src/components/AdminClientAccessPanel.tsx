import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Search, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

export default function AdminClientAccessPanel() {
  const [location] = useLocation();
  const { slug = "" } = useParams<{ slug: string }>();
  const [open, setOpen] = useState(false);
  const [attachQuery, setAttachQuery] = useState("");
  const utils = trpc.useUtils();

  const ficheQuery = trpc.fiches.getBySlug.useQuery(
    { slug },
    { enabled: location.startsWith("/studio/fiche/") && !!slug }
  );
  const ficheId = ficheQuery.data?.id;
  const ownerQuery = trpc.admin.getFicheOwner.useQuery(
    { ficheId: ficheId! },
    { enabled: open && !!ficheId }
  );
  const clientUsersQuery = trpc.admin.searchClientUsers.useQuery(
    { query: attachQuery },
    { enabled: open && !!ficheId }
  );

  const refreshAccess = async () => {
    await Promise.all([
      ownerQuery.refetch(),
      utils.fiches.getBySlug.invalidate({ slug }),
    ]);
  };

  const attachMutation = trpc.admin.attachFicheToOwner.useMutation({
    onSuccess: async () => {
      toast.success("Fiche rattachée au compte");
      await refreshAccess();
    },
    onError: error =>
      toast.error("Impossible de rattacher la fiche", {
        description: error.message,
      }),
  });

  const changeOwnerMutation = trpc.admin.changeFicheOwner.useMutation({
    onSuccess: async () => {
      toast.success("Propriétaire de la fiche modifié");
      setAttachQuery("");
      await refreshAccess();
    },
    onError: error =>
      toast.error("Impossible de changer le propriétaire", {
        description: error.message,
      }),
  });

  const detachMutation = trpc.admin.detachFicheOwner.useMutation({
    onSuccess: async () => {
      toast.success("Fiche détachée du compte client");
      await refreshAccess();
    },
    onError: error =>
      toast.error("Impossible de détacher la fiche", {
        description: error.message,
      }),
  });

  if (
    !location.startsWith("/studio/fiche/") ||
    !slug ||
    ficheQuery.isLoading ||
    !ficheQuery.data
  ) {
    return null;
  }

  const owner = ownerQuery.data?.owner;
  const hasOwner = Boolean(owner?.id);
  const availableClientUsers =
    clientUsersQuery.data?.filter(user => user.id !== owner?.id) ?? [];
  const busy =
    attachMutation.isPending ||
    changeOwnerMutation.isPending ||
    detachMutation.isPending;

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
                  Gérez le compte client associé à cette fiche.
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
              {ownerQuery.isFetching ? (
                <p className="py-6 text-center text-sm text-[#98a2b3]">
                  Chargement du compte…
                </p>
              ) : hasOwner ? (
                <>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      Compte propriétaire
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-950">
                      {owner?.name || "Sans nom"}
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-800/80">
                      {owner?.email || "Sans e-mail"} · {owner?._count.fiche ?? 0} fiche
                      {(owner?._count.fiche ?? 0) > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setAttachQuery(" ")}
                    >
                      Changer de compte
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Détacher cette fiche du compte client ? Elle restera disponible dans le studio, mais ne sera plus visible dans « Mes fiches »."
                          )
                        ) {
                          detachMutation.mutate({ ficheId: ficheId! });
                        }
                      }}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Détacher
                    </Button>
                  </div>
                </>
              ) : null}

              {(!hasOwner || attachQuery !== "") && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-[#172033]">
                      {hasOwner ? "Nouveau compte propriétaire" : "Compte existant"}
                    </p>
                    <p className="mt-1 text-sm text-[#667085]">
                      Sélectionnez un compte client existant. Pour créer un nouveau
                      compte, utilisez « Nouveau compte clients ».
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                    <input
                      value={attachQuery}
                      onChange={event => setAttachQuery(event.target.value)}
                      placeholder="Rechercher par nom ou e-mail…"
                      className="w-full rounded-lg border border-[#e0e4e9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#172033]"
                    />
                  </div>

                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {clientUsersQuery.isFetching ? (
                      <p className="py-6 text-center text-sm text-[#98a2b3]">
                        Recherche…
                      </p>
                    ) : !availableClientUsers.length ? (
                      <p className="py-6 text-center text-sm text-[#98a2b3]">
                        Aucun autre compte client trouvé.
                      </p>
                    ) : (
                      availableClientUsers.map(user => (
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
                                {user.email || "Sans e-mail"} · {user._count.fiche} fiche
                                {user._count.fiche > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              hasOwner
                                ? changeOwnerMutation.mutate({
                                    ficheId: ficheId!,
                                    ownerId: user.id,
                                  })
                                : attachMutation.mutate({
                                    ficheId: ficheId!,
                                    ownerId: user.id,
                                  })
                            }
                            className="shrink-0 bg-[#172033] text-white hover:bg-[#27334a]"
                          >
                            {hasOwner ? "Changer" : "Attacher"}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {hasOwner && attachQuery === "" && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setAttachQuery(" ")}
                  className="text-[#52607a]"
                >
                  Changer le propriétaire
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
