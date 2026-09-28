// Page de démonstration affichée dans le téléphone pour un secteur (PLACEHOLDER).
// Les libellés d'actions reprennent la liste du catalogue (pôle II).
interface SectorPage {
  color: string;
  brand: string;
  sub: string;
  actions: string[];
}

export default function SectorScreen({ page }: { page: SectorPage }) {
  return (
    <div className="we-page" style={{ '--bc': page.color } as React.CSSProperties}>
      <p className="we-brand"><b>{page.brand}</b><small>{page.sub}</small></p>
      {page.actions.map((a) => <span key={a} className="we-act">{a}</span>)}
    </div>
  );
}
