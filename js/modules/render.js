// -----------------------------
// Rendering Module
// -----------------------------
import { COLUMNS, STATUS_OPTIONS, GESCHLECHT_OPTIONS } from './config.js';
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

export async function render() {
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

  // Auto-populate Geschlecht column based on Gender column if needed
  // This runs at render time but only processes rows where Geschlecht is undefined/null.
  // After processing, each row will have a value (either "Mann", "Frau", or ""), 
  // so it won't be processed again on subsequent renders.
  let hasChanges = false;
  rows.forEach(row => {
    // Only populate if field doesn't exist or is null/undefined (not empty string)
    if (row["Geschlecht"] === undefined || row["Geschlecht"] === null) {
      const genderValue = String(row["Gender"] || "").trim();
      if (genderValue === "Sehr geehrter Herr") {
        row["Geschlecht"] = "Mann";
        hasChanges = true;
      } else if (genderValue === "Sehr geehrte Frau") {
        row["Geschlecht"] = "Frau";
        hasChanges = true;
      } else {
        // Set to empty string to mark as processed (but don't mark as changed)
        row["Geschlecht"] = "";
      }
    }
  });
  
  // Save auto-populated values if any meaningful changes were made
  if (hasChanges) {
    try {
      await setRows(rows);
      await save();
    } catch (error) {
      console.error('Failed to save auto-populated Geschlecht values:', error);
    }
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
  
  const orderedIndices = [...duplicateIndices, ...nonDuplicateIndices];

  orderedIndices.forEach((idx) => {
    const row = rows[idx];
    if (!rowMatchesSearch(row, q)) return;

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
