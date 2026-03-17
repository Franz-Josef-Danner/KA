// -----------------------------
// Personal (Personnel) Events Module
// -----------------------------
import { deleteRow } from './personal-state.js';
import { render, renderDeptFilter } from './personal-render.js';

let activeDeptFilter = "";
let activeSearch = "";

export function getDeptFilter() { return activeDeptFilter; }
export function getSearch()     { return activeSearch; }

export function initEventHandlers() {
  // Department filter bar (event delegation)
  document.getElementById("deptFilterBar")
    ?.addEventListener("click", e => {
      const btn = e.target.closest(".dept-filter-btn");
      if (!btn) return;
      activeDeptFilter = btn.dataset.dept;
      renderDeptFilter(activeDeptFilter);
      render(activeDeptFilter, activeSearch);
    });

  // Search input
  document.getElementById("personalSearch")
    ?.addEventListener("input", e => {
      activeSearch = e.target.value;
      render(activeDeptFilter, activeSearch);
    });

  // Delete button (event delegation on tbody)
  document.getElementById("personalTbody")
    ?.addEventListener("click", async e => {
      const btn = e.target.closest("button[data-action='delete']");
      if (!btn) return;
      const idx = parseInt(btn.dataset.idx, 10);
      if (isNaN(idx)) return;
      if (!confirm("Person wirklich löschen?")) return;
      await deleteRow(idx);
      render(activeDeptFilter, activeSearch);
    });
}
