// -----------------------------
// Aufträge UI Updates
// -----------------------------
import { canUndo, canRedo, getRows, setRows, save, newEmptyRow } from './auftraege-state.js';
import { COLUMNS, STATUS_OPTIONS } from './auftraege-config.js';
import { sanitizeText } from '../utils/sanitize.js';
import { render } from './auftraege-render.js';

// Function to get companies with "Kunde" status from firmenliste
function getCustomerCompanies() {
  try {
    const firmenData = localStorage.getItem("firmen_tabelle_v1");
    if (!firmenData) return [];
    
    const companies = JSON.parse(firmenData);
    if (!Array.isArray(companies)) return [];
    
    // Filter companies with Status = "Kunde" and extract unique company names
    const customerCompanies = companies
      .filter(company => company.Status === "Kunde" && company.Firma)
      .map(company => company.Firma.trim())
      .filter((firma, index, self) => firma && self.indexOf(firma) === index); // Remove duplicates and empty values
    
    return customerCompanies.sort(); // Sort alphabetically
  } catch (error) {
    console.error('Error loading customer companies:', error);
    return [];
  }
}

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
      } else if (col === "Firma" && input.tagName === "SELECT") {
        // Populate company dropdown with customers
        input.innerHTML = "";
        
        // Add empty option first
        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "-- Firma auswählen --";
        input.appendChild(emptyOption);
        
        // Add customer companies
        const customerCompanies = getCustomerCompanies();
        customerCompanies.forEach(firma => {
          const optionElement = document.createElement("option");
          optionElement.value = firma;
          optionElement.textContent = firma;
          if (rowData[col] === firma) {
            optionElement.selected = true;
          }
          input.appendChild(optionElement);
        });
        
        // If the current value is not in the list, add it as an option and select it
        const currentFirma = rowData[col] || "";
        if (currentFirma && !customerCompanies.includes(currentFirma)) {
          const customOption = document.createElement("option");
          customOption.value = currentFirma;
          customOption.textContent = currentFirma + " (nicht in Kundenliste)";
          customOption.selected = true;
          input.appendChild(customOption);
        }
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
  
  // Check if Auftrags-ID is filled (required field)
  if (!auftragsId || !auftragsId.value.trim()) {
    alert("Auftrags-ID ist ein Pflichtfeld und muss ausgefüllt werden.");
    if (auftragsId) auftragsId.focus();
    return false;
  }
  
  return true;
}

function closeModal() {
  const modal = document.getElementById("orderModal");
  modal.style.display = "none";
  currentEditingRowIndex = null;
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
      // Validate form before saving
      if (!validateForm()) {
        return;
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
      render();
      closeModal();
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
        // Validate before triggering save
        if (validateForm()) {
          modalSave.click();
        }
      }
    });
  }
}

// Initialize modal handlers when the module loads
initModalHandlers();
