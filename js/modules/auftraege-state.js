// -----------------------------
// Aufträge State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS } from './auftraege-config.js';
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
    if (c === "Auftragsdatum") {
      // Set today's date in YYYY-MM-DD format
      obj[c] = new Date().toISOString().split('T')[0];
    } else if (c === "Auftrags_ID") {
      // Leave empty - will be generated when company is selected
      obj[c] = "";
    } else if (c === "Status") {
      // Default status is "in Arbeit" (automatically set for all new orders)
      obj[c] = "in Arbeit";
    } else {
      obj[c] = "";
    }
  }
  // Add items array for order items (Positionen)
  obj.items = [];
  return obj;
}

// Create a new empty order item
export function newEmptyOrderItem() {
  return {
    Artikel: "",
    Beschreibung: "",
    Menge: "",
    Einheit: "",
    Einzelpreis: "",
    Gesamtpreis: ""
  };
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
      }
      // Set default Status if not present (backward compatibility)
      // Also convert "offen" to "in Arbeit" for legacy orders
      if (!row.Status || row.Status === "offen") {
        row.Status = "in Arbeit";
      }
      // Initialize items array if not present (backward compatibility)
      row.items = Array.isArray(r?.items) ? r.items : [];
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
