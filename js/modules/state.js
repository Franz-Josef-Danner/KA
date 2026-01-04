// -----------------------------
// State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS, STATUS_OPTIONS } from './config.js';
import { sanitizeText } from '../utils/sanitize.js';
import { pushState, undo as historyUndo, redo as historyRedo, canUndo, canRedo } from './history.js';

let rows = load() ?? [];

// Initialize history with the loaded state
pushState(rows);

export function getRows() {
  return rows;
}

/**
 * Sync Firmen_ID based on Status: assign ID if Status is "Kunde", remove otherwise
 * @param {Array} rowsToSync - Rows to synchronize IDs for
 * @returns {Array} - Rows with synchronized IDs
 */
function syncFirmenIds(rowsToSync) {
  // First pass: find the highest existing ID to avoid duplicates
  let maxId = 0;
  rowsToSync.forEach(row => {
    if (row.Firmen_ID && row.Firmen_ID.startsWith('F-')) {
      const idNum = parseInt(row.Firmen_ID.substring(2), 10);
      if (!isNaN(idNum) && idNum > maxId) {
        maxId = idNum;
      }
    }
  });
  
  // Second pass: assign or remove IDs
  return rowsToSync.map(row => {
    if (row.Status === 'Kunde') {
      // If status is "Kunde" and no ID exists, generate one
      if (!row.Firmen_ID || row.Firmen_ID.trim() === '') {
        maxId += 1;
        row.Firmen_ID = `F-${maxId.toString().padStart(5, '0')}`;
      }
    } else {
      // If status is not "Kunde", remove any existing ID
      row.Firmen_ID = '';
    }
    return row;
  });
}

export function setRows(newRows, skipHistory = false) {
  // Sync Firmen_IDs based on Status before setting rows
  rows = syncFirmenIds(newRows);
  if (!skipHistory) {
    pushState(rows);
  }
}

export function newEmptyRow() {
  const obj = {};
  for (const c of COLUMNS) {
    // Set default value for Status column
    obj[c] = (c === "Status") ? "offen" : "";
  }
  return obj;
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    return true;
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
    // Show user-friendly error message
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
    const normalizedRows = data.map(r => {
      const row = newEmptyRow();
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
    
    // Sync Firmen_IDs based on Status after loading
    return syncFirmenIds(normalizedRows);
  } catch {
    return null;
  }
}

// Undo/Redo functions
/**
 * Undo to previous state
 * @returns {boolean} - True if history operation succeeded (does NOT indicate save success)
 */
export function undo() {
  const previousState = historyUndo();
  if (previousState) {
    setRows(previousState, true);
    save(); // Best-effort save; user is notified via alert if it fails
    return true;
  }
  return false;
}

/**
 * Redo to next state
 * @returns {boolean} - True if history operation succeeded (does NOT indicate save success)
 */
export function redo() {
  const nextState = historyRedo();
  if (nextState) {
    setRows(nextState, true);
    save(); // Best-effort save; user is notified via alert if it fails
    return true;
  }
  return false;
}

export { canUndo, canRedo };
