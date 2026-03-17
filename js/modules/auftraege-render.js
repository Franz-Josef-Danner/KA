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
import { generatePdfFilename } from '../utils/pdf-helpers.js';
import { notifyOrderDeleted } from './email-notifications.js';
import { calculateItemsTotal } from '../utils/invoice-helpers.js';
import { showLoadingOverlay, hideLoadingOverlay } from './loading-overlay.js';
import {
  ensureInitialized as ensurePlanungInitialized,
  getRows as getPlanungRows,
  setRows as setPlanungRows,
  save as savePlanung,
} from './planung-state.js';

const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("search");

// Columns that are stored but not displayed in the table
const HIDDEN_COLUMNS = [
  'Firmenadresse', 'Firmen_Email', 'Beschreibung', 'Ansprechpartner',
  'AnsprechpartnerKontakt', 'Budget', 'Rabatt', 'Laufzeit',
  'Projekttyp', 'Drehtage', 'DrehtagDaten', 'Abgabedatum', 'Ausweichtermin',
  'Drehbeginn', 'Drehende', 'Drehorte', 'DrehortTyp',
  'InterviewEnthalten', 'BRollBenoetigt', 'Drohne', 'TonaufnahmeNotwendig',
  'KameraSetup', 'LichtLevel', 'TonLevel', 'BewegungLevel',
  'BenoetigteDepartments'
];

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
    
    // Add status-based CSS class for visual indication
    const status = row.Status || "in Arbeit";
    const isCompleted = status.toLowerCase() === "abgeschlossen";
    const isGrossauftrag = row.istGrossauftrag === true;
    
    if (isCompleted) {
      tr.classList.add("order-completed");
    } else {
      tr.classList.add("order-in-progress");
    }
    
    if (isGrossauftrag) {
      tr.classList.add("grossauftrag-row");
    }
    
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

      // Display Auftrags_ID
      if (col === "Auftrags_ID") {
        const badge = isGrossauftrag
          ? ' <span style="font-size: 10px; background: #7c3aed; color: white; padding: 1px 5px; border-radius: 8px; vertical-align: middle;">GA</span>'
          : '';
        td.innerHTML = `<span style="font-weight: 500;">${toCellDisplay(col, row[col])}</span>${badge}`;
      } else if (col === "Status") {
        // Display order status with color coding
        const statusColor = isCompleted ? '#10b981' : '#f59e0b';
        const statusLabel = isCompleted ? 'Abgeschlossen' : 'In Arbeit';
        td.innerHTML = `<span style="font-weight: 500; color: ${statusColor};">${statusLabel}</span>`;
      } else if (col === "Artikel") {
        // Special handling for Artikel column to display items count
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
      
      // Insert Summe column right after Firma column
      if (col === "Firma") {
        tr.appendChild(createSummeCell(row, idx));
      }
    }

    const act = document.createElement("td");
    act.className = "actions";
    
    // PDF View button
    const viewPdfBtn = document.createElement("button");
    viewPdfBtn.innerHTML = "🔍";
    viewPdfBtn.className = "btn-secondary btn-pdf-icon";
    viewPdfBtn.title = "PDF anzeigen";
    viewPdfBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      viewPdfBtn.disabled = true;
      viewPdfBtn.innerHTML = '⏳';
      try {
        const pdf = await generatePDF('order', row, false, null, true);
        if (pdf) {
          viewPDF(pdf);
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
      } finally {
        viewPdfBtn.disabled = false;
        viewPdfBtn.innerHTML = '🔍';
      }
    });
    act.appendChild(viewPdfBtn);
    
    // PDF Download button
    const downloadPdfBtn = document.createElement("button");
    downloadPdfBtn.innerHTML = "⬇";
    downloadPdfBtn.className = "btn-primary btn-pdf-icon";
    downloadPdfBtn.title = "PDF herunterladen";
    downloadPdfBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      downloadPdfBtn.disabled = true;
      downloadPdfBtn.innerHTML = '⏳';
      try {
        const pdf = await generatePDF('order', row, false, null, true);
        if (pdf) {
          const filename = generatePdfFilename('A', row.Projekt, row.Firma, row.Auftragsdatum);
          downloadPDF(pdf, filename);
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
      } finally {
        downloadPdfBtn.disabled = false;
        downloadPdfBtn.innerHTML = '⬇';
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
      const ok = confirm("Sind Sie sicher, dass Sie diesen Auftrag löschen möchten?");
      if (!ok) return;
      
      // Show loading overlay
      showLoadingOverlay("Auftrag wird gelöscht...");
      
      try {
        // Calculate total before deletion for notification
        const orderItems = row.Artikel || [];
        const total = calculateItemsTotal(orderItems);
        
        // Send deletion notification
        await notifyOrderDeleted({
          orderId: row.Auftrags_ID || '',
          customerName: row.Firma || '',
          customerEmail: row.Firmen_Email || '',
          total: total,
          items: orderItems
        }, row); // Pass full row for PDF generation
        
        rows.splice(idx, 1);
        setRows(rows);
        save();

        if (row.istGrossauftrag === true && row.Auftrags_ID) {
          await ensurePlanungInitialized();
          const planungRows = getPlanungRows();
          const filtered = planungRows.filter(item => item.Auftrags_ID !== row.Auftrags_ID);
          if (filtered.length !== planungRows.length) {
            setPlanungRows(filtered);
            await savePlanung();
            window.dispatchEvent(new Event('planungChanged'));
          }
        }

        render();
      } finally {
        // Always hide loading overlay
        hideLoadingOverlay();
      }
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
