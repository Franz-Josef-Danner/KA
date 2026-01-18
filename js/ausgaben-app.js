// -----------------------------
// Ausgaben Application Entry Point (Unified)
// Handles both regular and recurring expenses with tabs
// -----------------------------
import { render as renderRegular } from './modules/ausgaben-render.js';
import { initEventHandlers as initRegularEvents } from './modules/ausgaben-events.js';
import { ensureInitialized as ensureRegularInitialized } from './modules/ausgaben-state.js';

import { render as renderRecurring } from './modules/dauerhafte-ausgaben-render.js';
import { initEventHandlers as initRecurringEvents } from './modules/dauerhafte-ausgaben-events.js';
import { ensureInitialized as ensureRecurringInitialized } from './modules/dauerhafte-ausgaben-state.js';

// Track current view
let currentView = 'regular'; // 'regular' or 'recurring'

/**
 * Switch between regular and recurring expenses view
 */
function switchView(view) {
  currentView = view;
  
  const regularTab = document.getElementById('regularTab');
  const recurringTab = document.getElementById('recurringTab');
  const regularTable = document.getElementById('regularExpensesTable');
  const recurringTable = document.getElementById('recurringExpensesTable');
  const regularHint = document.getElementById('regularHint');
  const recurringHint = document.getElementById('recurringHint');
  const newBtn = document.getElementById('newAusgabenBtn');
  
  if (view === 'regular') {
    // Show regular expenses
    regularTab.classList.add('active');
    recurringTab.classList.remove('active');
    regularTable.style.display = 'block';
    recurringTable.style.display = 'none';
    regularHint.style.display = 'block';
    recurringHint.style.display = 'none';
    newBtn.textContent = '+ Neue Ausgabe';
    renderRegular();
  } else {
    // Show recurring expenses
    regularTab.classList.remove('active');
    recurringTab.classList.add('active');
    regularTable.style.display = 'none';
    recurringTable.style.display = 'block';
    regularHint.style.display = 'none';
    recurringHint.style.display = 'block';
    newBtn.textContent = '+ Neue dauerhafte Ausgabe';
    renderRecurring();
  }
}

/**
 * Initialize tab event handlers
 */
function initTabHandlers() {
  const regularTab = document.getElementById('regularTab');
  const recurringTab = document.getElementById('recurringTab');
  
  if (regularTab) {
    regularTab.addEventListener('click', () => switchView('regular'));
  }
  
  if (recurringTab) {
    recurringTab.addEventListener('click', () => switchView('recurring'));
  }
}

/**
 * Get current view
 */
export function getCurrentView() {
  return currentView;
}

// Initialize the application
async function init() {
  // Ensure both regular and recurring expenses are loaded
  await Promise.all([
    ensureRegularInitialized(),
    ensureRecurringInitialized()
  ]);
  
  // Initialize event handlers for both
  initRegularEvents();
  initRecurringEvents();
  
  // Initialize tab handlers
  initTabHandlers();
  
  // Render initial view (regular expenses)
  renderRegular();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
