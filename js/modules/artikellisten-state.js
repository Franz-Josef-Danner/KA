// -----------------------------
// Artikellisten State Management
// -----------------------------
import { ARTIKELLISTEN_STORAGE_KEY } from './artikellisten-config.js';

let artikellisten = load() ?? {};

/**
 * Get all article lists
 * @returns {Object} - Object with Firmen_ID as key and article list as value
 */
export function getArtikellisten() {
  return artikellisten;
}

/**
 * Get a specific article list by Firmen_ID
 * @param {string} firmenId - The company ID
 * @returns {Object|null} - The article list or null if not found
 */
export function getArtikelliste(firmenId) {
  return artikellisten[firmenId] || null;
}

/**
 * Create an empty article list for a company
 * @param {string} firmenId - The company ID
 * @param {string} firmenName - The company name
 * @returns {Object} - The newly created article list
 */
export function createEmptyArtikelliste(firmenId, firmenName) {
  const artikelliste = {
    firmenId: firmenId,
    firmenName: firmenName,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    items: []
  };
  
  artikellisten[firmenId] = artikelliste;
  save();
  return artikelliste;
}

/**
 * Update an article list
 * @param {string} firmenId - The company ID
 * @param {Object} artikelliste - The updated article list data
 */
export function updateArtikelliste(firmenId, artikelliste) {
  artikelliste.modified = new Date().toISOString();
  artikellisten[firmenId] = artikelliste;
  save();
}

/**
 * Delete an article list
 * @param {string} firmenId - The company ID
 */
export function deleteArtikelliste(firmenId) {
  delete artikellisten[firmenId];
  save();
}

/**
 * Check if an article list exists for a company
 * @param {string} firmenId - The company ID
 * @returns {boolean}
 */
export function artikellisteExists(firmenId) {
  return !!artikellisten[firmenId];
}

/**
 * Save article lists to localStorage
 */
function save() {
  try {
    localStorage.setItem(ARTIKELLISTEN_STORAGE_KEY, JSON.stringify(artikellisten));
    return true;
  } catch (error) {
    console.error('Failed to save article lists to localStorage:', error);
    return false;
  }
}

/**
 * Load article lists from localStorage
 */
function load() {
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
