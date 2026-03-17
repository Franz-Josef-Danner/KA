// -----------------------------
// Planung State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS } from './planung-config.js';

const API_BASE_URL = './api';
const SAVE_ENDPOINT = `${API_BASE_URL}/save-planung.php`;
const LOAD_ENDPOINT = `${API_BASE_URL}/load-planung.php`;

let usingApiStorage = true;
let rowsCache = null;
let initializationPromise = null;
let isInitialized = false;

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
    console.error('Failed to save planung to server:', error);
    return false;
  }
}

async function loadFromServer() {
  try {
    const response = await fetch(LOAD_ENDPOINT, { method: 'GET' });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Unknown server error');
    return result.data;
  } catch (error) {
    console.error('Failed to load planung from server:', error);
    return null;
  }
}

async function loadFromServerOrLocalStorage() {
  const serverData = await loadFromServer();
  if (serverData !== null) {
    usingApiStorage = true;
    const normalized = normalizeData(serverData);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); } catch (e) { /* ignore */ }
    return normalized;
  }

  const localData = loadSync();
  if (localData && localData.length > 0) {
    const ok = await saveToServer(localData);
    usingApiStorage = ok;
    return localData;
  }

  usingApiStorage = true;
  return [];
}

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

function normalizeData(data) {
  if (!Array.isArray(data)) return [];
  return data.map(r => {
    const row = {};
    for (const c of COLUMNS) {
      row[c] = r?.[c] ?? "";
    }
    return row;
  });
}

export function getRows() {
  return rowsCache || [];
}

export function setRows(newRows) {
  rowsCache = newRows;
}

export async function save() {
  let saveSuccess = false;

  if (usingApiStorage) {
    saveSuccess = await saveToServer(rowsCache);
    if (!saveSuccess) {
      usingApiStorage = false;
    }
  }

  if (!usingApiStorage || !saveSuccess) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rowsCache));
      saveSuccess = true;
    } catch (error) {
      console.error('Failed to save planung to localStorage:', error);
      alert('Fehler beim Speichern der Planungsdaten.');
      return false;
    }
  }

  if (usingApiStorage && saveSuccess) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rowsCache)); } catch (e) { /* ignore */ }
  }

  return saveSuccess;
}

/**
 * Create a new Planung entry from a Großauftrag data object.
 * Returns the new entry (does NOT save – caller must call save()).
 */
export function createPlanungFromGrossauftrag(grossauftragData) {
  return {
    Auftrags_ID:          grossauftragData.Auftrags_ID || "",
    Projekt:              grossauftragData.Projekt || "",
    Firma:                grossauftragData.Firma || "",
    Abgabedatum:          grossauftragData.Abgabedatum || "",
    Drehbeginn:           grossauftragData.Drehbeginn || "",
    Drehende:             grossauftragData.Drehende || "",
    Drehtage:             grossauftragData.Drehtage || "",
    DrehtagDaten:         grossauftragData.DrehtagDaten || "",
    Drehorte:             grossauftragData.Drehorte || "",
    BenoetigteDepartments: grossauftragData.BenoetigteDepartments || "",
    Planungsstatus:       "Offen",
    Verantwortlicher:     "",
    PersonalZugewiesen:   "",
    EquipmentBestaetigt:  "Ausstehend",
    LocationBestaetigt:   "Ausstehend",
    Notizen:              "",
    erstelltAm:           new Date().toISOString().split('T')[0],
  };
}
