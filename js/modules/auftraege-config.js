// -----------------------------
// Aufträge (Orders) Configuration
// -----------------------------
export const STORAGE_KEY = "auftraege_tabelle_v1";

export const COLUMNS = [
  "Auftrags_ID",
  "Auftragsdatum",
  "Firma",
  "Ansprechpartner",
  "Beschreibung",
  "Budget",
  "Status",
  "Fälligkeit",
  "Kommentare"
];

// Status column dropdown options
export const STATUS_OPTIONS = ["offen", "in Bearbeitung", "abgeschlossen", "storniert"];
