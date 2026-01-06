// -----------------------------
// Grid-Based Layout Editor Module
// -----------------------------

const LAYOUT_EDITOR_KEY = 'ka_document_layout';
const PDF_LAYOUT_KEY = 'ka_pdf_layout_template';

// Grid cell dimensions (must match layout-editor-ui.js)
const CELL_WIDTH = 100;
const CELL_HEIGHT = 80;
const CELL_GAP = 8;

// PDF conversion constants
const PDF_SCALE_FACTOR = 0.9; // Scale down slightly to avoid edge issues
const PDF_OFFSET_X = 20; // Small left offset
const PDF_OFFSET_Y = 20; // Small top offset

// Box types available in the library
// Note: FOOTER is excluded from the layout editor - it will be automatically placed at the bottom of PDFs
export const BOX_TYPES = {
  LOGO: { id: 'logo', title: 'Firmenlogo', icon: '🏢' },
  COMPANY_NAME: { id: 'company-name', title: 'Firmenname', icon: '📝' },
  COMPANY_ADDRESS: { id: 'company-address', title: 'Firmenadresse', icon: '📍' },
  COMPANY_CONTACT: { id: 'company-contact', title: 'Firmenkontakt', icon: '📞' },
  CUSTOMER_INFO: { id: 'customer-info', title: 'Kundendaten', icon: '👤' },
  DOCUMENT_NUMBER: { id: 'document-number', title: 'Auftrags-/Rechnungsnummer', icon: '🔢' },
  ITEMS_TABLE: { id: 'items-table', title: 'Artikeltabelle', icon: '📊' },
  TOTALS: { id: 'totals', title: 'Summe', icon: '💰' }
};

// Initial grid state
export function createInitialGridState() {
  return {
    rows: 3,
    cols: 3,
    boxes: [] // Array of box objects
  };
}

// Box object structure:
// {
//   id: unique id,
//   type: BOX_TYPES key,
//   cells: [[row, col], [row, col], ...] // All cells occupied by this box
// }

// Get current layout from localStorage
export function getLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_EDITOR_KEY);
    if (!raw) {
      return createInitialGridState();
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load layout:', error);
    return createInitialGridState();
  }
}

// Save layout to localStorage and sync with PDF template
export function saveLayout(layout) {
  try {
    // Save the grid-based layout
    localStorage.setItem(LAYOUT_EDITOR_KEY, JSON.stringify(layout));
    
    // Also convert and save as PDF template to keep them in sync
    const pdfTemplate = convertLayoutToPDFTemplate(layout);
    savePdfLayoutTemplateInternal(pdfTemplate);
    
    return true;
  } catch (error) {
    console.error('Failed to save layout:', error);
    return false;
  }
}

// Internal function to save PDF layout template (avoiding circular dependency)
function savePdfLayoutTemplateInternal(template) {
  try {
    localStorage.setItem(PDF_LAYOUT_KEY, JSON.stringify(template));
    return true;
  } catch (error) {
    console.error('Failed to save PDF layout template:', error);
    return false;
  }
}

// Convert grid layout to PDF template format
function convertLayoutToPDFTemplate(layout) {
  const elements = [];
  
  layout.boxes.forEach(box => {
    const boxType = Object.values(BOX_TYPES).find(bt => bt.id === box.type);
    if (!boxType) return;
    
    // Skip footer boxes - they will be automatically placed by the PDF generator
    if (box.type === 'footer') return;
    
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
    
    // Convert to PDF coordinates with scaling
    elements.push({
      id: box.id,
      type: box.type,
      x: Math.round((x * PDF_SCALE_FACTOR) + PDF_OFFSET_X),
      y: Math.round((y * PDF_SCALE_FACTOR) + PDF_OFFSET_Y),
      width: Math.round(width * PDF_SCALE_FACTOR),
      height: Math.round(height * PDF_SCALE_FACTOR),
      textAlign: 'left'
    });
  });
  
  return { elements };
}

