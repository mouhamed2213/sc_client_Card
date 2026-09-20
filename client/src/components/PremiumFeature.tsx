import { Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { PlanName } from "@shared/planFeatures";
import { planLabels } from "@shared/planFeatures";

export function PremiumBadge({ plan }: { plan: PlanName }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4df] px-2 py-1 text-[10px] font-bold text-[#9a6a2a]">
      <Sparkles size={11} aria-hidden="true" />
      {planLabels[plan]}
    </span>
  );
}

export function PremiumUpgradeModal({
  feature,
  requiredPlan,
  open,
  onClose,
}: {
  feature: string;
  requiredPlan: PlanName;
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-upgrade-title"
        className="w-full max-w-md rounded-2xl border border-[#eadcc7] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff4df] text-[#c98a4e]">
            <Sparkles size={21} aria-hidden="true" />
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-[#7d8798] hover:bg-[#f5f6f8] hover:text-[#172033]"
          >
            <X size={18} />
          </button>
        </div>
        <h2 id="premium-upgrade-title" className="mt-5 text-lg font-bold text-[#172033]">
          {feature} est une fonctionnalité Premium
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#667085]">
          Cette fonctionnalité est disponible avec la formule{" "}
          <span className="font-semibold text-[#172033]">{planLabels[requiredPlan]}</span>.
        </p>
        <div className="mt-5 rounded-xl bg-[#faf7f1] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#735028]">
            <Sparkles size={16} aria-hidden="true" />
            Passez à {planLabels[requiredPlan]} pour la débloquer.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-[#172033] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#25324d]"
        >
          Compris
        </button>
      </div>
    </div>
  );
}
