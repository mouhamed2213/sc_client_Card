import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Suspense, lazy, type ReactNode } from "react";
import { Route, Switch } from "wouter";
import AdminGuard from "./components/AdminGuard";
import ClientGuard from "./components/ClientGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import { ADMIN_HOME_PATH } from "./const";
import { ThemeProvider } from "./contexts/ThemeContext";
import ClientDashboard from "./pages/ClientDashboard";
import ClientFicheEdit from "./pages/ClientFicheEdit";
import ClientFiches from "./pages/ClientFiches";
import ClientLogin from "./pages/ClientLogin";
import ClientRequests from "./pages/ClientRequests";
import ClientStats from "./pages/ClientStats";
import FicheClientDetail from "./pages/FicheClientDetail";
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Home = lazy(() => import("@/pages/Home"));
const Fiches = lazy(() => import("@/pages/Fiches"));
const PublicFiche = lazy(() => import("@/pages/PublicFiche"));
const FicheEditor = lazy(() => import("@/pages/FicheEditor"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
function AdminRoute({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
function ClientRoute({ children }: { children: ReactNode }) {
  return <ClientGuard>{children}</ClientGuard>;
}
function Router() {
  return (
    <Suspense
      fallback={
        <div className="public-loading">
          <div className="loading-pulse" />
          <p>Chargement…</p>
        </div>
      }
    >
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/fiche/:slug" component={PublicFiche} />
        <Route path="/" component={LandingPage} />
        <Route
          path={ADMIN_HOME_PATH}
          component={() => (
            <AdminRoute>
              <Home />
            </AdminRoute>
          )}
        />
        <Route
          path="/studio/fiches"
          component={() => (
            <AdminRoute>
              <Fiches />
            </AdminRoute>
          )}
        />
        <Route
          path="/studio/fiche/:slug"
          component={() => (
            <AdminRoute>
              <FicheEditor />
            </AdminRoute>
          )}
        />
        <Route path="/espace-client/connexion" component={ClientLogin} />
        <Route
          path="/espace-client/fiches"
          component={() => (
            <ClientRoute>
              <ClientFiches />
            </ClientRoute>
          )}
        />
        <Route
          path="/espace-client"
          component={() => (
            <ClientRoute>
              <ClientDashboard />
            </ClientRoute>
          )}
        />
        <Route
          path="/espace-client/fiche/:ficheId/statistiques"
          component={() => (
            <ClientRoute>
              <ClientStats />
            </ClientRoute>
          )}
        />
        <Route
          path="/espace-client/fiche/:ficheId/demandes"
          component={() => (
            <ClientRoute>
              <ClientRequests />
            </ClientRoute>
          )}
        />
        <Route
          path="/espace-client/fiche/:ficheId/modifier"
          component={() => (
            <ClientRoute>
              <ClientFicheEdit />
            </ClientRoute>
          )}
        />
        <Route
          path="/espace-client/fiche/:ficheId"
          component={() => (
            <ClientRoute>
              <FicheClientDetail />
            </ClientRoute>
          )}
        />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
