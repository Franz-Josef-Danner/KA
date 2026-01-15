// -----------------------------
// Rechnungen (Invoices) Configuration
// -----------------------------
export const STORAGE_KEY = "rechnungen_tabelle_v1";

export const COLUMNS = [
  "Rechnungs_ID",
  "Rechnungsdatum",
  "Firma",
  "Firmen_Email",
  "Ansprechpartner",
  "Artikel",
  "Gesamtsumme",
  "Projekt",
  "Kommentare",
  "Auftrags_ID", // Reference to original order
  "Bezahlt", // Payment status: "unbezahlt" or "bezahlt"
  // Hidden columns (stored but not displayed in table)
  "Firmenadresse",
  "Beschreibung",
  "Rabatt"
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
