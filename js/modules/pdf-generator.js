// -----------------------------
// PDF Generation Module
// -----------------------------
import { getCompanySettings, getPdfLayoutTemplate } from './settings.js';

// Generate PDF for an order or invoice
export async function generatePDF(documentType, documentData, useSampleCompanyData = false, customLayoutTemplate = null) {
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
  
  // Use custom layout if provided, otherwise get from settings
  const layoutTemplate = customLayoutTemplate || getPdfLayoutTemplate();

  // Render document based on layout template
  try {
    renderPDFDocument(doc, documentType, documentData, companySettings, layoutTemplate);
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

// Render PDF document based on layout template
function renderPDFDocument(doc, documentType, documentData, companySettings, layoutTemplate) {
  // Set default font
  doc.setFont('helvetica');

  // Render each element according to layout
  layoutTemplate.elements.forEach(element => {
    renderElement(doc, element, documentType, documentData, companySettings);
  });

  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Seite ${i} von ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
  }
}

// Render individual element
// Note: For text-based elements (company-name, company-address, etc.), the height parameter
// is intentionally ignored - these elements use content-based heights to avoid unnecessary
// spacing when content is small. Only logo and items-table use the configured height.
function renderElement(doc, element, documentType, documentData, companySettings) {
  const x = element.x * 0.352778; // Convert px to mm (600px = 210mm)
  const y = element.y * 0.352778;
  const width = element.width * 0.352778;
  const height = element.height * 0.352778;

  switch (element.type) {
    case 'logo':
      renderLogo(doc, x, y, width, height, companySettings);
      break;
    case 'company-name':
      renderCompanyName(doc, x, y, width, companySettings);
      break;
    case 'company-address':
      renderCompanyAddress(doc, x, y, width, companySettings);
      break;
    case 'company-contact':
      renderCompanyContact(doc, x, y, width, companySettings);
      break;
    case 'customer-info':
      renderCustomerInfo(doc, x, y, width, documentData);
      break;
    case 'document-header':
      renderDocumentHeader(doc, x, y, width, documentType, documentData);
      break;
    case 'items-table':
      renderItemsTable(doc, x, y, width, height, documentData);
      break;
    case 'totals':
      renderTotals(doc, x, y, width, documentData);
      break;
    case 'footer':
      renderFooter(doc, x, y, width, companySettings, documentType);
      break;
  }
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

function renderCompanyName(doc, x, y, width, companySettings) {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(companySettings.companyName || 'Firma', x, y + 6);
}

function renderCompanyAddress(doc, x, y, width, companySettings) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  if (companySettings.address) {
    const lines = companySettings.address.split('\n');
    lines.forEach((line, index) => {
      doc.text(line, x, y + 5 + (index * 5));
    });
  }
}

function renderCompanyContact(doc, x, y, width, companySettings) {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  let offsetY = y + 5;
  if (companySettings.email) {
    doc.text(`E-Mail: ${companySettings.email}`, x, offsetY);
    offsetY += 5;
  }
  if (companySettings.phone) {
    doc.text(`Tel: ${companySettings.phone}`, x, offsetY);
  }
}

function renderCustomerInfo(doc, x, y, width, documentData) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  let offsetY = y + 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Kunde:', x, offsetY);
  offsetY += 6;
  
  doc.setFont('helvetica', 'normal');
  
  // Support both old format (Firma, Ansprechpartner) and new format (customer object)
  const customer = documentData.customer || documentData;
  
  if (customer.company || customer.Firma) {
    doc.text(customer.company || customer.Firma, x, offsetY);
    offsetY += 5;
  }
  if (customer.contactPerson || customer.Ansprechpartner) {
    doc.text(customer.contactPerson || customer.Ansprechpartner, x, offsetY);
    offsetY += 5;
  }
  if (customer.address) {
    const lines = customer.address.split('\n');
    lines.forEach(line => {
      doc.text(line, x, offsetY);
      offsetY += 4;
    });
  }
}

function renderDocumentHeader(doc, x, y, width, documentType, documentData) {
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  const title = (documentType === 'order' || documentType === 'auftrag') ? 'Auftrag' : 'Rechnung';
  doc.text(title, x, y + 8);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Support both old format and new sample format
  let docId, docDate;
  if (documentType === 'order' || documentType === 'auftrag') {
    docId = documentData.orderId || documentData.Auftrags_ID;
    docDate = documentData.orderDate || documentData.Auftragsdatum;
  } else {
    docId = documentData.invoiceId || documentData.Rechnungs_ID;
    docDate = documentData.invoiceDate || documentData.Rechnungsdatum;
  }
  
  if (docId) {
    doc.text(`Nr: ${docId}`, x + width - 60, y + 8, { align: 'left' });
  }
  if (docDate) {
    doc.text(`Datum: ${docDate}`, x + width - 60, y + 14, { align: 'left' });
  }
}

