// -----------------------------
// Ausgaben (Expenses) Configuration
// -----------------------------
export const STORAGE_KEY = "ausgaben_tabelle_v1";

export const COLUMNS = [
  "Ausgaben_ID",
  "Datum",
  "Empfaenger",
  "Verwendungszweck",
  "Rechnungsnummer",
  "Betrag",
  "Kategorie", // "Privat" or "Beruflich"
  "Status", // "bezahlt" or "unbezahlt"
  "Kommentare"
];

// Category dropdown options
export const KATEGORIE_OPTIONS = ["Privat", "Beruflich"];

// Status dropdown options
export const STATUS_OPTIONS = ["unbezahlt", "bezahlt"];
