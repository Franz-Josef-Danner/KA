// -----------------------------
// State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS, STATUS_OPTIONS } from './config.js';
import { sanitizeText } from '../utils/sanitize.js';
import { pushState, undo as historyUndo, redo as historyRedo, canUndo, canRedo } from './history.js';
import { createEmptyArtikelliste, deleteArtikelliste, artikellisteExists } from './artikellisten-state.js';
import { createOrUpdateCustomerAccount, deleteCustomerAccount } from './auth.js';
import { notifyNewCustomer } from './email-notifications.js';
import { isEmailConfigured } from './email-config.js';

let rows = loadSync() ?? [];

// Initialize history with the loaded state
pushState(rows);

export function getRows() {
  return rows;
}

/**
 * Sync Firmen_ID based on Status: assign ID if Status is "Kunde", remove otherwise
 * Also creates/deletes article lists and customer accounts accordingly
 * @param {Array} rowsToSync - Rows to synchronize IDs for
 * @returns {Array} - Rows with synchronized IDs
 */
async function syncFirmenIds(rowsToSync) {
  // First pass: find the highest existing ID to avoid duplicates
  let maxId = 0;
  rowsToSync.forEach(row => {
    if (row.Firmen_ID && typeof row.Firmen_ID === 'string' && row.Firmen_ID.startsWith('F-')) {
      const idNum = parseInt(row.Firmen_ID.substring(2), 10);
      if (!isNaN(idNum) && idNum > maxId) {
        maxId = idNum;
      }
    }
  });
  
  // Second pass: assign or remove IDs and manage article lists + customer accounts
  const updatedRows = [];
  for (const row of rowsToSync) {
    if (row.Status === 'Kunde') {
      // If status is "Kunde" and no ID exists, generate one
      const idStr = typeof row.Firmen_ID === 'string' ? row.Firmen_ID : '';
      const isNewCustomer = !idStr || idStr.trim() === '';
      if (isNewCustomer) {
        maxId += 1;
        row.Firmen_ID = `F-${maxId.toString().padStart(5, '0')}`;
        // Create empty article list for new customer
        const firmenName = row.Firma || 'Unbekannt';
        createEmptyArtikelliste(row.Firmen_ID, firmenName);
        // Create customer account
        const email = row['E-mail'] || '';
        if (email) {
          await createOrUpdateCustomerAccount(row.Firmen_ID, email, firmenName);
        }
        // Send email notification for new customer
        const notificationResult = notifyNewCustomer({
          firma: firmenName,
          ansprechpartner: row.Ansprechpartner || '',
          email: email,
          telefon: row.Telefon || ''
        });
        
        // Show warning if notification was not queued
        if (!notificationResult) {
          if (!isEmailConfigured()) {
            console.warn('E-Mail-Benachrichtigung für neuen Kunden nicht gesendet: E-Mail-Benachrichtigungen sind nicht aktiviert.');
          } else {
            console.warn('E-Mail-Benachrichtigung für neuen Kunden konnte nicht versendet werden.');
          }
        }
      } else {
        // Customer already has ID - ensure article list and account exist
        if (!artikellisteExists(idStr)) {
          const firmenName = row.Firma || 'Unbekannt';
          createEmptyArtikelliste(idStr, firmenName);
        }
        // Update or create customer account
        const email = row['E-mail'] || '';
        if (email) {
          await createOrUpdateCustomerAccount(idStr, email, row.Firma || 'Unbekannt');
        }
      }
    } else {
      // If status is not "Kunde", remove any existing ID, article list, and customer account
      const oldId = row.Firmen_ID;
      if (oldId && typeof oldId === 'string' && oldId.trim() !== '') {
        deleteArtikelliste(oldId);
        deleteCustomerAccount(oldId);
      }
      row.Firmen_ID = '';
    }
    updatedRows.push(row);
  }
  return updatedRows;
}

export async function setRows(newRows, skipHistory = false) {
  // Sync Firmen_IDs based on Status before setting rows
  rows = await syncFirmenIds(newRows);
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

// Synchronous load (doesn't update customer accounts)
function loadSync() {
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
    
    return normalizedRows;
  } catch {
    return null;
  }
}

export async function load() {
  const normalizedRows = loadSync();
  if (!normalizedRows) return null;
  
  // Sync Firmen_IDs based on Status after loading
  return await syncFirmenIds(normalizedRows);
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
