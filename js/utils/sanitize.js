// -----------------------------
// Sanitization and Escaping Utilities
// -----------------------------
export function sanitizeText(s) {
  return String(s ?? "").replace(/\u0000/g, "");
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

export function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`","&#096;");
}
