// -----------------------------
// Planung (Planning) Configuration
// -----------------------------

export const STORAGE_KEY = "planung_tabelle_v1";

export const COLUMNS = [
  "Auftrags_ID",
  "Projekt",
  "Firma",
  "Abgabedatum",
  "Drehbeginn",
  "Drehende",
  "Drehtage",
  "DrehtagDaten",
  "Drehorte",
  "BenoetigteDepartments",
  "Planungsstatus",
  "Verantwortlicher",
  "PersonalZugewiesen",
  "EquipmentBestaetigt",
  "LocationBestaetigt",
  "Notizen",
  "erstelltAm"
];

export const PLANUNGSSTATUS_OPTIONS = [
  "Offen",
  "In Vorbereitung",
  "Bereit",
  "Abgeschlossen"
];

export const BESTAETIGT_OPTIONS = ["Ausstehend", "Ja", "Nein"];
