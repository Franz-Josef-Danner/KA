// -----------------------------
// PDF Generation Module
// -----------------------------
import { getCompanySettings, getPdfLayoutTemplate, getStandardLayoutTemplate } from './settings.js';

// PDF margin in mm (1cm on all sides to prevent elements from sticking to edges)
const PDF_MARGIN = 10;

// Footer positioning constant
const FOOTER_MARGIN_FROM_BOTTOM = 50; // 50mm from bottom (40mm for footer content including QR code + 10mm margin)

// Page number positioning (distance from bottom edge)
const PAGE_NUMBER_MARGIN_FROM_BOTTOM = 5; // 5mm from bottom to avoid overlap with footer text

// Totals positioning adjustment (raise totals above footer line to prevent overlap)
const TOTALS_FOOTER_SPACING_MM = 3; // Raise totals by 3mm above their default position

// VAT has been removed as the user is VAT exempt

// Generate PDF for an order or invoice
// Parameters:
// - documentType: 'order'/'auftrag' or 'invoice'/'rechnung'
// - documentData: The document data object
// - useSampleCompanyData: If true, uses sample company data for preview (default: false)
// - customLayoutTemplate: Optional custom layout to use (default: null)
// - useStandardTemplate: If true, uses fixed standard template instead of custom layout (default: false)
export async function generatePDF(documentType, documentData, useSampleCompanyData = false, customLayoutTemplate = null, useStandardTemplate = false) {
  // Load jsPDF library from CDN if not already loaded
  if (typeof window.jspdf === 'undefined') {
    try {
      await loadJsPDF();
    } catch (error) {
      console.error('Failed to load jsPDF library:', error);
      alert('Fehler beim Laden der PDF-Bibliothek. Bitte versuchen Sie es erneut.');
      return null;
    }
  }

  // Load QRCode library for payment QR codes
  if (typeof window.QRCode === 'undefined') {
    try {
      await loadQRCodeLibrary();
    } catch (error) {
      console.warn('Failed to load QRCode library:', error);
      // Continue without QR code functionality
    }
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Choose between actual and sample company data
  let companySettings;
  if (useSampleCompanyData) {
    const { getSampleCompanyData } = await import('./settings.js');
    companySettings = getSampleCompanyData();
  } else {
    companySettings = getCompanySettings();
  }
  
  // Determine which layout template to use:
  // 1. If useStandardTemplate is true, use the fixed standard template
  // 2. Otherwise, use custom layout if provided
  // 3. Otherwise, get from settings (layout editor)
  let layoutTemplate;
  if (useStandardTemplate) {
    layoutTemplate = getStandardLayoutTemplate();
  } else {
    layoutTemplate = customLayoutTemplate || getPdfLayoutTemplate();
  }

  // Generate QR code for invoices if bank account data is available
  let paymentQRCode = null;
  if ((documentType === 'invoice' || documentType === 'rechnung') && 
      companySettings.iban && 
      typeof window.QRCode !== 'undefined') {
    try {
      // Calculate total amount from document data
      let totalAmount = 0;
      if (documentData.total !== undefined) {
        totalAmount = parseFloat(documentData.total);
      } else if (documentData.items && Array.isArray(documentData.items)) {
        totalAmount = documentData.items.reduce((sum, item) => {
          const price = parseFloat(String(item.Gesamtpreis || item.gesamtpreis || item.total || 0).replace(',', '.')) || 0;
          return sum + price;
        }, 0);
      } else if (documentData.Budget) {
        totalAmount = parseBudgetValue(documentData.Budget);
      }
      
      // Get invoice number
      const invoiceNumber = documentData.invoiceId || documentData.Rechnungs_ID || 'UNBEKANNT';
      
      // Generate EPC QR code data
      const epcData = generateEPCQRData(
        companySettings.iban,
        companySettings.bic,
        companySettings.accountHolder,
        totalAmount,
        invoiceNumber,
        companySettings.companyName
      );
      
      // Generate QR code image
      paymentQRCode = await generateQRCodeDataURL(epcData, 256);
    } catch (error) {
      console.error('Failed to generate payment QR code:', error);
      // Continue without QR code
    }
  }

  // Render document based on layout template
  try {
    renderPDFDocument(doc, documentType, documentData, companySettings, layoutTemplate, paymentQRCode);
    return doc;
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
    return null;
  }
}

// Load jsPDF library from CDN
function loadJsPDF() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window.jspdf !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      console.log('jsPDF library loaded successfully');
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load jsPDF from CDN'));
    };
    document.head.appendChild(script);
  });
}

