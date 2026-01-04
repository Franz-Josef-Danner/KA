// -----------------------------
// Rechnungen Search Module
// -----------------------------

// Check if a row matches search query
export function rowMatchesSearch(row, query) {
  if (!query) return true;
  
  const searchableFields = [
    row.Rechnungs_ID,
    row.Firma,
    row.Beschreibung,
    row.Projekt,
    row.Ansprechpartner,
    row.Kommentare,
    row.Auftrags_ID
  ];
  
  const searchText = searchableFields.join(" ").toLowerCase();
  return searchText.includes(query);
}
