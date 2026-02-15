// -----------------------------
// Rechnungen Application Entry Point
// -----------------------------
import { render } from './modules/rechnungen-render.js';
import { initEventHandlers } from './modules/rechnungen-events.js';
import { ensureInitialized } from './modules/rechnungen-state.js';
import { checkOverdueInvoices } from './modules/overdue-invoice-checker.js';

// Initialize the application
async function init() {
  // Ensure invoices are loaded before rendering
  await ensureInitialized();
  initEventHandlers();
  await render();
  
  // Check for overdue invoices (runs once per day)
  checkOverdueInvoices();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
