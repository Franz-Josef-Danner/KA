// -----------------------------
// Rechnungen Rendering Module
// -----------------------------
import { COLUMNS } from './rechnungen-config.js';
import { getRows, setRows, newEmptyRow, save } from './rechnungen-state.js';
import { toCellDisplay } from '../utils/formatting.js';
import { debounce } from '../utils/helpers.js';
import { rowMatchesSearch } from './rechnungen-search.js';
import { updateUndoRedoButtons } from './rechnungen-ui.js';
import { generatePDF, viewPDF, downloadPDF } from './pdf-generator.js';
import { generatePdfFilename } from '../utils/pdf-helpers.js';
import { enrichInvoiceWithPaymentTerms, calculateItemsTotal } from '../utils/invoice-helpers.js';
import { getArtikelliste } from './artikellisten-state.js';
import { DEFAULT_ZAHLUNGSZIEL_TAGE } from './artikellisten-config.js';
import { notifyInvoiceDeleted } from './email-notifications.js';

// Payment status display configuration
const PAYMENT_STATUS_CONFIG = {
  bezahlt: { color: '#10b981', text: 'Bezahlt' },
  unbezahlt: { color: '#f59e0b', text: 'Unbezahlt' }
};

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

// Columns that are stored but not displayed in the table
const HIDDEN_COLUMNS = ['Firmenadresse', 'Beschreibung', 'Rabatt', 'Firmen_ID', 'Firmen_Email', 'Ansprechpartner', 'Artikel', 'Auftrags_ID'];

/**
 * Calculate deadline date based on invoice date and payment terms
 * @param {string} invoiceDate - Invoice date in YYYY-MM-DD format
 * @param {number} paymentTermDays - Number of days until payment is due
 * @returns {string} - Deadline date in DD.MM.YYYY format or empty string
 */
function calculateDeadline(invoiceDate, paymentTermDays) {
  if (!invoiceDate) return '';
  
  try {
    // Parse date explicitly to avoid timezone issues
    // Invoice date format is YYYY-MM-DD
    const [year, month, day] = invoiceDate.split('-');
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return '';
    
    // Add payment term days to the invoice date
    date.setDate(date.getDate() + paymentTermDays);
    
    // Format as DD.MM.YYYY
    const dayFormatted = String(date.getDate()).padStart(2, '0');
    const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
    const yearFormatted = date.getFullYear();
    
    return `${dayFormatted}.${monthFormatted}.${yearFormatted}`;
  } catch (error) {
    console.error('Error calculating deadline:', error);
    return '';
  }
}

/**
 * Check if a deadline has passed
 * @param {string} deadlineStr - Deadline date in DD.MM.YYYY format
 * @returns {boolean} - True if deadline has passed
 */
function isDeadlinePassed(deadlineStr) {
  if (!deadlineStr) return false;
  
  try {
    const [day, month, year] = deadlineStr.split('.');
    const deadline = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return deadline < today;
  } catch (error) {
    return false;
  }
}

