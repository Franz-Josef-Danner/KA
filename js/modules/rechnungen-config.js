// -----------------------------
// Rechnungen (Invoices) Configuration
// -----------------------------
export const STORAGE_KEY = "rechnungen_tabelle_v1";

export const COLUMNS = [
  "Rechnungs_ID",
  "Rechnungsdatum",
  "Firma",
  "Firmenadresse",
  "Firmen_Email",
  "Ansprechpartner",
  "Artikel",
  "Beschreibung",
  "Budget",
  "Projekt",
  "Kommentare",
  "Auftrags_ID" // Reference to original order
];

// Columns for invoice items (Positionen)
export const INVOICE_ITEM_COLUMNS = [
  "Artikel",
  "Beschreibung",
  "Menge",
  "Einheit",
  "Einzelpreis",
  "Gesamtpreis"
];
