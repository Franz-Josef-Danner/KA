// -----------------------------
// Dauerhafte Ausgaben Events Module
// -----------------------------
import { render } from './dauerhafte-ausgaben-render.js';
import { deleteRow, undo, redo } from './dauerhafte-ausgaben-state.js';
import { openModal, closeModal, initModalHandlers, updateUndoRedoButtons } from './dauerhafte-ausgaben-ui.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize all event handlers for the Dauerhafte Ausgaben (integrated into Ausgaben page)
 */
export function initEventHandlers() {
  // Initialize modal handlers
  initModalHandlers();
  
  // Listen to custom events triggered by the unified UI
  window.addEventListener('recurringUndo', () => {
    if (undo()) {
      render();
      updateUndoRedoButtons();
    }
  });
  
  window.addEventListener('recurringRedo', () => {
    if (redo()) {
      render();
      updateUndoRedoButtons();
    }
  });
  
  window.addEventListener('recurringSearch', () => {
    render();
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
