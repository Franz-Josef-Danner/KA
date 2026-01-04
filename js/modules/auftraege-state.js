// -----------------------------
// Aufträge State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS, STATUS_OPTIONS } from './auftraege-config.js';
import { sanitizeText } from '../utils/sanitize.js';
import { pushState, undo as historyUndo, redo as historyRedo, canUndo, canRedo } from './history.js';

let rows = load() ?? [];

// Initialize history with the loaded state
pushState(rows);

export function getRows() {
  return rows;
}

export function setRows(newRows, skipHistory = false) {
  rows = newRows;
  if (!skipHistory) {
    pushState(rows);
  }
}

export function newEmptyRow() {
  const obj = {};
  for (const c of COLUMNS) {
    // Set default values
    if (c === "Status") {
      obj[c] = "offen";
    } else if (c === "Auftragsdatum") {
      // Set today's date in YYYY-MM-DD format
      obj[c] = new Date().toISOString().split('T')[0];
    } else if (c === "Auftrags_ID") {
      // Generate a simple unique ID
      obj[c] = "AUF-" + Date.now();
    } else {
      obj[c] = "";
    }
  }
  return obj;
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    return true;
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
    alert('Fehler beim Speichern: Daten konnten nicht gespeichert werden. Bitte überprüfen Sie die Speichereinstellungen Ihres Browsers.');
    return false;
  }
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;

    // Normalize: ensure all columns exist
    return data.map(r => {
      const row = {};
      for (const c of COLUMNS) {
        row[c] = sanitizeText(r?.[c] ?? "");
        // Normalize Status: trim whitespace and validate
        if (c === "Status") {
          row[c] = row[c].trim();
          // If empty or not in STATUS_OPTIONS, default to "offen"
          if (!row[c] || !STATUS_OPTIONS.includes(row[c])) {
            row[c] = "offen";
          }
        }
      }
      return row;
    });
  } catch {
    return null;
  }
}

// Undo/Redo functions
export function undo() {
  const previousState = historyUndo();
  if (previousState) {
    setRows(previousState, true);
    save();
    return true;
  }
  return false;
}

export function redo() {
  const nextState = historyRedo();
  if (nextState) {
    setRows(nextState, true);
    save();
    return true;
  }
  return false;
}

export { canUndo, canRedo };
