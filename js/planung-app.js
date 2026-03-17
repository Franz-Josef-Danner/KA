// -----------------------------
// Planung Application Entry Point
// -----------------------------
import { render } from './modules/planung-render.js';
import { initEventHandlers } from './modules/planung-events.js';
import { ensureInitialized } from './modules/planung-state.js';

async function init() {
  await ensureInitialized();
  initEventHandlers();
  render();
}

init();
