// -----------------------------
// Aufträge UI Updates
// -----------------------------
import { canUndo, canRedo, getRows, setRows, save, newEmptyRow, newEmptyOrderItem } from './auftraege-state.js';
import { COLUMNS, STATUS_OPTIONS, ORDER_ITEM_COLUMNS } from './auftraege-config.js';
import { ARTIKELLISTEN_STORAGE_KEY } from './artikellisten-config.js';
import { sanitizeText } from '../utils/sanitize.js';

// Helper function to add a custom option to a select element if it doesn't exist
function addCustomOptionIfNeeded(selectElement, value, availableValues = null) {
  if (!value) return;
  
  let hasOption;
  if (availableValues) {
    hasOption = availableValues.includes(value);
  } else {
    hasOption = Array.from(selectElement.options).some(opt => opt.value === value);
  }
  
  if (!hasOption) {
    const customOption = document.createElement("option");
    customOption.value = value;
    customOption.textContent = value;
    selectElement.appendChild(customOption);
  }
  selectElement.value = value;
}

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
        "E-mail": company["E-mail"] || "",
        Titel: company.Titel || "",
        Vorname: company.Vorname || "",
        Nachname: company.Nachname || ""
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

// Function to get articles from a company's article list (artikelliste)
function getArticlesForCompany(firmaName) {
  try {
    const company = getCompanyByName(firmaName);
    if (!company || !company.Firmen_ID) return [];
    
    const artikellistenData = localStorage.getItem(ARTIKELLISTEN_STORAGE_KEY);
    if (!artikellistenData) return [];
    
    const artikellisten = JSON.parse(artikellistenData);
    if (typeof artikellisten !== 'object' || artikellisten === null) return [];
    
    const artikelliste = artikellisten[company.Firmen_ID];
    if (!artikelliste || !Array.isArray(artikelliste.items)) return [];
    
    // Extract unique article names from the article list
    const articles = artikelliste.items
      .filter(item => item.Artikel && item.Artikel.trim())
      .map(item => item.Artikel.trim());
    
    // Remove duplicates and sort
    return [...new Set(articles)].sort();
  } catch (error) {
    console.error('Error loading articles for company:', error);
    return [];
  }
}

