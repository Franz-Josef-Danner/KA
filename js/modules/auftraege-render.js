// -----------------------------
// Aufträge Rendering Module
// -----------------------------
import { COLUMNS, STATUS_OPTIONS } from './auftraege-config.js';
import { getRows, setRows, newEmptyRow, save } from './auftraege-state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { toCellDisplay } from '../utils/formatting.js';
import { debounce } from '../utils/helpers.js';
import { rowMatchesSearch } from './auftraege-search.js';
import { updateUndoRedoButtons } from './ui.js';

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

export function render() {
  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";

  const rows = getRows();

  rows.forEach((row, idx) => {
    if (!rowMatchesSearch(row, q)) return;

    const tr = document.createElement("tr");

    for (const col of COLUMNS) {
      const td = document.createElement("td");
      td.dataset.row = String(idx);
      td.dataset.col = col;

      // Special handling for Status column - use dropdown
      if (col === "Status") {
        const select = document.createElement("select");
        select.className = "status-select";
        select.setAttribute("aria-label", "Status");
        
        // Add all status options
        STATUS_OPTIONS.forEach(option => {
          const optionElement = document.createElement("option");
          optionElement.value = option;
          optionElement.textContent = option;
          if (row[col] === option) {
            optionElement.selected = true;
          }
          select.appendChild(optionElement);
        });
        
        // Handle change event
        select.addEventListener("change", (e) => {
          const currentRows = getRows();
          currentRows[idx][col] = e.target.value;
          setRows(currentRows);
          save();
        });
        
        td.appendChild(select);
      } else {
        // Regular contenteditable cells for other columns
        td.setAttribute("contenteditable", "true");
        
        // Display HTML formatting
        td.innerHTML = toCellDisplay(col, row[col]);

        // On focus: show plain text for editing
        td.addEventListener("focus", () => {
          const originalValue = getRows()[idx][col] ?? "";
          td.textContent = originalValue;
          td.dataset.originalValue = sanitizeText(originalValue);
        });

        // On blur: save and format display
        td.addEventListener("blur", () => {
          const newVal = td.textContent ?? "";
          const originalValue = td.dataset.originalValue ?? "";
          const currentRows = getRows();
          const sanitizedNewVal = sanitizeText(newVal);
          
          // Only update and save to history if the value actually changed
          if (sanitizedNewVal !== originalValue) {
            currentRows[idx][col] = sanitizedNewVal;
            setRows(currentRows);
          }
          
          td.innerHTML = toCellDisplay(col, currentRows[idx][col]);
          debouncedRender();
        });
      }

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
      setRows(rows);
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
      const ok = confirm("Sind Sie sicher, dass Sie diesen Auftrag löschen möchten?");
      if (!ok) return;
      rows.splice(idx, 1);
      setRows(rows);
      save();
      render();
    });
    act.appendChild(minus);
    
    tr.appendChild(act);

    tbody.appendChild(tr);
  });
  
  // Update undo/redo button states after render
  updateUndoRedoButtons();
}

// Create a debounced version of render to avoid multiple rapid re-renders
export const debouncedRender = debounce(render, 300);
