// -----------------------------
// PDF Layout Editor Module - Grid-Based
// -----------------------------
import { getPdfLayoutTemplate, savePdfLayoutTemplate, getDefaultLayoutTemplate, getCompanySettings } from './settings.js';

const ELEMENT_LABELS = {
  'logo': 'Logo',
  'company-name': 'Firmenname',
  'company-address': 'Firmenadresse',
  'company-contact': 'Kontaktdaten',
  'customer-info': 'Kundeninfo',
  'document-header': 'Dokumentkopf',
  'items-table': 'Artikeltabelle',
  'totals': 'Summen',
  'footer': 'Fußzeile',
  'empty': 'Leer'
};

let currentLayout = null;
let canvas = null;
let gridContainer = null;

export function initLayoutEditor() {
  canvas = document.getElementById('layoutCanvas');
  if (!canvas) {
    console.error('Layout canvas not found');
    return;
  }
  
  // Load or initialize grid layout
  currentLayout = getPdfLayoutTemplate();
  
  // Convert old absolute layout to grid if needed
  if (!currentLayout.grid) {
    currentLayout = convertAbsoluteToGrid(currentLayout);
    savePdfLayoutTemplate(currentLayout);
  }
  
  // Render grid
  renderGrid();
  
  // Setup event listeners
  setupPaletteItems();
  setupResetButton();
  setupPreviewButton();
}

// Convert old absolute positioning layout to grid-based layout
function convertAbsoluteToGrid(oldLayout) {
  // Start with a simple 3x3 grid
  const grid = {
    version: 2, // Grid version
    grid: {
      rows: [
        {
          cells: [
            { element: 'logo', rowSpan: 1, colSpan: 1 },
            { element: 'empty', rowSpan: 1, colSpan: 1 },
            { element: 'customer-info', rowSpan: 1, colSpan: 1 }
          ]
        },
        {
          cells: [
            { element: 'company-name', rowSpan: 1, colSpan: 1 },
            { element: 'empty', rowSpan: 1, colSpan: 1 },
            { element: 'empty', rowSpan: 1, colSpan: 1 }
          ]
        },
        {
          cells: [
            { element: 'company-address', rowSpan: 1, colSpan: 1 },
            { element: 'empty', rowSpan: 1, colSpan: 1 },
            { element: 'empty', rowSpan: 1, colSpan: 1 }
          ]
        },
        {
          cells: [
            { element: 'company-contact', rowSpan: 1, colSpan: 1 },
            { element: 'empty', rowSpan: 1, colSpan: 1 },
            { element: 'empty', rowSpan: 1, colSpan: 1 }
          ]
        },
        {
          cells: [
            { element: 'document-header', rowSpan: 1, colSpan: 3 }
          ]
        },
        {
          cells: [
            { element: 'items-table', rowSpan: 1, colSpan: 3 }
          ]
        },
        {
          cells: [
            { element: 'empty', rowSpan: 1, colSpan: 1 },
            { element: 'empty', rowSpan: 1, colSpan: 1 },
            { element: 'totals', rowSpan: 1, colSpan: 1 }
          ]
        },
        {
          cells: [
            { element: 'footer', rowSpan: 1, colSpan: 3 }
          ]
        }
      ]
    }
  };
  
  return grid;
}

function renderGrid() {
  // Clear canvas
  canvas.innerHTML = '<div class="canvas-label">A4 Vorlage (210mm × 297mm) - Grid System</div>';
  
  // Create grid container
  gridContainer = document.createElement('div');
  gridContainer.className = 'grid-container';
  
  // Render each row
  currentLayout.grid.rows.forEach((row, rowIndex) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'grid-row';
    rowDiv.dataset.rowIndex = rowIndex;
    
    // Add row controls
    const rowControls = document.createElement('div');
    rowControls.className = 'row-controls';
    rowControls.innerHTML = `
      <button class="grid-btn add-row-above" title="Zeile darüber einfügen">↑</button>
      <button class="grid-btn add-row-below" title="Zeile darunter einfügen">↓</button>
      <button class="grid-btn delete-row" title="Zeile löschen">✕</button>
    `;
    
    rowControls.querySelector('.add-row-above').addEventListener('click', () => addRowAbove(rowIndex));
    rowControls.querySelector('.add-row-below').addEventListener('click', () => addRowBelow(rowIndex));
    rowControls.querySelector('.delete-row').addEventListener('click', () => deleteRow(rowIndex));
    
    rowDiv.appendChild(rowControls);
    
    // Render each cell
    row.cells.forEach((cell, cellIndex) => {
      const cellDiv = createGridCell(cell, rowIndex, cellIndex);
      rowDiv.appendChild(cellDiv);
    });
    
    gridContainer.appendChild(rowDiv);
  });
  
  canvas.appendChild(gridContainer);
  updatePaletteAvailability();
}

