// -----------------------------
// Rechnungen State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS } from './rechnungen-config.js';
import { sanitizeText } from '../utils/sanitize.js';
import { pushState, undo as historyUndo, redo as historyRedo, canUndo, canRedo } from './history.js';

// API endpoints
const API_BASE_URL = './api';
const SAVE_RECHNUNGEN_ENDPOINT = `${API_BASE_URL}/save-rechnungen.php`;
const LOAD_RECHNUNGEN_ENDPOINT = `${API_BASE_URL}/load-rechnungen.php`;

// Flag to track if we're using API storage
let usingApiStorage = true;

// Initialize invoices - will be loaded asynchronously
let rowsCache = null;
let initializationPromise = null;
let isInitialized = false;

/**
 * Ensure invoices are initialized before use
 */
export async function ensureInitialized() {
  // If already initializing, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // If already initialized, return immediately
  if (isInitialized) {
    return;
  }
  
  // Start initialization and store the promise
  initializationPromise = (async () => {
    rowsCache = await loadFromServerOrLocalStorage();
    isInitialized = true;
    // Initialize history with the loaded state
    pushState(rowsCache);
  })();
  
  await initializationPromise;
  initializationPromise = null; // Clear after completion
}

/**
 * Save invoices to server via API
 */
async function saveToServer(invoices) {
  try {
    const response = await fetch(SAVE_RECHNUNGEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoices),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown server error');
    }

    return true;
  } catch (error) {
    console.error('Failed to save invoices to server:', error);
    return false;
  }
}

/**
 * Load invoices from server via API
 */
async function loadFromServer() {
  try {
    const response = await fetch(LOAD_RECHNUNGEN_ENDPOINT, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown server error');
    }

    return result.data;
  } catch (error) {
    console.error('Failed to load invoices from server:', error);
    return null;
  }
}

/**
 * Load invoices from server or localStorage as fallback
 * Migrates data from localStorage to server if needed
 */
async function loadFromServerOrLocalStorage() {
  // Try to load from server first
  const serverData = await loadFromServer();
  
  if (serverData !== null) {
    // Server responded (even if with empty data), use it
    usingApiStorage = true;
    // Normalize and update localStorage cache
    const normalized = normalizeData(serverData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      console.warn('Failed to update localStorage cache:', e);
    }
    return normalized;
  }
  
  // Server failed to respond, check if we have data in localStorage
  const localData = loadSync();
  if (localData && localData.length > 0) {
    // Try to save to server
    const migrationSuccess = await saveToServer(localData);
    if (migrationSuccess) {
      usingApiStorage = true;
    } else {
      console.warn('⚠ Failed to migrate invoices to server, will continue using localStorage');
      usingApiStorage = false;
    }
    return localData;
  }
  
  // No data found anywhere, return empty array
  usingApiStorage = true; // Assume API is available for new data
  return [];
}

/**
 * Synchronous load from localStorage (doesn't update from server)
 */
function loadSync() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;
    return normalizeData(data);
  } catch {
    return null;
  }
}

/**
 * Normalize invoice data
 */
function normalizeData(data) {
  if (!Array.isArray(data)) return [];
  
  return data.map(r => {
    const row = {};
    for (const c of COLUMNS) {
      row[c] = sanitizeText(r?.[c] ?? "");
    }
    // Initialize items array if not present (backward compatibility)
    row.items = Array.isArray(r?.items) ? r.items : [];
    // Set default Bezahlt status if not present (backward compatibility)
    if (!row.Bezahlt) {
      row.Bezahlt = "unbezahlt";
    }
    return row;
  });
}

export function getRows() {
  return rowsCache || [];
}

export function setRows(newRows, skipHistory = false) {
  rowsCache = newRows;
  if (!skipHistory) {
    pushState(rowsCache);
  }
}

export function newEmptyRow() {
  const obj = {};
  for (const c of COLUMNS) {
    // Set default values
    if (c === "Rechnungsdatum") {
      // Set today's date in YYYY-MM-DD format
      obj[c] = new Date().toISOString().split('T')[0];
    } else if (c === "Rechnungs_ID") {
      // Leave empty - will be generated
      obj[c] = "";
    } else if (c === "Bezahlt") {
      // Set default payment status to "unbezahlt"
      obj[c] = "unbezahlt";
    } else {
      obj[c] = "";
    }
  }
  // Add items array for invoice items (Positionen)
  obj.items = [];
  return obj;
}

// Create a new empty invoice item
export function newEmptyInvoiceItem() {
  return {
    Datum: new Date().toISOString().split('T')[0],
    Artikel: "",
    Beschreibung: "",
    Menge: "",
    Einheit: "",
    Einzelpreis: "",
    Gesamtpreis: ""
  };
}

export async function save() {
  let saveSuccess = false;
  
  // Try to save to server if using API storage
  if (usingApiStorage) {
    saveSuccess = await saveToServer(rowsCache);
    if (!saveSuccess) {
      console.warn('Failed to save invoices to server, falling back to localStorage');
      usingApiStorage = false;
    }
  }
  
  // If API failed or we're not using API storage, use localStorage
  if (!usingApiStorage || !saveSuccess) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rowsCache));
      saveSuccess = true;
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      alert('Fehler beim Speichern: Daten konnten nicht gespeichert werden. Bitte überprüfen Sie die Speichereinstellungen Ihres Browsers.');
      return false;
    }
  }
  
  // Also update localStorage cache even when using API
  if (usingApiStorage && saveSuccess) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rowsCache));
    } catch (e) {
      console.warn('Failed to update localStorage cache:', e);
    }
  }
  
  return saveSuccess;
}

export function load() {
  // This is kept for backward compatibility but should not be used
  // Use ensureInitialized() instead
  return loadSync();
}

// Undo/Redo functions
export async function undo() {
  const previousState = historyUndo();
  if (previousState) {
    setRows(previousState, true);
    await save();
    return true;
  }
  return false;
}

export async function redo() {
  const nextState = historyRedo();
  if (nextState) {
    setRows(nextState, true);
    await save();
    return true;
  }
  return false;
}

export { canUndo, canRedo };
