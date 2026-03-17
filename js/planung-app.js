// -----------------------------
// Planung Application Entry Point
// -----------------------------
import { render } from './modules/planung-render.js';
import { initEventHandlers } from './modules/planung-events.js';
import { ensureInitialized } from './modules/planung-state.js';
import { ensureInitialized as ensurePersonalInitialized } from './modules/personal-state.js';

async function init() {
  await Promise.all([
    ensureInitialized(),
    ensurePersonalInitialized(),
  ]);
  initEventHandlers();
  render();
}

init();
