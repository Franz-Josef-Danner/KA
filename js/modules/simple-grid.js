// -----------------------------
// Simple Grid Layout Module
// -----------------------------
import { getCompanySettings } from './settings.js';

// PDF Canvas dimensions (in pixels, matching PDF generator expectations)
// Width corresponds to A4 width (210mm), height is dynamic based on content
const CANVAS_WIDTH_PX = 600;  // Base width for layout coordinates (converts to 210mm A4 width)

const ELEMENT_LABELS = {
  'logo': 'Logo',
  'company-name': 'Firmenname',
  'company-address': 'Firmenadresse',
  'company-contact': 'Kontaktdaten',
  'customer-info': 'Kundeninfo',
  'document-header': 'Dokumentkopf',
  'items-table': 'Artikeltabelle',
  'totals': 'Summen',
  'footer': 'Fußzeile'
};

let gridState = {
  rows: 2,
  cols: 2,
  cells: {}, // Format: "row-col": { element: elementType or null }
  boxes: {} // Format: "elementType": { row, col, rowspan, colspan }
};

let canvas = null;
let draggedElement = null;
let draggedFromCell = null;

export function initLayoutEditor() {
  canvas = document.getElementById('layoutCanvas');
  if (!canvas) {
    console.error('Layout canvas not found');
    return;
  }
  
  // Initialize grid state
  initializeGrid();
  
  // Render the grid
  renderGrid();
  
  // Setup palette items for drag and drop
  setupPaletteItems();
  
  // Setup preview button
  setupPreviewButton();
}

export function refreshCanvas() {
  if (canvas) {
    renderGrid();
  }
}

function initializeGrid() {
  // Initialize empty cells for 2x2 grid
  for (let row = 0; row < gridState.rows; row++) {
    for (let col = 0; col < gridState.cols; col++) {
      const cellId = `${row}-${col}`;
      if (!gridState.cells[cellId]) {
        gridState.cells[cellId] = { element: null };
      }
    }
  }
}

