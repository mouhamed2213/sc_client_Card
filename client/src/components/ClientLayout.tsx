import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, CreditCard, ExternalLink, FileText, LayoutDashboard, LogOut, Menu, MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function ClientLayout({ children, ficheId }: { children: ReactNode; ficheId?: number }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const me = trpc.auth.me.useQuery();
  const fiche = ficheId ? trpc.client.ficheDetail.useQuery({ ficheId }) : undefined;
  const nav = ficheId ? [
    { href: `/espace-client/fiche/${ficheId}`, label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: `/espace-client/fiche/${ficheId}/statistiques`, label: "Statistiques", icon: BarChart3 },
    { href: `/espace-client/fiche/${ficheId}/demandes`, label: "Demandes reçues", icon: MessageSquare },
    { href: `/espace-client/fiche/${ficheId}/cartes`, label: "Cartes membres", icon: CreditCard },
  ] : [];

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu size={20} /></button>
          <Link href="/espace-client" className="font-semibold tracking-tight">Espace client</Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {fiche?.data && <a href={`/fiche/${fiche.data.slug}`} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-lg border px-3 py-2 hover:bg-slate-50 sm:flex"><ExternalLink size={15} /> Voir ma fiche</a>}
          <span className="hidden text-slate-500 md:inline">{me.data?.name || me.data?.email}</span>
        </div>
      </div>
    </header>
    {open && <div className="fixed inset-0 z-50 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-80 bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}><div className="mb-6 flex items-center justify-between"><span className="font-semibold">Navigation</span><button onClick={() => setOpen(false)} aria-label="Fermer"><X /></button></div><ClientNav items={nav} location={location} onNavigate={() => setOpen(false)} /></aside></div>}
    <div className="mx-auto flex max-w-7xl">
      {ficheId && <aside className="hidden w-64 shrink-0 border-r bg-white px-4 py-6 lg:block"><div className="mb-6 rounded-xl bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fiche</p><p className="mt-1 font-semibold">{fiche?.data ? `${fiche.data.prenom} ${fiche.data.nom}` : "Chargement…"}</p><p className="text-sm text-slate-500">{fiche?.data?.entreprise}</p></div><ClientNav items={nav} location={location} /></aside>}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  </div>;
}

function ClientNav({ items, location, onNavigate }: { items: { href: string; label: string; icon: typeof LayoutDashboard }[]; location: string; onNavigate?: () => void }) {
  return <nav className="space-y-1">{items.map(item => { const Icon = item.icon; const active = location === item.href; return <Link key={item.href} href={item.href} onClick={onNavigate} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={18} />{item.label}</Link>; })}</nav>;
}