function createGridCell(cell, rowIndex, cellIndex) {
  const cellDiv = document.createElement('div');
  cellDiv.className = 'grid-cell';
  cellDiv.dataset.rowIndex = rowIndex;
  cellDiv.dataset.cellIndex = cellIndex;
  
  if (cell.colSpan > 1) {
    cellDiv.style.gridColumn = `span ${cell.colSpan}`;
  }
  if (cell.rowSpan > 1) {
    cellDiv.style.gridRow = `span ${cell.rowSpan}`;
  }
  
  // Cell controls
  const cellControls = document.createElement('div');
  cellControls.className = 'cell-controls';
  cellControls.innerHTML = `
    <button class="cell-btn add-col-left" title="Spalte links einfügen">←</button>
    <button class="cell-btn add-col-right" title="Spalte rechts einfügen">→</button>
  `;
  
  cellControls.querySelector('.add-col-left').addEventListener('click', (e) => {
    e.stopPropagation();
    addColumnLeft(rowIndex, cellIndex);
  });
  cellControls.querySelector('.add-col-right').addEventListener('click', (e) => {
    e.stopPropagation();
    addColumnRight(rowIndex, cellIndex);
  });
  
  cellDiv.appendChild(cellControls);
  
  // Cell content
  const contentDiv = document.createElement('div');
  contentDiv.className = 'cell-content';
  
  if (cell.element === 'empty') {
    contentDiv.classList.add('empty-cell');
    contentDiv.textContent = 'Leer';
    
    // Make droppable
    cellDiv.addEventListener('dragover', (e) => {
      e.preventDefault();
      cellDiv.classList.add('drag-over');
    });
    
    cellDiv.addEventListener('dragleave', () => {
      cellDiv.classList.remove('drag-over');
    });
    
    cellDiv.addEventListener('drop', (e) => {
      e.preventDefault();
      cellDiv.classList.remove('drag-over');
      const elementType = e.dataTransfer.getData('text/plain');
      if (elementType) {
        assignElementToCell(rowIndex, cellIndex, elementType);
      }
    });
  } else {
    renderElementContent(contentDiv, cell.element);
    
    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-element-btn';
    removeBtn.innerHTML = '✕';
    removeBtn.title = 'Element entfernen';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeElementFromCell(rowIndex, cellIndex);
    });
    cellDiv.appendChild(removeBtn);
  }
  
  cellDiv.appendChild(contentDiv);
  return cellDiv;
}

function renderElementContent(contentDiv, elementType) {
  const companySettings = getCompanySettings();
  
  switch (elementType) {
    case 'logo':
      if (companySettings.logo) {
        const img = document.createElement('img');
        img.src = companySettings.logo;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        contentDiv.appendChild(img);
      } else {
        contentDiv.textContent = ELEMENT_LABELS[elementType];
        contentDiv.style.color = '#999';
      }
      break;
      
    case 'company-name':
      if (companySettings.companyName) {
        contentDiv.textContent = companySettings.companyName;
        contentDiv.style.fontSize = '16px';
        contentDiv.style.fontWeight = 'bold';
      } else {
        contentDiv.textContent = ELEMENT_LABELS[elementType];
        contentDiv.style.color = '#999';
      }
      break;
      
    case 'company-address':
      if (companySettings.address) {
        contentDiv.textContent = companySettings.address;
        contentDiv.style.fontSize = '10px';
        contentDiv.style.whiteSpace = 'pre-wrap';
      } else {
        contentDiv.textContent = ELEMENT_LABELS[elementType];
        contentDiv.style.color = '#999';
      }
      break;
      
    case 'company-contact':
      const contactInfo = [];
      if (companySettings.email) contactInfo.push(`E-Mail: ${companySettings.email}`);
      if (companySettings.phone) contactInfo.push(`Tel: ${companySettings.phone}`);
      
      if (contactInfo.length > 0) {
        contentDiv.textContent = contactInfo.join('\n');
        contentDiv.style.fontSize = '9px';
        contentDiv.style.whiteSpace = 'pre-wrap';
      } else {
        contentDiv.textContent = ELEMENT_LABELS[elementType];
        contentDiv.style.color = '#999';
      }
      break;
      
    default:
      contentDiv.textContent = ELEMENT_LABELS[elementType] || elementType;
      break;
  }
}

// Grid manipulation functions
function addRowAbove(rowIndex) {
  const numCols = currentLayout.grid.rows[rowIndex].cells.length;
  const newRow = {
    cells: Array(numCols).fill(null).map(() => ({ element: 'empty', rowSpan: 1, colSpan: 1 }))
  };
  
  currentLayout.grid.rows.splice(rowIndex, 0, newRow);
  savePdfLayoutTemplate(currentLayout);
  renderGrid();
}

