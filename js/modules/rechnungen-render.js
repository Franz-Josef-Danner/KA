// -----------------------------
// Rechnungen Rendering Module
// -----------------------------
import { COLUMNS } from './rechnungen-config.js';
import { getRows, setRows, newEmptyRow, save } from './rechnungen-state.js';
import { toCellDisplay } from '../utils/formatting.js';
import { debounce } from '../utils/helpers.js';
import { rowMatchesSearch } from './rechnungen-search.js';
import { updateUndoRedoButtons, getCompanyByName } from './rechnungen-ui.js';
import { generatePDF, viewPDF } from './pdf-generator.js';

// Payment status display configuration
const PAYMENT_STATUS_CONFIG = {
  bezahlt: { color: '#10b981', text: 'Bezahlt' },
  unbezahlt: { color: '#f59e0b', text: 'Unbezahlt' }
};

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

export function render() {
  if (!tbody || !searchInput) {
    console.warn('Required DOM elements not found for rendering');
    return;
  }

  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";

  const rows = getRows();

  rows.forEach((row, idx) => {
    if (!rowMatchesSearch(row, q)) return;

    const tr = document.createElement("tr");
    
    // Add double-click handler to open edit modal
    tr.addEventListener("dblclick", () => {
      // Dispatch custom event to avoid circular dependency
      window.dispatchEvent(new CustomEvent('openInvoiceModal', { detail: { rowIndex: idx } }));
    });
    
    // Add cursor pointer style
    tr.style.cursor = "pointer";

    for (const col of COLUMNS) {
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
      } else if (col === "Beschreibung") {
        // Skip beschreibung column since it's now part of items
        td.innerHTML = "";
      } else if (col === "Gesamtsumme") {
        // Calculate subtotal sum from invoice items
        let subtotal = 0;
        if (row.items && Array.isArray(row.items)) {
          row.items.forEach(item => {
            const gesamtpreis = parseFloat(item.Gesamtpreis) || 0;
            subtotal += gesamtpreis;
          });
        }
        
        // Apply discount if present
        const rabattPercent = parseFloat(row.Rabatt) || 0;
        const discountAmount = (subtotal * rabattPercent) / 100;
        const totalSum = subtotal - discountAmount;
        
        td.innerHTML = `<span style="font-weight: 500;">${totalSum.toFixed(2).replace('.', ',')} €</span>`;
      } else if (col === "Rabatt") {
        // Skip Rabatt column - it's stored but not displayed in the table
        continue;
      } else if (col === "Bezahlt") {
        // Display payment status with color coding
        const bezahlt = row[col] || "unbezahlt";
        const config = PAYMENT_STATUS_CONFIG[bezahlt] || PAYMENT_STATUS_CONFIG.unbezahlt;
        td.innerHTML = `<span style="font-weight: 500; color: ${config.color};">${config.text}</span>`;
      } else {
        // Display formatted content (read-only)
        td.innerHTML = toCellDisplay(col, row[col]);
      }

      tr.appendChild(td);
    }

    const act = document.createElement("td");
    act.className = "actions";
    
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
      const ok = confirm("Sind Sie sicher, dass Sie diese Rechnung löschen möchten?");
      if (!ok) return;
      rows.splice(idx, 1);
      setRows(rows);
      save();
      render();
    });
    act.appendChild(minus);
    
    // PDF button - generate and view PDF
    const pdfBtn = document.createElement("button");
    pdfBtn.textContent = "📄 PDF";
    pdfBtn.title = "PDF anzeigen";
    pdfBtn.style.backgroundColor = "#667eea";
    pdfBtn.style.color = "white";
    pdfBtn.style.border = "none";
    pdfBtn.style.padding = "4px 8px";
    pdfBtn.style.cursor = "pointer";
    pdfBtn.style.borderRadius = "4px";
    pdfBtn.addEventListener("click", async (e) => {
      console.log('=== PDF BUTTON CLICKED ===');
      console.log('Invoice row data:', row);
      
      e.stopPropagation(); // Prevent row double-click event
      pdfBtn.disabled = true;
      const originalText = pdfBtn.textContent;
      pdfBtn.textContent = "⏳ Lädt...";
      pdfBtn.style.backgroundColor = "#9ca3af";
      try {
        console.log('About to enrich invoice...');
        // Enrich invoice data with customer address
        const enrichedInvoice = enrichInvoiceWithAddress(row);
        console.log('Enriched invoice:', enrichedInvoice);
        console.log('About to generate PDF...');
        const pdf = await generatePDF('invoice', enrichedInvoice, false, null, true);
        console.log('PDF generated:', pdf);
        if (pdf) {
          viewPDF(pdf);
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
      } finally {
        pdfBtn.disabled = false;
        pdfBtn.textContent = originalText;
        pdfBtn.style.backgroundColor = "#667eea";
      }
    });
    act.appendChild(pdfBtn);
    
    tr.appendChild(act);

    tbody.appendChild(tr);
  });
  
  // Update undo/redo button states after render
  updateUndoRedoButtons();
}

// Create a debounced version of render to avoid multiple rapid re-renders
export const debouncedRender = debounce(render, 300);

// Helper function to enrich invoice data with customer address for PDF generation
function enrichInvoiceWithAddress(invoice) {
  console.log('enrichInvoiceWithAddress - input invoice:', invoice);
  console.log('enrichInvoiceWithAddress - invoice.Firma:', invoice.Firma);
  console.log('enrichInvoiceWithAddress - invoice.Projekt:', invoice.Projekt);
  
  const company = getCompanyByName(invoice.Firma);
  console.log('enrichInvoiceWithAddress - company found:', company);
  
  if (!company) {
    console.warn(`Company "${invoice.Firma}" not found in firmenliste. Checking all companies...`);
    // Try to find company in all companies, not just customers
    try {
      const allFirmenData = localStorage.getItem("firmen_tabelle_v1");
      if (allFirmenData) {
        const allCompanies = JSON.parse(allFirmenData);
        const foundCompany = allCompanies.find(c => c.Firma === invoice.Firma);
        console.log('enrichInvoiceWithAddress - company in all companies:', foundCompany);
        if (foundCompany) {
          console.log('enrichInvoiceWithAddress - company.Adresse:', foundCompany.Adresse);
          const enriched = {
            ...invoice,
            Firmenadresse: foundCompany.Adresse || ''
          };
          console.log('enrichInvoiceWithAddress - enriched invoice (from all companies):', enriched);
          return enriched;
        }
      }
    } catch (error) {
      console.error('Error finding company in all companies:', error);
    }
  } else {
    console.log('enrichInvoiceWithAddress - company.Adresse:', company.Adresse);
  }
  
  // Create enriched invoice data with customer address
  const enriched = {
    ...invoice,
    Firmenadresse: company?.Adresse || ''
  };
  
  console.log('enrichInvoiceWithAddress - enriched invoice:', enriched);
  console.log('enrichInvoiceWithAddress - enriched.Firmenadresse:', enriched.Firmenadresse);
  console.log('enrichInvoiceWithAddress - enriched.Projekt:', enriched.Projekt);
  
  return enriched;
}
