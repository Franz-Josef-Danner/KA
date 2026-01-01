// -----------------------------
// Rendering Module
// -----------------------------
import { COLUMNS } from './config.js';
import { getRows, newEmptyRow, save } from './state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { toCellDisplay } from '../utils/formatting.js';
import { debounce } from '../utils/helpers.js';
import { findDuplicates, getRowsWithDuplicates } from './duplicates.js';
import { rowMatchesSearch } from './search.js';

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

export function render() {
  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";

  const rows = getRows();

  // Find duplicates in all rows (before filtering by search)
  const duplicateMap = findDuplicates(rows);
  const rowsWithDuplicates = getRowsWithDuplicates(duplicateMap);
  
  // Sort rows: rows with duplicates first, then others
  const duplicateIndices = [];
  const nonDuplicateIndices = [];
  
  rows.forEach((row, idx) => {
    if (rowsWithDuplicates.has(idx)) {
      duplicateIndices.push(idx);
    } else {
      nonDuplicateIndices.push(idx);
    }
  });
  
  const orderedIndices = [...duplicateIndices, ...nonDuplicateIndices];

  orderedIndices.forEach((idx) => {
    const row = rows[idx];
    if (!rowMatchesSearch(row, q)) return;

    const tr = document.createElement("tr");

    for (const col of COLUMNS) {
      const td = document.createElement("td");
      td.setAttribute("contenteditable", "true");
      td.dataset.row = String(idx);
      td.dataset.col = col;

      // Check if this cell contains a duplicate value
      const value = String(row[col] ?? "").trim();
      const isDuplicate = value && duplicateMap.has(col) && duplicateMap.get(col).has(value);
      
      // Für Linkspalten (Email/Webseite) HTML anzeigen, aber Text editieren:
      td.innerHTML = toCellDisplay(col, row[col]);
      
      // Add duplicate class if this cell has a duplicate value
      if (isDuplicate) {
        td.classList.add("duplicate");
      }

      // Beim Fokus: reiner Text zum Editieren
      td.addEventListener("focus", () => {
        td.textContent = row[col] ?? "";
      });

      // Beim Blur: speichern + hübsch darstellen
      td.addEventListener("blur", () => {
        const newVal = td.textContent ?? "";
        rows[idx][col] = sanitizeText(newVal);
        td.innerHTML = toCellDisplay(col, rows[idx][col]);
        // Use debounced render to avoid multiple rapid re-renders during editing
        debouncedRender();
      });

      tr.appendChild(td);
    }

    const act = document.createElement("td");
    act.className = "actions";
    
    // Plus button - add row below
    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.title = "Zeile darunter einfügen";
    plus.addEventListener("click", () => {
      rows.splice(idx + 1, 0, newEmptyRow());
      save();
      render();
    });
    act.appendChild(plus);
    
    // Minus button - delete row with confirmation
    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.title = "Zeile löschen";
    minus.className = "danger";
    minus.addEventListener("click", () => {
      const ok = confirm("Sind Sie sicher, dass Sie diese Zeile löschen möchten?");
      if (!ok) return;
      rows.splice(idx, 1);
      save();
      render();
    });
    act.appendChild(minus);
    
    tr.appendChild(act);

    tbody.appendChild(tr);
  });
}

// Create a debounced version of render to avoid multiple rapid re-renders
export const debouncedRender = debounce(render, 300);
