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
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
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
  // Clean up any expired session before login
  if (!isAuthenticated()) {
    localStorage.removeItem(AUTH_KEY);
  }
  
  await initializeUsers();
  const users = getUsers();
  const passwordHash = await simpleHash(password);
  
  const user = users.find(u => u.email === email && u.password === passwordHash);
  
  if (user) {
    const session = {
      email: user.email,
      timestamp: Date.now()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return true;
  }
  
  return false;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'index.html';
}

export function isAuthenticated() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    
    const session = JSON.parse(raw);
    // Check if session exists and is less than 24 hours old
    const now = Date.now();
    const sessionAge = now - session.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    const isValid = sessionAge < maxAge;
    
    // Clean up expired session
    if (!isValid) {
      localStorage.removeItem(AUTH_KEY);
    }
    
    return isValid;
  } catch {
    return false;
  }
}

export async function requireAuth() {
  // Check if there's an expired session
  const raw = localStorage.getItem(AUTH_KEY);
  const hasExpiredSession = raw && !isAuthenticated();
  
  if (!isAuthenticated()) {
    // Add session expiration message to URL if session expired
    if (hasExpiredSession) {
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
