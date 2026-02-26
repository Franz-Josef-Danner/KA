// -----------------------------
// Rendering Module
// -----------------------------
import { COLUMNS, STATUS_OPTIONS, GESCHLECHT_OPTIONS, KATEGORIE_OPTIONS } from './config.js';
import { getRows, setRows, newEmptyRow, save } from './state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { toCellDisplay } from '../utils/formatting.js';
import { debounce } from '../utils/helpers.js';
import { findDuplicates, getRowsWithDuplicates } from './duplicates.js';
import { rowMatchesSearch } from './search.js';
import { updateUndoRedoButtons } from './ui.js';
import { validateStatusChange } from './validation.js';

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

// Sort state
let sortColumn = null;
let sortDirection = null; // 'asc', 'desc', or null

// Columns selected for search filtering (empty = all columns)
const searchColumns = new Set();

function renderSortHeaders() {
  const headerRow = document.querySelector('#grid thead tr');
  if (!headerRow) return;

  const ths = headerRow.querySelectorAll('th');
  ths.forEach((th, idx) => {
    if (th.classList.contains('actions')) return;
    const col = COLUMNS[idx];
    if (!col) return;

    // Remove existing sort controls to avoid duplicates
    const existing = th.querySelector('.sort-controls');
    if (existing) existing.remove();

    // Remove existing search filter checkbox to avoid duplicates
    const existingFilter = th.querySelector('.col-search-filter');
    if (existingFilter) existingFilter.remove();

    const controls = document.createElement('div');
    controls.className = 'sort-controls';

    const btnAsc = document.createElement('button');
    btnAsc.className = 'sort-btn' + (sortColumn === col && sortDirection === 'asc' ? ' active' : '');
    btnAsc.textContent = '↑';
    btnAsc.title = 'Aufsteigend sortieren (A–Z)';
    btnAsc.addEventListener('click', () => {
      if (sortColumn === col && sortDirection === 'asc') {
        sortColumn = null;
        sortDirection = null;
      } else {
        sortColumn = col;
        sortDirection = 'asc';
      }
      render();
    });

    const btnDesc = document.createElement('button');
    btnDesc.className = 'sort-btn' + (sortColumn === col && sortDirection === 'desc' ? ' active' : '');
    btnDesc.textContent = '↓';
    btnDesc.title = 'Absteigend sortieren (Z–A)';
    btnDesc.addEventListener('click', () => {
      if (sortColumn === col && sortDirection === 'desc') {
        sortColumn = null;
        sortDirection = null;
      } else {
        sortColumn = col;
        sortDirection = 'desc';
      }
      render();
    });

    controls.appendChild(btnAsc);
    controls.appendChild(btnDesc);
    th.insertBefore(controls, th.firstChild);

    // Add search filter checkbox
    const filterLabel = document.createElement('label');
    filterLabel.className = 'col-search-filter';
    filterLabel.title = 'Diese Spalte in die Suche einbeziehen';

    const filterCheckbox = document.createElement('input');
    filterCheckbox.type = 'checkbox';
    filterCheckbox.checked = searchColumns.has(col);
    filterCheckbox.addEventListener('change', () => {
      if (filterCheckbox.checked) {
        searchColumns.add(col);
      } else {
        searchColumns.delete(col);
      }
      render();
    });

    filterLabel.appendChild(filterCheckbox);
    th.insertBefore(filterLabel, th.firstChild);
  });
}

