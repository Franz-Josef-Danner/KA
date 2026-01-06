// -----------------------------
// Layout Editor Preview Module
// -----------------------------

import { getLayout, BOX_TYPES } from './layout-editor.js';
import { getCompanySettings, getSampleDocumentData } from './settings.js';
import { generatePDF } from './pdf-generator.js';

// Grid dimensions - must match layout-editor-ui.js
const CELL_WIDTH = 100;
const CELL_HEIGHT = 80;
const CELL_GAP = 8;

// A4 page dimensions in pixels (at 72 DPI approximation)
const PAGE_WIDTH = 595; // ~210mm in pixels
const PAGE_HEIGHT = 842; // ~297mm in pixels

// Convert grid layout to PDF layout template
export function convertLayoutToPDFTemplate(layout) {
  const elements = [];
  
  layout.boxes.forEach(box => {
    const boxType = Object.values(BOX_TYPES).find(bt => bt.id === box.type);
    if (!boxType) return;
    
    // Calculate bounding box
    const minRow = Math.min(...box.cells.map(([r, c]) => r));
    const maxRow = Math.max(...box.cells.map(([r, c]) => r));
    const minCol = Math.min(...box.cells.map(([r, c]) => c));
    const maxCol = Math.max(...box.cells.map(([r, c]) => c));
    
    const rowSpan = maxRow - minRow + 1;
    const colSpan = maxCol - minCol + 1;
    
    // Calculate position in pixels
    const x = minCol * (CELL_WIDTH + CELL_GAP);
    const y = minRow * (CELL_HEIGHT + CELL_GAP);
    const width = colSpan * CELL_WIDTH + (colSpan - 1) * CELL_GAP;
    const height = rowSpan * CELL_HEIGHT + (rowSpan - 1) * CELL_GAP;
    
    // Convert to PDF coordinates (600px width = full A4 page)
    // Add some scaling to better fit the page
    const scale = 0.9; // Scale down slightly to avoid edge issues
    const offsetX = 20; // Small left offset
    const offsetY = 20; // Small top offset
    
    elements.push({
      id: box.id,
      type: box.type,
      x: Math.round((x * scale) + offsetX),
      y: Math.round((y * scale) + offsetY),
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      textAlign: 'left'
    });
  });
  
  return { elements };
}

// Generate preview PDF
export async function generatePreviewPDF(documentType = 'order') {
  // Get current layout
  const layout = getLayout();
  
  // Check if there are any boxes
  if (layout.boxes.length === 0) {
    return {
      success: false,
      message: 'Bitte fügen Sie zuerst Boxen zum Layout hinzu.'
    };
  }
  
  // Convert layout to PDF template
  const pdfTemplate = convertLayoutToPDFTemplate(layout);
  
  // Get sample document data
  const documentData = getSampleDocumentData(documentType);
  
  // Generate PDF
  try {
    const doc = await generatePDF(documentType, documentData, true, pdfTemplate);
    
    if (doc) {
      return {
        success: true,
        pdf: doc
      };
    } else {
      return {
        success: false,
        message: 'Fehler beim Generieren der Vorschau.'
      };
    }
  } catch (error) {
    console.error('Preview generation error:', error);
    return {
      success: false,
      message: 'Fehler beim Generieren der Vorschau: ' + error.message
    };
  }
}

// Show preview in new window or download
export async function showPreviewPDF(documentType = 'order', download = false) {
  const result = await generatePreviewPDF(documentType);
  
  if (!result.success) {
    return result;
  }
  
  try {
    if (download) {
      // Download PDF
      result.pdf.save(`layout-preview-${documentType}-${Date.now()}.pdf`);
    } else {
      // Open in new window
      const pdfBlob = result.pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    }
    
    return {
      success: true,
      message: 'Vorschau wurde geöffnet.'
    };
  } catch (error) {
    console.error('Error showing preview:', error);
    return {
      success: false,
      message: 'Fehler beim Öffnen der Vorschau: ' + error.message
    };
  }
}
