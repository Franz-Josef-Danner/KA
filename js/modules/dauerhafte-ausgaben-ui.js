// -----------------------------
// Dauerhafte Ausgaben UI Module
// -----------------------------
import { KATEGORIE_OPTIONS, WIEDERHOLUNGSZEITRAUM_OPTIONS } from './dauerhafte-ausgaben-config.js';
import { getRows, newEmptyRow, updateRow, setRows } from './dauerhafte-ausgaben-state.js';
import { isUndoAvailable, isRedoAvailable } from './dauerhafte-ausgaben-state.js';
import { sanitizeText } from '../utils/sanitize.js';
import { render } from './dauerhafte-ausgaben-render.js';

const modal = document.getElementById("dauerhafteAusgabenModal");
const modalTitle = document.getElementById("recurringModalTitle");
const modalClose = document.getElementById("recurringModalClose");
const modalCancel = document.getElementById("recurringModalCancel");
const modalSave = document.getElementById("recurringModalSave");
const dauerhafteAusgabenForm = document.getElementById("dauerhafteAusgabenForm");

let currentRecurringEditIndex = null;

/**
 * Open the modal for editing or creating a recurring expense
 */
export function openModal(rowIndex = null) {
  currentRecurringEditIndex = rowIndex;
  
  if (rowIndex !== null) {
    // Edit existing recurring expense
    modalTitle.textContent = "Dauerhafte Ausgabe bearbeiten";
    const rows = getRows();
    const row = rows[rowIndex];
    
    // Populate form fields
    document.getElementById("edit_Recurring_Ausgaben_ID").value = row.Ausgaben_ID || '';
    document.getElementById("edit_Recurring_Empfaenger").value = row.Empfaenger || '';
    document.getElementById("edit_Recurring_Verwendungszweck").value = row.Verwendungszweck || '';
    document.getElementById("edit_Recurring_Rechnungsnummer").value = row.Rechnungsnummer || '';
    document.getElementById("edit_Recurring_Betrag").value = row.Betrag || '0.00';
    document.getElementById("edit_Recurring_Kategorie").value = row.Kategorie || 'Beruflich';
    document.getElementById("edit_Recurring_IBAN").value = row.IBAN || '';
    document.getElementById("edit_Recurring_BIC").value = row.BIC || '';
    document.getElementById("edit_Recurring_Kommentare").value = row.Kommentare || '';
    document.getElementById("edit_Recurring_Wiederholungszeitraum").value = row.Wiederholungszeitraum || 'Monatlich';
    document.getElementById("edit_Recurring_Beginn_Datum").value = row.Beginn_Datum || '';
    document.getElementById("edit_Recurring_Stichtag").value = row.Stichtag || '1';
    document.getElementById("edit_Recurring_GesamtSumme").value = row.GesamtSumme || '';
  } else {
    // Create new recurring expense
    modalTitle.textContent = "Neue dauerhafte Ausgabe";
    const newRow = newEmptyRow();
    
    // Populate form with default values
    document.getElementById("edit_Recurring_Ausgaben_ID").value = newRow.Ausgaben_ID;
    document.getElementById("edit_Recurring_Empfaenger").value = '';
    document.getElementById("edit_Recurring_Verwendungszweck").value = '';
    document.getElementById("edit_Recurring_Rechnungsnummer").value = '';
    document.getElementById("edit_Recurring_Betrag").value = '0.00';
    document.getElementById("edit_Recurring_Kategorie").value = 'Beruflich';
    document.getElementById("edit_Recurring_IBAN").value = '';
    document.getElementById("edit_Recurring_BIC").value = '';
    document.getElementById("edit_Recurring_Kommentare").value = '';
    document.getElementById("edit_Recurring_Wiederholungszeitraum").value = 'Monatlich';
    document.getElementById("edit_Recurring_Beginn_Datum").value = newRow.Beginn_Datum;
    document.getElementById("edit_Recurring_Stichtag").value = '1';
    document.getElementById("edit_Recurring_GesamtSumme").value = '';
  }
  
  modal.style.display = "flex";
  
  // Focus first input
  setTimeout(() => {
    document.getElementById("edit_Recurring_Empfaenger").focus();
  }, 100);
}

/**
 * Close the modal
 */
export function closeModal() {
  modal.style.display = "none";
  currentRecurringEditIndex = null;
  dauerhafteAusgabenForm.reset();
}

/**
 * Save the recurring expense from the modal form
 */
export function saveModal() {
  // Get form values
  const formData = {
    Ausgaben_ID: document.getElementById("edit_Recurring_Ausgaben_ID").value,
    Empfaenger: document.getElementById("edit_Recurring_Empfaenger").value,
    Verwendungszweck: document.getElementById("edit_Recurring_Verwendungszweck").value,
    Rechnungsnummer: document.getElementById("edit_Recurring_Rechnungsnummer").value,
    Betrag: document.getElementById("edit_Recurring_Betrag").value,
    Kategorie: document.getElementById("edit_Recurring_Kategorie").value,
    IBAN: document.getElementById("edit_Recurring_IBAN").value,
    BIC: document.getElementById("edit_Recurring_BIC").value,
    Kommentare: document.getElementById("edit_Recurring_Kommentare").value,
    Wiederholungszeitraum: document.getElementById("edit_Recurring_Wiederholungszeitraum").value,
    Beginn_Datum: document.getElementById("edit_Recurring_Beginn_Datum").value,
    Stichtag: document.getElementById("edit_Recurring_Stichtag").value,
    GesamtSumme: document.getElementById("edit_Recurring_GesamtSumme").value
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
  
  // Validate start date
  if (!formData.Beginn_Datum) {
    alert('Bitte geben Sie ein Beginn-Datum ein.');
    return;
  }
  
  // Validate Stichtag (day of period)
  const stichtag = parseInt(formData.Stichtag);
  if (isNaN(stichtag) || stichtag < 1) {
    alert('Bitte geben Sie einen gültigen Stichtag ein (mindestens 1).');
    return;
  }
  
  // Additional validation based on recurrence period
  if (formData.Wiederholungszeitraum === 'Monatlich' && (stichtag < 1 || stichtag > 31)) {
    alert('Für monatliche Ausgaben muss der Stichtag zwischen 1 und 31 liegen.');
    return;
  }
  
  if (formData.Wiederholungszeitraum === 'Wöchentlich' && (stichtag < 1 || stichtag > 7)) {
    alert('Für wöchentliche Ausgaben muss der Stichtag zwischen 1 (Montag) und 7 (Sonntag) liegen.');
    return;
  }
  
  // Validate GesamtSumme if provided
  if (formData.GesamtSumme && formData.GesamtSumme !== '') {
    const gesamtSumme = parseFloat(formData.GesamtSumme);
    if (isNaN(gesamtSumme) || gesamtSumme <= 0) {
      alert('Bitte geben Sie eine gültige Gesamtsumme ein (größer als 0).');
      return;
    }
    
    // Warn if GesamtSumme is less than Betrag
    if (gesamtSumme < betrag) {
      const proceed = confirm('Die Gesamtsumme ist kleiner als der Betrag einer einzelnen Rate. Fortfahren?');
      if (!proceed) {
        return;
      }
    }
  }
  
  // Save the recurring expense
  if (currentRecurringEditIndex !== null) {
    // Update existing recurring expense
    updateRow(currentRecurringEditIndex, formData);
  } else {
    // Add new recurring expense
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

