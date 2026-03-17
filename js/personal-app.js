// -----------------------------
// Personal (Personnel) Application Entry Point
// -----------------------------
import { ensureInitialized } from './modules/personal-state.js';
import { render, renderDeptFilter } from './modules/personal-render.js';
import { initEventHandlers, getDeptFilter, getSearch } from './modules/personal-events.js';
import { initPersonalUI } from './modules/personal-ui.js';

async function init() {
  await ensureInitialized();
  renderDeptFilter("");
  render("", "");
  initEventHandlers();
  initPersonalUI(getDeptFilter, getSearch);
}

init();
