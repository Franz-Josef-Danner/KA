// -----------------------------
// Layout Grid Module
// Manages the grid-based layout designer for PDF documents
// -----------------------------

const LAYOUT_GRID_KEY = 'ka_layout_grid_state';

// Available box types with their metadata
export const BOX_TYPES = {
  'company-logo': {
    id: 'company-logo',
    title: 'Firmenlogo',
    icon: '🏢',
    placeholder: '[FIRMENLOGO]',
    minCells: 1
  },
  'company-name': {
    id: 'company-name',
    title: 'Firmen Name',
    icon: '🏷️',
    placeholder: 'Muster GmbH & Co. KG',
    minCells: 1
  },
  'company-address': {
    id: 'company-address',
    title: 'Firmenadresse',
    icon: '📍',
    placeholder: 'Musterstraße 123\n12345 Musterstadt',
    minCells: 1
  },
  'company-contact': {
    id: 'company-contact',
    title: 'Firmenkontakt',
    icon: '📞',
    placeholder: 'Tel: +49 123 456789\nEmail: kontakt@firma.de',
    minCells: 1
  },
  'customer-data': {
    id: 'customer-data',
    title: 'Kundendaten',
    icon: '👤',
    placeholder: 'Max Mustermann\nKundenstraße 456\n54321 Stadt\nmax@kunde.de',
    minCells: 1
  },
  'document-number': {
    id: 'document-number',
    title: 'Auftragsnummer / Rechnungsnummer',
    icon: '🔢',
    placeholder: 'Rechnung Nr.: RE-2024-001\nDatum: 01.01.2024',
    minCells: 1
  },
  'items-table': {
    id: 'items-table',
    title: 'Artikel Tabelle',
    icon: '📋',
    placeholder: 'Nr. | Artikel | Beschreibung | Preis | Einheit | Menge | Gesamt',
    minCells: 2
  },
  'total-sum': {
    id: 'total-sum',
    title: 'Summe',
    icon: '💰',
    placeholder: 'Zwischensumme: 1.000,00 €\nMwSt. (19%): 190,00 €\nGesamtsumme: 1.190,00 €',
    minCells: 1
  },
  'footer': {
    id: 'footer',
    title: 'Fußzeile',
    icon: '📄',
    placeholder: 'Bankverbindung | USt-ID | Rechtliche Hinweise',
    minCells: 1
  }
};

// Grid state management
class LayoutGridState {
  constructor() {
    this.rows = 3;
    this.cols = 3;
    this.cells = {}; // cell[row][col] = { boxId, isPartOfBox }
    this.boxes = {}; // boxId -> { type, row, col, rowSpan, colSpan }
    this.initializeCells();
  }

