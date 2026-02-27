// -----------------------------
// Rendering Module
// -----------------------------
import { COLUMNS, STATUS_OPTIONS, GESCHLECHT_OPTIONS, KATEGORIE_OPTIONS } from './config.js';
import { getRows, setRows, newEmptyRow, save } from './state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { toCellDisplay } from '../utils/formatting.js';
import { findDuplicates, getRowsWithDuplicates } from './duplicates.js';
import { rowMatchesSearch } from './search.js';
import { updateUndoRedoButtons } from './ui.js';
import { validateStatusChange } from './validation.js';

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");
const entryCountEl = document.getElementById("entry-count");

// Sort state
let sortColumn = null;
let sortDirection = null; // 'asc', 'desc', or null

// Columns selected for search filtering (empty = all columns)
const searchColumns = new Set();

// Currently visible row indices (updated on every render)
let visibleRowIndices = [];

// Pagination state
let currentPage = 0;
const PAGE_SIZE_DESKTOP = 200;
const PAGE_SIZE_MOBILE = 50;

function getPageSize() {
  return window.matchMedia('(max-width: 768px)').matches ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;
}

export function resetPage() {
  currentPage = 0;
}

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

    // Remove existing bulk edit button to avoid duplicates
    const existingBulkBtn = th.querySelector('.bulk-edit-btn');
    if (existingBulkBtn) existingBulkBtn.remove();

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
      currentPage = 0;
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
      currentPage = 0;
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
      currentPage = 0;
      render();
    });

    filterLabel.appendChild(filterCheckbox);
    th.insertBefore(filterLabel, th.firstChild);

    // Add bulk edit button (skip read-only Firmen_ID column)
    if (col !== 'Firmen_ID') {
      const bulkBtn = document.createElement('button');
      bulkBtn.className = 'bulk-edit-btn';
      bulkBtn.textContent = '✎';
      bulkBtn.title = `Massenänderung für Spalte „${col}"`;
      bulkBtn.addEventListener('click', () => showBulkEditModal(col));
      th.insertBefore(bulkBtn, th.firstChild);
    }
  });
}

/**
 * Show a modal dialog for bulk editing a column on all currently visible rows.
 * @param {string} col - The column key to bulk-edit.
 */
function showBulkEditModal(col) {
  const count = visibleRowIndices.length;

  // Build overlay
  const overlay = document.createElement('div');
  overlay.className = 'bulk-edit-overlay';

  const modal = document.createElement('div');
  modal.className = 'bulk-edit-modal';

  const title = document.createElement('h3');
  title.textContent = `Massenänderung: ${col}`;
  modal.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'bulk-edit-desc';
  desc.textContent = `Änderung wird auf ${count} sichtbare ${count === 1 ? 'Eintrag' : 'Einträge'} angewendet.`;
  modal.appendChild(desc);

  // Input element depending on column type
  let inputEl;
  if (col === 'Status') {
    inputEl = document.createElement('select');
    inputEl.className = 'bulk-edit-input';
    STATUS_OPTIONS.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      inputEl.appendChild(o);
    });
  } else if (col === 'Geschlecht') {
    inputEl = document.createElement('select');
    inputEl.className = 'bulk-edit-input';
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '—';
    inputEl.appendChild(emptyOpt);
    GESCHLECHT_OPTIONS.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      inputEl.appendChild(o);
    });
  } else if (col === 'Kategorie') {
    inputEl = document.createElement('select');
    inputEl.className = 'bulk-edit-input';
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '—';
    inputEl.appendChild(emptyOpt);
    KATEGORIE_OPTIONS.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      inputEl.appendChild(o);
    });
  } else if (col === 'Persönlich') {
    inputEl = document.createElement('select');
    inputEl.className = 'bulk-edit-input';
    [['false', 'Nein'], ['true', 'Ja']].forEach(([val, label]) => {
      const o = document.createElement('option');
      o.value = val;
      o.textContent = label;
      inputEl.appendChild(o);
    });
  } else {
    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'bulk-edit-input';
    inputEl.placeholder = `Neuer Wert für „${col}"`;
  }
  modal.appendChild(inputEl);

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'bulk-edit-btns';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'bulk-edit-confirm';
  confirmBtn.textContent = 'Übernehmen';
  confirmBtn.addEventListener('click', async () => {
    const value = inputEl.value;
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    try {
      await applyBulkEdit(col, value);
    } catch (err) {
      console.error('Bulk edit failed:', err);
      alert('Massenänderung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'bulk-edit-cancel';
  cancelBtn.textContent = 'Abbrechen';
  cancelBtn.addEventListener('click', () => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  });

  btnRow.appendChild(confirmBtn);
  btnRow.appendChild(cancelBtn);
  modal.appendChild(btnRow);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  });

  // Focus the input
  inputEl.focus();
}

