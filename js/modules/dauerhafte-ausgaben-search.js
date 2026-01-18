// -----------------------------
// Dauerhafte Ausgaben Search Module
// -----------------------------
import { COLUMNS } from './dauerhafte-ausgaben-config.js';

/**
 * Check if a row matches the search query
 * Searches across all columns
 */
export function rowMatchesSearch(row, query) {
  if (!query) return true;
  
  const lowerQuery = query.toLowerCase();
  
  return COLUMNS.some(col => {
    const value = row[col];
    if (value === null || value === undefined) return false;
    return String(value).toLowerCase().includes(lowerQuery);
  });
}
