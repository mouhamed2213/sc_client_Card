import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Organization = RouterOutputs["clientSpaceRouter"]["myOrganizations"][number];

type ActiveOrganizationContextValue = {
  organizations: RouterOutputs["clientSpaceRouter"]["myOrganizations"] | undefined;
  activeOrganizationId: number | null;
  setActiveOrganizationId: (id: number) => void;
  activeOrganization: Organization | null;
  isLoading: boolean;
};

const ActiveOrganizationContext = createContext<ActiveOrganizationContextValue | null>(null);
const STORAGE_KEY = "sc-client-active-organization";

export function ActiveOrganizationProvider({ children }: { children: ReactNode }) {
  const query = trpc.clientSpaceRouter.myOrganizations.useQuery();
  const [storedId, setStoredId] = useState<number | null>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const id = raw ? Number(raw) : NaN;
    return Number.isInteger(id) && id > 0 ? id : null;
  });

  const activeOrganization = useMemo(() => {
    const organizations = query.data ?? [];
    const selected = organizations.find(org => org.id === storedId);
    return selected ?? organizations[0] ?? null;
  }, [query.data, storedId]);

  useEffect(() => {
    if (!activeOrganization) return;
    if (activeOrganization.id !== storedId) setStoredId(activeOrganization.id);
    window.localStorage.setItem(STORAGE_KEY, String(activeOrganization.id));
  }, [activeOrganization, storedId]);

  const value = useMemo<ActiveOrganizationContextValue>(
    () => ({
      organizations: query.data,
      activeOrganizationId: activeOrganization?.id ?? null,
      setActiveOrganizationId: id => setStoredId(id),
      activeOrganization,
      isLoading: query.isLoading,
    }),
    [query.data, activeOrganization, query.isLoading]
  );

  return (
    <ActiveOrganizationContext.Provider value={value}>
      {children}
    </ActiveOrganizationContext.Provider>
  );
}

export function useActiveOrganization() {
  const value = useContext(ActiveOrganizationContext);
  if (!value) {
    throw new Error("useActiveOrganization must be used inside ActiveOrganizationProvider");
  }
  return value;
}
