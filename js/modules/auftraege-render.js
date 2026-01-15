// -----------------------------
// Aufträge Rendering Module
// -----------------------------
import { COLUMNS } from './auftraege-config.js';
import { getRows, setRows, newEmptyRow, save } from './auftraege-state.js';
import { toCellDisplay } from '../utils/formatting.js';
import { debounce } from '../utils/helpers.js';
import { rowMatchesSearch } from './auftraege-search.js';
import { updateUndoRedoButtons } from './auftraege-ui.js';
import { generatePDF, viewPDF, downloadPDF } from './pdf-generator.js';

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

// Columns that are stored but not displayed in the table
const HIDDEN_COLUMNS = ['Firmenadresse', 'Firmen_Email', 'Beschreibung', 'Status', 'Budget', 'Rabatt'];

// Helper function to create the Summe (total) cell
function createSummeCell(row, idx) {
  const summeTd = document.createElement("td");
  summeTd.dataset.row = String(idx);
  summeTd.dataset.col = "Summe";
  
  // Calculate subtotal from order items
  let subtotal = 0;
  if (row.items && Array.isArray(row.items)) {
    subtotal = row.items.reduce((sum, item) => {
      const gesamtpreis = parseFloat(item.Gesamtpreis) || 0;
      return sum + gesamtpreis;
    }, 0);
  }
  
  // Apply discount if present
  const rabattPercent = parseFloat(row.Rabatt) || 0;
  const discountAmount = (subtotal * rabattPercent) / 100;
  const total = subtotal - discountAmount;
  
  // Format total as currency using proper locale formatting
  const formattedTotal = new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(total);
  summeTd.innerHTML = `<span style="font-weight: 600;">${formattedTotal}</span>`;
  summeTd.style.textAlign = "right";
  
  return summeTd;
}

export function render() {
  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";

  const rows = getRows();

  rows.forEach((row, idx) => {
    if (!rowMatchesSearch(row, q)) return;

    const tr = document.createElement("tr");
    
    // Add double-click handler to open edit modal
    tr.addEventListener("dblclick", () => {
      // Dispatch custom event to avoid circular dependency
      window.dispatchEvent(new CustomEvent('openOrderModal', { detail: { rowIndex: idx } }));
    });
    
    // Add cursor pointer style
    tr.style.cursor = "pointer";

    for (const col of COLUMNS) {
      // Skip columns that are stored but not displayed in the table
      if (HIDDEN_COLUMNS.includes(col)) {
        continue;
      }
      
      const td = document.createElement("td");
      td.dataset.row = String(idx);
      td.dataset.col = col;

      // Special handling for Artikel column to display items count
      if (col === "Artikel") {
        const itemCount = row.items?.length || 0;
        if (itemCount === 0) {
          td.innerHTML = '<span style="color: #999;">Keine Artikel</span>';
        } else if (itemCount === 1) {
          td.innerHTML = `<span style="font-weight: 500;">${toCellDisplay(col, row.items[0].Artikel)}</span>`;
        } else {
          td.innerHTML = `<span style="font-weight: 500;">${itemCount} Artikel</span>`;
        }
      } else {
        // Display formatted content (read-only)
        td.innerHTML = toCellDisplay(col, row[col]);
      }

      tr.appendChild(td);
      
      // Insert Summe column right after Artikel column
      if (col === "Artikel") {
        tr.appendChild(createSummeCell(row, idx));
      }
    }

    const act = document.createElement("td");
    act.className = "actions";
    
    // PDF View button
    const pdfViewBtn = document.createElement("button");
    pdfViewBtn.textContent = "PDF anzeigen";
    pdfViewBtn.className = "btn-secondary";
    pdfViewBtn.title = "PDF anzeigen";
    pdfViewBtn.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent row double-click
      pdfViewBtn.disabled = true;
      pdfViewBtn.textContent = 'PDF wird erstellt...';
      try {
        const pdf = await generatePDF('order', row, false, null, false);
        if (pdf) {
          viewPDF(pdf);
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
      } finally {
        pdfViewBtn.disabled = false;
        pdfViewBtn.textContent = 'PDF anzeigen';
      }
    });
    act.appendChild(pdfViewBtn);
    
    // PDF Download button
    const pdfDownloadBtn = document.createElement("button");
    pdfDownloadBtn.textContent = "PDF herunterladen";
    pdfDownloadBtn.className = "btn-primary";
    pdfDownloadBtn.title = "PDF herunterladen";
    pdfDownloadBtn.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent row double-click
      pdfDownloadBtn.disabled = true;
      pdfDownloadBtn.textContent = 'PDF wird erstellt...';
      try {
        const pdf = await generatePDF('order', row, false, null, false);
        if (pdf) {
          const filename = generatePdfFilename('A', row.Projekt, row.Firma, row.Auftragsdatum);
          downloadPDF(pdf, filename);
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
      } finally {
        pdfDownloadBtn.disabled = false;
        pdfDownloadBtn.textContent = 'PDF herunterladen';
      }
    });
    act.appendChild(pdfDownloadBtn);
    
    // Plus button - add row below
    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.title = "Zeile darunter einfügen";
    plus.addEventListener("click", () => {
      rows.splice(idx + 1, 0, newEmptyRow());
      setRows(rows);
      save();
      render();
    });
    act.appendChild(plus);
    
    // Minus button - delete row with confirmation
    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.title = "Zeile löschen";
    minus.className = "danger";
    minus.addEventListener("click", () => {
      const ok = confirm("Sind Sie sicher, dass Sie diesen Auftrag löschen möchten?");
      if (!ok) return;
      rows.splice(idx, 1);
      setRows(rows);
      save();
      render();
    });
    act.appendChild(minus);
    
    tr.appendChild(act);

    tbody.appendChild(tr);
  });
  
  // Update undo/redo button states after render
  updateUndoRedoButtons();
}

// Create a debounced version of render to avoid multiple rapid re-renders
export const debouncedRender = debounce(render, 300);

// Helper function to sanitize and format filename components
function sanitizeFilenameComponent(text) {
  if (!text) return 'unbekannt';
  // Replace spaces and special characters with hyphens, remove multiple hyphens
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generate filename for PDF download
// prefix: 'A' for Aufträge, 'R' for Rechnungen
function generatePdfFilename(prefix, projektName, firmaName, datum) {
  const sanitizedProjekt = sanitizeFilenameComponent(projektName);
  const sanitizedFirma = sanitizeFilenameComponent(firmaName);
  const sanitizedDatum = sanitizeFilenameComponent(datum);
  
  return `${prefix}_${sanitizedProjekt}_${sanitizedFirma}_${sanitizedDatum}.pdf`;
}