// Load QRCode.js library from CDN
function loadQRCodeLibrary() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window.QRCode !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => {
      console.log('QRCode.js library loaded successfully');
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load QRCode.js from CDN'));
    };
    document.head.appendChild(script);
  });
}

// Render PDF document based on layout template
function renderPDFDocument(doc, documentType, documentData, companySettings, layoutTemplate, paymentQRCode = null) {
  // Set default font
  doc.setFont('helvetica');

  // Create a map to track actual rendered heights for dynamic positioning
  const renderedHeights = new Map();
  
  // Render each element according to layout, with dynamic Y positioning for text elements
  layoutTemplate.elements.forEach(element => {
    const adjustedElement = adjustElementPosition(element, renderedHeights, layoutTemplate.elements);
    const actualHeight = renderElement(doc, adjustedElement, documentType, documentData, companySettings);
    
    // Store the actual rendered height and position for this element (including margin)
    if (actualHeight !== null) {
      renderedHeights.set(element.id, {
        y: adjustedElement.y * 0.352778 + PDF_MARGIN,
        height: actualHeight,
        x: adjustedElement.x * 0.352778 + PDF_MARGIN,
        width: adjustedElement.width * 0.352778
      });
    }
  });

  // Automatically add footer at the bottom of the page
  // Footer is placed at a fixed position near the bottom, above the page numbers
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - FOOTER_MARGIN_FROM_BOTTOM;
  const footerX = PDF_MARGIN;
  const footerWidth = pageWidth - (2 * PDF_MARGIN);
  
  // Render footer on the last page
  const pageCount = doc.internal.getNumberOfPages();
  doc.setPage(pageCount);
  renderFooter(doc, footerX, footerY, footerWidth, companySettings, documentType, documentData, paymentQRCode);

  // Add page numbers (with extra spacing to avoid overlap with footer text)
  // Position page numbers closer to bottom edge, creating more space above for footer text
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Seite ${i} von ${pageCount}`, doc.internal.pageSize.width - PDF_MARGIN, doc.internal.pageSize.height - PAGE_NUMBER_MARGIN_FROM_BOTTOM, { align: 'right' });
  }
}

// Adjust element Y position based on actual content heights of previous elements
function adjustElementPosition(element, renderedHeights, allElements) {
  // Elements that should use dynamic positioning (text elements in the same column)
  const textElements = ['company-name', 'company-address', 'company-contact'];
  
  if (!textElements.includes(element.type)) {
    // Non-text elements keep their original position
    return element;
  }
  
  // Find the previous text element in the same column (similar X position)
  const elementX = element.x * 0.352778; // Convert to mm
  const previousElements = allElements
    .filter(el => {
      const elX = el.x * 0.352778;
      const elY = el.y * 0.352778;
      const currentY = element.y * 0.352778;
      // Same column (within 10mm) and positioned before current element
      return Math.abs(elX - elementX) < 10 && elY < currentY && renderedHeights.has(el.id);
    })
    .sort((a, b) => (b.y * 0.352778) - (a.y * 0.352778)); // Sort by Y descending
  
  if (previousElements.length > 0) {
    // Get the last rendered element in this column
    const previousElement = previousElements[0];
    const previousInfo = renderedHeights.get(previousElement.id);
    
    if (previousInfo) {
      // Position this element right after the previous one with a small gap
      // previousInfo.y includes the PDF_MARGIN, so we subtract it before calculating
      const gap = 2; // 2mm gap between elements
      const newY = (previousInfo.y - PDF_MARGIN + previousInfo.height + gap) / 0.352778; // Convert back to px
      
      return {
        ...element,
        y: newY
      };
    }
  }
  
  // No adjustment needed
  return element;
}

// Render individual element
// Note: For text-based elements (company-name, company-address, etc.), the height parameter
// is intentionally ignored - these elements use content-based heights to avoid unnecessary
// spacing when content is small. Only logo uses the configured height.
// The textAlign parameter is supported by company-name, company-address, and company-contact elements.
// Other elements have fixed alignment or don't support text alignment.
// Returns the actual height consumed by the element in mm (or null if not applicable).
function renderElement(doc, element, documentType, documentData, companySettings) {
  // Convert px to mm (600px = 210mm) and add PDF margin to ensure 1cm border
  const x = element.x * 0.352778 + PDF_MARGIN;
  const y = element.y * 0.352778 + PDF_MARGIN;
  const width = element.width * 0.352778;
  const height = element.height * 0.352778;
  const textAlign = element.textAlign || 'left';

  switch (element.type) {
    case 'logo':
      renderLogo(doc, x, y, width, height, companySettings);
      return height; // Logo uses configured height
    case 'company-name':
      return renderCompanyName(doc, x, y, width, companySettings, textAlign);
    case 'company-address':
      return renderCompanyAddress(doc, x, y, width, companySettings, textAlign);
    case 'company-contact':
      return renderCompanyContact(doc, x, y, width, companySettings, textAlign);
    case 'customer-info':
      return renderCustomerInfo(doc, x, y, width, documentData);
    case 'document-number':
      return renderDocumentNumber(doc, x, y, width, documentType, documentData);
    case 'document-header':
      return renderDocumentHeader(doc, x, y, width, documentType, documentData);
    case 'items-table':
      return renderItemsTable(doc, x, y, width, height, documentData);
    case 'totals':
      // Raise totals slightly to prevent overlap with footer line
      return renderTotals(doc, x, y - TOTALS_FOOTER_SPACING_MM, width, documentData);
    case 'footer':
      return renderFooter(doc, x, y, width, companySettings, documentType, documentData);
  }
  
  return null; // Unknown element type
}

function renderLogo(doc, x, y, width, height, companySettings) {
  if (companySettings.logo) {
    try {
      // Get image properties to calculate aspect ratio
      const imgProps = doc.getImageProperties(companySettings.logo);
      const imgAspectRatio = imgProps.width / imgProps.height;
      const boxAspectRatio = width / height;
      
      // Calculate dimensions that fit within the box while preserving aspect ratio
      let renderWidth = width;
      let renderHeight = height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (imgAspectRatio > boxAspectRatio) {
        // Image is wider - fit to width
        renderHeight = width / imgAspectRatio;
        offsetY = (height - renderHeight) / 2;
      } else {
        // Image is taller - fit to height
        renderWidth = height * imgAspectRatio;
        offsetX = (width - renderWidth) / 2;
      }
      
      // Add image with preserved aspect ratio, centered in the box
      doc.addImage(companySettings.logo, 'PNG', x + offsetX, y + offsetY, renderWidth, renderHeight);
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Fallback: draw a placeholder rectangle
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, y, width, height);
    }
  } else {
    // Draw placeholder
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, y, width, height);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Logo', x + width / 2, y + height / 2, { align: 'center' });
  }
}

function renderCompanyName(doc, x, y, width, companySettings, textAlign = 'left') {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  
  const align = textAlign === 'right' ? 'right' : textAlign === 'center' ? 'center' : 'left';
  const textX = align === 'right' ? (x + width) : align === 'center' ? (x + width / 2) : x;
  
  doc.text(companySettings.companyName || 'Firma', textX, y + 5, { align });
  
  // Return actual height: font size + spacing
  return 14 * 0.352778 + 2; // ~7mm total height
}

function renderCompanyAddress(doc, x, y, width, companySettings, textAlign = 'left') {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  const align = textAlign === 'right' ? 'right' : textAlign === 'center' ? 'center' : 'left';
  const textX = align === 'right' ? (x + width) : align === 'center' ? (x + width / 2) : x;
  
  let lineCount = 1;
  if (companySettings.address) {
    const lines = companySettings.address.split('\n');
    lineCount = lines.length;
    lines.forEach((line, index) => {
      doc.text(line, textX, y + 4 + (index * 4.5), { align });
    });
  }
  
  // Return actual height: first line offset + (line count * line height)
  return 4 + (lineCount * 4.5); // Each line is ~4.5mm
}

function renderCompanyContact(doc, x, y, width, companySettings, textAlign = 'left') {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  const align = textAlign === 'right' ? 'right' : textAlign === 'center' ? 'center' : 'left';
  const textX = align === 'right' ? (x + width) : align === 'center' ? (x + width / 2) : x;
  
  let offsetY = y + 4;
  let lineCount = 0;
  if (companySettings.email) {
    doc.text(`E-Mail: ${companySettings.email}`, textX, offsetY, { align });
    offsetY += 4.5;
    lineCount++;
  }
  if (companySettings.phone) {
    doc.text(`Tel: ${companySettings.phone}`, textX, offsetY, { align });
    lineCount++;
  }
  
  // Return actual height: first line offset + (line count * line height)
  return lineCount > 0 ? (4 + (lineCount * 4.5)) : 4;
}

function renderCustomerInfo(doc, x, y, width, documentData) {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  let offsetY = y + 6;
  const startY = offsetY;
  const padding = 3;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Rechnungsadresse:', x + padding, offsetY);
  offsetY += 6;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Support both old format (Firma, Ansprechpartner) and new format (customer object)
  const customer = documentData.customer || documentData;
  
  if (customer.company || customer.Firma) {
    doc.setFont('helvetica', 'bold');
    doc.text(customer.company || customer.Firma, x + padding, offsetY);
    doc.setFont('helvetica', 'normal');
    offsetY += 5;
  }
  if (customer.contactPerson || customer.Ansprechpartner) {
    doc.text(customer.contactPerson || customer.Ansprechpartner, x + padding, offsetY);
    offsetY += 4.5;
  }
  // Support both address and Firmenadresse fields
  const address = customer.address || customer.Firmenadresse;
  if (address) {
    // Split by newlines first, then split each line by commas
    // This handles addresses with either \n or , as separators
    const lines = address.split('\n').flatMap(line => 
      line.split(',').map(part => part.trim()).filter(part => part)
    );
    lines.forEach(line => {
      doc.text(line, x + padding, offsetY);
      offsetY += 4;
    });
  }
  
  // Calculate box height and draw box around customer info (draw after text to ensure proper height)
  const boxHeight = offsetY - y + 3;
  
  // Draw subtle box around customer info
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.rect(x, y, width, boxHeight);
  
  // Return actual height consumed
  return boxHeight;
}

function renderDocumentNumber(doc, x, y, width, documentType, documentData) {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  // Support both old format and new sample format
  let docId, docDate;
  let label;
  if (documentType === 'order' || documentType === 'auftrag') {
    docId = documentData.orderId || documentData.Auftrags_ID;
    docDate = documentData.orderDate || documentData.Auftragsdatum;
    label = 'Auftragsnummer:';
  } else {
    docId = documentData.invoiceId || documentData.Rechnungs_ID;
    docDate = documentData.invoiceDate || documentData.Rechnungsdatum;
    label = 'Rechnungsnummer:';
  }
  
  let offsetY = y + 4;
  let lineCount = 0;
  
  // Render document number
  if (docId) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(label, x, offsetY);
    offsetY += 5;
    lineCount++;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(docId, x, offsetY);
    offsetY += 5;
    lineCount++;
  }
  
  // Render date
  if (docDate) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Datum: ${docDate}`, x, offsetY);
    offsetY += 4;
    lineCount++;
  }
  
  // Return actual height: initial offset + (line count * average line height)
  return 4 + (lineCount * 5); // Consistent with other text elements
}

