// -----------------------------
// Planung Event Handlers
// -----------------------------
import { render } from './planung-render.js';
import { initPlanungModalHandlers } from './planung-ui.js';

export function initEventHandlers() {
  initPlanungModalHandlers();

  // Search input
  document.getElementById('planungSearch')
    ?.addEventListener('input', () => render());

  // Re-render when planung data changes (e.g. after save from modal)
  window.addEventListener('planungChanged', () => render());
}
