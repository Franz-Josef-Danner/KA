// -----------------------------
// Aufträge UI Updates
// -----------------------------
import { canUndo, canRedo } from './auftraege-state.js';

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
