import { useParams } from "wouter";
import { MessageSquare, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import FicheStatusAlert from "@/components/client-space/FicheStatusAlert";

export default function ClientRequests() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const id = Number(ficheId);
  const fiche = trpc.clientSpaceRouter.ficheDetail.useQuery({ ficheId: id });
  const lifecycleBlocked = fiche.data?.statutMetier === "suspendue" || fiche.data?.statutMetier === "expiree";
  const canViewRequests = fiche.data?.formule === "signature" && !lifecycleBlocked;
  const requests = trpc.clientSpaceRouter.contactRequests.useQuery(
    { ficheId: id },
    { enabled: canViewRequests }
  );

  return (
    <ClientLayout ficheId={id}>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-xl font-semibold text-[#172033]">Demandes reçues</h1>
          <p className="mt-1 text-sm text-[#7d8798]">
            Les messages envoyés depuis le formulaire de votre fiche publique.
          </p>
        </div>

        {fiche.isLoading ? (
          <div className="panel py-16 text-center text-sm text-[#7d8798]">
            Chargement…
          </div>
        ) : lifecycleBlocked ? (
          <FicheStatusAlert
            status={fiche.data?.statutMetier}
            dateEcheance={fiche.data?.dateEcheance}
          />
        ) : !canViewRequests ? (
          <div className="panel flex flex-col items-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff4df]">
              <MessageSquare size={20} className="text-[#9a6a2a]" />
            </div>
            <p className="mt-4 font-medium text-[#172033]">
              Fonctionnalité réservée à la formule Signature
            </p>
            <p className="mt-1 max-w-md text-sm text-[#7d8798]">
              Les demandes reçues correspondent au formulaire de rappel de votre fiche publique.
            </p>
          </div>
        ) : requests.isLoading ? (
          <div className="panel py-16 text-center text-sm text-[#7d8798]">
            Chargement…
          </div>
        ) : !requests.data?.length ? (
          <div className="panel flex flex-col items-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef2f6]">
              <MessageSquare size={20} className="text-[#7d8798]" />
            </div>
            <p className="mt-4 font-medium text-[#172033]">Aucune demande pour le moment</p>
            <p className="mt-1 max-w-xs text-sm text-[#7d8798]">
              Dès qu'un visiteur contacte via votre fiche publique, sa demande apparaîtra ici.
            </p>
          </div>
        ) : (
          <div className="panel divide-y divide-[#f0f1f3]" style={{ padding: 0 }}>
            {requests.data.map(request => (
              <article key={request.id} className="p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-semibold text-[#172033]">{request.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#7d8798]">
                      <Phone size={13} /> {request.phone}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-[#9aa3b1]">
                    {new Date(request.createdAt).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#42506a]">
                  {request.message}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
