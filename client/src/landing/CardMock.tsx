/**
 * The three physical cards of the brand, drawn in HTML/CSS so they stay sharp
 * at every size (sizes use container units: everything scales with the card).
 */

export function NfcIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M9 9.5c2.7 3.9 2.7 9.1 0 13" />
      <path d="M14 6.5c4.2 5.6 4.2 13.4 0 19" />
      <path d="M19.2 3.5c5.6 7.4 5.6 17.6 0 25" />
    </svg>
  );
}

export function BrandMark({
  tone,
  className = "",
}: {
  /** "dark": red + white (for dark backgrounds). "light": red + black. */
  tone: "dark" | "light";
  className?: string;
}) {
  return (
    <img
      className={className}
      src={`/landing/logo-mark-${tone}.png`}
      alt=""
      draggable={false}
      aria-hidden="true"
    />
  );
}

/** Copper metallic "Carte Pro" (hero). */
export function CopperCard({ className = "" }: { className?: string }) {
  return (
    <div className={`lp-card lp-card--copper ${className}`}>
      <span className="lp-card-chip" aria-hidden="true" />
      <div className="lp-card-brand">
        <BrandMark tone="light" className="lp-card-mark" />
        <span className="lp-card-word">
          <b>SUPPORT</b>
          <i>CONNECTÉ</i>
        </span>
      </div>
      <div className="lp-card-foot">
        <span className="lp-card-kicker">CARTE PRO</span>
        <strong>Votre identité.</strong>
      </div>
    </div>
  );
}

/** Full black card (« Une carte se donne une fois »). */
export function BlackCard({ className = "" }: { className?: string }) {
  return (
    <div className={`lp-card lp-card--black ${className}`}>
      <NfcIcon className="lp-card-nfc" />
      <span className="lp-card-nfc-label">NFC</span>
      <div className="lp-card-brand lp-card-brand--stack">
        <BrandMark tone="dark" className="lp-card-mark" />
        <span className="lp-card-word">
          <b>SUPPORT</b>
          <i>CONNECTÉ</i>
        </span>
      </div>
      <span className="lp-card-tagline">DES RELATIONS QUI DURENT.</span>
    </div>
  );
}

/** White card with the red/black side bar. */
export function WhiteCard({ className = "" }: { className?: string }) {
  return (
    <div className={`lp-card lp-card--white ${className}`}>
      <span className="lp-card-bar lp-card-bar--red" aria-hidden="true" />
      <span className="lp-card-bar lp-card-bar--black" aria-hidden="true" />
      <div className="lp-card-nfc-block">
        <NfcIcon className="lp-card-nfc" />
        <span className="lp-card-nfc-label">NFC</span>
      </div>
      <div className="lp-card-center">
        <BrandMark tone="light" className="lp-card-mark" />
        <b>SUPPORT</b>
        <i>CONNECTÉ</i>
        <span className="lp-card-rule" aria-hidden="true" />
      </div>
      <span className="lp-card-tagline">
        CONNECTER <em /> PARTAGER <em /> SIMPLIFIER
      </span>
    </div>
  );
}
