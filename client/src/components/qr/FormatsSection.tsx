import { useState } from 'react';
import { Q_FORMATS } from '../../data/qr';
import { Icon } from '../Icons';

/*
  Configurateur visuel : taille (échelle réelle face à un smartphone de 15 cm),
  forme (morphing CSS) et options (NFC, anti-métal, découpe sur mesure).
*/
export default function FormatsSection() {
  const [size, setSize] = useState(12);
  const [shape, setShape] = useState('rond');
  type OptId = 'nfc' | 'metal' | 'cut';
  const [opts, setOpts] = useState<Record<OptId, boolean>>({ nfc: false, metal: false, cut: false });
  const toggle = (id: OptId) => setOpts((o) => ({ ...o, [id]: !o[id] }));
  const cls = ['q-sample', `sh-${shape}`, opts.cut ? 'cut' : '', opts.metal ? 'metal' : ''].join(' ');

  return (
    <section className="q-formats">
      <div className="wrap qf-grid">
        <div className="qf-txt rv">
          <p className="label">{Q_FORMATS.label}</p>
          <h2 className="h2">{Q_FORMATS.title}</h2>
          <p className="qf-p">{Q_FORMATS.text}</p>

          <div className="qf-ctrl">
            <p className="qf-k">Taille</p>
            <div className="seg" role="radiogroup" aria-label="Taille">
              {Q_FORMATS.sizes.map((s) => <button key={s} role="radio" aria-checked={size === s} className={size === s ? 'on' : ''} onClick={() => setSize(s)}>{s} cm</button>)}
            </div>
            <p className="qf-k">Forme</p>
            <div className="seg" role="radiogroup" aria-label="Forme">
              {Q_FORMATS.shapes.map((s) => <button key={s.id} role="radio" aria-checked={shape === s.id} className={shape === s.id ? 'on' : ''} onClick={() => setShape(s.id)}>{s.label}</button>)}
            </div>
            <p className="qf-k">Options</p>
            <div className="qf-opts">
              {Q_FORMATS.options.map((o) => (
                <button key={o.id} className={`opt${opts[o.id as OptId] ? ' on' : ''}`} aria-pressed={opts[o.id as OptId]} onClick={() => toggle(o.id as OptId)}>
                  <span className="opt-ic"><Icon id={o.icon} /></span>
                  <span><b>{o.label}</b><small>{o.text}</small></span>
                  <span className="opt-sw" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="qf-vis rv">
          <div className="qf-bench" style={{ '--cm': size } as React.CSSProperties}>
            <div className="qf-phone" aria-hidden="true"><i /></div>
            <div className={cls} aria-label={`Aperçu : ${size} cm, ${shape}`}>
              <div className="qs-in">
                <span className="qs-t">Votre design</span>
                <span className="qs-qr" />
                <span className="qs-s">Scannez ici</span>
              </div>
              {opts.nfc && <span className="qs-nfc"><Icon id="nfc" /></span>}
              {opts.metal && <span className="qs-layer" aria-hidden="true" />}
            </div>
          </div>
          <p className="qf-scale">{size} cm · {Q_FORMATS.scale}</p>
          <p className="qf-service">{Q_FORMATS.service}</p>
        </div>
      </div>

      <div className="wrap qf-perks">
        {Q_FORMATS.perks.map((p) => (
          <div key={p.title} className="perk rv"><span className="perk-ic"><Icon id={p.icon} /></span><div><b>{p.title}</b><span>{p.text}</span></div></div>
        ))}
        <a className="perk perk-link rv" href={Q_FORMATS.phone.href}>
          <img src="/images/sticker-telephone.webp" alt="" loading="lazy" />
          <div><b>{Q_FORMATS.phone.title}</b><span>{Q_FORMATS.phone.text}</span><em>{Q_FORMATS.phone.link} <Icon id="arr" /></em></div>
        </a>
      </div>
    </section>
  );
}
