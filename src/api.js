// api.js — Belli Laadkaart API client
const API_URL = process.env.REACT_APP_API_URL || 'https://belli-laadplan-backend-production.up.railway.app';

async function apiFetch(path, options = {}) {
  const resp = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `API fout ${resp.status}`);
  return data;
}

export async function getAlleGemeenten() { return apiFetch('/gemeenten'); }
export async function getGemeente(id)    { return apiFetch(`/gemeenten/${id}`); }
export async function slaGemeenteOp(g)  { return apiFetch('/gemeenten', { method:'POST', body:JSON.stringify(g) }); }
export async function updateGemeente(id, data) { return apiFetch(`/gemeenten/${id}`, { method:'PUT', body:JSON.stringify(data) }); }
export async function verwijderGemeente(id) { return apiFetch(`/gemeenten/${id}`, { method:'DELETE' }); }
export async function updateWijk(gid, wid, data) { return apiFetch(`/gemeenten/${gid}/wijken/${wid}`, { method:'PATCH', body:JSON.stringify(data) }); }
export async function getStats()  { return apiFetch('/stats'); }
export async function checkHealth() {
  try { return await apiFetch('/health'); }
  catch { return { status: 'offline' }; }
}

// ── Geo API calls ────────────────────────────────────────────────────
export async function getNisCode(naam, land = 'België') {
  return apiFetch(`/geo/nis-lookup?naam=${encodeURIComponent(naam)}&land=${encodeURIComponent(land)}`);
}

export async function onboardGemeenteGeo(id, nisCode = null) {
  return apiFetch(`/geo/onboard/${id}`, {
    method: 'POST',
    body: JSON.stringify({ nisCode }),
  });
}

export async function getSectoren(id) {
  return apiFetch(`/geo/sectoren/${id}`);
}
