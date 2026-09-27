import { trpc } from "@/lib/trpc";
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import ClientSplash from "./client-space/ClientSplash";

export default function ClientGuard({ children }: { children: ReactNode }) {
  // get connected use informations
  // ? useQuery : get data from server 
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (meQuery.isLoading) {
    return <ClientSplash label="Vérification de la session…" />;
  }

  if (!meQuery.data || meQuery.data.role !== "user" || meQuery.data.loginMethod !== "local-client") {
    return <Navigate to="/espace-client/connexion" replace />;
  }

  if (meQuery.data.mustChangePassword) {
    return <Navigate to="/espace-client/connexion" replace />;
  }

  return <>{children}</>;
}
