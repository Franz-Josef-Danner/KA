// -----------------------------
// Preislisten State Management
// -----------------------------
import { PREISLISTEN_STORAGE_KEY } from './preislisten-config.js';

let preislisten = load() ?? {};

/**
 * Get all price lists
 * @returns {Object} - Object with Firmen_ID as key and price list as value
 */
export function getPreislisten() {
  return preislisten;
}

/**
 * Get a specific price list by Firmen_ID
 * @param {string} firmenId - The company ID
 * @returns {Object|null} - The price list or null if not found
 */
export function getPreisliste(firmenId) {
  return preislisten[firmenId] || null;
}

/**
 * Create an empty price list for a company
 * @param {string} firmenId - The company ID
 * @param {string} firmenName - The company name
 * @returns {Object} - The newly created price list
 */
export function createEmptyPreisliste(firmenId, firmenName) {
  const preisliste = {
    firmenId: firmenId,
    firmenName: firmenName,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    items: []
  };
  
  preislisten[firmenId] = preisliste;
  save();
  return preisliste;
}

/**
 * Update a price list
 * @param {string} firmenId - The company ID
 * @param {Object} preisliste - The updated price list data
 */
export function updatePreisliste(firmenId, preisliste) {
  preisliste.modified = new Date().toISOString();
  preislisten[firmenId] = preisliste;
  save();
}

/**
 * Delete a price list
 * @param {string} firmenId - The company ID
 */
export function deletePreisliste(firmenId) {
  delete preislisten[firmenId];
  save();
}

/**
 * Check if a price list exists for a company
 * @param {string} firmenId - The company ID
 * @returns {boolean}
 */
export function preislisteExists(firmenId) {
  return !!preislisten[firmenId];
}

/**
 * Save price lists to localStorage
 */
function save() {
  try {
    localStorage.setItem(PREISLISTEN_STORAGE_KEY, JSON.stringify(preislisten));
    return true;
  } catch (error) {
    console.error('Failed to save price lists to localStorage:', error);
    return false;
  }
}

/**
 * Load price lists from localStorage
 */
function load() {
  try {
    const raw = localStorage.getItem(PREISLISTEN_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    return data;
  } catch {
    return null;
  }
}
