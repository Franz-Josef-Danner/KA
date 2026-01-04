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
  "Projekt",
  "Status",
  "Kommentare"
];

// Status column dropdown options
export const STATUS_OPTIONS = ["offen", "in Bearbeitung", "abgeschlossen", "storniert"];

// Active order statuses - used for validation (orders with these statuses are considered "active")
export const ACTIVE_ORDER_STATUSES = ["offen", "in Bearbeitung", ""];

// Columns for order items (Positionen) - used for displaying multiple articles per order
export const ORDER_ITEM_COLUMNS = [
  "Artikel",
  "Beschreibung",
  "Menge",
  "Einheit",
  "Einzelpreis",
  "Gesamtpreis"
];
