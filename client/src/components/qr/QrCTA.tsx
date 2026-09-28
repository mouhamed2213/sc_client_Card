import { Q_CTA } from '../../data/qr';
import { Icon } from '../Icons';

export default function QrCTA() {
  return (
    <section className="c-cta q-cta">
      <div className="c-cta-bg" aria-hidden="true" />
      <div className="wrap">
        <div className="q-cta-head rv">
          <p className="label light">{Q_CTA.label}</p>
          <h2>{Q_CTA.title}<br /><em className="red">{Q_CTA.red}</em></h2>
        </div>
        <ol className="q-steps">
          <span className="rs-line" aria-hidden="true"><i /></span>
          {Q_CTA.steps.map((s, i) => (
            <li key={s.title}><span className="qs-n">{i + 1}</span><b>{s.title}</b><p>{s.text}</p></li>
          ))}
        </ol>
        <div className="btns rv">
          <a className="btn btn-red" href="/contact">{Q_CTA.cta1} <Icon id="arr" /></a>
          <a className="btn btn-line" href="/contact"><Icon id="i-chat" />{Q_CTA.cta2}</a>
        </div>
      </div>
    </section>
  );
}
