// -----------------------------
// Kundenbereiche Application Entry Point
// -----------------------------
import { render } from './modules/kundenbereiche-render.js';
import { initSearch } from './modules/kundenbereiche-search.js';

// Initialize the application
function init() {
  initSearch();
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
