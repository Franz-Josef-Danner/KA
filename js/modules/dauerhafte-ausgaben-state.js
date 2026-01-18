// -----------------------------
// Dauerhafte Ausgaben State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS } from './dauerhafte-ausgaben-config.js';
import { sanitizeText } from '../utils/sanitize.js';
import { pushState, undo as historyUndo, redo as historyRedo, canUndo, canRedo } from './history.js';

// API endpoints
const API_BASE_URL = './api';
const SAVE_ENDPOINT = `${API_BASE_URL}/save-dauerhafte-ausgaben.php`;
const LOAD_ENDPOINT = `${API_BASE_URL}/load-dauerhafte-ausgaben.php`;

// Flag to track if we're using API storage
let usingApiStorage = true;

// Initialize recurring expenses - will be loaded asynchronously
let rowsCache = null;
let initializationPromise = null;
let isInitialized = false;

/**
 * Ensure recurring expenses are initialized before use
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
 * Save recurring expenses to server via API
 */
async function saveToServer(expenses) {
  try {
    const response = await fetch(SAVE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenses),
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
    console.error('Failed to save recurring expenses to server:', error);
    return false;
  }
}

/**
 * Load recurring expenses from server via API
 */
async function loadFromServer() {
  try {
    const response = await fetch(LOAD_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown server error');
    }

    return result.data || [];
  } catch (error) {
    console.error('Failed to load recurring expenses from server:', error);
    return null;
  }
}

/**
 * Load recurring expenses from server, falling back to localStorage
 */
async function loadFromServerOrLocalStorage() {
  // Try to load from server first
  const serverData = await loadFromServer();
  
  if (serverData !== null) {
    usingApiStorage = true;
    return serverData;
  }
  
  // Fall back to localStorage
  console.log('Falling back to localStorage for recurring expenses');
  usingApiStorage = false;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save recurring expenses to localStorage
 */
function saveToLocalStorage(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

/**
 * Save recurring expenses to server or localStorage
 */
async function saveExpenses(expenses) {
  if (usingApiStorage) {
    const success = await saveToServer(expenses);
    if (!success) {
      // If server save fails, fall back to localStorage
      console.warn('Server save failed, falling back to localStorage');
      usingApiStorage = false;
      saveToLocalStorage(expenses);
    }
  } else {
    saveToLocalStorage(expenses);
  }
}

/**
 * Get all recurring expenses
 */
export function getRows() {
  if (!isInitialized) {
    console.warn('Attempting to get rows before initialization');
    return [];
  }
  return rowsCache;
}

/**
 * Set recurring expenses rows and save
 */
export function setRows(newRows) {
  rowsCache = newRows;
  pushState(newRows);
  save();
}

/**
 * Save current state
 */
export async function save() {
  await saveExpenses(rowsCache);
}

/**
 * Generate a new empty recurring expense row with default values
 */
export function newEmptyRow() {
  const row = {};
  COLUMNS.forEach(col => {
    if (col === 'Beginn_Datum') {
      // Set default start date to today
      row[col] = new Date().toISOString().split('T')[0];
    } else if (col === 'Kategorie') {
      row[col] = 'Beruflich';
    } else if (col === 'Betrag') {
      row[col] = '0.00';
    } else if (col === 'Ausgaben_ID') {
      // Generate a unique ID
      row[col] = `DAUS-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    } else if (col === 'Wiederholungszeitraum') {
      row[col] = 'Monatlich';
    } else if (col === 'Stichtag') {
      // Default to 1st of month for monthly, or current day for others
      row[col] = '1';
    } else {
      row[col] = '';
    }
  });
  return row;
}

/**
 * Delete a recurring expense by index
 */
export function deleteRow(idx) {
  const newRows = rowsCache.filter((_, i) => i !== idx);
  setRows(newRows);
}

/**
 * Update a single recurring expense field
 */
export function updateCell(rowIdx, col, value) {
  // Sanitize the value
  const sanitizedValue = sanitizeText(value);
  
  const newRows = [...rowsCache];
  newRows[rowIdx] = { ...newRows[rowIdx], [col]: sanitizedValue };
  setRows(newRows);
}

/**
 * Update an entire recurring expense row
 */
export function updateRow(rowIdx, updatedRow) {
  // Sanitize all text fields
  const sanitizedRow = {};
  for (const key in updatedRow) {
    sanitizedRow[key] = sanitizeText(updatedRow[key]);
  }
  
  const newRows = [...rowsCache];
  newRows[rowIdx] = sanitizedRow;
  setRows(newRows);
}

/**
 * Undo last change
 */
export function undo() {
  const previousState = historyUndo();
  if (previousState !== null) {
    rowsCache = previousState;
    save();
    return true;
  }
  return false;
}

/**
 * Redo last undone change
 */
export function redo() {
  const nextState = historyRedo();
  if (nextState !== null) {
    rowsCache = nextState;
    save();
    return true;
  }
  return false;
}

/**
 * Check if undo is available
 */
export function isUndoAvailable() {
  return canUndo();
}

/**
 * Check if redo is available
 */
export function isRedoAvailable() {
  return canRedo();
}
