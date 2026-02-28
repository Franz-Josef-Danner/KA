// -----------------------------
// State Management
// -----------------------------
import { STORAGE_KEY, COLUMNS, STATUS_OPTIONS } from './config.js';
import { sanitizeText } from '../utils/sanitize.js';
import { escapeHtml } from '../utils/sanitize.js';
import { pushState, undo as historyUndo, redo as historyRedo, canUndo, canRedo } from './history.js';
import { createEmptyArtikelliste, deleteArtikelliste, artikellisteExists } from './artikellisten-state.js';
import { createOrUpdateCustomerAccount, deleteCustomerAccount } from './auth.js';
import { sendCustomerWelcomeEmail } from './email-notifications.js';
import { isEmailConfigured } from './email-config.js';
import { getCustomerDisplayName } from '../utils/helpers.js';

// API endpoints
const API_BASE_URL = './api';
const SAVE_ENDPOINT = `${API_BASE_URL}/save-firmenliste.php`;
const LOAD_ENDPOINT = `${API_BASE_URL}/load-firmenliste.php`;

// Flag to track if we're using API storage
let usingApiStorage = true;

// Initialize rows - will be loaded asynchronously
let rows = [];
let initializationPromise = null;
let isInitialized = false;

// Flag to track unsaved changes
let isDirty = false;

export function hasDirtyChanges() {
  return isDirty;
}

// Ensure state is initialized before use
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
    rows = await loadFromServerOrLocalStorage();
    pushState(rows);
    isInitialized = true;
  })();
  
  await initializationPromise;
  initializationPromise = null; // Clear after completion
}

export function getRows() {
  return rows;
}

// Show a notification modal with the new customer password
function showNewCustomerPasswordNotification(firmenName, email, password) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'credentials-modal';
  modal.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `;
  
  modal.innerHTML = `
    <h2 style="margin-top: 0; margin-bottom: 1.5rem; color: #28a745;">✓ Kundenkonto erstellt</h2>
    <div style="margin-bottom: 1rem;">
      <strong>Firma:</strong> ${escapeHtml(firmenName)}
    </div>
    <div style="margin-bottom: 1rem;">
      <strong>E-Mail (Login):</strong> ${escapeHtml(email)}
    </div>
    <div style="margin-bottom: 1.5rem; padding: 1rem; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
      <p style="margin: 0 0 0.5rem 0; font-weight: bold; color: #155724;">Generiertes Passwort:</p>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <code style="font-size: 1.2rem; padding: 0.5rem; background: white; border-radius: 4px; flex: 1; word-break: break-all;">${escapeHtml(password)}</code>
        <button class="btn-secondary" id="copyPasswordBtn" style="flex-shrink: 0;">Kopieren</button>
      </div>
    </div>
    <div style="margin-bottom: 1.5rem; padding: 1rem; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
      <p style="margin: 0; color: #856404; font-size: 0.9rem;">
        <strong>⚠️ Wichtig:</strong> Bitte notieren Sie sich das Passwort und teilen Sie es dem Kunden mit.
        Das Passwort wird aus Sicherheitsgründen nicht erneut angezeigt.<br><br>
        Sie können das Passwort später über <strong>Kundenbereiche → Zugangsdaten</strong> zurücksetzen.
      </p>
    </div>
    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
      <button class="btn-primary" id="closePasswordModal">Schließen</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Close modal when clicking overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
  
  // Close button handler
  document.getElementById('closePasswordModal').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
  
  // Copy password button handler
  document.getElementById('copyPasswordBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(password).then(() => {
      const btn = document.getElementById('copyPasswordBtn');
      btn.textContent = '✓ Kopiert!';
      btn.style.background = '#28a745';
      btn.style.color = 'white';
      setTimeout(() => {
        btn.textContent = 'Kopieren';
        btn.style.background = '';
        btn.style.color = '';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy password:', err);
      alert('Fehler beim Kopieren. Bitte kopieren Sie das Passwort manuell.');
    });
  });
}

/**
 * Save data to server via API
 * @param {Array} data - Data to save
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
    console.error('Failed to save data to server:', error);
    return false;
  }
}

/**
 * Load data from server via API
 * @returns {Promise<Array|null>} - Data array or null if failed
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
    console.error('Failed to load data from server:', error);
    return null;
  }
}

/**
 * Load data from server or localStorage as fallback
 * Migrates data from localStorage to server if needed
 * @returns {Promise<Array>} - Data array (empty array if no data found)
 */