function renderDocumentHeader(doc, x, y, width, documentType, documentData) {
  // Title with accent color
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  
  const title = (documentType === 'order' || documentType === 'auftrag') ? 'Auftrag' : 'Rechnung';
  doc.text(title, x, y + 10);
  
  // Document metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  // Support both old format and new sample format
  let docId, docDate;
  if (documentType === 'order' || documentType === 'auftrag') {
    docId = documentData.orderId || documentData.Auftrags_ID;
    docDate = documentData.orderDate || documentData.Auftragsdatum;
  } else {
    docId = documentData.invoiceId || documentData.Rechnungs_ID;
    docDate = documentData.invoiceDate || documentData.Rechnungsdatum;
  }
  
  let offsetY = y + 20;
  if (docId) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Nummer:`, x, offsetY);
    doc.setFont('helvetica', 'normal');
    doc.text(docId, x + 20, offsetY);
    offsetY += 5;
  }
  if (docDate) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Datum:`, x, offsetY);
    doc.setFont('helvetica', 'normal');
    doc.text(docDate, x + 20, offsetY);
  }
  
  // Return actual height: title height + extra info
  return 30; // ~30mm for document header
}

function renderItemsTable(doc, x, y, width, height, documentData) {
  // Note: The 'height' parameter is used for reference but the table will grow
  // dynamically to fit all items, checking against page boundaries instead.
  // The actual rendered height is returned to allow proper positioning of subsequent elements.
  
  // Parse items from documentData
  let items = [];
  
  if (documentData.items && Array.isArray(documentData.items)) {
    // New format with items array
    // Field mapping supports multiple naming conventions for backward compatibility:
    // - API field names (where applicable): description, quantity, unit, pricePerUnit, total
    // - German lowercase (legacy): artikel, beschreibung, menge, einheit, einzelpreis, gesamtpreis
    // - German Capitalized (UI forms): Artikel, Beschreibung, Menge, Einheit, Einzelpreis, Gesamtpreis
    // Priority: API name (if exists) → lowercase → Capitalized
    items = documentData.items.map(item => ({
      artikel: item.artikel || item.Artikel || '',
      beschreibung: item.description || item.beschreibung || item.Beschreibung || '',
      menge: item.quantity || item.menge || item.Menge || '1',
      einheit: item.unit || item.einheit || item.Einheit || 'Stk',
      einzelpreis: item.pricePerUnit || item.einzelpreis || item.Einzelpreis || '0',
      gesamtpreis: item.total || item.gesamtpreis || item.Gesamtpreis || '0'
    }));
  } else if (documentData.Artikel) {
    // Try to parse from single field (legacy format)
    try {
      items = JSON.parse(documentData.Artikel);
    } catch (e) {
      // Single item
      items = [{
        artikel: documentData.Artikel || '',
        beschreibung: documentData.Beschreibung || '',
        menge: '1',
        einheit: 'Stk',
        einzelpreis: documentData.Budget || '0',
        gesamtpreis: documentData.Budget || '0'
      }];
    }
  }

  // Column widths configuration - optimized for better readability
  const colWidths = {
    pos: width * 0.08,
    beschreibung: width * 0.38,
    menge: width * 0.10,
    einheit: width * 0.10,
    einzelpreis: width * 0.17,
    gesamtpreis: width * 0.17
  };
  
  // Table dimensions
  const headerHeight = 9; // Height of table header in mm
  const rowHeight = 8; // Height of each table row in mm
  const newPageStartY = 20; // Starting Y position for content on new pages
  
  // Helper function to render table header
  const renderTableHeader = (headerY) => {
    // Header background with darker color
    doc.setFillColor(60, 60, 60);
    doc.rect(x, headerY, width, headerHeight, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    
    let headerColX = x;
    doc.text('Pos.', headerColX + 2, headerY + 6);
    headerColX += colWidths.pos;
    doc.text('Beschreibung', headerColX + 2, headerY + 6);
    headerColX += colWidths.beschreibung;
    doc.text('Menge', headerColX + 2, headerY + 6);
    headerColX += colWidths.menge;
    doc.text('Einheit', headerColX + 2, headerY + 6);
    headerColX += colWidths.einheit;
    doc.text('Einzelpreis', headerColX + 2, headerY + 6);
    headerColX += colWidths.einzelpreis;
    doc.text('Gesamt', headerColX + 2, headerY + 6);
  };
  
  // Render initial table header
  renderTableHeader(y);
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  
  let rowY = y + headerHeight;
  let colX; // Will be reset for each row
  const pageBottomMargin = doc.internal.pageSize.height - PDF_MARGIN;
  
  items.forEach((item, index) => {
    // Check if there's enough space for this row on the current page
    // We check against the page boundary to allow the table to grow dynamically
    // beyond the box height set in the layout editor
    if (rowY + rowHeight > pageBottomMargin) {
      // Create new page if needed
      doc.addPage();
      // Render header on new page
      renderTableHeader(newPageStartY);
      // Position first row after header on new page
      rowY = newPageStartY + headerHeight;
    }
    
    // Alternate row background - even rows get lighter background
    if (index % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(x, rowY, width, rowHeight, 'F');
    }
    
    // Add subtle borders between rows
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(x, rowY, x + width, rowY);
    
    colX = x;
    doc.text(String(item.position || index + 1), colX + 2, rowY + 5.5);
    colX += colWidths.pos;
    doc.text(item.beschreibung || item.artikel || '', colX + 2, rowY + 5.5);
    colX += colWidths.beschreibung;
    doc.text(String(item.menge || '1'), colX + 2, rowY + 5.5);
    colX += colWidths.menge;
    doc.text(item.einheit || 'Stk', colX + 2, rowY + 5.5);
    colX += colWidths.einheit;
    doc.text(formatCurrency(item.einzelpreis), colX + 2, rowY + 5.5);
    colX += colWidths.einzelpreis;
    doc.text(formatCurrency(item.gesamtpreis), colX + 2, rowY + 5.5);
    
    rowY += rowHeight;
  });
  
  // Add bottom border to table
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.5);
  doc.line(x, rowY, x + width, rowY);
  
  // Return actual height of rendered table content
  return rowY - y + 1; // Add 1mm for bottom border
}

