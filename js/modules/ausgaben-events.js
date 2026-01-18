// -----------------------------
// Ausgaben Events Module
// -----------------------------
import { render } from './ausgaben-render.js';
import { deleteRow, undo, redo } from './ausgaben-state.js';
import { openModal, closeModal, initModalHandlers } from './ausgaben-ui.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize all event handlers for the Ausgaben page
 */
export function initEventHandlers() {
  // Initialize modal handlers
  initModalHandlers();
  
  // New expense button
  const newBtn = document.getElementById("newAusgabenBtn");
  if (newBtn) {
    newBtn.onclick = () => openModal(null);
  }
  
  // Undo button
  const undoBtn = document.getElementById("undoBtn");
  if (undoBtn) {
    undoBtn.onclick = () => {
      undo();
      render();
    };
  }
  
  // Redo button
  const redoBtn = document.getElementById("redoBtn");
  if (redoBtn) {
    redoBtn.onclick = () => {
      redo();
      render();
    };
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
    // Undo: Ctrl+Z
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      render();
    }
    
    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      redo();
      render();
    }
  });
  
  // Custom events for modal and delete actions
  window.addEventListener('openAusgabenModal', (e) => {
    openModal(e.detail.rowIndex);
  });
  
  window.addEventListener('deleteAusgabe', (e) => {
    const confirmed = confirm('Möchten Sie diese Ausgabe wirklich löschen?');
    if (confirmed) {
      deleteRow(e.detail.rowIndex);
      render();
    }
  });
}
