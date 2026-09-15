import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("@/pages/Home"));
const PublicFiche = lazy(() => import("@/pages/PublicFiche"));

function Router() {
  return <Suspense fallback={<div className="public-loading"><div className="loading-pulse" /><p>Chargement…</p></div>}><Switch>
    <Route path="/" component={Home} />
    <Route path="/fiche/:slug" component={PublicFiche} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch></Suspense>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
