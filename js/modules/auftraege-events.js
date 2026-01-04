// -----------------------------
// Aufträge Event Handlers
// -----------------------------
import { getRows, setRows, save, undo, redo, newEmptyRow } from './auftraege-state.js';
import { render } from './auftraege-render.js';
import { updateUndoRedoButtons, openOrderModal } from './auftraege-ui.js';

export function initEventHandlers() {
  // New order button - open modal for creating new order
  document.getElementById("newOrderBtn").addEventListener("click", () => {
    openOrderModal(null); // null means new order
  });

  // Search input
  document.getElementById("search").addEventListener("input", () => render());
  
  // Undo button
  document.getElementById("undoBtn").addEventListener("click", () => {
    if (undo()) {
      render();
      updateUndoRedoButtons();
    }
  });
  
  // Redo button
  document.getElementById("redoBtn").addEventListener("click", () => {
    if (redo()) {
      render();
      updateUndoRedoButtons();
    }
  });
  
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
