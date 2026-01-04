// -----------------------------
// Rechnungen Event Handlers
// -----------------------------
import { getRows, setRows, save, undo, redo, newEmptyRow } from './rechnungen-state.js';
import { render } from './rechnungen-render.js';
import { updateUndoRedoButtons, openInvoiceModal } from './rechnungen-ui.js';

export function initEventHandlers() {
  // New invoice button - open modal for creating new invoice
  const newInvoiceBtn = document.getElementById("newInvoiceBtn");
  if (newInvoiceBtn) {
    newInvoiceBtn.addEventListener("click", () => {
      openInvoiceModal(null); // null means new invoice
    });
  }

  // Search input
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", () => render());
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
  
  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Skip if user is typing in contenteditable or input fields
    if (e.target.isContentEditable || 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Ctrl+Z or Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (undo()) {
        render();
        updateUndoRedoButtons();
      }
    }
    // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z for redo
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
      e.preventDefault();
      if (redo()) {
        render();
        updateUndoRedoButtons();
      }
    }
  });
  
  // Initial button state update
  updateUndoRedoButtons();
}
