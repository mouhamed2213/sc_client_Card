import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { trpc } from "@/lib/trpc";

export default function AdminGuard({ children }: { children: ReactNode }) {
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

  // A failed request (network/server error) is not "logged out": showing the
  // error avoids a silent bounce to the login page.
  if (meQuery.isError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 text-white">
        <p className="text-sm text-slate-300">
          Impossible de vérifier la session.
        </p>
        <button
          type="button"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900"
          onClick={() => meQuery.refetch()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!meQuery.data || meQuery.data.role !== "admin") {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
}


 