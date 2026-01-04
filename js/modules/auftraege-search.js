// -----------------------------
// Aufträge Search Functionality
// -----------------------------
import { COLUMNS } from './auftraege-config.js';

export function rowMatchesSearch(row, q) {
  if (!q) return true;
  const hay = COLUMNS.map(c => String(row[c] ?? "")).join(" ").toLowerCase();
  return hay.includes(q);
}