  initializeCells() {
    this.cells = {};
    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = {};
      for (let c = 0; c < this.cols; c++) {
        this.cells[r][c] = { boxId: null };
      }
    }
  }

  addRow(atIndex) {
    // Insert a new row at the specified index
    const newCells = {};
    for (let r = 0; r < this.rows + 1; r++) {
      newCells[r] = {};
      for (let c = 0; c < this.cols; c++) {
        if (r < atIndex) {
          newCells[r][c] = this.cells[r][c];
        } else if (r === atIndex) {
          newCells[r][c] = { boxId: null };
        } else {
          newCells[r][c] = this.cells[r - 1][c];
        }
      }
    }
    this.rows++;
    this.cells = newCells;
    
    // Update box positions
    for (const boxId in this.boxes) {
      const box = this.boxes[boxId];
      if (box.row >= atIndex) {
        box.row++;
      }
    }
  }

  deleteRow(index) {
    if (this.rows <= 1) return false;
    
    // Check if any boxes are in this row
    const affectedBoxes = new Set();
    for (let c = 0; c < this.cols; c++) {
      const boxId = this.cells[index][c].boxId;
      if (boxId) {
        affectedBoxes.add(boxId);
      }
    }
    
    // Remove affected boxes
    for (const boxId of affectedBoxes) {
      this.removeBox(boxId);
    }
    
    // Shift rows up
    const newCells = {};
    let newRow = 0;
    for (let r = 0; r < this.rows; r++) {
      if (r === index) continue;
      newCells[newRow] = {};
      for (let c = 0; c < this.cols; c++) {
        newCells[newRow][c] = this.cells[r][c];
      }
      newRow++;
    }
    this.rows--;
    this.cells = newCells;
    
    // Update box positions
    for (const boxId in this.boxes) {
      const box = this.boxes[boxId];
      if (box.row > index) {
        box.row--;
      }
    }
    
    return true;
  }

  addColumn(atIndex) {
    // Insert a new column at the specified index
    for (let r = 0; r < this.rows; r++) {
      const newRow = {};
      for (let c = 0; c <= this.cols; c++) {
        if (c < atIndex) {
          newRow[c] = this.cells[r][c];
        } else if (c === atIndex) {
          newRow[c] = { boxId: null };
        } else {
          newRow[c] = this.cells[r][c - 1];
        }
      }
      this.cells[r] = newRow;
    }
    this.cols++;
    
    // Update box positions
    for (const boxId in this.boxes) {
      const box = this.boxes[boxId];
      if (box.col >= atIndex) {
        box.col++;
      }
    }
  }

  deleteColumn(index) {
    if (this.cols <= 1) return false;
    
    // Check if any boxes are in this column
    const affectedBoxes = new Set();
    for (let r = 0; r < this.rows; r++) {
      const boxId = this.cells[r][index].boxId;
      if (boxId) {
        affectedBoxes.add(boxId);
      }
    }
    
    // Remove affected boxes
    for (const boxId of affectedBoxes) {
      this.removeBox(boxId);
    }
    
    // Shift columns left
    for (let r = 0; r < this.rows; r++) {
      const newRow = {};
      let newCol = 0;
      for (let c = 0; c < this.cols; c++) {
        if (c === index) continue;
        newRow[newCol] = this.cells[r][c];
        newCol++;
      }
      this.cells[r] = newRow;
    }
    this.cols--;
    
    // Update box positions
    for (const boxId in this.boxes) {
      const box = this.boxes[boxId];
      if (box.col > index) {
        box.col--;
      }
    }
    
    return true;
  }

  canPlaceBox(row, col, rowSpan, colSpan) {
    // Check if the area is available
    if (row + rowSpan > this.rows || col + colSpan > this.cols) {
      return false;
    }
    
    for (let r = row; r < row + rowSpan; r++) {
      for (let c = col; c < col + colSpan; c++) {
        if (this.cells[r][c].boxId !== null) {
          return false;
        }
      }
    }
    return true;
  }

  placeBox(boxId, type, row, col) {
    // Place a box starting at the specified cell (initial 1x1)
    if (!this.canPlaceBox(row, col, 1, 1)) {
      return false;
    }
    
    this.boxes[boxId] = {
      type,
      row,
      col,
      rowSpan: 1,
      colSpan: 1
    };
    
    this.cells[row][col].boxId = boxId;
    return true;
  }

  expandBox(boxId, direction) {
    const box = this.boxes[boxId];
    if (!box) return false;
    
    let newRowSpan = box.rowSpan;
    let newColSpan = box.colSpan;
    
    switch (direction) {
      case 'up':
        if (box.row === 0) return false;
        // Check if cells above are free
        for (let c = box.col; c < box.col + box.colSpan; c++) {
          if (this.cells[box.row - 1][c].boxId !== null) {
            return { error: 'Zellen oberhalb sind nicht leer' };
          }
        }
        box.row--;
        newRowSpan++;
        break;
        
      case 'down':
        if (box.row + box.rowSpan >= this.rows) {
          return { error: 'Keine Zeile verfügbar. Bitte fügen Sie eine Zeile hinzu.' };
        }
        // Check if cells below are free
        for (let c = box.col; c < box.col + box.colSpan; c++) {
          if (this.cells[box.row + box.rowSpan][c].boxId !== null) {
            return { error: 'Zellen unterhalb sind nicht leer' };
          }
        }
        newRowSpan++;
        break;
        
      case 'left':
        if (box.col === 0) return false;
        // Check if cells to the left are free
        for (let r = box.row; r < box.row + box.rowSpan; r++) {
          if (this.cells[r][box.col - 1].boxId !== null) {
            return { error: 'Zellen links sind nicht leer' };
          }
        }
        box.col--;
        newColSpan++;
        break;
        
      case 'right':
        if (box.col + box.colSpan >= this.cols) {
          return { error: 'Keine Spalte verfügbar. Bitte fügen Sie eine Spalte hinzu.' };
        }
        // Check if cells to the right are free
        for (let r = box.row; r < box.row + box.rowSpan; r++) {
          if (this.cells[r][box.col + box.colSpan].boxId !== null) {
            return { error: 'Zellen rechts sind nicht leer' };
          }
        }
        newColSpan++;
        break;
    }
    
    // Update cells
    for (let r = box.row; r < box.row + newRowSpan; r++) {
      for (let c = box.col; c < box.col + newColSpan; c++) {
        this.cells[r][c].boxId = boxId;
      }
    }
    
    box.rowSpan = newRowSpan;
    box.colSpan = newColSpan;
    return true;
  }

  shrinkBox(boxId, row, col) {
    const box = this.boxes[boxId];
    if (!box) return false;
    
    // Determine which edge to shrink based on the cell being released
    const relRow = row - box.row;
    const relCol = col - box.col;
    
    // If box is only 1x1, remove it entirely
    if (box.rowSpan === 1 && box.colSpan === 1) {
      this.removeBox(boxId);
      return true;
    }
    
    // If box spans multiple cells, ask user which direction to shrink
    // This will be handled in the UI layer
    return { needsDirection: true, box, cell: { row, col } };
  }

  shrinkBoxDirection(boxId, direction) {
    const box = this.boxes[boxId];
    if (!box) return false;
    
    // Clear the cells that will be released
    switch (direction) {
      case 'horizontal':
        // Release the rightmost column
        if (box.colSpan > 1) {
          for (let r = box.row; r < box.row + box.rowSpan; r++) {
            this.cells[r][box.col + box.colSpan - 1].boxId = null;
          }
          box.colSpan--;
        }
        break;
        
      case 'vertical':
        // Release the bottom row
        if (box.rowSpan > 1) {
          for (let c = box.col; c < box.col + box.colSpan; c++) {
            this.cells[box.row + box.rowSpan - 1][c].boxId = null;
          }
          box.rowSpan--;
        }
        break;
    }
    
    // If box is now empty, remove it
    if (box.rowSpan === 0 || box.colSpan === 0) {
      this.removeBox(boxId);
    }
    
    return true;
  }

  removeBox(boxId) {
    const box = this.boxes[boxId];
    if (!box) return false;
    
    // Clear all cells occupied by this box
    for (let r = box.row; r < box.row + box.rowSpan; r++) {
      for (let c = box.col; c < box.col + box.colSpan; c++) {
        this.cells[r][c].boxId = null;
      }
    }
    
    delete this.boxes[boxId];
    return true;
  }

  save() {
    const state = {
      rows: this.rows,
      cols: this.cols,
      boxes: this.boxes
    };
    localStorage.setItem(LAYOUT_GRID_KEY, JSON.stringify(state));
  }

  load() {
    try {
      const raw = localStorage.getItem(LAYOUT_GRID_KEY);
      if (!raw) return false;
      
      const state = JSON.parse(raw);
      this.rows = state.rows || 3;
      this.cols = state.cols || 3;
      this.boxes = state.boxes || {};
      
      // Rebuild cells from boxes
      this.initializeCells();
      for (const boxId in this.boxes) {
        const box = this.boxes[boxId];
        for (let r = box.row; r < box.row + box.rowSpan; r++) {
          for (let c = box.col; c < box.col + box.colSpan; c++) {
            this.cells[r][c].boxId = boxId;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load layout grid state:', error);
      return false;
    }
  }

  reset() {
    this.rows = 3;
    this.cols = 3;
    this.boxes = {};
    this.initializeCells();
    localStorage.removeItem(LAYOUT_GRID_KEY);
  }
}

export { LayoutGridState };