// Function to get full article data by name from a company's article list
function getArticleDataByName(firmaName, artikelName) {
  try {
    const company = getCompanyByName(firmaName);
    if (!company || !company.Firmen_ID) return null;
    
    const artikellistenData = localStorage.getItem(ARTIKELLISTEN_STORAGE_KEY);
    if (!artikellistenData) return null;
    
    const artikellisten = JSON.parse(artikellistenData);
    if (typeof artikellisten !== 'object' || artikellisten === null) return null;
    
    const artikelliste = artikellisten[company.Firmen_ID];
    if (!artikelliste || !Array.isArray(artikelliste.items)) return null;
    
    // Find the article by name
    const article = artikelliste.items.find(item => 
      item.Artikel && item.Artikel.trim() === artikelName.trim()
    );
    
    return article || null;
  } catch (error) {
    console.error('Error loading article data:', error);
    return null;
  }
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
let currentOrderItems = []; // Holds the items being edited in the modal

// Function to calculate Gesamtpreis for an order item
function calculateItemGesamtpreis(menge, einzelpreis) {
  const m = parseFloat(menge) || 0;
  const e = parseFloat(einzelpreis) || 0;
  return (m * e).toFixed(2);
}

// Function to calculate and update order totals
function updateOrderTotals() {
  let subtotal = 0;
  
  currentOrderItems.forEach(item => {
    const gesamtpreis = parseFloat(item.Gesamtpreis) || 0;
    subtotal += gesamtpreis;
  });
  
  const subtotalElement = document.getElementById("orderSubtotal");
  const totalElement = document.getElementById("orderTotal");
  
  if (subtotalElement) {
    subtotalElement.textContent = subtotal.toFixed(2).replace('.', ',') + ' €';
  }
  
  if (totalElement) {
    // For now, final total is the same as subtotal (could add tax/discounts later)
    totalElement.textContent = subtotal.toFixed(2).replace('.', ',') + ' €';
  }
}

// Function to render order items table in the modal
function renderOrderItemsTable() {
  const tbody = document.getElementById("orderItemsTableBody");
  const emptyDiv = document.getElementById("orderItemsEmpty");
  
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  if (currentOrderItems.length === 0) {
    emptyDiv.style.display = "block";
    updateOrderTotals();
    return;
  }
  
  emptyDiv.style.display = "none";
  
  // Get selected company for auto-fill
  const firmaInput = document.getElementById("edit_Firma");
  const selectedFirma = firmaInput ? firmaInput.value : "";
  
  currentOrderItems.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.style.borderBottom = "1px solid #ddd";
    
    // Artikel column - dropdown
    const artikelTd = document.createElement("td");
    artikelTd.style.padding = "8px";
    artikelTd.style.borderRight = "1px solid #ddd";
    
    const artikelSelect = document.createElement("select");
    artikelSelect.style.width = "100%";
    artikelSelect.style.padding = "4px";
    artikelSelect.dataset.itemIndex = idx;
    artikelSelect.dataset.field = "Artikel";
    artikelSelect.setAttribute("aria-label", `Artikel auswählen für Position ${idx + 1}`);
    
    // Populate artikel dropdown
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "-- Artikel auswählen --";
    artikelSelect.appendChild(emptyOption);
    
    if (selectedFirma) {
      const articles = getArticlesForCompany(selectedFirma);
      articles.forEach(article => {
        const option = document.createElement("option");
        option.value = article;
        option.textContent = article;
        if (item.Artikel === article) {
          option.selected = true;
        }
        artikelSelect.appendChild(option);
      });
    }
    
    // Set current value
    if (item.Artikel && !selectedFirma) {
      const customOption = document.createElement("option");
      customOption.value = item.Artikel;
      customOption.textContent = item.Artikel;
      customOption.selected = true;
      artikelSelect.appendChild(customOption);
    } else {
      artikelSelect.value = item.Artikel || "";
    }
    
    artikelSelect.addEventListener("change", (e) => {
      const itemIndex = parseInt(e.target.dataset.itemIndex, 10);
      const selectedArtikel = e.target.value;
      currentOrderItems[itemIndex].Artikel = selectedArtikel;
      
      // Auto-fill Beschreibung and Einheit from article list
      if (selectedArtikel && selectedFirma) {
        const articleData = getArticleDataByName(selectedFirma, selectedArtikel);
        if (articleData) {
          // Only auto-fill if fields are currently empty
          if (!currentOrderItems[itemIndex].Beschreibung) {
            currentOrderItems[itemIndex].Beschreibung = articleData.Beschreibung || "";
          }
          if (!currentOrderItems[itemIndex].Einheit) {
            currentOrderItems[itemIndex].Einheit = articleData.Einheit || "";
          }
          if (!currentOrderItems[itemIndex].Einzelpreis) {
            currentOrderItems[itemIndex].Einzelpreis = articleData.Einzelpreis || "";
          }
          // Recalculate Gesamtpreis
          currentOrderItems[itemIndex].Gesamtpreis = calculateItemGesamtpreis(
            currentOrderItems[itemIndex].Menge,
            currentOrderItems[itemIndex].Einzelpreis
          );
          renderOrderItemsTable();
        }
      }
    });
    
    artikelTd.appendChild(artikelSelect);
    tr.appendChild(artikelTd);
    
    // Beschreibung column - input
    const beschreibungTd = document.createElement("td");
    beschreibungTd.style.padding = "8px";
    beschreibungTd.style.borderRight = "1px solid #ddd";
    
    const beschreibungInput = document.createElement("input");
    beschreibungInput.type = "text";
    beschreibungInput.style.width = "100%";
    beschreibungInput.style.padding = "4px";
    beschreibungInput.value = item.Beschreibung || "";
    beschreibungInput.dataset.itemIndex = idx;
    beschreibungInput.dataset.field = "Beschreibung";
    beschreibungInput.setAttribute("aria-label", `Beschreibung für Artikel ${idx + 1}`);
    beschreibungInput.addEventListener("input", (e) => {
      const itemIndex = parseInt(e.target.dataset.itemIndex, 10);
      currentOrderItems[itemIndex].Beschreibung = e.target.value;
    });
    
    beschreibungTd.appendChild(beschreibungInput);
    tr.appendChild(beschreibungTd);
    
    // Menge column - input
    const mengeTd = document.createElement("td");
    mengeTd.style.padding = "8px";
    mengeTd.style.borderRight = "1px solid #ddd";
    
    const mengeInput = document.createElement("input");
    mengeInput.type = "text";
    mengeInput.style.width = "100%";
    mengeInput.style.padding = "4px";
    mengeInput.value = item.Menge || "";
    mengeInput.dataset.itemIndex = idx;
    mengeInput.dataset.field = "Menge";
    mengeInput.setAttribute("aria-label", `Menge für Artikel ${idx + 1}`);
    mengeInput.addEventListener("input", (e) => {
      const itemIndex = parseInt(e.target.dataset.itemIndex, 10);
      currentOrderItems[itemIndex].Menge = e.target.value;
      // Recalculate Gesamtpreis
      currentOrderItems[itemIndex].Gesamtpreis = calculateItemGesamtpreis(
        currentOrderItems[itemIndex].Menge,
        currentOrderItems[itemIndex].Einzelpreis
      );
      renderOrderItemsTable();
    });
    
    mengeTd.appendChild(mengeInput);
    tr.appendChild(mengeTd);
    
    // Einheit column - input
    const einheitTd = document.createElement("td");
    einheitTd.style.padding = "8px";
    einheitTd.style.borderRight = "1px solid #ddd";
    
    const einheitInput = document.createElement("input");
    einheitInput.type = "text";
    einheitInput.style.width = "100%";
    einheitInput.style.padding = "4px";
    einheitInput.value = item.Einheit || "";
    einheitInput.dataset.itemIndex = idx;
    einheitInput.dataset.field = "Einheit";
    einheitInput.setAttribute("aria-label", `Einheit für Artikel ${idx + 1}`);
    einheitInput.addEventListener("input", (e) => {
      const itemIndex = parseInt(e.target.dataset.itemIndex, 10);
      currentOrderItems[itemIndex].Einheit = e.target.value;
    });
    
    einheitTd.appendChild(einheitInput);
    tr.appendChild(einheitTd);
    
    // Einzelpreis column - input
    const einzelpreisTd = document.createElement("td");
    einzelpreisTd.style.padding = "8px";
    einzelpreisTd.style.borderRight = "1px solid #ddd";
    
    const einzelpreisInput = document.createElement("input");
    einzelpreisInput.type = "text";
    einzelpreisInput.style.width = "100%";
    einzelpreisInput.style.padding = "4px";
    einzelpreisInput.value = item.Einzelpreis || "";
    einzelpreisInput.dataset.itemIndex = idx;
    einzelpreisInput.dataset.field = "Einzelpreis";
    einzelpreisInput.setAttribute("aria-label", `Einzelpreis für Artikel ${idx + 1}`);
    einzelpreisInput.addEventListener("input", (e) => {
      const itemIndex = parseInt(e.target.dataset.itemIndex, 10);
      currentOrderItems[itemIndex].Einzelpreis = e.target.value;
      // Recalculate Gesamtpreis
      currentOrderItems[itemIndex].Gesamtpreis = calculateItemGesamtpreis(
        currentOrderItems[itemIndex].Menge,
        currentOrderItems[itemIndex].Einzelpreis
      );
      renderOrderItemsTable();
    });
    
    einzelpreisTd.appendChild(einzelpreisInput);
    tr.appendChild(einzelpreisTd);
    
    // Gesamtpreis column - readonly display
    const gesamtpreisTd = document.createElement("td");
    gesamtpreisTd.style.padding = "8px";
    gesamtpreisTd.style.borderRight = "1px solid #ddd";
    gesamtpreisTd.style.backgroundColor = "#f5f5f5";
    gesamtpreisTd.style.fontWeight = "600";
    gesamtpreisTd.style.textAlign = "right";
    gesamtpreisTd.textContent = (item.Gesamtpreis || "0.00") + " €";
    
    tr.appendChild(gesamtpreisTd);
    
    // Actions column
    const actionTd = document.createElement("td");
    actionTd.style.padding = "8px";
    actionTd.style.textAlign = "center";
    
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "−";
    deleteBtn.className = "danger";
    deleteBtn.title = "Artikel entfernen";
    deleteBtn.type = "button";
    deleteBtn.style.padding = "4px 8px";
    deleteBtn.setAttribute("aria-label", `Artikel ${idx + 1} entfernen`);
    deleteBtn.dataset.itemIndex = idx;
    deleteBtn.addEventListener("click", (e) => {
      const itemIndex = parseInt(e.target.dataset.itemIndex, 10);
      currentOrderItems.splice(itemIndex, 1);
      renderOrderItemsTable();
    });
    
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
  
  // Update totals
  updateOrderTotals();
}

// Function to add a new order item
function addOrderItem() {
  currentOrderItems.push(newEmptyOrderItem());
  renderOrderItemsTable();
}

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
    currentOrderItems = emptyRow.items || [];
    populateForm(emptyRow);
  } else {
    // Edit existing order
    const rows = getRows();
    const row = rows[rowIndex];
    currentOrderItems = Array.isArray(row.items) ? [...row.items] : [];
    populateForm(row);
  }
  
  // Render order items table
  renderOrderItemsTable();
  
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
    
    // Skip Artikel and Beschreibung as they are now part of order items
    if (col === "Artikel" || col === "Beschreibung") {
      continue;
    }
    
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
        
        // Set the value before cloning
        input.value = currentFirma;
        
        // Remove any existing event listeners by cloning and replacing the element
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        // Set the value again after cloning (cloneNode doesn't preserve value property)
        newInput.value = currentFirma;
        
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
    
    // Re-render order items table to update article dropdowns
    renderOrderItemsTable();
    
    // Auto-generate order ID only for new orders (when currentEditingRowIndex is null)
    if (currentEditingRowIndex === null) {
      const auftragsIdInput = document.getElementById("edit_Auftrags_ID");
      if (auftragsIdInput) {
        auftragsIdInput.value = generateOrderId(selectedFirma);
      }
    }
  } else {
    hideCompanyInfo();
    // Re-render order items table to clear article dropdowns
    renderOrderItemsTable();
  }
}

