// -----------------------------
// Event Handlers
// -----------------------------
import { getRows, setRows, save, undo, redo, canUndo, canRedo, hasDirtyChanges } from './state.js';
import { toCSV, parseCSV } from '../utils/csv.js';
import { downloadText } from '../utils/helpers.js';
import { render } from './render.js';
import { updateUndoRedoButtons } from './ui.js';

/**
 * Show a dialog asking the user what to do with unsaved changes.
 * Returns a Promise that resolves with 'save', 'discard', or 'cancel'.
 */
function showUnsavedChangesDialog() {
  const modal = document.createElement('div');
  modal.className = 'logout-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'unsaved-changes-title');
  modal.setAttribute('aria-modal', 'true');

  modal.innerHTML = `
    <div class="logout-modal-overlay"></div>
    <div class="logout-modal-content">
      <h2 id="unsaved-changes-title">Ungespeicherte Änderungen</h2>
      <p>Sie haben ungespeicherte Änderungen. Möchten Sie diese speichern?</p>
      <div class="logout-modal-buttons">
        <button class="modal-btn modal-btn-cancel">Abbrechen</button>
        <button class="modal-btn modal-btn-discard">Verwerfen</button>
        <button class="modal-btn modal-btn-confirm">Speichern</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  return new Promise((resolve) => {
    const cleanup = () => document.body.removeChild(modal);

    const cancelBtn = modal.querySelector('.modal-btn-cancel');
    const discardBtn = modal.querySelector('.modal-btn-discard');
    const saveBtn = modal.querySelector('.modal-btn-confirm');
    const overlay = modal.querySelector('.logout-modal-overlay');

    const resolveWith = (value) => {
      document.removeEventListener('keydown', handleEscape);
      cleanup();
      resolve(value);
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        resolveWith('cancel');
      }
    };
    document.addEventListener('keydown', handleEscape);

    saveBtn.addEventListener('click', () => resolveWith('save'));
    discardBtn.addEventListener('click', () => resolveWith('discard'));
    cancelBtn.addEventListener('click', () => resolveWith('cancel'));
    overlay.addEventListener('click', () => resolveWith('cancel'));

    // Focus the safe default (cancel)
    cancelBtn.focus();
  });
}

export function initEventHandlers() {
  // Import CSV - trigger file input when file is selected
  document.getElementById("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      return;
    }
    
    const fileName = file.name.toLowerCase();
    
    // Support CSV files
    if (!fileName.endsWith('.csv')) {
      alert("Bitte verwenden Sie eine CSV-Datei (.csv).");
      e.target.value = "";
      return;
    }
    
    importCSV(file, e.target);
  });

  // Save button
  document.getElementById("saveBtn").addEventListener("click", async () => {
    const saved = await save();
    if (saved) {
      alert("Gespeichert im Webspace.");
    }
  });

  // Export button
  document.getElementById("exportBtn").addEventListener("click", () => {
    const rows = getRows();
    const csv = toCSV(rows);
    const ts = new Date().toISOString().slice(0,19).replaceAll(":","-");
    downloadText(`firmen_export_${ts}.csv`, csv);
  });

  // Search input
  document.getElementById("search").addEventListener("input", () => render());
  
  // Undo button
  document.getElementById("undoBtn").addEventListener("click", async () => {
    const success = await undo();
    if (success) {
      render();
      updateUndoRedoButtons();
    }
  });
  
  // Redo button
  document.getElementById("redoBtn").addEventListener("click", async () => {
    const success = await redo();
    if (success) {
      render();
      updateUndoRedoButtons();
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener("keydown", async (e) => {
    // Skip if user is typing in contenteditable or input fields
    if (e.target.isContentEditable || 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // Ctrl+Z or Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      const success = await undo();
      if (success) {
        render();
        updateUndoRedoButtons();
      }
    }
    // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z for redo
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
      e.preventDefault();
      const success = await redo();
      if (success) {
        render();
        updateUndoRedoButtons();
      }
    }
  });
  
  // Initial button state update
  updateUndoRedoButtons();

  // Warn before closing/refreshing the tab when there are unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (hasDirtyChanges()) {
      e.preventDefault();
    }
  });

  // Intercept navigation link clicks when there are unsaved changes
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a[href]');
    if (!link || !hasDirtyChanges()) return;

    const href = link.getAttribute('href');
    // Only intercept relative-path and same-protocol navigation; skip anchors and non-http(s) schemes
    if (!href || href.startsWith('#')) return;
    try {
      const url = new URL(href, window.location.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    } catch {
      return;
    }

    e.preventDefault();

    const choice = await showUnsavedChangesDialog();
    if (choice === 'save') {
      const saved = await save();
      if (saved) {
        window.location.href = href;
      }
    } else if (choice === 'discard') {
      window.location.href = href;
    }
    // 'cancel': do nothing, stay on page
  });
}

async function importCSV(file, fileInput) {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const text = e.target.result;
      const importedRows = parseCSV(text);
      
      // Add imported rows to the beginning of the table
      const rows = getRows();
      await setRows([...importedRows, ...rows]);
      const saved = await save();
      render();
      
      // Always notify about import success, but only show alert when save succeeded
      if (saved) {
        alert(`${importedRows.length} Zeilen erfolgreich importiert und gespeichert.`);
      } else {
        // Save already showed error alert; log that import worked without showing another popup
        console.warn(`${importedRows.length} Zeilen erfolgreich importiert, aber die Daten wurden nicht dauerhaft gespeichert.`);
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      let userMessage = "Fehler beim Importieren der CSV-Datei. Bitte überprüfen Sie das Dateiformat.";
      const errorMsg = error?.message?.trim();
      if (errorMsg) {
        userMessage += "\n\nDetails: " + errorMsg;
      }
      alert(userMessage);
    } finally {
      // Reset file input
      if (fileInput) {
        fileInput.value = "";
      }
    }
  };
  
  reader.onerror = () => {
    console.error("Fehler beim Lesen der Datei:", reader.error);
    alert("Fehler beim Lesen der Datei.");
    if (fileInput) {
      fileInput.value = "";
    }
  };
  
  reader.readAsText(file, 'UTF-8');
}