function addRowBelow(rowIndex) {
  const numCols = currentLayout.grid.rows[rowIndex].cells.length;
  const newRow = {
    cells: Array(numCols).fill(null).map(() => ({ element: 'empty', rowSpan: 1, colSpan: 1 }))
  };
  
  currentLayout.grid.rows.splice(rowIndex + 1, 0, newRow);
  savePdfLayoutTemplate(currentLayout);
  renderGrid();
}

function deleteRow(rowIndex) {
  if (currentLayout.grid.rows.length <= 1) {
    alert('Das Grid muss mindestens eine Zeile haben.');
    return;
  }
  
  if (confirm('Möchten Sie diese Zeile wirklich löschen?')) {
    currentLayout.grid.rows.splice(rowIndex, 1);
    savePdfLayoutTemplate(currentLayout);
    renderGrid();
  }
}

function addColumnLeft(rowIndex, cellIndex) {
  // Add a column to all rows at this position
  currentLayout.grid.rows.forEach(row => {
    // Ensure cellIndex is valid for this row
    const insertIndex = Math.min(cellIndex, row.cells.length);
    row.cells.splice(insertIndex, 0, { element: 'empty', rowSpan: 1, colSpan: 1 });
  });
  
  savePdfLayoutTemplate(currentLayout);
  renderGrid();
}

function addColumnRight(rowIndex, cellIndex) {
  // Add a column to all rows after this position
  currentLayout.grid.rows.forEach(row => {
    // Ensure cellIndex is valid for this row
    const insertIndex = Math.min(cellIndex + 1, row.cells.length);
    row.cells.splice(insertIndex, 0, { element: 'empty', rowSpan: 1, colSpan: 1 });
  });
  
  savePdfLayoutTemplate(currentLayout);
  renderGrid();
}

function assignElementToCell(rowIndex, cellIndex, elementType) {
  // Validate indices
  if (!currentLayout.grid.rows[rowIndex] || !currentLayout.grid.rows[rowIndex].cells[cellIndex]) {
    console.error('Invalid row or cell index');
    return;
  }
  
  // Check if element already exists
  const exists = currentLayout.grid.rows.some(row =>
    row.cells.some(cell => cell.element === elementType)
  );
  
  if (exists) {
    alert('Dieses Element ist bereits im Layout vorhanden.');
    return;
  }
  
  currentLayout.grid.rows[rowIndex].cells[cellIndex].element = elementType;
  savePdfLayoutTemplate(currentLayout);
  renderGrid();
}

function removeElementFromCell(rowIndex, cellIndex) {
  // Validate indices
  if (!currentLayout.grid.rows[rowIndex] || !currentLayout.grid.rows[rowIndex].cells[cellIndex]) {
    console.error('Invalid row or cell index');
    return;
  }
  
  currentLayout.grid.rows[rowIndex].cells[cellIndex].element = 'empty';
  savePdfLayoutTemplate(currentLayout);
  renderGrid();
}

function setupPaletteItems() {
  const paletteItems = document.querySelectorAll('.palette-item');
  
  paletteItems.forEach(item => {
    // Make draggable
    item.setAttribute('draggable', 'true');
    
    item.addEventListener('dragstart', (e) => {
      if (item.classList.contains('disabled')) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', item.dataset.element);
    });
  });
}

function updatePaletteAvailability() {
  const paletteItems = document.querySelectorAll('.palette-item');
  
  paletteItems.forEach(item => {
    const elementType = item.dataset.element;
    const exists = currentLayout.grid.rows.some(row =>
      row.cells.some(cell => cell.element === elementType)
    );
    
    if (exists) {
      item.classList.add('disabled');
    } else {
      item.classList.remove('disabled');
    }
  });
}

function setupResetButton() {
  const resetBtn = document.getElementById('resetLayoutBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Möchten Sie das Layout auf die Standardvorlage zurücksetzen? Alle Änderungen gehen verloren.')) {
        currentLayout = convertAbsoluteToGrid(getDefaultLayoutTemplate());
        savePdfLayoutTemplate(currentLayout);
        renderGrid();
      }
    });
  }
}

function setupPreviewButton() {
  const previewBtn = document.getElementById('previewPdfBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', async () => {
      try {
        // Dynamically import the PDF generator module
        const { generatePDF } = await import('./pdf-generator-grid.js');
        const { getSampleDocumentData } = await import('./settings.js');
        
        // Get sample data for preview
        const sampleData = getSampleDocumentData('invoice');
        
        // Generate PDF with sample data
        const pdf = await generatePDF('invoice', sampleData, true);
        
        if (pdf) {
          window.open(pdf.output('bloburl'), '_blank');
        }
      } catch (error) {
        console.error('Error generating preview:', error);
        alert('Fehler beim Erstellen der Vorschau. Bitte stellen Sie sicher, dass alle Elemente korrekt positioniert sind.');
      }
    });
  }
}

export function getLayoutTemplate() {
  return currentLayout || getPdfLayoutTemplate();
}

export function refreshCanvas() {
  if (canvas) {
    renderGrid();
  }
}
