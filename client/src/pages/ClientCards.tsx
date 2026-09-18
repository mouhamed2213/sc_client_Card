import { useParams } from "wouter";
import { CreditCard } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ClientLayout from "@/components/ClientLayout";
import { cardStatusLabels } from "@/lib/ficheStatus";

const pillClass = {
  active: "status-pill-ok",
  perdue: "status-pill-warn",
  revoquee: "status-pill-danger",
} as const;

export default function ClientCards() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const id = Number(ficheId);
  const cards = trpc.clientSpaceRouter.membershipCards.useQuery({ ficheId: id });

  return (
    <ClientLayout ficheId={id}>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-xl font-semibold text-[#172033]">Cartes membres</h1>
          <p className="mt-1 text-sm text-[#7d8798]">
            L'état des cartes de fidélité attribuées via votre fiche.
          </p>
        </div>

        {cards.isLoading ? (
          <div className="panel py-16 text-center text-sm text-[#7d8798]">
            Chargement…
          </div>
        ) : !cards.data?.length ? (
          <div className="panel flex flex-col items-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef2f6]">
              <CreditCard size={20} className="text-[#7d8798]" />
            </div>
            <p className="mt-4 font-medium text-[#172033]">Aucune carte</p>
            <p className="mt-1 max-w-xs text-sm text-[#7d8798]">
              Aucune carte membre n'est actuellement associée à cette fiche.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.data.map(card => (
              <div key={card.id} className="id-card" style={{ padding: "20px 22px 18px" }}>
                <div className="id-card-row">
                  <div>
                    <div className="id-card-chip" aria-hidden />
                    <p className="id-card-brand" style={{ marginTop: 10 }}>
                      Carte membre
                    </p>
                  </div>
                  <span className={`status-pill ${pillClass[card.statut]}`}>
                    {cardStatusLabels[card.statut]}
                  </span>
                </div>
                <p className="id-card-name" style={{ fontSize: 19, marginTop: 20, fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em" }}>
                  {card.numero}
                </p>
                <p className="id-card-role">
                  Créée le {new Date(card.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
