import { getPlanFeatures, type PlanFeatures } from "../shared/planFeatures";
import type { Formule } from "./model";

export type TemplateTheme = Formule;

export type TemplateConfig = {
  theme: TemplateTheme;
  features: PlanFeatures;
};

export const templateConfig: Record<Formule, TemplateConfig> = {
  essentiel: { theme: "essentiel", features: getPlanFeatures("essentiel") },
  pro: { theme: "pro", features: getPlanFeatures("pro") },
  signature: { theme: "signature", features: getPlanFeatures("signature") },
};

export function getTemplateConfig(formule: Formule): TemplateConfig {
  console.log(formule);
  return templateConfig[formule];
}
