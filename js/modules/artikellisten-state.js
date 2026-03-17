// -----------------------------
// Artikellisten State Management
// -----------------------------
import { ARTIKELLISTEN_STORAGE_KEY, DEFAULT_ZAHLUNGSZIEL_TAGE } from './artikellisten-config.js';

// API endpoints
const API_BASE_URL = './api';
const SAVE_ENDPOINT = `${API_BASE_URL}/save-artikellisten.php`;
const LOAD_ENDPOINT = `${API_BASE_URL}/load-artikellisten.php`;

// Flag to track if we're using API storage
let usingApiStorage = true;

// Initialize article lists - will be loaded asynchronously
let artikellisten = {};
let initializationPromise = null;
let isInitialized = false;

/**
 * Ensure state is initialized before use
 */
async function ensureInitialized() {
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
    artikellisten = await loadFromServerOrLocalStorage();
    isInitialized = true;
  })();
  
  await initializationPromise;
  initializationPromise = null; // Clear after completion
}

/**
 * Save data to server via API
 * @param {Object} data - Data to save
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function saveToServer(data) {
  try {
    const response = await fetch(SAVE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
    console.error('Failed to save article lists to server:', error);
    return false;
  }
}

/**
 * Load data from server via API
 * @returns {Promise<Object|null>} - Data object or null if failed
 */
async function loadFromServer() {
  try {
    const response = await fetch(LOAD_ENDPOINT, {
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
    console.error('Failed to load article lists from server:', error);
    return null;
  }
}

/**
 * Load data from server or localStorage as fallback
 * Migrates data from localStorage to server if needed
 * @returns {Promise<Object>} - Data object (empty object if no data found)
 */
async function loadFromServerOrLocalStorage() {
  // Try to load from server first
  const serverData = await loadFromServer();
  
  if (serverData !== null) {
    // Server responded (even if with empty data), use it
    usingApiStorage = true;
    // Update localStorage cache
    try {
      localStorage.setItem(ARTIKELLISTEN_STORAGE_KEY, JSON.stringify(serverData));
    } catch (e) {
      console.warn('Failed to update localStorage cache:', e);
    }
    return serverData;
  }
  
  // Server failed to respond, check if we have data in localStorage
  const localData = loadSync();
  if (localData && Object.keys(localData).length > 0) {
    // Try to save to server
    const migrationSuccess = await saveToServer(localData);
    if (migrationSuccess) {
      usingApiStorage = true;
    } else {
      console.warn('⚠ Failed to migrate article lists to server, will continue using localStorage');
      usingApiStorage = false;
    }
    return localData;
  }
  
  // No data found anywhere, return empty object
  usingApiStorage = true; // Assume API is available for new data
  return {};
}

/**
 * Synchronous load from localStorage (doesn't update from server)
 */
function loadSync() {
  try {
    const raw = localStorage.getItem(ARTIKELLISTEN_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Get all article lists
 * @returns {Object} - Object with Firmen_ID as key and article list as value
 */
export async function getArtikellisten() {
  await ensureInitialized();
  return artikellisten;
}

/**
 * Get a specific article list by Firmen_ID
 * @param {string} firmenId - The company ID
 * @returns {Promise<Object|null>} - The article list or null if not found
 */
export async function getArtikelliste(firmenId) {
  await ensureInitialized();
  return artikellisten[firmenId] || null;
}

/**
 * Create an empty article list for a company
 * @param {string} firmenId - The company ID
 * @param {string} firmenName - The company name
 * @returns {Promise<Object>} - The newly created article list
 */
export async function createEmptyArtikelliste(firmenId, firmenName) {
  await ensureInitialized();
  const artikelliste = {
    firmenId: firmenId,
    firmenName: firmenName,
    zahlungsziel_tage: DEFAULT_ZAHLUNGSZIEL_TAGE,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    items: []
  };
  
  artikellisten[firmenId] = artikelliste;
  await save();
  return artikelliste;
}

/**
 * Update an article list
 * @param {string} firmenId - The company ID
 * @param {Object} artikelliste - The updated article list data
 */
export async function updateArtikelliste(firmenId, artikelliste) {
  await ensureInitialized();
  artikelliste.modified = new Date().toISOString();
  artikellisten[firmenId] = artikelliste;
  await save();
}

/**
 * Delete an article list
 * @param {string} firmenId - The company ID
 */
export async function deleteArtikelliste(firmenId) {
  await ensureInitialized();
  delete artikellisten[firmenId];
  await save();
}

/**
 * Check if an article list exists for a company
 * @param {string} firmenId - The company ID
 * @returns {Promise<boolean>}
 */
export async function artikellisteExists(firmenId) {
  await ensureInitialized();
  return !!artikellisten[firmenId];
}

/**
 * Save article lists to server or localStorage as fallback
 */
async function save() {
  let saveSuccess = false;
  
  // Try to save to server if using API storage
  if (usingApiStorage) {
    saveSuccess = await saveToServer(artikellisten);
    if (!saveSuccess) {
      console.warn('Failed to save article lists to server, falling back to localStorage');
      usingApiStorage = false;
    }
  }
  
  // If API failed or we're not using API storage, use localStorage
  if (!usingApiStorage || !saveSuccess) {
    try {
      localStorage.setItem(ARTIKELLISTEN_STORAGE_KEY, JSON.stringify(artikellisten));
      saveSuccess = true;
    } catch (error) {
      console.error('Failed to save article lists to localStorage:', error);
      return false;
    }
  }
  
  // Also update localStorage cache even when using API
  if (usingApiStorage && saveSuccess) {
    try {
      localStorage.setItem(ARTIKELLISTEN_STORAGE_KEY, JSON.stringify(artikellisten));
    } catch (e) {
      console.warn('Failed to update localStorage cache:', e);
    }
  }
  
  return saveSuccess;
}
