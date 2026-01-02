// -----------------------------
// History Management for Undo/Redo
// -----------------------------

const MAX_HISTORY_SIZE = 100;

let history = [];        // Array of state snapshots
let currentIndex = -1;   // Current position in history (-1 = no history)
let isUndoRedoActive = false;  // Flag to prevent recursive history tracking

/**
 * Push a new state to history
 * @param {Array} state - The current state to save
 */
export function pushState(state) {
  // Don't track history changes during undo/redo operations
  if (isUndoRedoActive) {
    return;
  }

  // Deep clone the state to prevent reference issues
  const snapshot = JSON.parse(JSON.stringify(state));
  
  // Remove any history after current index (when pushing after undo)
  history = history.slice(0, currentIndex + 1);
  
  // Add new state
  history.push(snapshot);
  
  // Limit history to MAX_HISTORY_SIZE
  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  } else {
    currentIndex++;
  }
}

/**
 * Undo to previous state
 * @returns {Array|null} - The previous state or null if can't undo
 */
export function undo() {
  if (!canUndo()) {
    return null;
  }
  
  isUndoRedoActive = true;
  currentIndex--;
  const state = JSON.parse(JSON.stringify(history[currentIndex]));
  isUndoRedoActive = false;
  
  return state;
}

/**
 * Redo to next state
 * @returns {Array|null} - The next state or null if can't redo
 */
export function redo() {
  if (!canRedo()) {
    return null;
  }
  
  isUndoRedoActive = true;
  currentIndex++;
  const state = JSON.parse(JSON.stringify(history[currentIndex]));
  isUndoRedoActive = false;
  
  return state;
}

/**
 * Check if undo is possible
 * @returns {boolean}
 */
export function canUndo() {
  return currentIndex > 0;
}

/**
 * Check if redo is possible
 * @returns {boolean}
 */
export function canRedo() {
  return currentIndex < history.length - 1;
}

/**
 * Clear all history
 */
export function clearHistory() {
  history = [];
  currentIndex = -1;
}

/**
 * Get current history size for debugging
 * @returns {number}
 */
export function getHistorySize() {
  return history.length;
}
