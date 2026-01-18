// -----------------------------
// Ausgaben UI Module
// -----------------------------
import { KATEGORIE_OPTIONS, STATUS_OPTIONS } from './ausgaben-config.js';
import { getRows, newEmptyRow, updateRow, setRows } from './ausgaben-state.js';
import { isUndoAvailable, isRedoAvailable } from './ausgaben-state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { render } from './ausgaben-render.js';

const modal = document.getElementById("ausgabenModal");
const modalTitle = document.getElementById("modalTitle");
const modalClose = document.getElementById("modalClose");
const modalCancel = document.getElementById("modalCancel");
const modalSave = document.getElementById("modalSave");
const ausgabenForm = document.getElementById("ausgabenForm");

let currentEditIndex = null;

/**
 * Open the modal for editing or creating an expense
 */
export function openModal(rowIndex = null) {
  currentEditIndex = rowIndex;
  
  if (rowIndex !== null) {
    // Edit existing expense
    modalTitle.textContent = "Ausgabe bearbeiten";
    const rows = getRows();
    const row = rows[rowIndex];
    
    // Populate form fields
    document.getElementById("edit_Ausgaben_ID").value = row.Ausgaben_ID || '';
    document.getElementById("edit_Datum").value = row.Datum || '';
    document.getElementById("edit_Empfaenger").value = row.Empfaenger || '';
    document.getElementById("edit_Verwendungszweck").value = row.Verwendungszweck || '';
    document.getElementById("edit_Rechnungsnummer").value = row.Rechnungsnummer || '';
    document.getElementById("edit_Betrag").value = row.Betrag || '0.00';
    document.getElementById("edit_Kategorie").value = row.Kategorie || 'Beruflich';
    document.getElementById("edit_Status").value = row.Status || 'unbezahlt';
    document.getElementById("edit_Deadline").value = row.Deadline || '';
    document.getElementById("edit_IBAN").value = row.IBAN || '';
    document.getElementById("edit_BIC").value = row.BIC || '';
    document.getElementById("edit_Kommentare").value = row.Kommentare || '';
  } else {
    // Create new expense
    modalTitle.textContent = "Neue Ausgabe";
    const newRow = newEmptyRow();
    
    // Populate form with default values
    document.getElementById("edit_Ausgaben_ID").value = newRow.Ausgaben_ID;
    document.getElementById("edit_Datum").value = newRow.Datum;
    document.getElementById("edit_Empfaenger").value = '';
    document.getElementById("edit_Verwendungszweck").value = '';
    document.getElementById("edit_Rechnungsnummer").value = '';
    document.getElementById("edit_Betrag").value = '0.00';
    document.getElementById("edit_Kategorie").value = 'Beruflich';
    document.getElementById("edit_Status").value = 'unbezahlt';
    document.getElementById("edit_Deadline").value = '';
    document.getElementById("edit_IBAN").value = '';
    document.getElementById("edit_BIC").value = '';
    document.getElementById("edit_Kommentare").value = '';
  }
  
  modal.style.display = "flex";
  
  // Focus first input
  setTimeout(() => {
    document.getElementById("edit_Empfaenger").focus();
  }, 100);
}

/**
 * Close the modal
 */
export function closeModal() {
  modal.style.display = "none";
  currentEditIndex = null;
  ausgabenForm.reset();
}

/**
 * Save the expense from the modal form
 */
export function saveModal() {
  // Get form values
  const formData = {
    Ausgaben_ID: document.getElementById("edit_Ausgaben_ID").value,
    Datum: document.getElementById("edit_Datum").value,
    Empfaenger: document.getElementById("edit_Empfaenger").value,
    Verwendungszweck: document.getElementById("edit_Verwendungszweck").value,
    Rechnungsnummer: document.getElementById("edit_Rechnungsnummer").value,
    Betrag: document.getElementById("edit_Betrag").value,
    Kategorie: document.getElementById("edit_Kategorie").value,
    Status: document.getElementById("edit_Status").value,
    Deadline: document.getElementById("edit_Deadline").value,
    IBAN: document.getElementById("edit_IBAN").value,
    BIC: document.getElementById("edit_BIC").value,
    Kommentare: document.getElementById("edit_Kommentare").value
  };
  
  // Validate required fields
  if (!formData.Empfaenger || !formData.Verwendungszweck) {
    alert('Bitte füllen Sie mindestens die Felder "Empfänger" und "Verwendungszweck" aus.');
    return;
  }
  
  // Validate amount
  const betrag = parseFloat(formData.Betrag);
  if (isNaN(betrag) || betrag < 0) {
    alert('Bitte geben Sie einen gültigen Betrag ein.');
    return;
  }
  
  // Save the expense
  if (currentEditIndex !== null) {
    // Update existing expense
    updateRow(currentEditIndex, formData);
  } else {
    // Add new expense
    const rows = getRows();
    rows.push(formData);
    setRows(rows);
  }
  
  closeModal();
  
  // Re-render the table
  render();
}

/**
 * Update undo/redo button states
 */
export function updateUndoRedoButtons() {
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  
  if (undoBtn) {
    undoBtn.disabled = !isUndoAvailable();
  }
  if (redoBtn) {
    redoBtn.disabled = !isRedoAvailable();
  }
}

/**
 * Initialize modal event handlers
 */
export function initModalHandlers() {
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  
  if (modalCancel) {
    modalCancel.addEventListener('click', closeModal);
  }
  
  if (modalSave) {
    modalSave.addEventListener('click', saveModal);
  }
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });
}
