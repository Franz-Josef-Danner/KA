// -----------------------------
// Kampagnen Application Entry Point
// -----------------------------
import { render } from './modules/kampagnen-render.js';
import { initEventHandlers } from './modules/kampagnen-events.js';
import { ensureInitialized } from './modules/kampagnen-state.js';
import { ensureInitialized as ensureCompanyDataInitialized } from './modules/state.js';

// Initialize the application
async function init() {
  // Ensure drafts and company data are loaded before rendering
  await Promise.all([
    ensureInitialized(),
    ensureCompanyDataInitialized()
  ]);
  render();
  initEventHandlers();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
