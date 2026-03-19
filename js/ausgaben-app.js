// -----------------------------
// Ausgaben Application Entry Point
// -----------------------------
import { render } from './modules/ausgaben-render.js?v=2';
import { initEventHandlers } from './modules/ausgaben-events.js';
import { ensureInitialized } from './modules/ausgaben-state.js';

async function init() {
  await ensureInitialized();
  initEventHandlers();
  render();
}

init();
