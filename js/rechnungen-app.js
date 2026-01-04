// -----------------------------
// Rechnungen Application Entry Point
// -----------------------------
import { render } from './modules/rechnungen-render.js';
import { initEventHandlers } from './modules/rechnungen-events.js';

// Initialize the application
function init() {
  initEventHandlers();
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
