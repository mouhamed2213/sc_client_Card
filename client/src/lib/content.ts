import { useEffect, useState } from 'react';

/*
  Textes modifiables depuis le back-office (onglet « Contenu du site », table site_content).
  Le site s'affiche d'abord avec ses textes par défaut (fichiers data/*.js, bons pour le référencement),
  puis applique la version publiée dans le back-office dès qu'elle est chargée.
  Sans VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY : textes par défaut uniquement.
*/
const ENV = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
const BASE = ENV.VITE_SUPABASE_URL, KEY = ENV.VITE_SUPABASE_ANON_KEY;
let cache = null;
const loadAll = () => {
  if (!BASE || !KEY) return Promise.resolve({});
  cache ??= fetch(`${BASE}/rest/v1/site_content?select=key,value`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
    .then((r) => (r.ok ? r.json() : []))
    .then((rows) => Object.fromEntries(rows.map((r) => [r.key, r.value])))
    .catch(() => ({}));
  return cache;
};

export function useContent(key, fallback) {
  const [v, setV] = useState(fallback);
  useEffect(() => {
    let on = true;
    loadAll().then((all) => { if (on && all[key]) setV({ ...fallback, ...all[key] }); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return v;
}
