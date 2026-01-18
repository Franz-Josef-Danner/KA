// -----------------------------
// Ausgaben Events Module
// -----------------------------
import { render } from './ausgaben-render.js';
import { deleteRow, undo, redo } from './ausgaben-state.js';
import { openModal, closeModal, initModalHandlers, updateUndoRedoButtons } from './ausgaben-ui.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize all event handlers for the Ausgaben page (regular expenses)
 */
export function initEventHandlers() {
  // Initialize modal handlers
  initModalHandlers();
  
  // New expense button - will be handled by tab-aware logic in main app
  const newBtn = document.getElementById("newAusgabenBtn");
  if (newBtn) {
    // Remove any existing listeners and add new one
    const newBtnClone = newBtn.cloneNode(true);
    newBtn.parentNode.replaceChild(newBtnClone, newBtn);
    
    newBtnClone.addEventListener("click", () => {
      // Check which view is active
      const regularTab = document.getElementById('regularTab');
      if (regularTab && regularTab.classList.contains('active')) {
        openModal(null);
      } else {
        // Trigger recurring expense modal
        window.dispatchEvent(new CustomEvent('openDauerhafteAusgabenModal', { detail: { rowIndex: null } }));
      }
    });
  }
  
  // Undo button
  const undoBtn = document.getElementById("undoBtn");
  if (undoBtn) {
    undoBtn.addEventListener("click", () => {
      // Check which view is active
      const regularTab = document.getElementById('regularTab');
      if (regularTab && regularTab.classList.contains('active')) {
        if (undo()) {
          render();
          updateUndoRedoButtons();
        }
      } else {
        // Trigger recurring undo
        window.dispatchEvent(new CustomEvent('recurringUndo'));
      }
    });
  }
  
  // Redo button
  const redoBtn = document.getElementById("redoBtn");
  if (redoBtn) {
    redoBtn.addEventListener("click", () => {
      // Check which view is active
      const regularTab = document.getElementById('regularTab');
      if (regularTab && regularTab.classList.contains('active')) {
        if (redo()) {
          render();
          updateUndoRedoButtons();
        }
      } else {
        // Trigger recurring redo
        window.dispatchEvent(new CustomEvent('recurringRedo'));
      }
    });
  }
  
  // Search input with debounce
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
      // Check which view is active and render accordingly
      const regularTab = document.getElementById('regularTab');
      if (regularTab && regularTab.classList.contains('active')) {
        render();
      } else {
        window.dispatchEvent(new CustomEvent('recurringSearch'));
      }
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
    
    // Check which view is active
    const regularTab = document.getElementById('regularTab');
    const isRegularView = regularTab && regularTab.classList.contains('active');
    
    // Undo: Ctrl+Z
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (isRegularView) {
        if (undo()) {
          render();
          updateUndoRedoButtons();
        }
      } else {
        window.dispatchEvent(new CustomEvent('recurringUndo'));
      }
    }
    
    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      if (isRegularView) {
        if (redo()) {
          render();
          updateUndoRedoButtons();
        }
      } else {
        window.dispatchEvent(new CustomEvent('recurringRedo'));
      }
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
  
  // Initial button state update
  updateUndoRedoButtons();
}
