import { useParams } from "wouter";
import ClientLayout from "@/components/ClientLayout";
import FicheOverview from "@/components/client-space/FicheOverview";

export default function FicheClientDetail() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const id = Number(ficheId);

  return (
    <ClientLayout ficheId={id}>
      <FicheOverview ficheId={id} />
    </ClientLayout>
  );
}
