// -----------------------------
// Kundenbereich Application Entry Point
// -----------------------------
import { render } from './modules/kundenbereich-render.js';

// Initialize the application
function init() {
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
