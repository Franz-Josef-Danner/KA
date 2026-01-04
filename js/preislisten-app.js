// -----------------------------
// Preislisten Application
// -----------------------------
import { getPreislisten } from './modules/preislisten-state.js';
import { getRows } from './modules/state.js';

function render() {
  const tbody = document.getElementById("preislisten-tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  const preislisten = getPreislisten();
  const firmenRows = getRows();
  
  // Create a map of Firmen_ID to company data for quick lookup
  const firmenMap = {};
  firmenRows.forEach(row => {
    if (row.Firmen_ID && row.Status === 'Kunde') {
      firmenMap[row.Firmen_ID] = row;
    }
  });
  
  // Get all price lists and sort by Firmen_ID
  const preislistenArray = Object.values(preislisten).sort((a, b) => {
    return a.firmenId.localeCompare(b.firmenId);
  });
  
  if (preislistenArray.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.setAttribute("colspan", "5");
    td.style.textAlign = "center";
    td.style.padding = "20px";
    td.style.color = "#666";
    td.textContent = "Keine Preislisten vorhanden. Erstellen Sie Kunden in der Firmenliste, um Preislisten zu generieren.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  
  preislistenArray.forEach(preisliste => {
    const firma = firmenMap[preisliste.firmenId];
    
    // Skip if company is no longer a customer
    if (!firma) return;
    
    const tr = document.createElement("tr");
    tr.classList.add("preislisten-row");
    tr.dataset.firmenId = preisliste.firmenId;
    
    // Firmen_ID
    const tdId = document.createElement("td");
    tdId.textContent = preisliste.firmenId;
    tr.appendChild(tdId);
    
    // Firma Name
    const tdName = document.createElement("td");
    tdName.textContent = preisliste.firmenName || firma.Firma || '-';
    tr.appendChild(tdName);
    
    // Anzahl Items
    const tdItems = document.createElement("td");
    tdItems.textContent = preisliste.items.length.toString();
    tdItems.style.textAlign = "center";
    tr.appendChild(tdItems);
    
    // Created date
    const tdCreated = document.createElement("td");
    tdCreated.textContent = new Date(preisliste.created).toLocaleDateString('de-DE');
    tr.appendChild(tdCreated);
    
    // Modified date
    const tdModified = document.createElement("td");
    tdModified.textContent = new Date(preisliste.modified).toLocaleDateString('de-DE');
    tr.appendChild(tdModified);
    
    // Add double-click handler to open detail view
    tr.addEventListener("dblclick", () => {
      window.location.href = `preisliste-detail.html?firmenId=${encodeURIComponent(preisliste.firmenId)}`;
    });
    
    // Add hover effect
    tr.style.cursor = "pointer";
    
    tbody.appendChild(tr);
  });
}

// Initialize the application
function init() {
  render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
