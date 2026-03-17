// -----------------------------
// Personal (Personnel) Configuration
// -----------------------------
export const STORAGE_KEY = "personal_tabelle_v1";

export const DEPARTMENTS = [
  "Produktion",
  "Regie",
  "Kamera",
  "Licht",
  "Ton",
  "Postproduktion",
  "Maske / Kostüm",
  "Location Management",
  "Transport / Logistik",
  "Casting",
  "Stunts",
  "Catering",
  "Requisite",
  "Bühnenbild"
];

export const COLUMNS = [
  "Personal_ID",
  "Vorname",
  "Nachname",
  "Department",
  "Rolle",
  "Telefon",
  "Email",
  "Tagessatz",
  "Kommentare"
];

// Columns shown in the table (all except ID which is shown as badge)
export const TABLE_COLUMNS = [
  "Vorname",
  "Nachname",
  "Department",
  "Rolle",
  "Telefon",
  "Email",
  "Tagessatz"
];
