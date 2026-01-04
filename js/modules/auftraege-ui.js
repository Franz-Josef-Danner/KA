// -----------------------------
// Aufträge UI Updates
// -----------------------------
import { canUndo, canRedo, getRows, setRows, save, newEmptyRow } from './auftraege-state.js';
import { COLUMNS, STATUS_OPTIONS } from './auftraege-config.js';
import { sanitizeText } from '../utils/sanitize.js';

export function updateUndoRedoButtons() {
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  
  if (undoBtn) {
    undoBtn.disabled = !canUndo();
  }
  
  if (redoBtn) {
    redoBtn.disabled = !canRedo();
  }
}

let currentEditingRowIndex = null;

export function openOrderModal(rowIndex) {
  currentEditingRowIndex = rowIndex;
  const modal = document.getElementById("orderModal");
  const modalTitle = document.getElementById("modalTitle");
  const form = document.getElementById("orderForm");
  
  // Set modal title
  if (rowIndex === null) {
    modalTitle.textContent = "Neuer Auftrag";
  } else {
    modalTitle.textContent = "Auftrag bearbeiten";
  }
  
  // Populate form with data
  if (rowIndex === null) {
    // New order - populate with defaults
    const emptyRow = newEmptyRow();
    populateForm(emptyRow);
  } else {
    // Edit existing order
    const rows = getRows();
    const row = rows[rowIndex];
    populateForm(row);
  }
  
  // Show modal
  modal.style.display = "flex";
  
  // Focus first input
  setTimeout(() => {
    document.getElementById("edit_Auftrags_ID").focus();
  }, 100);
}

function populateForm(rowData) {
  for (const col of COLUMNS) {
    const input = document.getElementById(`edit_${col}`);
    if (input) {
      if (col === "Status" && input.tagName === "SELECT") {
        // Populate status dropdown options dynamically
        input.innerHTML = "";
        STATUS_OPTIONS.forEach(option => {
          const optionElement = document.createElement("option");
          optionElement.value = option;
          optionElement.textContent = option;
          if (rowData[col] === option) {
            optionElement.selected = true;
          }
          input.appendChild(optionElement);
        });
      } else {
        input.value = rowData[col] || "";
      }
    }
  }
}

function getFormData() {
  const formData = {};
  for (const col of COLUMNS) {
    const input = document.getElementById(`edit_${col}`);
    if (input) {
      formData[col] = sanitizeText(input.value || "");
    }
  }
  return formData;
}

function validateForm() {
  const auftragsId = document.getElementById("edit_Auftrags_ID");
  
  // Check if Auftrags-ID element exists
  if (!auftragsId) {
    console.error("Auftrags-ID field not found");
    return false;
  }
  
  // Check if Auftrags-ID is filled (required field)
  if (!auftragsId.value.trim()) {
    alert("Auftrags-ID ist ein Pflichtfeld und muss ausgefüllt werden.");
    auftragsId.focus();
    return false;
  }
  
  return true;
}

function closeModal() {
  const modal = document.getElementById("orderModal");
  modal.style.display = "none";
  currentEditingRowIndex = null;
}

function saveOrder() {
  // Validate form before saving
  if (!validateForm()) {
    return false;
  }
  
  const formData = getFormData();
  const rows = getRows();
  
  if (currentEditingRowIndex === null) {
    // New order - add to beginning
    rows.unshift(formData);
  } else {
    // Edit existing order
    rows[currentEditingRowIndex] = formData;
  }
  
  setRows(rows);
  save();
  
  // Trigger render event - avoid circular dependency by using custom event
  window.dispatchEvent(new Event('ordersChanged'));
  
  closeModal();
  return true;
}

// Initialize modal event handlers
function initModalHandlers() {
  const modalClose = document.getElementById("modalClose");
  const modalCancel = document.getElementById("modalCancel");
  const modalSave = document.getElementById("modalSave");
  const modal = document.getElementById("orderModal");
  
  // Close button
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }
  
  // Cancel button
  if (modalCancel) {
    modalCancel.addEventListener("click", closeModal);
  }
  
  // Save button
  if (modalSave) {
    modalSave.addEventListener("click", () => {
      saveOrder();
    });
  }
  
  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
  
  // Handle Enter key in form inputs (except textarea)
  const form = document.getElementById("orderForm");
  if (form) {
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        saveOrder();
      }
    });
  }
}

// Initialize modal handlers when the module loads
initModalHandlers();

// Listen for custom events to avoid circular dependencies
window.addEventListener('openOrderModal', (e) => {
  openOrderModal(e.detail.rowIndex);
});

window.addEventListener('ordersChanged', () => {
  // Dynamically import render to avoid circular dependency at module load time
  import('./auftraege-render.js').then(module => {
    module.render();
  });
});
