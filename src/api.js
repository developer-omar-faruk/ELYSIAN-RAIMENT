export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function api(path, { method = "GET", body } = {}) {
  let r;
  try {
    r = await fetch(`${API}/api${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the store server. Please check your connection and try again.");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
}