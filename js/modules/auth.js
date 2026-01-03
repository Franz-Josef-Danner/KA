// -----------------------------
// Authentication Module
// -----------------------------

const AUTH_KEY = 'ka_auth_session';
const USERS_KEY = 'ka_users';

// Initialize with a default user if no users exist
function initializeUsers() {
  const users = getUsers();
  if (users.length === 0) {
    // Create a default demo user
    const defaultUser = {
      email: 'demo@example.com',
      password: 'demo123' // In production, this should be hashed
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

export function login(email, password) {
  initializeUsers();
  const users = getUsers();
  
  const user = users.find(u => u.email === email && u.password === password);
  
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
    
    return sessionAge < maxAge;
  } catch {
    return false;
  }
}

export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
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