// Add a row above or below a specific row
export function addRow(layout, rowIndex, position) {
  const newLayout = { ...layout };
  newLayout.rows++;
  
  // Update box cell positions
  newLayout.boxes = newLayout.boxes.map(box => {
    const updatedCells = box.cells.map(([r, c]) => {
      if (position === 'above' && r >= rowIndex) {
        return [r + 1, c];
      } else if (position === 'below' && r > rowIndex) {
        return [r + 1, c];
      }
      return [r, c];
    });
    return { ...box, cells: updatedCells };
  });
  
  return newLayout;
}

// Add a column left or right of a specific column
export function addColumn(layout, colIndex, position) {
  const newLayout = { ...layout };
  newLayout.cols++;
  
  // Update box cell positions
  newLayout.boxes = newLayout.boxes.map(box => {
    const updatedCells = box.cells.map(([r, c]) => {
      if (position === 'left' && c >= colIndex) {
        return [r, c + 1];
      } else if (position === 'right' && c > colIndex) {
        return [r, c + 1];
      }
      return [r, c];
    });
    return { ...box, cells: updatedCells };
  });
  
  return newLayout;
}

// Delete a row
export function deleteRow(layout, rowIndex) {
  const newLayout = { ...layout };
  
  // Check if this would make rows < 1
  if (newLayout.rows <= 1) {
    return null; // Cannot delete last row
  }
  
  newLayout.rows--;
  
  // Remove boxes that have cells in this row and update positions
  newLayout.boxes = newLayout.boxes
    .map(box => {
      // Remove cells in the deleted row
      const updatedCells = box.cells.filter(([r, c]) => r !== rowIndex);
      
      // Update positions for rows below
      const finalCells = updatedCells.map(([r, c]) => {
        if (r > rowIndex) {
          return [r - 1, c];
        }
        return [r, c];
      });
      
      return { ...box, cells: finalCells };
    })
    .filter(box => box.cells.length > 0); // Remove boxes with no cells left
  
  return newLayout;
}

// Delete a column
export function deleteColumn(layout, colIndex) {
  const newLayout = { ...layout };
  
  // Check if this would make cols < 1
  if (newLayout.cols <= 1) {
    return null; // Cannot delete last column
  }
  
  newLayout.cols--;
  
  // Remove boxes that have cells in this column and update positions
  newLayout.boxes = newLayout.boxes
    .map(box => {
      // Remove cells in the deleted column
      const updatedCells = box.cells.filter(([r, c]) => c !== colIndex);
      
      // Update positions for columns to the right
      const finalCells = updatedCells.map(([r, c]) => {
        if (c > colIndex) {
          return [r, c - 1];
        }
        return [r, c];
      });
      
      return { ...box, cells: finalCells };
    })
    .filter(box => box.cells.length > 0); // Remove boxes with no cells left
  
  return newLayout;
}

// Check if a cell is occupied
export function isCellOccupied(layout, row, col) {
  return layout.boxes.some(box => 
    box.cells.some(([r, c]) => r === row && c === col)
  );
}

// Get box at a specific cell
export function getBoxAtCell(layout, row, col) {
  return layout.boxes.find(box => 
    box.cells.some(([r, c]) => r === row && c === col)
  );
}

