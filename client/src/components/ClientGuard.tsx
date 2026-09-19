import { trpc } from "@/lib/trpc";
import { ReactNode } from "react";
import { Redirect } from "wouter";
import ClientSplash from "./client-space/ClientSplash";

export default function ClientGuard({ children }: { children: ReactNode }) {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (meQuery.isLoading) {
    return <ClientSplash label="Vérification de la session…" />;
  }

  if (!meQuery.data || meQuery.data.role !== "user") {
    return <Redirect to="/espace-client/connexion" />;
  }

  if (meQuery.data.mustChangePassword) {
    return <Redirect to="/espace-client/connexion" />;
  }

  return <>{children}</>;
}
