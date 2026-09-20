/**
 * Public fiche slugs are printed on NFC/QR cards: they are generated once,
 * at creation, and never edited afterwards.
 */
const MAX_BASE_LENGTH = 120;

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, "");
}

/** Base slug from the person's name, falling back to the company name. */
export function slugBaseFromFiche(input: {
  prenom?: string | null;
  nom?: string | null;
  entreprise?: string | null;
}): string {
  const fromName = slugify(`${input.prenom ?? ""} ${input.nom ?? ""}`);
  const base = fromName || slugify(input.entreprise ?? "") || "fiche";
  return base.length >= 3 ? base : `${base}-fiche`;
}

/** Picks `base`, then `base-2`, `base-3`… skipping already used slugs. */
export function pickAvailableSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
