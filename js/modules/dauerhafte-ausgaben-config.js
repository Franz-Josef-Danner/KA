// -----------------------------
// Dauerhafte Ausgaben (Recurring Expenses) Configuration
// -----------------------------
export const STORAGE_KEY = "dauerhafte_ausgaben_v1";

export const COLUMNS = [
  "Ausgaben_ID",
  "Empfaenger",
  "Verwendungszweck",
  "Rechnungsnummer",
  "Betrag",
  "Kategorie", // "Privat" or "Beruflich"
  "IBAN",
  "BIC",
  "Kommentare",
  "Wiederholungszeitraum", // "Täglich", "Wöchentlich", "Monatlich", "Jährlich"
  "Beginn_Datum", // Start date when recurring expense begins
  "Stichtag" // Day of period when payment is due (e.g., day of month)
];

// Category dropdown options
export const KATEGORIE_OPTIONS = ["Privat", "Beruflich"];

// Recurrence period options
export const WIEDERHOLUNGSZEITRAUM_OPTIONS = [
  "Täglich",
  "Wöchentlich", 
  "Monatlich",
  "Jährlich"
];
