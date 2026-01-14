// -----------------------------
// Aufträge Application Entry Point
// -----------------------------
import { render } from './modules/auftraege-render.js';
import { initEventHandlers } from './modules/auftraege-events.js';
import { ensureInitialized } from './modules/auftraege-state.js';

// Initialize the application
async function init() {
  // Ensure orders are loaded before rendering
  await ensureInitialized();
  initEventHandlers();
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
