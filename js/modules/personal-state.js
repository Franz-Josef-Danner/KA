// -----------------------------
// Personal (Personnel) State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS } from './personal-config.js';
import { sanitizeText } from '../utils/sanitize.js';

// API endpoints
const API_BASE_URL = './api';
const SAVE_ENDPOINT = `${API_BASE_URL}/save-personal.php`;
const LOAD_ENDPOINT = `${API_BASE_URL}/load-personal.php`;

// Flag to track if we're using API storage
let usingApiStorage = true;

// State
let rowsCache = [];
let initializationPromise = null;
let isInitialized = false;

// ── Initialization ────────────────────────────────────────────────────────────

export async function ensureInitialized() {
  if (initializationPromise) return initializationPromise;
  if (isInitialized) return;

  initializationPromise = (async () => {
    rowsCache = await loadFromServerOrLocalStorage();
    isInitialized = true;
  })();

  await initializationPromise;
  initializationPromise = null;
}

// ── Server / localStorage I/O ─────────────────────────────────────────────────

async function saveToServer(data) {
  try {
    const response = await fetch(SAVE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Unknown server error');
    return true;
  } catch (error) {
    console.error('Failed to save personnel to server:', error);
    return false;
  }
}

async function loadFromServer() {
  try {
    const response = await fetch(LOAD_ENDPOINT, { method: 'GET' });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Unknown server error');
    return result.data || [];
  } catch (error) {
    console.error('Failed to load personnel from server:', error);
    return null;
  }
}

async function loadFromServerOrLocalStorage() {
  const serverData = await loadFromServer();
  if (serverData !== null) {
    usingApiStorage = true;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData)); } catch (_) {}
    return normalizeRows(serverData);
  }

  usingApiStorage = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeRows(JSON.parse(raw)) : [];
  } catch (_) {
    return [];
  }
}

// ── Normalization ─────────────────────────────────────────────────────────────

function normalizeRows(data) {
  if (!Array.isArray(data)) return [];
  return data.map(r => {
    const row = newEmptyRow();
    for (const c of COLUMNS) {
      row[c] = sanitizeText(r?.[c] ?? "");
    }
    return row;
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getRows() {
  return rowsCache;
}

export async function setRows(newRows) {
  rowsCache = newRows;
  await save();
}

export async function save() {
  if (usingApiStorage) {
    const success = await saveToServer(rowsCache);
    if (!success) {
      console.warn('Server save failed, falling back to localStorage');
      usingApiStorage = false;
    }
  }
  if (!usingApiStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rowsCache));
    } catch (error) {
      console.error('Failed to save personnel to localStorage:', error);
    }
  }
  // Also keep localStorage cache in sync when using API
  if (usingApiStorage) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rowsCache)); } catch (_) {}
  }
}

export function newEmptyRow() {
  const row = {};
  for (const c of COLUMNS) {
    row[c] = "";
  }
  return row;
}

/** Generate a unique Personal_ID */
export function generateId() {
  const rows = getRows();
  let max = 0;
  rows.forEach(r => {
    if (r.Personal_ID && r.Personal_ID.startsWith('P-')) {
      const n = parseInt(r.Personal_ID.slice(2), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return `P-${(max + 1).toString().padStart(5, '0')}`;
}

export function deleteRow(idx) {
  const newRows = rowsCache.filter((_, i) => i !== idx);
  return setRows(newRows);
}

export function updateRow(idx, updatedRow) {
  const sanitized = {};
  for (const key in updatedRow) {
    sanitized[key] = sanitizeText(updatedRow[key]);
  }
  const newRows = [...rowsCache];
  newRows[idx] = sanitized;
  return setRows(newRows);
}
