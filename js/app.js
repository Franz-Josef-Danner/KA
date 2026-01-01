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

// Start the application when DOM is ready
init();
