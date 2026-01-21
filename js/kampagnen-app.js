// -----------------------------
// Kampagnen Application Entry Point
// -----------------------------
import { render } from './modules/kampagnen-render.js';
import { initEventHandlers } from './modules/kampagnen-events.js';
import { ensureInitialized } from './modules/kampagnen-state.js';

// Initialize the application
function init() {
  // Ensure drafts are loaded before rendering
  ensureInitialized();
  render();
  initEventHandlers();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
