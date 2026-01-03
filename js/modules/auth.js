// -----------------------------
// Authentication Module
// -----------------------------

const AUTH_KEY = 'ka_auth_session';
const USERS_KEY = 'ka_users';

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
    // Create a default demo user
    const defaultUser = {
      email: 'demo@example.com',
      password: await simpleHash('demo123') // Hash the password
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
  const passwordHash = await simpleHash(password);
  
  const user = users.find(u => u.email === email && u.password === passwordHash);
  
  if (user) {
    const session = {
      email: user.email,
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
