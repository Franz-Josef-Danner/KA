// -----------------------------
// Authentication Module
// -----------------------------

const AUTH_KEY = 'ka_auth_session';
const USERS_KEY = 'ka_users';
const CUSTOMER_ACCOUNTS_KEY = 'ka_customer_accounts';

// API endpoints for customer accounts
const API_BASE_URL = './api';
const SAVE_CUSTOMER_ACCOUNTS_ENDPOINT = `${API_BASE_URL}/save-customer-accounts.php`;
const LOAD_CUSTOMER_ACCOUNTS_ENDPOINT = `${API_BASE_URL}/load-customer-accounts.php`;

// Flag to track if we're using API storage
let usingApiStorage = true;

// Initialize customer accounts - will be loaded asynchronously
let customerAccountsCache = null;
let initializationPromise = null;
let isInitialized = false;

/**
 * Ensure customer accounts are initialized before use
 */
async function ensureCustomerAccountsInitialized() {
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
    customerAccountsCache = await loadCustomerAccountsFromServerOrLocalStorage();
    isInitialized = true;
  })();
  
  await initializationPromise;
  initializationPromise = null; // Clear after completion
}

/**
 * Save customer accounts to server via API
 * @param {Array} accounts - Customer accounts array
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
async function saveCustomerAccountsToServer(accounts) {
  try {
    const response = await fetch(SAVE_CUSTOMER_ACCOUNTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accounts),
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
    console.error('Failed to save customer accounts to server:', error);
    return false;
  }
}

/**
 * Load customer accounts from server via API
 * @returns {Promise<Array|null>} - Customer accounts array or null if failed
 */
