import { useEffect, useRef, useState } from 'react';
import useViewProgress from '../../hooks/useViewProgress';

/*
  Bandeau photo animé : zoom et parallaxe liés au défilement (PC), panoramique lent (mobile),
  repères qui s'allument quand le bandeau entre à l'écran. Réutilisable sur toutes les pages.
  hotspots : [{ x, y, label, far }] en % de l'image (far = masqué sur mobile).
*/
export default function PhotoBand({ src, alt = '', label, title, red, text, note, hotspots = [], id, pos = 'bottom' }) {
  const sec = useRef(null), [inView, setIn] = useState(false);
  useViewProgress(sec, (p) => sec.current?.style.setProperty('--p', p.toFixed(4)));
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { threshold: .35 });
    io.observe(sec.current); return () => io.disconnect();
  }, []);
  return (
    <section className={`pband pos-${pos}${inView ? ' in' : ''}`} ref={sec} id={id}>
      <div className="pband-img">
        <img src={src} alt={alt} loading="lazy" decoding="async" />
        {hotspots.map((h, i) => <span key={h.label} className={`hs${h.far ? ' far' : ''}`} style={{ left: h.x + '%', top: h.y + '%', '--i': i }}><i /><b>{h.label}</b></span>)}
      </div>
      {(title || text) && (
        <div className="pband-tx"><div className="wrap">
          {label && <p className="label light">{label}</p>}
          {title && <h2>{title} {red && <em className="red">{red}</em>}</h2>}
          {text && <p>{text}</p>}
          {note && <small>{note}</small>}
        </div></div>
      )}
    </section>
  );
}
