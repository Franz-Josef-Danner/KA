// -----------------------------
// Simple Grid Layout Module
// -----------------------------

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
  cells: {} // Format: "row-col": { element: elementType or null }
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
  canvas.innerHTML = '<div class="canvas-label">A4 Vorlage (210mm × 297mm)</div>';
  
  // Create grid container
  const gridContainer = document.createElement('div');
  gridContainer.className = 'simple-grid-container';
  
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
  
  gridContainer.appendChild(columnControlsRow);
  
  // Create grid rows with row controls
  for (let row = 0; row < gridState.rows; row++) {
    const gridRow = document.createElement('div');
    gridRow.className = 'grid-row';
    
    // Row controls
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
    
    gridRow.appendChild(rowControl);
    
    // Add cells
    for (let col = 0; col < gridState.cols; col++) {
      const cellId = `${row}-${col}`;
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.cellId = cellId;
      
      // Make cell a drop target
      cell.addEventListener('dragover', handleDragOver);
      cell.addEventListener('drop', handleDrop);
      cell.addEventListener('dragleave', handleDragLeave);
      
      // If cell has an element, render it
      const cellData = gridState.cells[cellId];
      if (cellData && cellData.element) {
        const elementDiv = document.createElement('div');
        elementDiv.className = 'cell-element';
        elementDiv.textContent = ELEMENT_LABELS[cellData.element] || cellData.element;
        elementDiv.draggable = true;
        elementDiv.dataset.elementType = cellData.element;
        
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
      }
      
      gridRow.appendChild(cell);
    }
    
    gridContainer.appendChild(gridRow);
  }
  
  canvas.appendChild(gridContainer);
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

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  
  const targetCell = e.currentTarget;
  const targetCellId = targetCell.dataset.cellId;
  
  // Check if cell already has an element
  if (gridState.cells[targetCellId] && gridState.cells[targetCellId].element) {
    alert('Diese Zelle ist bereits belegt. Bitte wählen Sie eine leere Zelle.');
    return;
  }
  
  // If dragging from another cell, remove from that cell
  if (draggedFromCell) {
    gridState.cells[draggedFromCell].element = null;
  }
  
  // Place element in target cell
  gridState.cells[targetCellId].element = draggedElement;
  
  // Reset drag state
  draggedElement = null;
  draggedFromCell = null;
  
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
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', elementType);
      item.style.opacity = '0.5';
    });
    
    item.addEventListener('dragend', (e) => {
      item.style.opacity = '1';
    });
  });
}
