// -----------------------------
// Kundenbereich Application Entry Point
// -----------------------------
import { render } from './modules/kundenbereich-render.js';
import { ensureInitialized as ensureFirmenlisteInitialized } from './modules/state.js';

// Initialize the application
async function init() {
  // Ensure company list is loaded before rendering
  await ensureFirmenlisteInitialized();
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
