// -----------------------------
// Dauerhafte Ausgaben Rendering Module
// -----------------------------
import { COLUMNS } from './dauerhafte-ausgaben-config.js';
import { getRows } from './dauerhafte-ausgaben-state.js';
import { toCellDisplay } from '../utils/formatting.js';
import { rowMatchesSearch } from './dauerhafte-ausgaben-search.js';
import { updateUndoRedoButtons } from './dauerhafte-ausgaben-ui.js';

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

export function render() {
  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";

  const rows = getRows();

  rows.forEach((row, idx) => {
    if (!rowMatchesSearch(row, q)) return;

    const tr = document.createElement("tr");
    
    // Add double-click handler to open edit modal
    tr.addEventListener("dblclick", () => {
      // Dispatch custom event to avoid circular dependency
      window.dispatchEvent(new CustomEvent('openDauerhafteAusgabenModal', { detail: { rowIndex: idx } }));
    });
    
    // Add cursor pointer style
    tr.style.cursor = "pointer";

    for (const col of COLUMNS) {
      const td = document.createElement("td");
      td.dataset.row = String(idx);
      td.dataset.col = col;

      // Display formatted content (read-only)
      td.innerHTML = toCellDisplay(col, row[col]);

      // Right-align amount column
      if (col === 'Betrag') {
        td.style.textAlign = "right";
        td.style.fontWeight = "600";
      }

      tr.appendChild(td);
    }

    // Add action buttons
    const actionTd = document.createElement("td");
    actionTd.className = "actions";
    
    const editBtn = document.createElement("button");
    editBtn.textContent = "Bearbeiten";
    editBtn.className = "edit-btn";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('openDauerhafteAusgabenModal', { detail: { rowIndex: idx } }));
    };
    
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Löschen";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('deleteDauerhafteAusgabe', { detail: { rowIndex: idx } }));
    };
    
    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });
  
  // Update undo/redo button states
  updateUndoRedoButtons();
}
