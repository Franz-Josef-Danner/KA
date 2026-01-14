// -----------------------------
// Kundenbereiche Application Entry Point
// -----------------------------
import { render } from './modules/kundenbereiche-render.js';
import { initSearch } from './modules/kundenbereiche-search.js';
import { ensureInitialized as ensureFirmenlisteInitialized } from './modules/state.js';

// Initialize the application
async function init() {
  // Ensure company list is loaded before rendering
  await ensureFirmenlisteInitialized();
  initSearch();
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