// Function to update article dropdown based on selected company

// Function to display company address and email
function updateCompanyInfo(firmaName) {
  const company = getCompanyByName(firmaName);
  
  const addressGroup = document.getElementById("company_address_group");
  const addressDiv = document.getElementById("company_address");
  const emailGroup = document.getElementById("company_email_group");
  const emailDiv = document.getElementById("company_email");
  const ansprechpartnerInput = document.getElementById("edit_Ansprechpartner");
  
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
    
    // Populate contact person field (Ansprechpartner) from Titel, Vorname, Nachname
    if (ansprechpartnerInput) {
      const contactParts = [];
      if (company.Titel) contactParts.push(company.Titel);
      if (company.Vorname) contactParts.push(company.Vorname);
      if (company.Nachname) contactParts.push(company.Nachname);
      
      const contactPerson = contactParts.join(" ").trim();
      ansprechpartnerInput.value = contactPerson;
    }
  } else {
    hideCompanyInfo();
  }
}

// Function to hide company info fields
function hideCompanyInfo() {
  const addressGroup = document.getElementById("company_address_group");
  const emailGroup = document.getElementById("company_email_group");
  const ansprechpartnerInput = document.getElementById("edit_Ansprechpartner");
  
  if (addressGroup) addressGroup.style.display = "none";
  if (emailGroup) emailGroup.style.display = "none";
  if (ansprechpartnerInput) ansprechpartnerInput.value = "";
}

function getFormData() {
  const formData = {};
  for (const col of COLUMNS) {
    // Skip Artikel and Beschreibung as they are now part of order items
    if (col === "Artikel" || col === "Beschreibung") {
      formData[col] = ""; // Keep empty for backward compatibility
      continue;
    }
    
    const input = document.getElementById(`edit_${col}`);
    if (input) {
      formData[col] = sanitizeText(input.value || "");
    }
  }
  
  // Add order items to formData with all fields
  formData.items = currentOrderItems.map(item => ({
    Artikel: sanitizeText(item.Artikel || ""),
    Beschreibung: sanitizeText(item.Beschreibung || ""),
    Menge: sanitizeText(item.Menge || ""),
    Einheit: sanitizeText(item.Einheit || ""),
    Einzelpreis: sanitizeText(item.Einzelpreis || ""),
    Gesamtpreis: sanitizeText(item.Gesamtpreis || "")
  }));
  
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
  
  // Add order item button
  const addOrderItemBtn = document.getElementById("addOrderItemBtn");
  if (addOrderItemBtn) {
    addOrderItemBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addOrderItem();
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