async function loadCustomerAccountsFromServer() {
  try {
    const response = await fetch(LOAD_CUSTOMER_ACCOUNTS_ENDPOINT, {
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
    console.error('Failed to load customer accounts from server:', error);
    return null;
  }
}

/**
 * Load customer accounts from server or localStorage as fallback
 * Migrates data from localStorage to server if needed
 * @returns {Promise<Array>} - Customer accounts array (empty array if no data found)
 */
async function loadCustomerAccountsFromServerOrLocalStorage() {
  // Try to load from server first
  const serverData = await loadCustomerAccountsFromServer();
  
  if (serverData !== null) {
    // Server responded (even if with empty data), use it
    console.log('Loaded customer accounts from server');
    usingApiStorage = true;
    // Update localStorage cache
    try {
      localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify(serverData));
    } catch (e) {
      console.warn('Failed to update localStorage cache:', e);
    }
    return serverData;
  }
  
  // Server failed to respond, check if we have data in localStorage
  const localData = getCustomerAccountsSync();
  if (localData && localData.length > 0) {
    console.log('Migrating customer accounts from localStorage to server...');
    // Try to save to server
    const migrationSuccess = await saveCustomerAccountsToServer(localData);
    if (migrationSuccess) {
      console.log('✓ Successfully migrated customer accounts to server');
      usingApiStorage = true;
    } else {
      console.warn('⚠ Failed to migrate customer accounts to server, will continue using localStorage');
      usingApiStorage = false;
    }
    return localData;
  }
  
  // No data found anywhere, return empty array
  console.log('No existing customer accounts found, starting fresh');
  usingApiStorage = true; // Assume API is available for new data
  return [];
}

/**
 * Synchronous load from localStorage (doesn't update from server)
 */
function getCustomerAccountsSync() {
  try {
    const raw = localStorage.getItem(CUSTOMER_ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Simple hash function for password storage
// Note: This is NOT cryptographically secure, but better than plaintext
// In production, use proper backend authentication with bcrypt or similar
async function simpleHash(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Initialize with a default user if no users exist
async function initializeUsers() {
  const users = getUsers();
  if (users.length === 0) {
    // Create a default demo user (admin)
    const defaultUser = {
      email: 'office@franzjosef-danner.at',
      password: await simpleHash('5.z3LPg2TE:HvWK'), // Hash the password
      role: 'admin'
    };
    users.push(defaultUser);
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to initialize users in localStorage:', error);
      throw new Error('Storage initialization failed. Please check browser storage settings.');
    }
  }
}

function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Customer Account Management Functions

async function getCustomerAccounts() {
  await ensureCustomerAccountsInitialized();
  return customerAccountsCache || [];
}

async function saveCustomerAccounts(accounts) {
  customerAccountsCache = accounts;
  
  let saveSuccess = false;
  
  // Try to save to server if using API storage
  if (usingApiStorage) {
    saveSuccess = await saveCustomerAccountsToServer(accounts);
    if (!saveSuccess) {
      console.warn('Failed to save customer accounts to server, falling back to localStorage');
      usingApiStorage = false;
    }
  }
  
  // If API failed or we're not using API storage, use localStorage
  if (!usingApiStorage || !saveSuccess) {
    try {
      localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify(accounts));
      saveSuccess = true;
    } catch (error) {
      console.error('Failed to save customer accounts to localStorage:', error);
      return false;
    }
  }
  
  // Also update localStorage cache even when using API
  if (usingApiStorage && saveSuccess) {
    try {
      localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to update localStorage cache:', e);
    }
  }
  
  return saveSuccess;
}

export async function login(email, password) {
  await initializeUsers();
  const users = getUsers();
  const customerAccounts = await getCustomerAccounts();
  const passwordHash = await simpleHash(password);
  
  // Check admin users first
  let user = users.find(u => u.email === email && u.password === passwordHash);
  let role = 'admin';
  let firmenId = null;
  
  // If not found in admin users, check customer accounts
  if (!user) {
    const customerAccount = customerAccounts.find(c => c.email === email && c.password === passwordHash);
    if (customerAccount) {
      user = customerAccount;
      role = 'customer';
      firmenId = customerAccount.firmenId;
    }
  }
  
  if (user) {
    const session = {
      email: user.email,
      role: role,
      firmenId: firmenId,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return true;
    } catch (error) {
      console.error('Failed to create session in localStorage:', error);
      throw new Error('Login failed: Unable to create session. Please check browser storage settings.');
    }
  }
  
  return false;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'index.html';
}

// Helper function to check session validity and clean up if expired
function checkSessionValidity() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return { isValid: false, hadSession: false };
    
    const session = JSON.parse(raw);

    // Validate session structure; treat malformed sessions as expired
    if (
      !session ||
      typeof session.timestamp !== 'number' ||
      !Number.isFinite(session.timestamp)
    ) {
      localStorage.removeItem(AUTH_KEY);
      return { isValid: false, hadSession: true };
    }
    
    const now = Date.now();
    const sessionAge = now - session.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    // Check if sessionAge is negative (session timestamp is in the future, possibly due to clock changes)
    // or if sessionAge exceeds maxAge (session has expired)
    const isValid = sessionAge >= 0 && sessionAge < maxAge;
    
    // Clean up expired session
    if (!isValid) {
      localStorage.removeItem(AUTH_KEY);
    }
    
    return { isValid, hadSession: true };
  } catch {
    return { isValid: false, hadSession: false };
  }
}

export function isAuthenticated() {
  return checkSessionValidity().isValid;
}

export function requireAuth() {
  // Check session validity once to avoid race conditions
  const { isValid, hadSession } = checkSessionValidity();
  
  if (!isValid) {
    // If there was a session but it was expired, show expiration message
    if (hadSession) {
      window.location.href = 'index.html?expired=true';
    } else {
      window.location.href = 'index.html';
    }
    // Throw error to prevent further execution
    throw new Error('Authentication required');
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Generate a cryptographically secure random password
function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(array[i] % chars.length);
  }
  return password;
}

// Create or update a customer account
export async function createOrUpdateCustomerAccount(firmenId, email, firmenName) {
  if (!email || !firmenId) {
    console.error('Email and Firmen ID are required to create customer account');
    return null;
  }
  
  const accounts = await getCustomerAccounts();
  const existingIndex = accounts.findIndex(a => a.firmenId === firmenId);
  
  let password;
  let isNewAccount = false;
  
  if (existingIndex >= 0) {
    // Update existing account
    const existingAccount = accounts[existingIndex];
    // If email changed, generate new password
    if (existingAccount.email !== email) {
      password = generatePassword();
      accounts[existingIndex] = {
        firmenId,
        email,
        firmenName: firmenName || existingAccount.firmenName,
        password: await simpleHash(password),
        createdAt: existingAccount.createdAt,
        updatedAt: new Date().toISOString()
      };
      isNewAccount = true; // Treat as new for notification purposes
    } else {
      // Just update the name if changed
      accounts[existingIndex].firmenName = firmenName || existingAccount.firmenName;
      accounts[existingIndex].updatedAt = new Date().toISOString();
    }
  } else {
    // Create new account
    password = generatePassword();
    isNewAccount = true;
    accounts.push({
      firmenId,
      email,
      firmenName: firmenName || 'Unbekannt',
      password: await simpleHash(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  if (await saveCustomerAccounts(accounts)) {
    // Return password only for new/updated accounts
    return isNewAccount ? password : null;
  }
  
  return null;
}

// Delete a customer account
export async function deleteCustomerAccount(firmenId) {
  const accounts = await getCustomerAccounts();
  const filtered = accounts.filter(a => a.firmenId !== firmenId);
  return await saveCustomerAccounts(filtered);
}

// Get customer account by Firmen ID
export async function getCustomerAccountByFirmenId(firmenId) {
  const accounts = await getCustomerAccounts();
  return accounts.find(a => a.firmenId === firmenId);
}

// Reset password for a customer account
export async function resetCustomerPassword(firmenId) {
  const accounts = await getCustomerAccounts();
  const accountIndex = accounts.findIndex(a => a.firmenId === firmenId);
  
  if (accountIndex < 0) {
    console.error('Customer account not found');
    return null;
  }
  
  // Generate new password
  const newPassword = generatePassword();
  
  // Update account with new password hash
  accounts[accountIndex].password = await simpleHash(newPassword);
  accounts[accountIndex].updatedAt = new Date().toISOString();
  
  if (await saveCustomerAccounts(accounts)) {
    return newPassword;
  }
  
  return null;
}

// Change admin credentials (email and/or password)
// Returns true on success, false if current password is wrong
export async function changeAdminCredentials(currentPassword, newEmail, newPassword) {
  await initializeUsers();
  const users = getUsers();
  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  // Find user by email first, then verify password separately to avoid leaking info via timing
  const userIndex = users.findIndex(u => u.email === currentUser.email);
  if (userIndex < 0) return false;

  const currentHash = await simpleHash(currentPassword);
  if (users[userIndex].password !== currentHash) return false;

  // Validate new email format if provided
  if (newEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) return false;
    // Ensure no duplicate email among existing users
    const duplicate = users.find((u, i) => i !== userIndex && u.email === newEmail.trim());
    if (duplicate) return false;
  }

  const emailToSet = newEmail ? newEmail.trim() : users[userIndex].email;
  const passwordHash = newPassword ? await simpleHash(newPassword) : users[userIndex].password;

  users[userIndex] = {
    ...users[userIndex],
    email: emailToSet,
    password: passwordHash
  };

  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Failed to save updated admin credentials:', error);
    return false;
  }

  // Update active session email if it changed
  if (emailToSet !== currentUser.email) {
    try {
      const session = JSON.parse(localStorage.getItem(AUTH_KEY));
      if (session) {
        session.email = emailToSet;
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      }
    } catch {
      // Session update failure is non-fatal
    }
  }

  return true;
}

// Check if user is admin
export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

// Check if user is customer
export function isCustomer() {
  const user = getCurrentUser();
  return user && user.role === 'customer';
}

// Require admin role
export function requireAdmin() {
  requireAuth();
  if (!isAdmin()) {
    window.location.href = 'kundenbereich.html';
    throw new Error('Admin access required');
  }
}