function renderItemsTable(doc, x, y, width, height, documentData) {
  // Parse items from documentData
  let items = [];
  
  if (documentData.items && Array.isArray(documentData.items)) {
    // New format with items array
    items = documentData.items.map(item => ({
      artikel: item.description || item.artikel || '',
      beschreibung: item.description || item.beschreibung || '',
      menge: item.quantity || item.menge || '1',
      einheit: item.unit || item.einheit || 'Stk',
      einzelpreis: item.pricePerUnit || item.einzelpreis || '0',
      gesamtpreis: item.total || item.gesamtpreis || '0'
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

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, width, 8, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  
  const colWidths = {
    pos: width * 0.08,
    beschreibung: width * 0.35,
    menge: width * 0.12,
    einheit: width * 0.12,
    einzelpreis: width * 0.165,
    gesamtpreis: width * 0.165
  };
  
  let colX = x;
  doc.text('Pos.', colX + 2, y + 5);
  colX += colWidths.pos;
  doc.text('Beschreibung', colX + 2, y + 5);
  colX += colWidths.beschreibung;
  doc.text('Menge', colX + 2, y + 5);
  colX += colWidths.menge;
  doc.text('Einheit', colX + 2, y + 5);
  colX += colWidths.einheit;
  doc.text('Einzelpreis', colX + 2, y + 5);
  colX += colWidths.einzelpreis;
  doc.text('Gesamtpreis', colX + 2, y + 5);
  
  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  let rowY = y + 8;
  items.forEach((item, index) => {
    if (rowY > y + height - 10) {
      // Create new page if needed
      doc.addPage();
      rowY = 20;
    }
    
    // Alternate row background
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(x, rowY, width, 7, 'F');
    }
    
    colX = x;
    doc.text(String(item.position || index + 1), colX + 2, rowY + 5);
    colX += colWidths.pos;
    doc.text(item.beschreibung || item.artikel || '', colX + 2, rowY + 5);
    colX += colWidths.beschreibung;
    doc.text(String(item.menge || '1'), colX + 2, rowY + 5);
    colX += colWidths.menge;
    doc.text(item.einheit || 'Stk', colX + 2, rowY + 5);
    colX += colWidths.einheit;
    doc.text(formatCurrency(item.einzelpreis), colX + 2, rowY + 5);
    colX += colWidths.einzelpreis;
    doc.text(formatCurrency(item.gesamtpreis), colX + 2, rowY + 5);
    
    rowY += 7;
  });
  
  // Border
  doc.setDrawColor(200, 200, 200);
  doc.rect(x, y, width, rowY - y);
}

function renderTotals(doc, x, y, width, documentData) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Calculate total and subtotal
  let subtotal = 0;
  let vat = 0;
  let total = 0;
  
  // Check if we have new format with pre-calculated values
  if (documentData.subtotal !== undefined && documentData.total !== undefined) {
    subtotal = documentData.subtotal;
    vat = documentData.vat || 0;
    total = documentData.total;
  } else if (documentData.items && Array.isArray(documentData.items)) {
    subtotal = documentData.items.reduce((sum, item) => {
      const price = parseFloat(String(item.gesamtpreis || item.total || 0).replace(',', '.')) || 0;
      return sum + price;
    }, 0);
    vat = subtotal * 0.19; // Default 19% VAT
    total = subtotal + vat;
  } else if (documentData.Budget) {
    total = parseFloat(String(documentData.Budget).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    subtotal = total / 1.19;
    vat = total - subtotal;
  } else {
    return; // No data to display
  }
  
  // Calculate content-based height for the totals box
  // 3 lines of content + padding: subtotal, VAT, total
  const lineHeight = 7;  // 7mm between lines
  const topPadding = 5;  // 5mm top padding
  const bottomPadding = 3;  // 3mm bottom padding
  const boxHeight = topPadding + (3 * lineHeight) + bottomPadding;
  
  // Draw box with content-based height
  doc.setFillColor(245, 245, 245);
  doc.rect(x, y, width, boxHeight, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(x, y, width, boxHeight);
  
  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Netto:', x + 5, y + topPadding + 3);
  doc.text(formatCurrency(subtotal), x + width - 5, y + topPadding + 3, { align: 'right' });
  
  // VAT
  const vatRate = documentData.vatRate || 0.19;
  doc.text(`MwSt. (${(vatRate * 100).toFixed(0)}%):`, x + 5, y + topPadding + 3 + lineHeight);
  doc.text(formatCurrency(vat), x + width - 5, y + topPadding + 3 + lineHeight, { align: 'right' });
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Gesamtsumme:', x + 5, y + topPadding + 3 + (2 * lineHeight));
  doc.text(formatCurrency(total), x + width - 5, y + topPadding + 3 + (2 * lineHeight), { align: 'right' });
}

function renderFooter(doc, x, y, width, companySettings, documentType) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  
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
  const lines = doc.splitTextToSize(footerText, width - 10);
  let offsetY = y + 5;
  lines.forEach(line => {
    doc.text(line, x + width / 2, offsetY, { align: 'center' });
    offsetY += 4;
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
