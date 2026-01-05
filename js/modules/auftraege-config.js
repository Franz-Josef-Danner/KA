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
export const STATUS_OPTIONS = ["in Arbeit", "abgeschlossen"];

// Active order statuses - used for validation (orders with these statuses are considered "active")
// Empty string included for backward compatibility with orders that don't have a status yet
export const ACTIVE_ORDER_STATUSES = ["in Arbeit", ""];

// Completed status constant
export const COMPLETED_STATUS = "abgeschlossen";

// Columns for order items (Positionen) - used for displaying multiple articles per order
export const ORDER_ITEM_COLUMNS = [
  "Artikel",
  "Beschreibung",
  "Menge",
  "Einheit",
  "Einzelpreis",
  "Gesamtpreis"
];
