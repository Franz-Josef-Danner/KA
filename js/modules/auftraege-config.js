// -----------------------------
// Aufträge (Orders) Configuration
// -----------------------------
export const STORAGE_KEY = "auftraege_tabelle_v1";

export const COLUMNS = [
  "Auftrags_ID",
  "Auftragsdatum",
  "Firma",
  "Firmen_ID", // Company ID reference for payment terms and other company-specific data
  "Firmenadresse",
  "Firmen_Email",
  "Ansprechpartner",
  "Artikel",
  "Beschreibung",
  "Budget",
  "Projekt",
  "Status",
  "Kommentare",
  "Rabatt"
];

// Status column dropdown options (currently hidden from UI, status is automated)
export const STATUS_OPTIONS = ["in Arbeit", "abgeschlossen"];

// Active order statuses - used for validation (orders with these statuses are considered "active")
// "offen" is included only for backward compatibility with legacy data and will be auto-converted to "in Arbeit"
// Empty string is included for backward compatibility with orders that don't have a status yet
export const ACTIVE_ORDER_STATUSES = ["in Arbeit", "", "offen"];

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
