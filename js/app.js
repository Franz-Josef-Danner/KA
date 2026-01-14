// -----------------------------
// Main Application Entry Point
// -----------------------------
import { render } from './modules/render.js';
import { initEventHandlers } from './modules/events.js';
import { ensureInitialized } from './modules/state.js';

// Initialize the application
async function init() {
  // Load data from server or localStorage
  await ensureInitialized();
  // Initialize event handlers
  initEventHandlers();
  // Render the UI
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init().catch(error => {
  console.error('Failed to initialize application:', error);
  alert('Fehler beim Laden der Anwendung. Bitte laden Sie die Seite neu.');
});
