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

  if (!meQuery.data || meQuery.data.role !== "admin") {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
}