export async function render() {
  renderSortHeaders();
  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";

  const rows = getRows();
  
  // If no rows exist, show a button to add the first row
  if (rows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = COLUMNS.length + 1; // Span all columns including actions
    td.style.textAlign = "center";
    td.style.padding = "20px";
    
    const addButton = document.createElement("button");
    addButton.textContent = "+ Erste Zeile hinzufügen";
    addButton.title = "Erste Zeile zur Tabelle hinzufügen";
    addButton.addEventListener("click", async () => {
      await setRows([newEmptyRow()]);
      await save();
      await render();
    });
    
    td.appendChild(addButton);
    tr.appendChild(td);
    tbody.appendChild(tr);
    
    // Update undo/redo button states after render
    updateUndoRedoButtons();
    return;
  }

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
  
  let orderedIndices;
  if (sortColumn) {
    orderedIndices = [...duplicateIndices, ...nonDuplicateIndices].sort((a, b) => {
      const valA = String(rows[a][sortColumn] ?? '').toLowerCase();
      const valB = String(rows[b][sortColumn] ?? '').toLowerCase();
      const cmp = valA.localeCompare(valB, 'de');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  } else {
    orderedIndices = [...duplicateIndices, ...nonDuplicateIndices];
  }

  orderedIndices.forEach((idx) => {
    const row = rows[idx];
    if (!rowMatchesSearch(row, q, [...searchColumns])) return;

    const tr = document.createElement("tr");

    for (const col of COLUMNS) {
      const td = document.createElement("td");
      td.dataset.row = String(idx);
      td.dataset.col = col;

      // Check if this cell contains a duplicate value
      const value = String(row[col] ?? "").trim();
      const isDuplicate = value && duplicateMap.has(col) && duplicateMap.get(col).has(value);
      
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
        select.addEventListener("change", async (e) => {
          const currentRows = getRows();
          const oldStatus = currentRows[idx][col];
          const newStatus = e.target.value;
          const firmenId = currentRows[idx]["Firmen_ID"] || "";
          const firmaName = currentRows[idx]["Firma"] || "";
          
          // Validate status change
          const validation = validateStatusChange(oldStatus, newStatus, firmenId, firmaName);
          
          if (!validation.allowed) {
            // Revert the dropdown to the old value
            e.target.value = oldStatus;
            // Show warning message
            alert(validation.message);
            return;
          }
          
          // If confirmation is required, ask user
          if (validation.requiresConfirmation) {
            const confirmed = confirm(validation.confirmationMessage);
            if (!confirmed) {
              // User declined, revert the dropdown to the old value
              e.target.value = oldStatus;
              return;
            }
          }
          
          // If validation passed (and confirmation given if required), proceed with the change
          currentRows[idx][col] = newStatus;
          await setRows(currentRows);
          await save();
          // Re-render to update Firmen_ID based on new status
          await render();
        });
        
        td.appendChild(select);
      } else if (col === "Geschlecht") {
        // Special handling for Geschlecht column - use dropdown
        const select = document.createElement("select");
        select.className = "geschlecht-select";
        select.setAttribute("aria-label", "Geschlecht");
        
        // Add empty option first
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "";
        select.appendChild(emptyOption);
        
        // Add all Geschlecht options
        GESCHLECHT_OPTIONS.forEach(option => {
          const optionElement = document.createElement("option");
          optionElement.value = option;
          optionElement.textContent = option;
          select.appendChild(optionElement);
        });
        
        // Set selected value (auto-population happens at the start of render())
        const geschlechtValue = row[col] || "";
        if (geschlechtValue) {
          select.value = geschlechtValue;
        }
        
        // Handle change event
        select.addEventListener("change", async (e) => {
          const currentRows = getRows();
          currentRows[idx][col] = e.target.value;
          await setRows(currentRows);
          await save();
        });
        
        td.appendChild(select);
      } else if (col === "Kategorie") {
        // Special handling for Kategorie column - use dropdown
        const select = document.createElement("select");
        select.className = "kategorie-select";
        select.setAttribute("aria-label", "Kategorie");
        
        // Add empty option first
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "";
        select.appendChild(emptyOption);
        
        // Add all Kategorie options
        KATEGORIE_OPTIONS.forEach(option => {
          const optionElement = document.createElement("option");
          optionElement.value = option;
          optionElement.textContent = option;
          select.appendChild(optionElement);
        });
        
        // Set selected value
        const kategorieValue = row[col] || "";
        if (kategorieValue) {
          select.value = kategorieValue;
        }
        
        // Handle change event
        select.addEventListener("change", async (e) => {
          const currentRows = getRows();
          currentRows[idx][col] = e.target.value;
          await setRows(currentRows);
          await save();
        });
        
        td.appendChild(select);
      } else if (col === "Persönlich") {
        // Special handling for Persönlich column - use checkbox
        td.setAttribute("contenteditable", "false");
        td.style.textAlign = "center";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "personlich-checkbox";
        checkbox.setAttribute("aria-label", "Persönlich");
        
        // Set checked state based on stored value
        const isChecked = row[col] === "true" || row[col] === true;
        checkbox.checked = isChecked;
        
        // Handle change event
        checkbox.addEventListener("change", async (e) => {
          const currentRows = getRows();
          currentRows[idx][col] = e.target.checked ? "true" : "false";
          await setRows(currentRows);
          await save();
        });
        
        td.appendChild(checkbox);
      } else if (col === "Firmen_ID") {
        // Firmen_ID column is read-only - auto-generated based on Status
        td.setAttribute("contenteditable", "false");
        td.classList.add("readonly");
        td.innerHTML = toCellDisplay(col, row[col]);
        td.title = "Automatisch generierte ID für Kunden";
      } else {
        // Regular contenteditable cells for other columns
        td.setAttribute("contenteditable", "true");
        
        // Für Linkspalten (Email/Webseite) HTML anzeigen, aber Text editieren:
        td.innerHTML = toCellDisplay(col, row[col]);
        
        // Add duplicate class if this cell has a duplicate value
        if (isDuplicate) {
          td.classList.add("duplicate");
        }

        // Beim Fokus: reiner Text zum Editieren
        td.addEventListener("focus", () => {
          const originalValue = getRows()[idx][col] ?? "";
          td.textContent = originalValue;
          // Store original value to compare on blur
          td.dataset.originalValue = sanitizeText(originalValue);
        });

        // Beim Blur: speichern + hübsch darstellen
        td.addEventListener("blur", async () => {
          const newVal = td.textContent ?? "";
          const originalValue = td.dataset.originalValue ?? "";
          const currentRows = getRows();
          const sanitizedNewVal = sanitizeText(newVal);
          
          // Only update and save to history if the value actually changed
          if (sanitizedNewVal !== originalValue) {
            currentRows[idx][col] = sanitizedNewVal;
            await setRows(currentRows);
          }
          
          td.innerHTML = toCellDisplay(col, currentRows[idx][col]);
          // Use debounced render to avoid multiple rapid re-renders during editing
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
    plus.addEventListener("click", async () => {
      rows.splice(idx + 1, 0, newEmptyRow());
      await setRows(rows);
      await save();
      await render();
    });
    act.appendChild(plus);
    
    // Minus button - delete row with confirmation
    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.title = "Zeile löschen";
    minus.className = "danger";
    minus.addEventListener("click", async () => {
      const ok = confirm("Sind Sie sicher, dass Sie diese Zeile löschen möchten?");
      if (!ok) return;
      rows.splice(idx, 1);
      await setRows(rows);
      await save();
      await render();
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
