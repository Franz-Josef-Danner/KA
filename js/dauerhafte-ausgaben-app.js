// -----------------------------
// Dauerhafte Ausgaben Application Entry Point
// -----------------------------
import { render } from './modules/dauerhafte-ausgaben-render.js';
import { initEventHandlers } from './modules/dauerhafte-ausgaben-events.js';
import { ensureInitialized } from './modules/dauerhafte-ausgaben-state.js';

// Initialize the application
async function init() {
  // Ensure recurring expenses are loaded before rendering
  await ensureInitialized();
  initEventHandlers();
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
