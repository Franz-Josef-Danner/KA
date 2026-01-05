// -----------------------------
// Authentication Module
// -----------------------------

const AUTH_KEY = 'ka_auth_session';
const USERS_KEY = 'ka_users';
const CUSTOMER_ACCOUNTS_KEY = 'ka_customer_accounts';

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
      email: 'demo@example.com',
      password: await simpleHash('demo123'), // Hash the password
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

export async function login(email, password) {
  await initializeUsers();
  const users = getUsers();
  const customerAccounts = getCustomerAccounts();
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

// Customer Account Management Functions

function getCustomerAccounts() {
  try {
    const raw = localStorage.getItem(CUSTOMER_ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCustomerAccounts(accounts) {
  try {
    localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify(accounts));
    return true;
  } catch (error) {
    console.error('Failed to save customer accounts:', error);
    return false;
  }
}

// Generate a random password
function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Create or update a customer account
export async function createOrUpdateCustomerAccount(firmenId, email, firmenName) {
  if (!email || !firmenId) {
    console.error('Email and Firmen ID are required to create customer account');
    return null;
  }
  
  const accounts = getCustomerAccounts();
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
  
  if (saveCustomerAccounts(accounts)) {
    // Return password only for new/updated accounts
    return isNewAccount ? password : null;
  }
  
  return null;
}

// Delete a customer account
export function deleteCustomerAccount(firmenId) {
  const accounts = getCustomerAccounts();
  const filtered = accounts.filter(a => a.firmenId !== firmenId);
  return saveCustomerAccounts(filtered);
}

// Get customer account by Firmen ID
export function getCustomerAccountByFirmenId(firmenId) {
  const accounts = getCustomerAccounts();
  return accounts.find(a => a.firmenId === firmenId);
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
