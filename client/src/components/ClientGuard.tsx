import { trpc } from "@/lib/trpc";
import { ReactNode } from "react";
import { Redirect } from "wouter";

export default function ClientGuard({ children }: { children: ReactNode }) {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-300">Vérification de la session…</p>
      </div>
    );
  }

  if (!meQuery.data || meQuery.data.role !== "user") {
    return <Redirect to="/espace-client/connexion" />;
  }

  return <>{children}</>;
}
