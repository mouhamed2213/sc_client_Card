const KEY = "sc_visitor";

/**
 * Anonymous, random, per-browser id used only to avoid counting the same
 * visitor twice on a fiche (reload, back button, second tab). It contains no
 * personal data. Returns undefined when storage is unavailable; the server then
 * falls back to its own de-duplication.
 */
export function getVisitorId(): string | undefined {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || id.length < 8) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(KEY, id);
    }
    return id.slice(0, 64);
  } catch {
    return undefined;
  }
}
