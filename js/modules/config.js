// -----------------------------
// Konfiguration
// -----------------------------
export const STORAGE_KEY = "firmen_tabelle_v1";

export const COLUMNS = [
  "Firmen_ID","Firma","Geschlecht","Titel","Vorname","Nachname","Persönlich","E-mail","Tell","Webseite",
  "Kommentare","Kategorie","Status","Adresse"
];

// Status column dropdown options
export const STATUS_OPTIONS = ["offen", "erste mail", "erster Anruf", "Laufend melden", "nein", "Kunde"];

// Geschlecht column dropdown options
export const GESCHLECHT_OPTIONS = ["Mann", "Frau"];

// Kategorie column dropdown options
export const KATEGORIE_OPTIONS = ["Produktion", "Schauspielschule", "Theater"];
