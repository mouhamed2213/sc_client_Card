import type { FicheTemplateModel } from "../../../templates/model";

const CACHE_PREFIX = "support-connecte:fiche:";

type CachedFiche = {
  cachedAt: string;
  data: FicheTemplateModel & { statut?: string };
};

function getKey(slug: string) {
  return `${CACHE_PREFIX}${slug}`;
}

export function saveCachedFiche(slug: string, data: CachedFiche["data"]) {
  try {
    localStorage.setItem(
      getKey(slug),
      JSON.stringify({ cachedAt: new Date().toISOString(), data } satisfies CachedFiche)
    );
  } catch {
    // Storage may be unavailable or full. Offline support remains optional.
  }
}

export function readCachedFiche(slug: string): CachedFiche["data"] | null {
  try {
    const raw = localStorage.getItem(getKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFiche;
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

export function clearCachedFiche(slug: string) {
  try {
    localStorage.removeItem(getKey(slug));
  } catch {
    // Ignore storage errors.
  }
}