/**
 * Apply a bulk edit value to all currently visible rows for the given column.
 * @param {string} col - The column key.
 * @param {string} value - The new value to set.
 */
async function applyBulkEdit(col, value) {
  if (visibleRowIndices.length === 0) return;
  const currentRows = getRows();
  for (const idx of visibleRowIndices) {
    currentRows[idx][col] = value;
  }
  await setRows(currentRows);
  const saved = await save();
  if (!saved) {
    console.warn('Bulk edit: data updated but could not be saved');
  }
  await render();
}

/**
 * Render pagination controls (prev/next buttons and range label).
 * @param {number} total - Total number of filtered rows.
 * @param {number} pageStart - Index of the first visible row (0-based).
 * @param {number} pageEnd - Index after the last visible row (exclusive).
 */
function renderPagination(total, pageStart, pageEnd) {
  const paginationEls = [
    document.getElementById('pagination-top'),
    document.getElementById('pagination'),
  ];

  paginationEls.forEach(el => { if (el) el.innerHTML = ''; });

  const pageSize = getPageSize();
  const totalPages = Math.ceil(total / pageSize) || 1;

  if (totalPages <= 1) return;

  function buildControls() {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '←';
    prevBtn.title = 'Vorherige Seite';
    prevBtn.disabled = currentPage === 0;
    prevBtn.addEventListener('click', () => { currentPage--; render(); });

    const rangeLabel = document.createElement('span');
    rangeLabel.className = 'pagination-range';
    rangeLabel.textContent = `${pageStart}–${pageEnd}`;

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '→';
    nextBtn.title = 'Nächste Seite';
    nextBtn.disabled = currentPage >= totalPages - 1;
    nextBtn.addEventListener('click', () => { currentPage++; render(); });

    return [prevBtn, rangeLabel, nextBtn];
  }

  paginationEls.forEach(el => {
    if (!el) return;
    buildControls().forEach(node => el.appendChild(node));
  });
}

export async function render() {
  renderSortHeaders();
  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";
  visibleRowIndices = [];

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
    if (entryCountEl) entryCountEl.textContent = '0 Einträge';
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

  // First pass: collect all filtered indices (before pagination)
  const allFilteredIndices = [];
  orderedIndices.forEach((idx) => {
    const row = rows[idx];
    if (!rowMatchesSearch(row, q, [...searchColumns])) return;
    allFilteredIndices.push(idx);
  });

  // Apply pagination
  const pageSize = getPageSize();
  const totalFiltered = allFilteredIndices.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  if (currentPage < 0) currentPage = 0;
  const pageStart = currentPage * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, totalFiltered);
  visibleRowIndices = allFilteredIndices.slice(pageStart, pageEnd);

  // Second pass: render rows for current page
  visibleRowIndices.forEach((idx) => {
    const row = rows[idx];

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

  // Update entry counter
  if (entryCountEl) {
    entryCountEl.textContent = `${totalFiltered} ${totalFiltered === 1 ? 'Eintrag' : 'Einträge'}`;
  }

  // Render pagination controls
  renderPagination(totalFiltered, pageStart, pageEnd);
  
  // Update undo/redo button states after render
  updateUndoRedoButtons();
}
