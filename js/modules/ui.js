// -----------------------------
// UI Update Functions
// -----------------------------
import { canUndo, canRedo } from './state.js';

/**
 * Update undo/redo button states
 */
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
