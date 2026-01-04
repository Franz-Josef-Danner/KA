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
    
    // Filter companies with Status = "Kunde" and return full company objects
    const customerCompanies = companies
      .filter(company => company.Status === "Kunde" && company.Firma)
      .map(company => ({
        Firmen_ID: company.Firmen_ID || "",
        Firma: (company.Firma || "").trim(),
        Adresse: company.Adresse || "",
        "E-mail": company["E-mail"] || ""
      }))
      .filter(company => company.Firma); // Remove empty company names
    
    // Sort by company name alphabetically
    return customerCompanies.sort((a, b) => a.Firma.localeCompare(b.Firma));
  } catch (error) {
    console.error('Error loading customer companies:', error);
    return [];
  }
}

// Function to get company data by company name
function getCompanyByName(firmaName) {
  const companies = getCustomerCompanies();
  return companies.find(company => company.Firma === firmaName);
}

// Function to generate order ID based on company selection
function generateOrderId(firmaName) {
  if (!firmaName) {
    return "AUF-" + Date.now();
  }
  
  const company = getCompanyByName(firmaName);
  if (!company || !company.Firmen_ID) {
    return "AUF-" + Date.now();
  }
  
  // Get current date in YYYYMMDD format
  const now = new Date();
  const dateStr = now.getFullYear().toString() + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
  
  // Calculate sequence number: count existing orders for this company today
  const rows = getRows();
  const todayPrefix = company.Firmen_ID + "-" + dateStr + "-";
  const existingOrdersToday = rows.filter(row => 
    row.Auftrags_ID && row.Auftrags_ID.startsWith(todayPrefix)
  );
  const sequenceNumber = (existingOrdersToday.length + 1).toString().padStart(3, '0');
  
  // Format: Firmen_ID-YYYYMMDD-XXX
  return `${company.Firmen_ID}-${dateStr}-${sequenceNumber}`;
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
        customerCompanies.forEach(company => {
          const optionElement = document.createElement("option");
          optionElement.value = company.Firma;
          optionElement.textContent = company.Firma;
          input.appendChild(optionElement);
        });
        
        // If the current value is not in the list, add it as an option
        const currentFirma = rowData[col] || "";
        if (currentFirma && !customerCompanies.some(c => c.Firma === currentFirma)) {
          const customOption = document.createElement("option");
          customOption.value = currentFirma;
          customOption.textContent = currentFirma + " (nicht in Kundenliste)";
          input.appendChild(customOption);
        }
        
        // Set the value
        input.value = currentFirma;
        
        // Remove any existing event listeners by cloning and replacing the element
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        // Add event listener for company selection change
        newInput.addEventListener("change", onCompanySelectionChange);
        
        // Trigger initial update if a company is already selected
        if (currentFirma) {
          updateCompanyInfo(currentFirma);
        } else {
          hideCompanyInfo();
        }
      } else {
        input.value = rowData[col] || "";
      }
    }
  }
}

// Function to update company info (address and email) when company is selected
function onCompanySelectionChange(event) {
  const selectedFirma = event.target.value;
  
  if (selectedFirma) {
    updateCompanyInfo(selectedFirma);
    
    // Auto-generate order ID only for new orders (when currentEditingRowIndex is null)
    if (currentEditingRowIndex === null) {
      const auftragsIdInput = document.getElementById("edit_Auftrags_ID");
      if (auftragsIdInput) {
        auftragsIdInput.value = generateOrderId(selectedFirma);
      }
    }
  } else {
    hideCompanyInfo();
  }
}

// Function to display company address and email
function updateCompanyInfo(firmaName) {
  const company = getCompanyByName(firmaName);
  
  const addressGroup = document.getElementById("company_address_group");
  const addressDiv = document.getElementById("company_address");
  const emailGroup = document.getElementById("company_email_group");
  const emailDiv = document.getElementById("company_email");
  
  if (company) {
    // Show and populate address
    if (company.Adresse) {
      addressDiv.textContent = company.Adresse;
      addressGroup.style.display = "block";
    } else {
      addressGroup.style.display = "none";
    }
    
    // Show and populate email
    if (company["E-mail"]) {
      emailDiv.textContent = company["E-mail"];
      emailGroup.style.display = "block";
    } else {
      emailGroup.style.display = "none";
    }
  } else {
    hideCompanyInfo();
  }
}

// Function to hide company info fields
function hideCompanyInfo() {
  const addressGroup = document.getElementById("company_address_group");
  const emailGroup = document.getElementById("company_email_group");
  
  if (addressGroup) addressGroup.style.display = "none";
  if (emailGroup) emailGroup.style.display = "none";
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
