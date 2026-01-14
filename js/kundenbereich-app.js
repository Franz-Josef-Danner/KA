// -----------------------------
// Kundenbereich Application Entry Point
// -----------------------------
import { render } from './modules/kundenbereich-render.js';
import { ensureInitialized as ensureFirmenlisteInitialized } from './modules/state.js';
import { ensureInitialized as ensureAuftraegeInitialized } from './modules/auftraege-state.js';
import { ensureInitialized as ensureRechnungenInitialized } from './modules/rechnungen-state.js';

// Initialize the application
async function init() {
  // Ensure all data is loaded before rendering
  await Promise.all([
    ensureFirmenlisteInitialized(),
    ensureAuftraegeInitialized(),
    ensureRechnungenInitialized()
  ]);
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
