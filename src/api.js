// api.js — Belli Laadkaart API client
// Communiceert met de Express/PostgreSQL backend op Railway

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function apiFetch(path, options = {}) {
  const resp = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `API fout ${resp.status}`);
  return data;
}

// ── Gemeente API calls ───────────────────────────────────────────────

// Alle gemeenten ophalen (zonder wijken — voor de selector)
export async function getAlleGemeenten() {
  return apiFetch('/gemeenten');
}

// Één gemeente ophalen inclusief alle wijken
export async function getGemeente(id) {
  return apiFetch(`/gemeenten/${id}`);
}

// Nieuwe gemeente opslaan (na onboarding-wizard)
export async function slaGemeenteOp(gemeente) {
  return apiFetch('/gemeenten', {
    method: 'POST',
    body: JSON.stringify(gemeente),
  });
}

// Gemeente bijwerken
export async function updateGemeente(id, data) {
  return apiFetch(`/gemeenten/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Gemeente verwijderen
export async function verwijderGemeente(id) {
  return apiFetch(`/gemeenten/${id}`, { method: 'DELETE' });
}

// Wijk bijwerken
export async function updateWijk(gemeenteId, wijkId, data) {
  return apiFetch(`/gemeenten/${gemeenteId}/wijken/${wijkId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Stats ophalen
export async function getStats() {
  return apiFetch('/stats');
}

// Health check
export async function checkHealth() {
  try {
    return await apiFetch('/health');
  } catch {
    return { status: 'offline' };
  }
}
