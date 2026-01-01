// -----------------------------
// Main Application Entry Point
// -----------------------------
import { render } from './modules/render.js';
import { initEventHandlers } from './modules/events.js';
import { initModalListeners } from './modules/modal.js';

// Initialize the application
function init() {
  initModalListeners();
  initEventHandlers();
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
