// -----------------------------
// Display Formatting Utilities
// -----------------------------
import { sanitizeText, escapeHtml, escapeAttr } from './sanitize.js';

export function toCellDisplay(col, value) {
  const v = sanitizeText(value).trim();
  if (!v) return "";

  if (col === "E-mail") {
    // Anzeige als Link (Speicher bleibt Text)
    const email = v;
    return `<a href="mailto:${escapeAttr(email)}">${escapeHtml(email)}</a>`;
  }
  if (col === "Webseite") {
    let url = v;
    // wenn ohne Schema, für Linkanzeige ergänzen
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(v)}</a>`;
  }
  return escapeHtml(v);
}
