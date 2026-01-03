// -----------------------------
// Event Handlers
// -----------------------------
import { getRows, setRows, save, undo, redo, canUndo, canRedo } from './state.js';
import { toCSV, parseCSV } from '../utils/csv.js';
import { downloadText } from '../utils/helpers.js';
import { render } from './render.js';
import { updateUndoRedoButtons } from './ui.js';

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
  document.getElementById("saveBtn").addEventListener("click", () => {
    if (save()) {
      alert("Gespeichert (LocalStorage im Browser).");
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

function importCSV(file, fileInput) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const importedRows = parseCSV(text);
      
      // Add imported rows to the beginning of the table
      const rows = getRows();
      setRows([...importedRows, ...rows]);
      const saved = save();
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
