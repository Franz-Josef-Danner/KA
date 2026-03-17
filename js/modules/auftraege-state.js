// -----------------------------
// Aufträge State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS } from './auftraege-config.js';
import { sanitizeText } from '../utils/sanitize.js';
import { pushState, undo as historyUndo, redo as historyRedo, canUndo, canRedo } from './history.js';

// API endpoints
const API_BASE_URL = './api';
const SAVE_AUFTRAEGE_ENDPOINT = `${API_BASE_URL}/save-auftraege.php`;
const LOAD_AUFTRAEGE_ENDPOINT = `${API_BASE_URL}/load-auftraege.php`;

// Flag to track if we're using API storage
let usingApiStorage = true;

// Initialize orders - will be loaded asynchronously
let rowsCache = null;
let initializationPromise = null;
let isInitialized = false;

/**
 * Ensure orders are initialized before use
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
 * Save orders to server via API
 */
async function saveToServer(orders) {
  try {
    const response = await fetch(SAVE_AUFTRAEGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orders),
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
    console.error('Failed to save orders to server:', error);
    return false;
  }
}

/**
 * Load orders from server via API
 */
async function loadFromServer() {
  try {
    const response = await fetch(LOAD_AUFTRAEGE_ENDPOINT, {
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
    console.error('Failed to load orders from server:', error);
    return null;
  }
}

/**
 * Load orders from server or localStorage as fallback
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
      console.warn('⚠ Failed to migrate orders to server, will continue using localStorage');
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
 * Normalize order data
 */
function normalizeData(data) {
  if (!Array.isArray(data)) return [];
  
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
      console.warn('Failed to save orders to server, falling back to localStorage');
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