// Add a box to the grid at a specific cell
export function addBox(layout, boxType, row, col) {
  // Check if cell is already occupied
  if (isCellOccupied(layout, row, col)) {
    return { success: false, message: 'Diese Zelle ist bereits belegt.' };
  }
  
  const newBox = {
    id: `box-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: boxType,
    cells: [[row, col]]
  };
  
  const newLayout = { ...layout };
  newLayout.boxes = [...newLayout.boxes, newBox];
  
  return { success: true, layout: newLayout };
}

// Expand a box in a direction
export function expandBox(layout, boxId, direction) {
  const box = layout.boxes.find(b => b.id === boxId);
  if (!box) {
    return { success: false, message: 'Box nicht gefunden.' };
  }
  
  // Get the bounding box
  const minRow = Math.min(...box.cells.map(([r, c]) => r));
  const maxRow = Math.max(...box.cells.map(([r, c]) => r));
  const minCol = Math.min(...box.cells.map(([r, c]) => c));
  const maxCol = Math.max(...box.cells.map(([r, c]) => c));
  
  let newCells = [];
  
  switch (direction) {
    case 'up':
      if (minRow === 0) {
        return { success: false, message: 'Keine Zeile oberhalb verfügbar.' };
      }
      // Add all cells in the row above
      for (let c = minCol; c <= maxCol; c++) {
        if (isCellOccupied(layout, minRow - 1, c)) {
          return { success: false, message: 'Blockierende Zelle vorhanden. Bitte neue Zeile erzeugen oder blockierende Zellen leeren.' };
        }
        newCells.push([minRow - 1, c]);
      }
      break;
      
    case 'down':
      if (maxRow >= layout.rows - 1) {
        return { success: false, message: 'Keine Zeile unterhalb verfügbar.' };
      }
      // Add all cells in the row below
      for (let c = minCol; c <= maxCol; c++) {
        if (isCellOccupied(layout, maxRow + 1, c)) {
          return { success: false, message: 'Blockierende Zelle vorhanden. Bitte neue Zeile erzeugen oder blockierende Zellen leeren.' };
        }
        newCells.push([maxRow + 1, c]);
      }
      break;
      
    case 'left':
      if (minCol === 0) {
        return { success: false, message: 'Keine Spalte links verfügbar.' };
      }
      // Add all cells in the column to the left
      for (let r = minRow; r <= maxRow; r++) {
        if (isCellOccupied(layout, r, minCol - 1)) {
          return { success: false, message: 'Blockierende Zelle vorhanden. Bitte neue Spalte erzeugen oder blockierende Zellen leeren.' };
        }
        newCells.push([r, minCol - 1]);
      }
      break;
      
    case 'right':
      if (maxCol >= layout.cols - 1) {
        return { success: false, message: 'Keine Spalte rechts verfügbar.' };
      }
      // Add all cells in the column to the right
      for (let r = minRow; r <= maxRow; r++) {
        if (isCellOccupied(layout, r, maxCol + 1)) {
          return { success: false, message: 'Blockierende Zelle vorhanden. Bitte neue Spalte erzeugen oder blockierende Zellen leeren.' };
        }
        newCells.push([r, maxCol + 1]);
      }
      break;
  }
  
  const newLayout = { ...layout };
  newLayout.boxes = newLayout.boxes.map(b => {
    if (b.id === boxId) {
      return { ...b, cells: [...b.cells, ...newCells] };
    }
    return b;
  });
  
  return { success: true, layout: newLayout };
}

// Get corners of a box
export function getBoxCorners(box) {
  const minRow = Math.min(...box.cells.map(([r, c]) => r));
  const maxRow = Math.max(...box.cells.map(([r, c]) => r));
  const minCol = Math.min(...box.cells.map(([r, c]) => c));
  const maxCol = Math.max(...box.cells.map(([r, c]) => c));
  
  return [
    [minRow, minCol], // top-left
    [minRow, maxCol], // top-right
    [maxRow, minCol], // bottom-left
    [maxRow, maxCol]  // bottom-right
  ];
}

// Remove a cell from a box (for X button on corners)
export function removeCellFromBox(layout, boxId, row, col) {
  const box = layout.boxes.find(b => b.id === boxId);
  if (!box) {
    return { success: false, message: 'Box nicht gefunden.' };
  }
  
  // If box only has 1 cell, remove the entire box
  if (box.cells.length === 1) {
    const newLayout = { ...layout };
    newLayout.boxes = newLayout.boxes.filter(b => b.id !== boxId);
    return { success: true, layout: newLayout };
  }
  
  // Get corners
  const corners = getBoxCorners(box);
  const isCorner = corners.some(([r, c]) => r === row && c === col);
  
  if (!isCorner) {
    return { success: false, message: 'Nur Eckzellen können entfernt werden.' };
  }
  
  // Check if removing this corner would create more than 4 corners
  const minRow = Math.min(...box.cells.map(([r, c]) => r));
  const maxRow = Math.max(...box.cells.map(([r, c]) => r));
  const minCol = Math.min(...box.cells.map(([r, c]) => c));
  const maxCol = Math.max(...box.cells.map(([r, c]) => c));
  
  const rowSpan = maxRow - minRow + 1;
  const colSpan = maxCol - minCol + 1;
  
  // If box is large (4x4 or more), ask for split direction
  if (rowSpan >= 4 && colSpan >= 4) {
    return {
      success: false,
      requiresSplit: true,
      message: 'Box ist zu groß. Bitte Trennrichtung wählen.',
      boxId: boxId,
      corner: [row, col]
    };
  }
  
  // Simple corner removal - remove the entire row or column
  let newCells = box.cells;
  
  if (row === minRow && col === minCol) {
    // Top-left: remove top row or left column
    if (rowSpan > colSpan) {
      newCells = newCells.filter(([r, c]) => r !== minRow);
    } else {
      newCells = newCells.filter(([r, c]) => c !== minCol);
    }
  } else if (row === minRow && col === maxCol) {
    // Top-right: remove top row or right column
    if (rowSpan > colSpan) {
      newCells = newCells.filter(([r, c]) => r !== minRow);
    } else {
      newCells = newCells.filter(([r, c]) => c !== maxCol);
    }
  } else if (row === maxRow && col === minCol) {
    // Bottom-left: remove bottom row or left column
    if (rowSpan > colSpan) {
      newCells = newCells.filter(([r, c]) => r !== maxRow);
    } else {
      newCells = newCells.filter(([r, c]) => c !== minCol);
    }
  } else if (row === maxRow && col === maxCol) {
    // Bottom-right: remove bottom row or right column
    if (rowSpan > colSpan) {
      newCells = newCells.filter(([r, c]) => r !== maxRow);
    } else {
      newCells = newCells.filter(([r, c]) => c !== maxCol);
    }
  }
  
  const newLayout = { ...layout };
  newLayout.boxes = newLayout.boxes.map(b => {
    if (b.id === boxId) {
      return { ...b, cells: newCells };
    }
    return b;
  });
  
  return { success: true, layout: newLayout };
}

// Split a box (for large boxes when removing corners)
export function splitBox(layout, boxId, corner, direction) {
  const box = layout.boxes.find(b => b.id === boxId);
  if (!box) {
    return { success: false, message: 'Box nicht gefunden.' };
  }
  
  const [cornerRow, cornerCol] = corner;
  const minRow = Math.min(...box.cells.map(([r, c]) => r));
  const maxRow = Math.max(...box.cells.map(([r, c]) => r));
  const minCol = Math.min(...box.cells.map(([r, c]) => c));
  const maxCol = Math.max(...box.cells.map(([r, c]) => c));
  
  let newCells = box.cells;
  
  if (direction === 'horizontal') {
    // Remove the top or bottom half
    if (cornerRow === minRow) {
      // Remove top half
      const midRow = Math.floor((minRow + maxRow) / 2);
      newCells = newCells.filter(([r, c]) => r > midRow);
    } else {
      // Remove bottom half
      const midRow = Math.ceil((minRow + maxRow) / 2);
      newCells = newCells.filter(([r, c]) => r < midRow);
    }
  } else if (direction === 'vertical') {
    // Remove the left or right half
    if (cornerCol === minCol) {
      // Remove left half
      const midCol = Math.floor((minCol + maxCol) / 2);
      newCells = newCells.filter(([r, c]) => c > midCol);
    } else {
      // Remove right half
      const midCol = Math.ceil((minCol + maxCol) / 2);
      newCells = newCells.filter(([r, c]) => c < midCol);
    }
  }
  
  const newLayout = { ...layout };
  newLayout.boxes = newLayout.boxes.map(b => {
    if (b.id === boxId) {
      return { ...b, cells: newCells };
    }
    return b;
  });
  
  return { success: true, layout: newLayout };
}

// Remove a box completely
export function removeBox(layout, boxId) {
  const newLayout = { ...layout };
  newLayout.boxes = newLayout.boxes.filter(b => b.id !== boxId);
  return newLayout;
}

// Move a box to a new cell (box collapses to 1 cell)
export function moveBox(layout, boxId, newRow, newCol) {
  // Check if target cell is occupied
  if (isCellOccupied(layout, newRow, newCol)) {
    return { success: false, message: 'Diese Zelle ist bereits belegt.' };
  }
  
  const newLayout = { ...layout };
  newLayout.boxes = newLayout.boxes.map(b => {
    if (b.id === boxId) {
      return { ...b, cells: [[newRow, newCol]] };
    }
    return b;
  });
  
  return { success: true, layout: newLayout };
}
