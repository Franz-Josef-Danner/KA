// -----------------------------
// Ausgaben Rendering Module
// -----------------------------
import { COLUMNS } from './ausgaben-config.js';
import { getRows } from './ausgaben-state.js';
import { toCellDisplay } from '../utils/formatting.js';
import { rowMatchesSearch } from './ausgaben-search.js';
import { updateUndoRedoButtons } from './ausgaben-ui.js';

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

export function render() {
  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";

  const rows = getRows();

  const parseDate = (str) => {
    if (!str) return 0;
    // ISO format: YYYY-MM-DD
    const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]).getTime();
    // German format: DD.MM.YYYY
    const de = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (de) return new Date(+de[3], +de[2] - 1, +de[1]).getTime();
    // Slash format: DD/MM/YYYY
    const sl = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (sl) return new Date(+sl[3], +sl[2] - 1, +sl[1]).getTime();
    return Date.parse(str) || 0;
  };

  const indexedRows = rows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => rowMatchesSearch(row, q))
    .sort((a, b) => {
      const dateA = parseDate(a.row.Datum);
      const dateB = parseDate(b.row.Datum);
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      // Stable fallback: newer insertions usually have higher source index.
      return b.idx - a.idx;
    });

  indexedRows.forEach(({ row, idx }) => {

    const tr = document.createElement("tr");
    
    // Add double-click handler to open edit modal
    tr.addEventListener("dblclick", () => {
      // Dispatch custom event to avoid circular dependency
      window.dispatchEvent(new CustomEvent('openAusgabenModal', { detail: { rowIndex: idx } }));
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
      window.dispatchEvent(new CustomEvent('openAusgabenModal', { detail: { rowIndex: idx } }));
    };
    
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Löschen";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('deleteAusgabe', { detail: { rowIndex: idx } }));
    };
    
    actionTd.appendChild(editBtn);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });
  
  // Update undo/redo button states
  updateUndoRedoButtons();
}
