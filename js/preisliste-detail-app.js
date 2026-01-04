// -----------------------------
// Preisliste Detail Application
// -----------------------------
import { getPreisliste, updatePreisliste, deletePreisliste } from './modules/preislisten-state.js';
import { PREISLISTEN_ITEM_COLUMNS } from './modules/preislisten-config.js';
import { sanitizeText } from './utils/sanitize.js';

let currentFirmenId = null;
let currentPreisliste = null;

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function newEmptyItem() {
  return {
    Position: "",
    Artikel: "",
    Beschreibung: "",
    Menge: "",
    Einheit: "",
    Einzelpreis: "",
    Gesamtpreis: ""
  };
}

function calculateGesamtpreis(menge, einzelpreis) {
  const m = parseFloat(menge) || 0;
  const e = parseFloat(einzelpreis) || 0;
  return (m * e).toFixed(2);
}

function render() {
  const tbody = document.getElementById("detail-tbody");
  if (!tbody || !currentPreisliste) return;
  
  tbody.innerHTML = "";
  
  if (currentPreisliste.items.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.setAttribute("colspan", "8");
    td.style.textAlign = "center";
    td.style.padding = "20px";
    td.style.color = "#666";
    td.textContent = "Keine Positionen vorhanden. Klicken Sie auf '+ Position hinzufügen', um eine neue Position zu erstellen.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  
  currentPreisliste.items.forEach((item, idx) => {
    const tr = document.createElement("tr");
    
    PREISLISTEN_ITEM_COLUMNS.forEach(col => {
      const td = document.createElement("td");
      td.dataset.row = String(idx);
      td.dataset.col = col;
      
      if (col === "Gesamtpreis") {
        // Gesamtpreis is calculated, not editable
        td.setAttribute("contenteditable", "false");
        td.classList.add("readonly");
        td.textContent = item[col] || "0.00";
      } else {
        // Regular contenteditable cells
        td.setAttribute("contenteditable", "true");
        td.textContent = item[col] || "";
        
        // Beim Fokus: Store original value
        td.addEventListener("focus", () => {
          td.dataset.originalValue = sanitizeText(item[col] || "");
        });
        
        // Beim Blur: save changes
        td.addEventListener("blur", () => {
          const newVal = td.textContent || "";
          const originalValue = td.dataset.originalValue || "";
          const sanitizedNewVal = sanitizeText(newVal);
          
          // Only update if value changed
          if (sanitizedNewVal !== originalValue) {
            currentPreisliste.items[idx][col] = sanitizedNewVal;
            
            // If Menge or Einzelpreis changed, recalculate Gesamtpreis
            if (col === "Menge" || col === "Einzelpreis") {
              const menge = currentPreisliste.items[idx].Menge;
              const einzelpreis = currentPreisliste.items[idx].Einzelpreis;
              currentPreisliste.items[idx].Gesamtpreis = calculateGesamtpreis(menge, einzelpreis);
            }
            
            render();
          }
        });
        
        // Tab navigation
        td.addEventListener("keydown", (e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const nextCell = findNextCell(td);
            if (nextCell) {
              nextCell.focus();
            }
          }
        });
      }
      
      tr.appendChild(td);
    });
    
    // Actions column
    const act = document.createElement("td");
    act.className = "actions";
    
    // Plus button - add item below
    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.title = "Position darunter einfügen";
    plus.addEventListener("click", () => {
      currentPreisliste.items.splice(idx + 1, 0, newEmptyItem());
      render();
    });
    act.appendChild(plus);
    
    // Minus button - delete item
    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.title = "Position löschen";
    minus.className = "danger";
    minus.addEventListener("click", () => {
      const ok = confirm("Sind Sie sicher, dass Sie diese Position löschen möchten?");
      if (!ok) return;
      currentPreisliste.items.splice(idx, 1);
      render();
    });
    act.appendChild(minus);
    
    tr.appendChild(act);
    tbody.appendChild(tr);
  });
}

function findNextCell(currentCell) {
  const currentRow = parseInt(currentCell.dataset.row, 10);
  const currentCol = currentCell.dataset.col;
  const colIndex = PREISLISTEN_ITEM_COLUMNS.indexOf(currentCol);
  
  // Try next column in same row
  if (colIndex < PREISLISTEN_ITEM_COLUMNS.length - 2) { // -2 because Gesamtpreis is not editable
    const nextColName = PREISLISTEN_ITEM_COLUMNS[colIndex + 1];
    const nextCell = document.querySelector(`td[data-row="${currentRow}"][data-col="${nextColName}"]`);
    if (nextCell && nextCell.getAttribute("contenteditable") === "true") {
      return nextCell;
    }
  }
  
  // Try first column of next row
  if (currentRow < currentPreisliste.items.length - 1) {
    const firstColName = PREISLISTEN_ITEM_COLUMNS[0];
    const nextRowCell = document.querySelector(`td[data-row="${currentRow + 1}"][data-col="${firstColName}"]`);
    if (nextRowCell && nextRowCell.getAttribute("contenteditable") === "true") {
      return nextRowCell;
    }
  }
  
  return null;
}

function save() {
  if (!currentFirmenId || !currentPreisliste) {
    alert("Fehler: Keine Preisliste geladen.");
    return;
  }
  
  updatePreisliste(currentFirmenId, currentPreisliste);
  alert("Preisliste gespeichert.");
}

function addItem() {
  if (!currentPreisliste) return;
  currentPreisliste.items.push(newEmptyItem());
  render();
}

function deleteCurrentPreisliste() {
  const ok = confirm("Sind Sie sicher, dass Sie diese Preisliste löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.");
  if (!ok) return;
  
  deletePreisliste(currentFirmenId);
  alert("Preisliste gelöscht.");
  window.location.href = "preislisten.html";
}

function init() {
  // Get firmenId from URL parameter
  currentFirmenId = getUrlParameter('firmenId');
  
  if (!currentFirmenId) {
    alert("Fehler: Keine Firmen-ID angegeben.");
    window.location.href = "preislisten.html";
    return;
  }
  
  // Load price list
  currentPreisliste = getPreisliste(currentFirmenId);
  
  if (!currentPreisliste) {
    alert("Fehler: Preisliste nicht gefunden.");
    window.location.href = "preislisten.html";
    return;
  }
  
  // Update title and subtitle
  document.getElementById("detail-title").textContent = `Preisliste: ${currentPreisliste.firmenName}`;
  document.getElementById("detail-subtitle").textContent = `Firmen-ID: ${currentFirmenId}`;
  
  // Event handlers
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "preislisten.html";
  });
  
  document.getElementById("saveBtn").addEventListener("click", save);
  document.getElementById("addItemBtn").addEventListener("click", addItem);
  document.getElementById("deletePreislisteBtn").addEventListener("click", deleteCurrentPreisliste);
  
  // Initial render
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready
init();
