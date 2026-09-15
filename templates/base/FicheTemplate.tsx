import type { ReactNode } from "react";
import type { FicheTemplateModel } from "../model";
import { getTemplateConfig } from "../config";

export type FicheTemplateProps = {
  fiche: FicheTemplateModel;
  children?: ReactNode;
};

/**
 * Shared template shell.
 * Formula changes configuration/theme; it does not select another HTML template.
 */
export function FicheTemplate({ fiche, children }: FicheTemplateProps) {
  const config = getTemplateConfig(fiche.formule);

  return (
    <div className={`fiche-template fiche-template--${config.theme}`} data-formule={fiche.formule}>
      <div className="fiche-template__card">
        {children}
      </div>
    </div>
  );
}
