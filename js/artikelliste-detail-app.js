// -----------------------------
// Artikelliste Detail Application
// -----------------------------
import { getArtikelliste, updateArtikelliste, deleteArtikelliste } from './modules/artikellisten-state.js';
import { ARTIKELLISTEN_ITEM_COLUMNS, DEFAULT_ZAHLUNGSZIEL_TAGE } from './modules/artikellisten-config.js';
import { sanitizeText } from './utils/sanitize.js';

let currentFirmenId = null;
let currentArtikelliste = null;

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function newEmptyItem() {
  return {
    Artikel_ID: "",
    Artikel: "",
    Beschreibung: "",
    Einheit: "",
    Einzelpreis: ""
  };
}

function calculateGesamtpreis(menge, einzelpreis) {
  const m = parseFloat(menge) || 0;
  const e = parseFloat(einzelpreis) || 0;
  return (m * e).toFixed(2);
}

// Function to generate Artikel_ID based on Firmen_ID and sequence
function generateArtikelId(firmenId, sequenceNumber) {
  return `${firmenId}-ART-${sequenceNumber.toString().padStart(3, '0')}`;
}

function render() {
  const tbody = document.getElementById("detail-tbody");
  if (!tbody || !currentArtikelliste) return;
  
  tbody.innerHTML = "";
  
  if (currentArtikelliste.items.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.setAttribute("colspan", "6");
    td.style.textAlign = "center";
    td.style.padding = "20px";
    td.style.color = "#666";
    td.textContent = "Keine Positionen vorhanden. Klicken Sie auf '+ Position hinzufügen', um eine neue Position zu erstellen.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  
  currentArtikelliste.items.forEach((item, idx) => {
    // Auto-generate Artikel_ID if not present
    if (!item.Artikel_ID) {
      item.Artikel_ID = generateArtikelId(currentFirmenId, idx + 1);
    }
    
    const tr = document.createElement("tr");
    
    ARTIKELLISTEN_ITEM_COLUMNS.forEach(col => {
      const td = document.createElement("td");
      td.dataset.row = String(idx);
      td.dataset.col = col;
      
      if (col === "Artikel_ID") {
        // Artikel_ID is auto-generated, display as readonly
        td.setAttribute("contenteditable", "false");
        td.classList.add("readonly");
        td.textContent = item[col] || "";
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
            currentArtikelliste.items[idx][col] = sanitizedNewVal;
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
      currentArtikelliste.items.splice(idx + 1, 0, newEmptyItem());
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
      currentArtikelliste.items.splice(idx, 1);
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
  const colIndex = ARTIKELLISTEN_ITEM_COLUMNS.indexOf(currentCol);
  
  // Try next column in same row (skip Artikel_ID which is readonly)
  if (colIndex < ARTIKELLISTEN_ITEM_COLUMNS.length - 1) {
    const nextColName = ARTIKELLISTEN_ITEM_COLUMNS[colIndex + 1];
    const nextCell = document.querySelector(`td[data-row="${currentRow}"][data-col="${nextColName}"]`);
    if (nextCell && nextCell.getAttribute("contenteditable") === "true") {
      return nextCell;
    }
  }
  
  // Try first editable column of next row (skip Artikel_ID)
  if (currentRow < currentArtikelliste.items.length - 1) {
    const firstEditableColName = ARTIKELLISTEN_ITEM_COLUMNS.find(col => col !== "Artikel_ID");
    const nextRowCell = document.querySelector(`td[data-row="${currentRow + 1}"][data-col="${firstEditableColName}"]`);
    if (nextRowCell && nextRowCell.getAttribute("contenteditable") === "true") {
      return nextRowCell;
    }
  }
  
  return null;
}

async function save() {
  if (!currentFirmenId || !currentArtikelliste) {
    alert("Fehler: Keine Artikelliste geladen.");
    return;
  }
  
  await updateArtikelliste(currentFirmenId, currentArtikelliste);
  alert("Artikelliste gespeichert im Webspace.");
  // Redirect back to overview page
  window.location.href = "artikellisten.html";
}

function addItem() {
  if (!currentArtikelliste) return;
  currentArtikelliste.items.push(newEmptyItem());
  render();
}

async function deleteCurrentArtikelliste() {
  const ok = confirm("Sind Sie sicher, dass Sie diese Artikelliste löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.");
  if (!ok) return;
  
  await deleteArtikelliste(currentFirmenId);
  alert("Artikelliste gelöscht.");
  window.location.href = "artikellisten.html";
}

async function init() {
  // Get firmenId from URL parameter
  currentFirmenId = getUrlParameter('firmenId');
  
  if (!currentFirmenId) {
    alert("Fehler: Keine Firmen-ID angegeben.");
    window.location.href = "artikellisten.html";
    return;
  }
  
  // Load article list
  currentArtikelliste = await getArtikelliste(currentFirmenId);
  
  if (!currentArtikelliste) {
    alert("Fehler: Artikelliste nicht gefunden.");
    window.location.href = "artikellisten.html";
    return;
  }
  
  // Update title and subtitle
  document.getElementById("detail-title").textContent = `Artikelliste: ${currentArtikelliste.firmenName}`;
  document.getElementById("detail-subtitle").textContent = `Firmen-ID: ${currentFirmenId}`;
  
  // Initialize payment terms input
  const zahlungszielInput = document.getElementById("zahlungsziel-input");
  zahlungszielInput.value = currentArtikelliste.zahlungsziel_tage || DEFAULT_ZAHLUNGSZIEL_TAGE;
  zahlungszielInput.addEventListener("change", () => {
    const value = parseInt(zahlungszielInput.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 365) {
      currentArtikelliste.zahlungsziel_tage = value;
    } else {
      // Reset to current value if invalid
      zahlungszielInput.value = currentArtikelliste.zahlungsziel_tage || DEFAULT_ZAHLUNGSZIEL_TAGE;
      alert("Bitte geben Sie eine gültige Anzahl von Tagen zwischen 1 und 365 ein.");
    }
  });
  
  // Event handlers
  document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "artikellisten.html";
  });
  
  document.getElementById("saveBtn").addEventListener("click", save);
  document.getElementById("addItemBtn").addEventListener("click", addItem);
  document.getElementById("deleteArtikellisteBtn").addEventListener("click", deleteCurrentArtikelliste);
  
  // Initial render
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready
init();