function renderGrid() {
  // Clear canvas
  canvas.innerHTML = '<div class="canvas-label">Layout-Vorlage</div>';
  
  // Create grid container wrapper
  const gridWrapper = document.createElement('div');
  gridWrapper.className = 'simple-grid-wrapper';
  
  // Create column controls row
  const columnControlsRow = document.createElement('div');
  columnControlsRow.className = 'column-controls-row';
  
  // Empty cell for row controls alignment
  const emptyCell = document.createElement('div');
  emptyCell.className = 'empty-control-cell';
  columnControlsRow.appendChild(emptyCell);
  
  // Add column controls
  for (let col = 0; col < gridState.cols; col++) {
    const colControl = document.createElement('div');
    colControl.className = 'column-control';
    
    const leftArrow = document.createElement('button');
    leftArrow.className = 'grid-control-btn';
    leftArrow.innerHTML = '←';
    leftArrow.title = 'Spalte links einfügen';
    leftArrow.onclick = () => addColumnLeft(col);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'grid-control-btn delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Spalte löschen';
    deleteBtn.onclick = () => deleteColumn(col);
    
    const rightArrow = document.createElement('button');
    rightArrow.className = 'grid-control-btn';
    rightArrow.innerHTML = '→';
    rightArrow.title = 'Spalte rechts einfügen';
    rightArrow.onclick = () => addColumnRight(col);
    
    colControl.appendChild(leftArrow);
    colControl.appendChild(deleteBtn);
    colControl.appendChild(rightArrow);
    
    columnControlsRow.appendChild(colControl);
  }
  
  gridWrapper.appendChild(columnControlsRow);
  
  // Create main content area with row controls and grid
  const mainContent = document.createElement('div');
  mainContent.className = 'grid-main-content';
  
  // Create row controls column
  const rowControlsColumn = document.createElement('div');
  rowControlsColumn.className = 'row-controls-column';
  
  for (let row = 0; row < gridState.rows; row++) {
    const rowControl = document.createElement('div');
    rowControl.className = 'row-control';
    
    const upArrow = document.createElement('button');
    upArrow.className = 'grid-control-btn';
    upArrow.innerHTML = '↑';
    upArrow.title = 'Zeile oben einfügen';
    upArrow.onclick = () => addRowAbove(row);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'grid-control-btn delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Zeile löschen';
    deleteBtn.onclick = () => deleteRow(row);
    
    const downArrow = document.createElement('button');
    downArrow.className = 'grid-control-btn';
    downArrow.innerHTML = '↓';
    downArrow.title = 'Zeile unten einfügen';
    downArrow.onclick = () => addRowBelow(row);
    
    rowControl.appendChild(upArrow);
    rowControl.appendChild(deleteBtn);
    rowControl.appendChild(downArrow);
    
    rowControlsColumn.appendChild(rowControl);
  }
  
  mainContent.appendChild(rowControlsColumn);
  
  // Create the actual grid using CSS Grid
  const gridContainer = document.createElement('div');
  gridContainer.className = 'simple-grid-container';
  gridContainer.style.display = 'grid';
  gridContainer.style.gridTemplateColumns = `repeat(${gridState.cols}, 1fr)`;
  gridContainer.style.gridTemplateRows = `repeat(${gridState.rows}, 1fr)`;
  gridContainer.style.gap = '4px';
  gridContainer.style.flex = '1';
  
  // Track which cells are starting cells of boxes
  const processedBoxes = new Set();
  
  // Create all cells
  for (let row = 0; row < gridState.rows; row++) {
    for (let col = 0; col < gridState.cols; col++) {
      const cellId = `${row}-${col}`;
      const cellData = gridState.cells[cellId];
      
      // Check if this cell has an element and it's the starting cell
      if (cellData && cellData.element) {
        const boxInfo = gridState.boxes[cellData.element];
        
        // Only render the box from its starting cell
        if (boxInfo && boxInfo.row === row && boxInfo.col === col && !processedBoxes.has(cellData.element)) {
          processedBoxes.add(cellData.element);
          
          const cell = document.createElement('div');
          cell.className = 'grid-cell';
          cell.dataset.cellId = cellId;
          cell.style.gridColumn = `${col + 1} / span ${boxInfo.colspan}`;
          cell.style.gridRow = `${row + 1} / span ${boxInfo.rowspan}`;
          
          // Make cell a drop target
          cell.addEventListener('dragover', handleDragOver);
          cell.addEventListener('drop', handleDrop);
          cell.addEventListener('dragleave', handleDragLeave);
          
          // Create element with expansion arrows
          const elementDiv = document.createElement('div');
          elementDiv.className = 'cell-element';
          elementDiv.textContent = ELEMENT_LABELS[cellData.element] || cellData.element;
          elementDiv.draggable = true;
          elementDiv.dataset.elementType = cellData.element;
          
          // Add expansion arrows
          const arrowsDiv = document.createElement('div');
          arrowsDiv.className = 'box-expansion-arrows';
          
          const upBtn = document.createElement('button');
          upBtn.className = 'box-expand-btn expand-up';
          upBtn.innerHTML = '↑';
          upBtn.title = 'Nach oben erweitern';
          upBtn.onclick = (e) => {
            e.stopPropagation();
            expandBox(cellData.element, 'up');
          };
          
          const downBtn = document.createElement('button');
          downBtn.className = 'box-expand-btn expand-down';
          downBtn.innerHTML = '↓';
          downBtn.title = 'Nach unten erweitern';
          downBtn.onclick = (e) => {
            e.stopPropagation();
            expandBox(cellData.element, 'down');
          };
          
          const leftBtn = document.createElement('button');
          leftBtn.className = 'box-expand-btn expand-left';
          leftBtn.innerHTML = '←';
          leftBtn.title = 'Nach links erweitern';
          leftBtn.onclick = (e) => {
            e.stopPropagation();
            expandBox(cellData.element, 'left');
          };
          
          const rightBtn = document.createElement('button');
          rightBtn.className = 'box-expand-btn expand-right';
          rightBtn.innerHTML = '→';
          rightBtn.title = 'Nach rechts erweitern';
          rightBtn.onclick = (e) => {
            e.stopPropagation();
            expandBox(cellData.element, 'right');
          };
          
          arrowsDiv.appendChild(upBtn);
          arrowsDiv.appendChild(downBtn);
          arrowsDiv.appendChild(leftBtn);
          arrowsDiv.appendChild(rightBtn);
          
          elementDiv.appendChild(arrowsDiv);
          
          // Add delete button in upper left corner
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'box-delete-btn';
          deleteBtn.innerHTML = '×';
          deleteBtn.title = 'Element entfernen';
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Möchten Sie das Element "${ELEMENT_LABELS[cellData.element]}" wirklich aus dem Layout entfernen?`)) {
              removeBox(cellData.element);
            }
          };
          elementDiv.appendChild(deleteBtn);
          
          // Make element draggable from cell
          elementDiv.addEventListener('dragstart', (e) => {
            draggedElement = cellData.element;
            draggedFromCell = cellId;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', cellData.element);
            elementDiv.style.opacity = '0.5';
          });
          
          elementDiv.addEventListener('dragend', (e) => {
            elementDiv.style.opacity = '1';
          });
          
          cell.appendChild(elementDiv);
          gridContainer.appendChild(cell);
        }
      } else {
        // Empty cell - render it normally
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.cellId = cellId;
        cell.style.gridColumn = `${col + 1}`;
        cell.style.gridRow = `${row + 1}`;
        
        // Make cell a drop target
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('drop', handleDrop);
        cell.addEventListener('dragleave', handleDragLeave);
        
        gridContainer.appendChild(cell);
      }
    }
  }
  
  mainContent.appendChild(gridContainer);
  gridWrapper.appendChild(mainContent);
  canvas.appendChild(gridWrapper);
}

function addColumnLeft(col) {
  // Shift all columns from col onwards to the right
  const newCells = {};
  
  for (let row = 0; row < gridState.rows; row++) {
    for (let c = 0; c < gridState.cols; c++) {
      const oldCellId = `${row}-${c}`;
      const newCol = c >= col ? c + 1 : c;
      const newCellId = `${row}-${newCol}`;
      newCells[newCellId] = gridState.cells[oldCellId] || { element: null };
    }
    // Add empty cell in the new column
    const newCellId = `${row}-${col}`;
    newCells[newCellId] = { element: null };
  }
  
  // Update box positions
  for (const elementType in gridState.boxes) {
    const box = gridState.boxes[elementType];
    if (box.col >= col) {
      box.col++;
    }
  }
  
  gridState.cols++;
  gridState.cells = newCells;
  renderGrid();
}

function addColumnRight(col) {
  // Shift all columns after col to the right
  const newCells = {};
  
  for (let row = 0; row < gridState.rows; row++) {
    for (let c = 0; c < gridState.cols; c++) {
      const oldCellId = `${row}-${c}`;
      const newCol = c > col ? c + 1 : c;
      const newCellId = `${row}-${newCol}`;
      newCells[newCellId] = gridState.cells[oldCellId] || { element: null };
    }
    // Add empty cell in the new column
    const newCellId = `${row}-${col + 1}`;
    newCells[newCellId] = { element: null };
  }
  
  // Update box positions
  for (const elementType in gridState.boxes) {
    const box = gridState.boxes[elementType];
    if (box.col > col) {
      box.col++;
    }
  }
  
  gridState.cols++;
  gridState.cells = newCells;
  renderGrid();
}

function deleteColumn(col) {
  if (gridState.cols <= 1) {
    alert('Es muss mindestens eine Spalte vorhanden sein.');
    return;
  }
  
  // Shift all columns after col to the left
  const newCells = {};
  
  for (let row = 0; row < gridState.rows; row++) {
    for (let c = 0; c < gridState.cols; c++) {
      if (c === col) continue; // Skip the deleted column
      
      const oldCellId = `${row}-${c}`;
      const newCol = c > col ? c - 1 : c;
      const newCellId = `${row}-${newCol}`;
      newCells[newCellId] = gridState.cells[oldCellId] || { element: null };
    }
  }
  
  gridState.cols--;
  gridState.cells = newCells;
  renderGrid();
}

function addRowAbove(row) {
  // Shift all rows from row onwards down
  const newCells = {};
  
  for (let r = 0; r < gridState.rows; r++) {
    for (let col = 0; col < gridState.cols; col++) {
      const oldCellId = `${r}-${col}`;
      const newRow = r >= row ? r + 1 : r;
      const newCellId = `${newRow}-${col}`;
      newCells[newCellId] = gridState.cells[oldCellId] || { element: null };
    }
  }
  
  // Add empty cells in the new row
  for (let col = 0; col < gridState.cols; col++) {
    const newCellId = `${row}-${col}`;
    newCells[newCellId] = { element: null };
  }
  
  // Update box positions
  for (const elementType in gridState.boxes) {
    const box = gridState.boxes[elementType];
    if (box.row >= row) {
      box.row++;
    }
  }
  
  gridState.rows++;
  gridState.cells = newCells;
  renderGrid();
}

function addRowBelow(row) {
  // Shift all rows after row down
  const newCells = {};
  
  for (let r = 0; r < gridState.rows; r++) {
    for (let col = 0; col < gridState.cols; col++) {
      const oldCellId = `${r}-${col}`;
      const newRow = r > row ? r + 1 : r;
      const newCellId = `${newRow}-${col}`;
      newCells[newCellId] = gridState.cells[oldCellId] || { element: null };
    }
  }
  
  // Add empty cells in the new row
  for (let col = 0; col < gridState.cols; col++) {
    const newCellId = `${row + 1}-${col}`;
    newCells[newCellId] = { element: null };
  }
  
  // Update box positions
  for (const elementType in gridState.boxes) {
    const box = gridState.boxes[elementType];
    if (box.row > row) {
      box.row++;
    }
  }
  
  gridState.rows++;
  gridState.cells = newCells;
  renderGrid();
}

function deleteRow(row) {
  if (gridState.rows <= 1) {
    alert('Es muss mindestens eine Zeile vorhanden sein.');
    return;
  }
  
  // Shift all rows after row up
  const newCells = {};
  
  for (let r = 0; r < gridState.rows; r++) {
    if (r === row) continue; // Skip the deleted row
    
    for (let col = 0; col < gridState.cols; col++) {
      const oldCellId = `${r}-${col}`;
      const newRow = r > row ? r - 1 : r;
      const newCellId = `${newRow}-${col}`;
      newCells[newCellId] = gridState.cells[oldCellId] || { element: null };
    }
  }
  
  gridState.rows--;
  gridState.cells = newCells;
  renderGrid();
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function resetDragState() {
  draggedElement = null;
  draggedFromCell = null;
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  
  const targetCell = e.currentTarget;
  const targetCellId = targetCell.dataset.cellId;
  
  // Get the dragged element type from dataTransfer
  const elementType = e.dataTransfer.getData('text/plain');
  
  if (!elementType) {
    console.error('No element type found in dataTransfer');
    resetDragState();
    return;
  }
  
  // Check if cell already has an element
  if (gridState.cells[targetCellId] && gridState.cells[targetCellId].element) {
    alert('Diese Zelle ist bereits belegt. Bitte wählen Sie eine leere Zelle.');
    resetDragState();
    return;
  }
  
  // If dragging from another cell, remove from that cell and its box info
  if (draggedFromCell) {
    const oldElement = gridState.cells[draggedFromCell].element;
    
    // Clear all cells occupied by the old box
    if (oldElement && gridState.boxes[oldElement]) {
      const oldBox = gridState.boxes[oldElement];
      const [oldRow, oldCol] = draggedFromCell.split('-').map(Number);
      
      for (let r = 0; r < oldBox.rowspan; r++) {
        for (let c = 0; c < oldBox.colspan; c++) {
          const cellId = `${oldRow + r}-${oldCol + c}`;
          if (gridState.cells[cellId]) {
            gridState.cells[cellId].element = null;
          }
        }
      }
      
      // Remove box info
      delete gridState.boxes[oldElement];
    }
  }
  
  // Place element in target cell
  gridState.cells[targetCellId].element = elementType;
  
  // Initialize box info with span 1x1
  const [row, col] = targetCellId.split('-').map(Number);
  gridState.boxes[elementType] = {
    row: row,
    col: col,
    rowspan: 1,
    colspan: 1
  };
  
  // Reset drag state
  resetDragState();
  
  // Re-render grid
  renderGrid();
}

function expandBox(elementType, direction) {
  const box = gridState.boxes[elementType];
  if (!box) {
    console.error('Box not found:', elementType);
    return;
  }
  
  const { row, col, rowspan, colspan } = box;
  
  switch (direction) {
    case 'up':
      // Check if we can expand upward
      if (row === 0) {
        // Need to add a row at the top
        // First update box info to reflect the expansion
        box.row = 0;
        box.rowspan++;
        
        // Add the row (which will shift the box down)
        addRowAbove(0);
        
        // Mark new cells as occupied
        for (let c = 0; c < box.colspan; c++) {
          const cellId = `0-${box.col + c}`;
          if (!gridState.cells[cellId]) {
            gridState.cells[cellId] = { element: null };
          }
          gridState.cells[cellId].element = elementType;
        }
        return;
      }
      
      // Check if cells above are empty
      const newRow = row - 1;
      for (let c = 0; c < colspan; c++) {
        const checkCellId = `${newRow}-${col + c}`;
        if (gridState.cells[checkCellId] && gridState.cells[checkCellId].element) {
          alert('Die Zellen oberhalb sind bereits belegt. Erweiterung nicht möglich.');
          return;
        }
      }
      
      // Expand upward
      box.row = newRow;
      box.rowspan++;
      
      // Mark new cells as occupied
      for (let c = 0; c < colspan; c++) {
        const cellId = `${newRow}-${col + c}`;
        gridState.cells[cellId].element = elementType;
      }
      break;
      
    case 'down':
      // Check if we can expand downward
      const nextRow = row + rowspan;
      if (nextRow >= gridState.rows) {
        // Need to add a row at the bottom
        // First calculate the new row index before modifying
        const newRowIdx = row + rowspan;
        box.rowspan++;
        
        // Add the row
        addRowBelow(gridState.rows - 1);
        
        // Mark new cells as occupied
        for (let c = 0; c < box.colspan; c++) {
          const cellId = `${newRowIdx}-${box.col + c}`;
          if (!gridState.cells[cellId]) {
            gridState.cells[cellId] = { element: null };
          }
          gridState.cells[cellId].element = elementType;
        }
        return;
      }
      
      // Check if cells below are empty
      for (let c = 0; c < colspan; c++) {
        const checkCellId = `${nextRow}-${col + c}`;
        if (gridState.cells[checkCellId] && gridState.cells[checkCellId].element) {
          alert('Die Zellen unterhalb sind bereits belegt. Erweiterung nicht möglich.');
          return;
        }
      }
      
      // Expand downward
      box.rowspan++;
      
      // Mark new cells as occupied
      for (let c = 0; c < colspan; c++) {
        const cellId = `${nextRow}-${col + c}`;
        gridState.cells[cellId].element = elementType;
      }
      break;
      
    case 'left':
      // Check if we can expand leftward
      if (col === 0) {
        // Need to add a column on the left
        // First update box info to reflect the expansion
        box.col = 0;
        box.colspan++;
        
        // Add the column (which will shift the box right)
        addColumnLeft(0);
        
        // Mark new cells as occupied
        for (let r = 0; r < box.rowspan; r++) {
          const cellId = `${box.row + r}-0`;
          if (!gridState.cells[cellId]) {
            gridState.cells[cellId] = { element: null };
          }
          gridState.cells[cellId].element = elementType;
        }
        return;
      }
      
      // Check if cells to the left are empty
      const newCol = col - 1;
      for (let r = 0; r < rowspan; r++) {
        const checkCellId = `${row + r}-${newCol}`;
        if (gridState.cells[checkCellId] && gridState.cells[checkCellId].element) {
          alert('Die Zellen links sind bereits belegt. Erweiterung nicht möglich.');
          return;
        }
      }
      
      // Expand leftward
      box.col = newCol;
      box.colspan++;
      
      // Mark new cells as occupied
      for (let r = 0; r < rowspan; r++) {
        const cellId = `${row + r}-${newCol}`;
        gridState.cells[cellId].element = elementType;
      }
      break;
      
    case 'right':
      // Check if we can expand rightward
      const nextCol = col + colspan;
      if (nextCol >= gridState.cols) {
        // Need to add a column on the right
        // First calculate the new column index before modifying
        const newColIdx = col + colspan;
        box.colspan++;
        
        // Add the column
        addColumnRight(gridState.cols - 1);
        
        // Mark new cells as occupied
        for (let r = 0; r < box.rowspan; r++) {
          const cellId = `${box.row + r}-${newColIdx}`;
          if (!gridState.cells[cellId]) {
            gridState.cells[cellId] = { element: null };
          }
          gridState.cells[cellId].element = elementType;
        }
        return;
      }
      
      // Check if cells to the right are empty
      for (let r = 0; r < rowspan; r++) {
        const checkCellId = `${row + r}-${nextCol}`;
        if (gridState.cells[checkCellId] && gridState.cells[checkCellId].element) {
          alert('Die Zellen rechts sind bereits belegt. Erweiterung nicht möglich.');
          return;
        }
      }
      
      // Expand rightward
      box.colspan++;
      
      // Mark new cells as occupied
      for (let r = 0; r < rowspan; r++) {
        const cellId = `${row + r}-${nextCol}`;
        gridState.cells[cellId].element = elementType;
      }
      break;
  }
  
  // Re-render grid
  renderGrid();
}

function removeBox(elementType) {
  const box = gridState.boxes[elementType];
  if (!box) {
    console.error('Box not found:', elementType);
    return;
  }
  
  const { row, col, rowspan, colspan } = box;
  
  // Clear all cells occupied by this box
  for (let r = 0; r < rowspan; r++) {
    for (let c = 0; c < colspan; c++) {
      const cellId = `${row + r}-${col + c}`;
      if (gridState.cells[cellId]) {
        gridState.cells[cellId].element = null;
      }
    }
  }
  
  // Remove box from boxes object
  delete gridState.boxes[elementType];
  
  // Re-render grid
  renderGrid();
}

function setupPaletteItems() {
  const paletteItems = document.querySelectorAll('.palette-item');
  
  paletteItems.forEach(item => {
    item.draggable = true;
    
    item.addEventListener('dragstart', (e) => {
      const elementType = item.dataset.element;
      draggedElement = elementType;
      draggedFromCell = null; // Not from a cell, from palette
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', elementType);
      item.style.opacity = '0.5';
    });
    
    item.addEventListener('dragend', (e) => {
      item.style.opacity = '1';
    });
  });
}

function setupPreviewButton() {
  const previewBtn = document.getElementById('previewPdfBtn');
  if (!previewBtn) {
    console.warn('Preview button not found');
    return;
  }
  
  previewBtn.addEventListener('click', async () => {
    try {
      // Validate company settings
      const companySettings = getCompanySettings();
      const errors = validateCompanyDataForPreview(companySettings);
      
      if (errors.length > 0) {
        alert('Bitte füllen Sie alle erforderlichen Firmendaten aus, bevor Sie die PDF-Vorschau erstellen:\n\n' + errors.join('\n'));
        return;
      }
      
      // Convert grid state to layout template format
      const layoutTemplate = convertGridToLayoutTemplate();
      
      // Dynamically import the PDF generator module
      const { generatePDF } = await import('./pdf-generator.js');
      const { getSampleDocumentData } = await import('./settings.js');
      
      // Get sample data for preview (use 'invoice' as default)
      const sampleData = getSampleDocumentData('invoice');
      
      // Generate PDF with actual company data but sample customer/document data
      // Pass the converted layout template as the 4th parameter
      const pdf = await generatePDF('invoice', sampleData, false, layoutTemplate);
      
      if (pdf) {
        // Open the PDF in a new window
        window.open(pdf.output('bloburl'), '_blank');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Fehler beim Erstellen der Vorschau. Bitte stellen Sie sicher, dass alle Firmendaten korrekt ausgefüllt sind.');
    }
  });
}

function convertGridToLayoutTemplate() {
  // Convert grid state to layout template format expected by PDF generator
  const elements = [];
  
  // Use CANVAS_WIDTH_PX as the reference width for A4 (210mm in PDF)
  // Height is dynamic and grows based on grid content
  const cellWidth = CANVAS_WIDTH_PX / gridState.cols;
  
  // Use square cells for consistent proportions
  // This allows the PDF to grow vertically as needed
  const cellHeight = cellWidth;
  
  // Process each box in the grid
  for (const elementType in gridState.boxes) {
    const box = gridState.boxes[elementType];
    
    // Convert grid coordinates to pixel coordinates
    const x = box.col * cellWidth;
    const y = box.row * cellHeight;
    const width = box.colspan * cellWidth;
    const height = box.rowspan * cellHeight;
    
    elements.push({
      id: elementType,
      type: elementType,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
      textAlign: 'left'
    });
  }
  
  return { elements };
}

function validateCompanyDataForPreview(settings) {
  const errors = [];
  
  // Check required company fields
  if (!settings.companyName || settings.companyName.trim() === '') {
    errors.push('• Firmenname ist erforderlich');
  }
  
  if (!settings.address || settings.address.trim() === '') {
    errors.push('• Adresse ist erforderlich');
  }
  
  if (!settings.email || settings.email.trim() === '') {
    errors.push('• E-Mail-Adresse ist erforderlich');
  }
  
  if (!settings.phone || settings.phone.trim() === '') {
    errors.push('• Telefonnummer ist erforderlich');
  }
  
  // Check footer fields
  if (!settings.footerTextOrder || settings.footerTextOrder.trim() === '') {
    errors.push('• Fußzeile für Aufträge ist erforderlich');
  }
  
  if (!settings.footerTextInvoice || settings.footerTextInvoice.trim() === '') {
    errors.push('• Fußzeile für Rechnungen ist erforderlich');
  }
  
  return errors;
}
