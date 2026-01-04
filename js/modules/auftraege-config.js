// -----------------------------
// Aufträge (Orders) Configuration
// -----------------------------
export const STORAGE_KEY = "auftraege_tabelle_v1";

export const COLUMNS = [
  "Auftrags_ID",
  "Auftragsdatum",
  "Firma",
  "Ansprechpartner",
  "Artikel",
  "Beschreibung",
  "Budget",
  "Status",
  "Fälligkeit",
  "Kommentare"
];

// Status column dropdown options
export const STATUS_OPTIONS = ["offen", "in Bearbeitung", "abgeschlossen", "storniert"];

// Columns for order items (Positionen) - used for displaying multiple articles per order
export const ORDER_ITEM_COLUMNS = [
  "Artikel",
  "Beschreibung",
  "Menge",
  "Einheit",
  "Einzelpreis",
  "Gesamtpreis"
];
