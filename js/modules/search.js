// -----------------------------
// Search Functionality
// -----------------------------
import { COLUMNS } from './config.js';

/**
 * Returns true if the row matches the search query.
 * @param {Object} row - The data row to check.
 * @param {string} q - The lowercase search query.
 * @param {string[]} [selectedColumns] - Columns to search in. Searches all columns when empty or omitted.
 */
export function rowMatchesSearch(row, q, selectedColumns) {
  if (!q) return true;
  const cols = (selectedColumns && selectedColumns.length > 0) ? selectedColumns : COLUMNS;
  const hay = cols.map(c => String(row[c] ?? "")).join(" ").toLowerCase();
  return hay.includes(q);
}
