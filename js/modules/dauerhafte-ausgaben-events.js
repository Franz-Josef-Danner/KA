// -----------------------------
// Dauerhafte Ausgaben Events Module
// -----------------------------
import { render } from './dauerhafte-ausgaben-render.js';
import { deleteRow, undo, redo } from './dauerhafte-ausgaben-state.js';
import { openModal, closeModal, initModalHandlers, updateUndoRedoButtons } from './dauerhafte-ausgaben-ui.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize all event handlers for the Dauerhafte Ausgaben page
 */
export function initEventHandlers() {
  // Initialize modal handlers
  initModalHandlers();
  
  // New recurring expense button
  const newBtn = document.getElementById("newDauerhafteAusgabenBtn");
  if (newBtn) {
    newBtn.addEventListener("click", () => openModal(null));
  }
  
  // Undo button
  const undoBtn = document.getElementById("undoBtn");
  if (undoBtn) {
    undoBtn.addEventListener("click", () => {
      if (undo()) {
        render();
        updateUndoRedoButtons();
      }
    });
  }
  
  // Redo button
  const redoBtn = document.getElementById("redoBtn");
  if (redoBtn) {
    redoBtn.addEventListener("click", () => {
      if (redo()) {
        render();
        updateUndoRedoButtons();
      }
    });
  }
  
  // Search input with debounce
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      render();
    }, 300));
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Skip if user is typing in contenteditable or input fields
    if (e.target.isContentEditable || 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Undo: Ctrl+Z
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (undo()) {
        render();
        updateUndoRedoButtons();
      }
    }
    
    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      if (redo()) {
        render();
        updateUndoRedoButtons();
      }
    }
  });
  
  // Custom events for modal and delete actions
  window.addEventListener('openDauerhafteAusgabenModal', (e) => {
    openModal(e.detail.rowIndex);
  });
  
  window.addEventListener('deleteDauerhafteAusgabe', (e) => {
    const confirmed = confirm('Möchten Sie diese dauerhafte Ausgabe wirklich löschen?');
    if (confirmed) {
      deleteRow(e.detail.rowIndex);
      render();
    }
  });
  
  // Initial button state update
  updateUndoRedoButtons();
}
