/*
  Mesure du tunnel de vente. Envoie un événement vers Google Tag Manager / GA4
  (window.dataLayer) s'il est installé, sinon ne fait rien. Aucun cookie posé ici.
  Événements : diag_answer, diag_result, lead_email, lead_call, cta_demo.
*/
export default function track(event: string, params: Record<string, unknown> = {}) {
  try { ((window as any).dataLayer = (window as any).dataLayer || []).push({ event, ...params }); } catch (e) { /* silencieux */ }
}
