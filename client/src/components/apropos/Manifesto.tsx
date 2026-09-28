import { useRef } from "react";
import { A_MANIFESTO } from "../../data/apropos";
import useStickyProgress from "../../hooks/useStickyProgress";

/*
  Conviction du catalogue en deux temps, pilotée par le scroll (variable CSS --p) :
  la première phrase apparaît mot à mot, « dépense » est barrée,
  puis la seconde phrase se révèle et « commercial » se souligne en rouge.
  L'opacité de chaque mot est calculée en CSS pur avec clamp() et calc().
*/

type WordsProps = {
  text: string;
  start: number;
  span: number;
  cls?: string;
};

const Words = ({ text, start, span, cls = "" }: WordsProps) => {
  const w = text.split(" ");
  return w.map((x: string, i: number) => (
    <span
      key={i}
      className={`mw ${cls}`}
      style={{
        "--i": i,
        "--n": w.length,
        "--s": start,
        "--d": span,
      } as unknown as React.CSSProperties}
    >
      {x}{" "}
    </span>
  ));
};

export default function Manifesto() {
  const sec = useRef<HTMLElement>(null);
  useStickyProgress(
    sec,
    (p: number) => sec.current?.style.setProperty("--p", p.toFixed(4)),
    () => {}
  );
  const A = A_MANIFESTO;
  return (
    <section
      className="mani"
      ref={sec}
      style={{ "--p": 0 } as unknown as React.CSSProperties}
      aria-label={`${A.a1} ${A.a2} ${A.b1} ${A.b2}`}
    >
      <div className="pin">
        <div className="wrap mani-in">
          <p className="label light">{A.label}</p>
          <p className="mani-l l1" aria-hidden="true">
            <Words text={A.a1} start={0.02} span={0.2} />
            <span className="strike">
              <Words text={A.a2} start={0.2} span={0.08} />
            </span>
          </p>
          <p className="mani-l l2" aria-hidden="true">
            <Words text={A.b1} start={0.44} span={0.2} />
            <span className="uline">
              <Words text={A.b2} start={0.62} span={0.08} cls="red" />
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
