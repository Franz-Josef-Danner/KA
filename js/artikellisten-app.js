// -----------------------------
// Artikellisten Application
// -----------------------------
import { getArtikellisten } from './modules/artikellisten-state.js';
import { getRows, ensureInitialized as ensureFirmenlisteInitialized } from './modules/state.js';

let selectedFirmenId = null;
let clickTimer = null;

async function renderPreview(firmenId) {
  const previewContainer = document.getElementById("artikellisten-preview");
  if (!previewContainer) return;
  
  const artikellisten = await getArtikellisten();
  const artikelliste = artikellisten[firmenId];
  
  if (!artikelliste) {
    previewContainer.innerHTML = `
      <div class="preview-placeholder">
        <p>Wählen Sie eine Artikelliste aus, um die Vorschau anzuzeigen</p>
      </div>
    `;
    return;
  }
  
  // Build preview HTML
  let previewHTML = `
    <div class="preview-content">
      <div class="preview-header">
        <h3>${artikelliste.firmenName || artikelliste.firmenId}</h3>
        <p><strong>Firmen-ID:</strong> ${artikelliste.firmenId}</p>
        <p><strong>Zahlungsziel:</strong> ${artikelliste.zahlungsziel_tage || 30} Tage</p>
        <p><strong>Erstellt:</strong> ${new Date(artikelliste.created).toLocaleDateString('de-DE')}</p>
        <p><strong>Geändert:</strong> ${new Date(artikelliste.modified).toLocaleDateString('de-DE')}</p>
        <p><strong>Positionen:</strong> ${artikelliste.items.length}</p>
      </div>
      
      <div class="preview-items">
        <h4>Artikel</h4>
  `;
  
  if (artikelliste.items.length === 0) {
    previewHTML += `
      <div class="preview-no-items">
        Keine Artikel in dieser Liste
      </div>
    `;
  } else {
    artikelliste.items.forEach((item, index) => {
      previewHTML += `
        <div class="preview-item">
          <div class="preview-item-row">
            <span class="preview-item-label">Artikel:</span>
            <span class="preview-item-value">${item.Artikel || '-'}</span>
          </div>
          <div class="preview-item-row">
            <span class="preview-item-label">Beschreibung:</span>
            <span class="preview-item-value">${item.Beschreibung || '-'}</span>
          </div>
          <div class="preview-item-row">
            <span class="preview-item-label">Menge:</span>
            <span class="preview-item-value">${item.Menge || '-'} ${item.Einheit || ''}</span>
          </div>
          <div class="preview-item-row">
            <span class="preview-item-label">Einzelpreis:</span>
            <span class="preview-item-value">${item.Einzelpreis ? item.Einzelpreis + ' €' : '-'}</span>
          </div>
          <div class="preview-item-row">
            <span class="preview-item-label">Gesamtpreis:</span>
            <span class="preview-item-value">${item.Gesamtpreis ? item.Gesamtpreis + ' €' : '-'}</span>
          </div>
        </div>
      `;
    });
  }
  
  previewHTML += `
      </div>
    </div>
  `;
  
  previewContainer.innerHTML = previewHTML;
}

async function render() {
  const tbody = document.getElementById("artikellisten-tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  const artikellisten = await getArtikellisten();
  const firmenRows = getRows();
  
  // Create a map of Firmen_ID to company data for quick lookup
  const firmenMap = {};
  firmenRows.forEach(row => {
    if (row.Firmen_ID && row.Status === 'Kunde') {
      firmenMap[row.Firmen_ID] = row;
    }
  });
  
  // Get all article lists and sort by Firmen_ID
  const artikellistenArray = Object.values(artikellisten).sort((a, b) => {
    return a.firmenId.localeCompare(b.firmenId);
  });
  
  if (artikellistenArray.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.setAttribute("colspan", "6");
    td.style.textAlign = "center";
    td.style.padding = "20px";
    td.style.color = "#666";
    td.textContent = "Keine Artikellisten vorhanden. Erstellen Sie Kunden in der Firmenliste, um Artikellisten zu generieren.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  
  artikellistenArray.forEach(artikelliste => {
    const firma = firmenMap[artikelliste.firmenId];
    
    // Skip if company is no longer a customer
    if (!firma) return;
    
    const tr = document.createElement("tr");
    tr.classList.add("artikellisten-row");
    tr.dataset.firmenId = artikelliste.firmenId;
    
    // Highlight if selected
    if (selectedFirmenId === artikelliste.firmenId) {
      tr.classList.add("selected");
    }
    
    // Firmen_ID
    const tdId = document.createElement("td");
    tdId.textContent = artikelliste.firmenId;
    tr.appendChild(tdId);
    
    // Firma Name
    const tdName = document.createElement("td");
    tdName.textContent = artikelliste.firmenName || firma.Firma || '-';
    tr.appendChild(tdName);
    
    // Anzahl Items
    const tdItems = document.createElement("td");
    tdItems.textContent = artikelliste.items.length.toString();
    tdItems.style.textAlign = "center";
    tr.appendChild(tdItems);
    
    // Zahlungsziel (Tage)
    const tdZahlungsziel = document.createElement("td");
    tdZahlungsziel.textContent = (artikelliste.zahlungsziel_tage || 30).toString();
    tdZahlungsziel.style.textAlign = "center";
    tr.appendChild(tdZahlungsziel);
    
    // Created date
    const tdCreated = document.createElement("td");
    tdCreated.textContent = new Date(artikelliste.created).toLocaleDateString('de-DE');
    tr.appendChild(tdCreated);
    
    // Modified date
    const tdModified = document.createElement("td");
    tdModified.textContent = new Date(artikelliste.modified).toLocaleDateString('de-DE');
    tr.appendChild(tdModified);
    
    // Add click handler to show preview with delay to avoid race condition with double-click
    tr.addEventListener("click", (e) => {
      clearTimeout(clickTimer);
      clickTimer = setTimeout(async () => {
        // Remove 'selected' class from all rows
        document.querySelectorAll('.artikellisten-row').forEach(row => {
          row.classList.remove('selected');
        });
        
        // Add 'selected' class to clicked row
        tr.classList.add('selected');
        
        selectedFirmenId = artikelliste.firmenId;
        await renderPreview(artikelliste.firmenId);
      }, 250); // Wait 250ms to see if it's a double-click
    });
    
    // Add double-click handler to open detail view
    tr.addEventListener("dblclick", () => {
      clearTimeout(clickTimer); // Cancel the single-click timer
      window.location.href = `artikelliste-detail.html?firmenId=${encodeURIComponent(artikelliste.firmenId)}`;
    });
    
    // Add hover effect
    tr.style.cursor = "pointer";
    
    tbody.appendChild(tr);
  });
}

// Initialize the application
async function init() {
  // Ensure both company list and article lists are loaded
  await ensureFirmenlisteInitialized();
  await render();
}

// ES6 modules are deferred by default; at this point the DOM is ready, so start the application
init();
