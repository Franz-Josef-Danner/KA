// -----------------------------
// Event Handlers
// -----------------------------
import { getRows, setRows, newEmptyRow, save } from './state.js';
import { toCSV, parseCSV } from '../utils/csv.js';
import { downloadText } from '../utils/helpers.js';
import { render } from './render.js';
import { openModal, closeModal } from './modal.js';

const tbody = document.getElementById("tbody");

export function initEventHandlers() {
  // Add row button
  document.getElementById("addRowBtn").addEventListener("click", () => {
    openModal();
  });

  // Add multiple rows
  document.getElementById("addMultipleBtn").addEventListener("click", () => {
    const count = parseInt(document.getElementById("rowCount").value, 10);
    
    // Validate row count
    if (isNaN(count) || count < 1 || count > 10) {
      alert("Ungültige Anzahl von Zeilen. Bitte wählen Sie eine Zahl zwischen 1 und 10.");
      return;
    }
    
    const rows = getRows();
    for (let i = 0; i < count; i++) {
      rows.unshift(newEmptyRow());
    }
    save();
    render();
    closeModal();
    
    // Fokus auf erste Zelle der neuen Zeile
    setTimeout(() => {
      const firstCell = tbody.querySelector('td[contenteditable="true"]');
      firstCell?.focus();
    }, 0);
  });

  // Import CSV
  document.getElementById("importCsvBtn").addEventListener("click", () => {
    const fileInput = document.getElementById("importFile");
    const file = fileInput.files[0];
    
    if (!file) {
      alert("Bitte wählen Sie eine Datei aus.");
      return;
    }
    
    const fileName = file.name.toLowerCase();
    
    // Support CSV files
    if (!fileName.endsWith('.csv')) {
      alert("Bitte verwenden Sie eine CSV-Datei (.csv).");
      return;
    }
    
    importCSV(file, fileInput);
  });

  // Save button
  document.getElementById("saveBtn").addEventListener("click", () => {
    save();
    alert("Gespeichert (LocalStorage im Browser).");
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
      save();
      render();
      closeModal();
      
      alert(`${importedRows.length} Zeilen erfolgreich importiert.`);
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
