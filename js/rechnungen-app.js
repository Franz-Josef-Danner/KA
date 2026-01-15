// -----------------------------
// Rechnungen Application Entry Point
// -----------------------------
import { render } from './modules/rechnungen-render.js';
import { initEventHandlers } from './modules/rechnungen-events.js';
import { ensureInitialized } from './modules/rechnungen-state.js';
import { ensureInitialized as ensureFirmenlisteInitialized } from './modules/state.js';

// Initialize the application
async function init() {
  // Ensure invoices and companies are loaded before rendering
  // Companies are needed for PDF generation (to enrich invoice data with company details)
  await Promise.all([
    ensureInitialized(),
    ensureFirmenlisteInitialized()
  ]);
  initEventHandlers();
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
