// -----------------------------
// Ausgaben Search Module
// -----------------------------

/**
 * Check if a row matches the search query
 * @param {Object} row - The expense row
 * @param {string} q - The search query (lowercase)
 * @returns {boolean} - True if the row matches the search query
 */
export function rowMatchesSearch(row, q) {
  if (!q) return true;
  
  const searchableFields = [
    'Ausgaben_ID',
    'Empfaenger',
    'Verwendungszweck',
    'Rechnungsnummer',
    'Betrag',
    'Kategorie',
    'Status',
    'Kommentare'
  ];
  
  return searchableFields.some(field => {
    const value = row[field] || '';
    return String(value).toLowerCase().includes(q);
  });
}