async function loadFromServerOrLocalStorage() {
  // Try to load from server first
  const serverData = await loadFromServer();
  
  if (serverData !== null) {
    // Server responded (even if with empty data), use it
    console.log('Loaded company list from server');
    usingApiStorage = true;
    // Update localStorage cache
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
    } catch (e) {
      console.warn('Failed to update localStorage cache:', e);
    }
    return await normalizeAndSyncRows(serverData);
  }
  
  // Server failed to respond, check if we have data in localStorage
  const localData = loadSync();
  if (localData && localData.length > 0) {
    console.log('Migrating company list from localStorage to server...');
    // Try to save to server
    const migrationSuccess = await saveToServer(localData);
    if (migrationSuccess) {
      console.log('✓ Successfully migrated data to server');
      usingApiStorage = true;
    } else {
      console.warn('⚠ Failed to migrate data to server, will continue using localStorage');
      usingApiStorage = false;
    }
    return localData;
  }
  
  // No data found anywhere, return empty array
  console.log('No existing company list found, starting fresh');
  usingApiStorage = true; // Assume API is available for new data
  return [];
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
        const firmenName = getCustomerDisplayName(row);
        await createEmptyArtikelliste(row.Firmen_ID, firmenName);
        // Create customer account
        const email = row['E-mail'] || '';
        if (email) {
          const generatedPassword = await createOrUpdateCustomerAccount(row.Firmen_ID, email, firmenName);
          
          // Show password notification if a new password was generated
          if (generatedPassword) {
            showNewCustomerPasswordNotification(firmenName, email, generatedPassword);
            
            // Send welcome email to customer with credentials
            const welcomeEmailSent = await sendCustomerWelcomeEmail({
              email: email,
              username: email,
              password: generatedPassword,
              customerName: firmenName
            });
            
            if (welcomeEmailSent) {
              console.log(`Welcome email sent to ${email}`);
            } else {
              console.warn(`Failed to send welcome email to ${email}`);
            }
          }
        }
      } else {
        // Customer already has ID - ensure article list and account exist
        const articleListExists = await artikellisteExists(idStr);
        if (!articleListExists) {
          const firmenName = getCustomerDisplayName(row);
          await createEmptyArtikelliste(idStr, firmenName);
        }
        // Update or create customer account
        const email = row['E-mail'] || '';
        if (email) {
          const generatedPassword = await createOrUpdateCustomerAccount(idStr, email, getCustomerDisplayName(row));
          
          // Show password notification if a new password was generated (e.g., email changed)
          if (generatedPassword) {
            showNewCustomerPasswordNotification(getCustomerDisplayName(row), email, generatedPassword);
            
            // Send welcome email to customer with new credentials
            const welcomeEmailSent = await sendCustomerWelcomeEmail({
              email: email,
              username: email,
              password: generatedPassword,
              customerName: getCustomerDisplayName(row)
            });
            
            if (welcomeEmailSent) {
              console.log(`Welcome email sent to ${email}`);
            } else {
              console.warn(`Failed to send welcome email to ${email}`);
            }
          }
        }
      }
    } else {
      // If status is not "Kunde", remove any existing ID, article list, and customer account
      const oldId = row.Firmen_ID;
      if (oldId && typeof oldId === 'string' && oldId.trim() !== '') {
        await deleteArtikelliste(oldId);
        await deleteCustomerAccount(oldId);
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
  isDirty = true;
  if (!skipHistory) {
    pushState(rows);
  }
}

export function newEmptyRow() {
  const obj = {};
  for (const c of COLUMNS) {
    // Set default value for Status column
    if (c === "Status") {
      obj[c] = "offen";
    } else if (c === "Persönlich") {
      obj[c] = "false";
    } else {
      obj[c] = "";
    }
  }
  return obj;
}

export async function save() {
  let saveSuccess = false;
  
  // Try to save to server if using API storage
  if (usingApiStorage) {
    saveSuccess = await saveToServer(rows);
    if (!saveSuccess) {
      console.warn('Failed to save to server, falling back to localStorage');
      usingApiStorage = false;
    }
  }
  
  // If API failed or we're not using API storage, use localStorage
  if (!usingApiStorage || !saveSuccess) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      saveSuccess = true;
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      // Show user-friendly error message
      alert('Fehler beim Speichern: Daten konnten nicht gespeichert werden. Bitte überprüfen Sie die Speichereinstellungen Ihres Browsers.');
      return false;
    }
  }
  
  // Also update localStorage cache even when using API
  if (usingApiStorage && saveSuccess) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (e) {
      console.warn('Failed to update localStorage cache:', e);
    }
  }
  
  if (saveSuccess) {
    isDirty = false;
  }
  
  return saveSuccess;
}

// Synchronous load (doesn't update customer accounts)
function loadSync() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return null;

    return normalizeRows(data);
  } catch {
    return null;
  }
}

// Normalize rows: ensure all columns exist and validate data
function normalizeRows(data) {
  if (!Array.isArray(data)) return [];
  
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
}

// Normalize and sync rows with customer accounts
async function normalizeAndSyncRows(data) {
  const normalized = normalizeRows(data);
  return await syncFirmenIds(normalized);
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
 * @returns {Promise<boolean>} - True if history operation succeeded (does NOT indicate save success)
 */
export async function undo() {
  const previousState = historyUndo();
  if (previousState) {
    await setRows(previousState, true);
    await save(); // Best-effort save; user is notified via alert if it fails
    return true;
  }
  return false;
}

/**
 * Redo to next state
 * @returns {Promise<boolean>} - True if history operation succeeded (does NOT indicate save success)
 */
export async function redo() {
  const nextState = historyRedo();
  if (nextState) {
    await setRows(nextState, true);
    await save(); // Best-effort save; user is notified via alert if it fails
    return true;
  }
  return false;
}

export { canUndo, canRedo };
