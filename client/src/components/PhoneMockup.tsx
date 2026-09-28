import { forwardRef } from 'react';
import { DEMO_PAGE } from '../data/content';
import { Icon } from './Icons';

// ⚠️ PLACEHOLDER (cahier, section 14) : interface de démonstration.
// À remplacer par l'interface officielle Support Connecté quand elle sera fournie.

/** Contenu de la page connectée (réutilisé dans le mini téléphone du métier II). */
export const DemoPage = forwardRef(function DemoPage({ className = '', actRefs, children }: { className?: string; actRefs?: React.RefObject<HTMLLIElement[]>; children?: React.ReactNode }, ref: React.ForwardedRef<HTMLDivElement>) {
  return (
    <div className={`page ${className}`} ref={ref}>
      <div className="cover">
        <svg viewBox="0 0 200 70" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="140" cy="38" r="16" fill="#ffd28a" opacity=".85" />
          <path d="M0 52 Q50 44 100 50 T200 48 V70 H0z" fill="#0c0c0c" opacity=".55" />
          <path d="M0 60 Q60 54 120 60 T200 58 V70 H0z" fill="#0c0c0c" />
        </svg>
      </div>
      <div className="ident">
        <div className="av"><Icon id="palm" /></div>
        <h4>{DEMO_PAGE.name}</h4>
        <p>{DEMO_PAGE.place}</p>
      </div>
      <ul className="acts">
        {DEMO_PAGE.actions.map((a, i) => (
          <li key={a.label} ref={actRefs ? (el: HTMLLIElement) => { actRefs.current[i] = el; } : undefined}>
            <Icon id={a.icon} />{a.label}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
});

/** Petit téléphone statique pour la carte du métier II. */
export function MiniPhone() {
  return (
    <div className="mphone" aria-hidden="true">
      <div className="scr"><DemoPage className="show" /></div>
    </div>
  );
}
