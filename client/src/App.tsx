import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Suspense, lazy, type ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
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
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/fiche/:slug" element={<PublicFiche />} />
        <Route
          path={ADMIN_HOME_PATH}
          element={
            <AdminRoute>
              <Home />
            </AdminRoute>
          }
        />
        <Route
          path="/studio/fiches"
          element={
            <AdminRoute>
              <Fiches />
            </AdminRoute>
          }
        />
        <Route
          path="/studio/fiche/:slug"
          element={
            <AdminRoute>
              <FicheEditor />
            </AdminRoute>
          }
        />
        <Route path="/espace-client/connexion" element={<ClientLogin />} />
        <Route
          path="/espace-client/fiches"
          element={
            <ClientRoute>
              <ClientFiches />
            </ClientRoute>
          }
        />
        <Route
          path="/espace-client"
          element={
            <ClientRoute>
              <ClientDashboard />
            </ClientRoute>
          }
        />
        <Route
          path="/espace-client/fiche/:ficheId/statistiques"
          element={
            <ClientRoute>
              <ClientStats />
            </ClientRoute>
          }
        />
        <Route
          path="/espace-client/fiche/:ficheId/demandes"
          element={
            <ClientRoute>
              <ClientRequests />
            </ClientRoute>
          }
        />
        <Route
          path="/espace-client/fiche/:ficheId/modifier"
          element={
            <ClientRoute>
              <ClientFicheEdit />
            </ClientRoute>
          }
        />
        <Route
          path="/espace-client/fiche/:ficheId"
          element={
            <ClientRoute>
              <FicheClientDetail />
            </ClientRoute>
          }
        />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
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