function renderTotals(doc, x, y, width, documentData) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  
  // Calculate total and subtotal
  let subtotal = 0;
  let vat = 0;
  let total = 0;
  
  // Check if we have new format with pre-calculated values
  if (documentData.subtotal !== undefined && documentData.total !== undefined) {
    // Use the pre-calculated total since VAT calculations are not needed
    total = documentData.total;
  } else if (documentData.items && Array.isArray(documentData.items) && documentData.items.length > 0) {
    // Calculate from items array, checking for both capitalized and lowercase field names
    total = documentData.items.reduce((sum, item) => {
      const price = parseFloat(String(item.Gesamtpreis || item.gesamtpreis || item.total || 0).replace(',', '.')) || 0;
      return sum + price;
    }, 0);
    
    // If total is 0 but Budget exists, use Budget as fallback
    // Budget represents the final total amount when items don't provide pricing
    if (total === 0 && documentData.Budget) {
      total = parseBudgetValue(documentData.Budget);
    }
  } else if (documentData.Budget) {
    total = parseBudgetValue(documentData.Budget);
  } else {
    return; // No data to display
  }
  
  // Calculate dynamic width based on content to ensure text fits properly
  // Measure the width of all text elements that will be displayed
  
  // Measure total label (bold font, size 12)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const labelWidth = doc.getTextWidth('Gesamtbetrag:');
  const valueWidth = doc.getTextWidth(formatCurrency(total));
  
  // Calculate required width: label + value + spacing + padding
  const horizontalPadding = 10; // 5mm on each side
  const labelValueGap = 5; // Gap between label and value
  const calculatedWidth = labelWidth + labelValueGap + valueWidth + horizontalPadding;
  
  // Use the larger of calculated width or provided width, with a reasonable minimum
  const minWidth = 55; // Minimum width in mm (same as original ~158px)
  const actualWidth = Math.max(calculatedWidth, width, minWidth);
  
  // Adjust x position to keep the box right-aligned if width increased
  // Ensure adjustedX stays within valid page boundaries (minimum at left margin)
  const pageWidth = doc.internal.pageSize.width;
  const rightMargin = PDF_MARGIN;
  const leftMargin = PDF_MARGIN;
  const adjustedX = Math.max(leftMargin, Math.min(x, pageWidth - rightMargin - actualWidth));
  
  // Add subtle background box for totals
  const lineHeight = 6;
  const topPadding = 5;
  const bottomPadding = 5;
  const totalHeight = topPadding + lineHeight + bottomPadding;
  
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.rect(adjustedX, y, actualWidth, totalHeight, 'FD');
  
  const labelX = adjustedX + 5;
  const valueX = adjustedX + actualWidth - 5;
  
  // Total (no VAT calculation as user is VAT exempt)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Gesamtbetrag:', labelX, y + topPadding + 4);
  doc.text(formatCurrency(total), valueX, y + topPadding + 4, { align: 'right' });
  
  // Return the actual height
  return totalHeight;
}

