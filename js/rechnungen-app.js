// -----------------------------
// Rechnungen Application Entry Point
// -----------------------------
import { render } from './modules/rechnungen-render.js';
import { initEventHandlers } from './modules/rechnungen-events.js';
import { ensureInitialized } from './modules/rechnungen-state.js';

// Initialize the application
async function init() {
  // Ensure invoices are loaded before rendering
  await ensureInitialized();
  initEventHandlers();
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