export async function render() {
  if (!tbody || !searchInput) {
    console.warn('Required DOM elements not found for rendering');
    return;
  }

  const q = (searchInput.value || "").trim().toLowerCase();
  tbody.innerHTML = "";

  const rows = getRows();
  
  // Pre-fetch all payment terms for companies to avoid multiple async calls during rendering
  const paymentTermsCache = {};
  const companyIds = [...new Set(rows.map(row => row.Firmen_ID).filter(id => id))];
  
  await Promise.all(companyIds.map(async (firmenId) => {
    try {
      const artikelliste = await getArtikelliste(firmenId);
      paymentTermsCache[firmenId] = artikelliste?.zahlungsziel_tage || DEFAULT_ZAHLUNGSZIEL_TAGE;
    } catch (error) {
      console.warn('Failed to fetch payment terms for company', firmenId, error);
      paymentTermsCache[firmenId] = DEFAULT_ZAHLUNGSZIEL_TAGE;
    }
  }));

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
      } else if (col === "Bezahlt") {
        // Display payment status with color coding
        const bezahlt = row[col] || "unbezahlt";
        const config = PAYMENT_STATUS_CONFIG[bezahlt] || PAYMENT_STATUS_CONFIG.unbezahlt;
        td.innerHTML = `<span style="font-weight: 500; color: ${config.color};">${config.text}</span>`;
      } else if (col === "Deadline") {
        // Display deadline only for unpaid invoices
        const bezahlt = row.Bezahlt || "unbezahlt";
        if (bezahlt === "unbezahlt") {
          const paymentTermDays = paymentTermsCache[row.Firmen_ID] || DEFAULT_ZAHLUNGSZIEL_TAGE;
          const deadlineStr = calculateDeadline(row.Rechnungsdatum, paymentTermDays);
          
          if (deadlineStr) {
            const isPastDue = isDeadlinePassed(deadlineStr);
            const color = isPastDue ? '#ef4444' : '#6b7280'; // Red if overdue, gray otherwise
            const weight = isPastDue ? '600' : '500';
            td.innerHTML = `<span style="font-weight: ${weight}; color: ${color};">${deadlineStr}</span>`;
          } else {
            td.innerHTML = '<span style="color: #999;">-</span>';
          }
        } else {
          // For paid invoices, show a dash
          td.innerHTML = '<span style="color: #999;">-</span>';
        }
      } else {
        // Display formatted content (read-only)
        td.innerHTML = toCellDisplay(col, row[col]);
      }

      tr.appendChild(td);
    }

    const act = document.createElement("td");
    act.className = "actions";
    
    // PDF View button
    const viewPdfBtn = document.createElement("button");
    viewPdfBtn.textContent = "PDF anzeigen";
    viewPdfBtn.className = "btn-secondary";
    viewPdfBtn.title = "PDF anzeigen";
    viewPdfBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      viewPdfBtn.disabled = true;
      viewPdfBtn.textContent = 'PDF wird erstellt...';
      try {
        // Enrich invoice data with payment terms from article list
        const enrichedRow = await enrichInvoiceWithPaymentTerms(row);
        const pdf = await generatePDF('invoice', enrichedRow, false, null, true);
        if (pdf) {
          viewPDF(pdf);
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
      } finally {
        viewPdfBtn.disabled = false;
        viewPdfBtn.textContent = 'PDF anzeigen';
      }
    });
    act.appendChild(viewPdfBtn);
    
    // PDF Download button
    const downloadPdfBtn = document.createElement("button");
    downloadPdfBtn.textContent = "PDF herunterladen";
    downloadPdfBtn.className = "btn-primary";
    downloadPdfBtn.title = "PDF herunterladen";
    downloadPdfBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      downloadPdfBtn.disabled = true;
      downloadPdfBtn.textContent = 'PDF wird erstellt...';
      try {
        // Enrich invoice data with payment terms from article list
        const enrichedRow = await enrichInvoiceWithPaymentTerms(row);
        const pdf = await generatePDF('invoice', enrichedRow, false, null, true);
        if (pdf) {
          const filename = generatePdfFilename('R', row.Projekt, row.Firma, row.Rechnungsdatum);
          downloadPDF(pdf, filename);
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
      } finally {
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.textContent = 'PDF herunterladen';
      }
    });
    act.appendChild(downloadPdfBtn);
    
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
    minus.addEventListener("click", async () => {
      const ok = confirm("Sind Sie sicher, dass Sie diese Rechnung löschen möchten?");
      if (!ok) return;
      
      // Calculate total before deletion for notification
      const invoiceItems = row.items || [];
      const total = calculateItemsTotal(invoiceItems);
      
      // Send deletion notification (async)
      await notifyInvoiceDeleted({
        invoiceId: row.Rechnungs_ID || '',
        customerName: row.Firma || '',
        total: total
      }, row); // Pass full row for PDF generation
      
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