function renderFooter(doc, x, y, width, companySettings, documentType, documentData = null, paymentQRCode = null) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  // Add subtle top border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(x, y - 2, x + width, y - 2);
  
  let offsetY = y + 3;
  
  // For invoices, show bank account information prominently if IBAN is available
  if ((documentType === 'invoice' || documentType === 'rechnung') && companySettings.iban) {
    
    // Determine layout based on QR code availability
    const hasQRCode = paymentQRCode !== null;
    const qrSize = 25; // QR code size in mm (reduced for better fit)
    const qrMargin = 5; // Margin around QR code
    
    if (hasQRCode) {
      // Layout: QR code on left, text information on right
      const qrX = x + 10;
      const qrY = offsetY;
      const textX = qrX + qrSize + qrMargin;
      const textWidth = width - (qrSize + qrMargin + 20);
      
      // Add QR code
      try {
        doc.addImage(paymentQRCode, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (error) {
        console.error('Failed to add QR code to PDF:', error);
      }
      
      // Bank account section header (above QR code)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text('Zahlungsinformationen:', textX, offsetY + 2, { align: 'left' });
      let textOffsetY = offsetY + 7;
      
      // Bank account details (to the right of QR code)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      
      if (companySettings.accountHolder) {
        doc.text(`Kontoinhaber: ${companySettings.accountHolder}`, textX, textOffsetY, { align: 'left' });
        textOffsetY += 3.5;
      }
      
      if (companySettings.bankName) {
        doc.text(`Bank: ${companySettings.bankName}`, textX, textOffsetY, { align: 'left' });
        textOffsetY += 3.5;
      }
      
      if (companySettings.iban) {
        doc.text(`IBAN: ${companySettings.iban}`, textX, textOffsetY, { align: 'left' });
        textOffsetY += 3.5;
      }
      
      if (companySettings.bic) {
        doc.text(`BIC: ${companySettings.bic}`, textX, textOffsetY, { align: 'left' });
        textOffsetY += 3.5;
      }
      
      // QR code hint
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text('Scannen Sie den QR-Code', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
      doc.text('für schnelle Überweisung', qrX + qrSize / 2, qrY + qrSize + 6, { align: 'center' });
      
      // Move offset to after QR code section
      offsetY = Math.max(qrY + qrSize + 8, textOffsetY + 2);
      
    } else {
      // Original centered layout without QR code
      // Bank account section header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text('Zahlungsinformationen:', x + width / 2, offsetY, { align: 'center' });
      offsetY += 5;
      
      // Bank account details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      
      if (companySettings.accountHolder) {
        doc.text(`Kontoinhaber: ${companySettings.accountHolder}`, x + width / 2, offsetY, { align: 'center' });
        offsetY += 3.5;
      }
      
      if (companySettings.bankName) {
        doc.text(`Bank: ${companySettings.bankName}`, x + width / 2, offsetY, { align: 'center' });
        offsetY += 3.5;
      }
      
      if (companySettings.iban) {
        doc.text(`IBAN: ${companySettings.iban}`, x + width / 2, offsetY, { align: 'center' });
        offsetY += 3.5;
      }
      
      if (companySettings.bic) {
        doc.text(`BIC: ${companySettings.bic}`, x + width / 2, offsetY, { align: 'center' });
        offsetY += 3.5;
      }
    }
    
    offsetY += 2; // Extra spacing before footer text
  }
  
  // Use appropriate footer text based on document type
  let footerText = '';
  if (documentType === 'invoice' || documentType === 'rechnung') {
    footerText = companySettings.footerTextInvoice || '';
  } else if (documentType === 'order' || documentType === 'auftrag') {
    footerText = companySettings.footerTextOrder || '';
  }
  
  // Fallback to default if no footer text is configured
  if (!footerText) {
    footerText = companySettings.companyName ? 
      `${companySettings.companyName} | ${companySettings.email || ''} | ${companySettings.phone || ''}` :
      'Vielen Dank für Ihr Vertrauen!';
  }
  
  // Split long text into multiple lines if needed
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const lines = doc.splitTextToSize(footerText, width - 10);
  lines.forEach(line => {
    doc.text(line, x + width / 2, offsetY, { align: 'center' });
    offsetY += 3.5;
  });
  
  // Return actual height: from y to offsetY
  return offsetY - y;
}

// Helper function to parse budget value from string
function parseBudgetValue(budget) {
  return parseFloat(String(budget).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
}

// Generate EPC QR code data for SEPA transfers
// Follows the European Payments Council Quick Response Code specification
function generateEPCQRData(iban, bic, accountHolder, amount, invoiceNumber, companyName) {
  // EPC QR code format specification:
  // Line 1: Service Tag (always "BCD")
  // Line 2: Version (001, 002)
  // Line 3: Character set (1 = UTF-8)
  // Line 4: Identification (always "SCT" for SEPA Credit Transfer)
  // Line 5: BIC of the beneficiary bank (optional from version 002)
  // Line 6: Beneficiary name (max 70 chars)
  // Line 7: Beneficiary IBAN
  // Line 8: Amount in EUR with format EUR123.45 (max 12 chars including EUR)
  // Line 9: Purpose (optional, max 4 chars)
  // Line 10: Structured reference (optional)
  // Line 11: Unstructured remittance information (max 140 chars)
  // Line 12: Beneficiary to originator information (optional)
  
  const lines = [
    'BCD',                                    // Service Tag
    '002',                                    // Version
    '1',                                      // Character set (UTF-8)
    'SCT',                                    // Identification
    bic || '',                                // BIC (optional in version 002)
    (accountHolder || companyName || '').substring(0, 70),  // Beneficiary name
    (iban || '').replace(/\s/g, ''),         // IBAN without spaces
    `EUR${amount.toFixed(2)}`,               // Amount
    '',                                       // Purpose (empty)
    '',                                       // Structured reference (empty)
    `Rechnung ${invoiceNumber}`.substring(0, 140), // Unstructured reference
    ''                                        // Beneficiary to originator info (empty)
  ];
  
  return lines.join('\n');
}

// Generate QR code as data URL using QRCode.js library
async function generateQRCodeDataURL(data, size = 256) {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary container for QR code generation
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);
      
      // Generate QR code
      const qr = new QRCode(container, {
        text: data,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      
      // Wait for QR code generation and extract as data URL
      setTimeout(() => {
        try {
          const canvas = container.querySelector('canvas');
          if (canvas) {
            const dataURL = canvas.toDataURL('image/png');
            document.body.removeChild(container);
            resolve(dataURL);
          } else {
            document.body.removeChild(container);
            reject(new Error('QR code canvas not found'));
          }
        } catch (error) {
          document.body.removeChild(container);
          reject(error);
        }
      }, 100); // Small delay to ensure QR code is generated
    } catch (error) {
      reject(error);
    }
  });
}

function formatCurrency(value) {
  const num = parseFloat(String(value).replace(',', '.')) || 0;
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(num);
}

// Export PDF to download
export function downloadPDF(doc, filename) {
  if (!doc) return;
  doc.save(filename);
}

// Open PDF in new window
export function viewPDF(doc) {
  if (!doc) return;
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}
