// -----------------------------
// Layout Editor UI Module
// -----------------------------

import {
  BOX_TYPES,
  getLayout,
  saveLayout,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  addBox,
  expandBox,
  removeCellFromBox,
  splitBox,
  moveBox,
  getBoxCorners,
  isCellOccupied
} from './layout-editor.js';

// Grid cell dimensions (must match CSS)
const CELL_WIDTH = 100;
const CELL_HEIGHT = 80;
const CELL_GAP = 8;

// Box preview text for each box type
// Note: Footer is excluded - it will be automatically placed at the bottom of PDFs
const BOX_PREVIEWS = {
  'logo': 'Logo Vorschau',
  'company-name': 'Musterfirma GmbH',
  'company-address': 'Straße 123, Stadt',
  'company-contact': 'Tel. / E-Mail',
  'customer-info': 'Kundenname + Adresse',
  'document-number': 'AUF-2024-001',
  'items-table': 'Pos. | Artikel | Preis',
  'totals': 'Gesamt: 1.234,56 €'
};

let currentLayout = null;
let draggedBoxType = null;
let draggedBoxId = null;
let splitModalData = null;

// Initialize the layout editor
export function initLayoutEditor(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Layout editor container not found');
    return;
  }
  
  // Load current layout
  currentLayout = getLayout();
  
  // Render the editor
  renderEditor(container);
  
  // Auto-save on changes
  window.addEventListener('beforeunload', () => {
    saveLayout(currentLayout);
  });
}

// Render the entire editor
function renderEditor(container) {
  container.innerHTML = `
    <div class="layout-editor-container">
      <h2>Dokument-Layout-Editor</h2>
      <p class="layout-editor-description">
        Gestalten Sie das Layout für Aufträge und Rechnungen durch Ziehen der Boxen in das Grid.
        Verwenden Sie die Pfeile um Boxen zu erweitern und X-Buttons um sie zu entfernen.
        <br><strong>Hinweis:</strong> Die Fußzeile wird automatisch am Ende des Dokuments platziert und kann nicht manuell positioniert werden.
      </p>
      
      <div class="layout-editor-actions">
        <button id="previewOrderBtn" class="btn-preview">📄 Vorschau Auftrag</button>
        <button id="previewInvoiceBtn" class="btn-preview">🧾 Vorschau Rechnung</button>
      </div>
      
      <div class="grid-wrapper">
        <div id="gridContainer" class="grid-container">
          <!-- Grid will be rendered here -->
        </div>
      </div>
      
      <div class="box-library">
        <h3>Box-Bibliothek</h3>
        <div id="boxLibrary" class="box-library-grid">
          <!-- Box library will be rendered here -->
        </div>
      </div>
    </div>
    
    <!-- Split modal (hidden by default) -->
    <div id="splitModal" style="display: none;"></div>
    
    <!-- Notification area -->
    <div id="notificationArea"></div>
  `;
  
  renderGrid();
  renderBoxLibrary();
  attachPreviewButtons();
}

// Render the grid
function renderGrid() {
  const container = document.getElementById('gridContainer');
  if (!container) return;
  
  const { rows, cols, boxes } = currentLayout;
  
  // Create column controls
  const columnControlsHtml = Array.from({ length: cols }, (_, colIndex) => `
    <div class="column-control-group">
      <button class="column-control-btn" data-action="add-col-left" data-col="${colIndex}">←</button>
      <button class="column-control-btn" data-action="add-col-right" data-col="${colIndex}">→</button>
      <button class="column-control-btn delete" data-action="delete-col" data-col="${colIndex}">✕</button>
    </div>
  `).join('');
  
  // Create row controls
  const rowControlsHtml = Array.from({ length: rows }, (_, rowIndex) => `
    <div class="row-control-group">
      <button class="row-control-btn" data-action="add-row-above" data-row="${rowIndex}">↑</button>
      <button class="row-control-btn" data-action="add-row-below" data-row="${rowIndex}">↓</button>
      <button class="row-control-btn delete" data-action="delete-row" data-row="${rowIndex}">✕</button>
    </div>
  `).join('');
  
  // Create grid cells
  let cellsHtml = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const occupied = isCellOccupied(currentLayout, r, c);
      cellsHtml += `
        <div class="grid-cell ${occupied ? 'occupied' : ''}" 
             data-row="${r}" 
             data-col="${c}"
             data-cell-id="${r}-${c}">
        </div>
      `;
    }
  }
  
  container.innerHTML = `
    <div class="column-controls">${columnControlsHtml}</div>
    <div class="row-controls">${rowControlsHtml}</div>
    <div class="grid" style="grid-template-columns: repeat(${cols}, 100px); grid-template-rows: repeat(${rows}, 80px);">
      ${cellsHtml}
    </div>
  `;
  
  // Render boxes on top of grid
  renderBoxes();
  
  // Attach event listeners
  attachGridEventListeners();
}

// Render boxes on the grid
function renderBoxes() {
  const gridElement = document.querySelector('.grid');
  if (!gridElement) return;
  
  // Remove existing boxes
  document.querySelectorAll('.box').forEach(box => box.remove());
  
  currentLayout.boxes.forEach(box => {
    const boxElement = createBoxElement(box);
    gridElement.appendChild(boxElement);
  });
}

// Create a box element
function createBoxElement(box) {
  const boxType = Object.values(BOX_TYPES).find(bt => bt.id === box.type);
  if (!boxType) return null;
  
  // Calculate box position and size based on cells
  const minRow = Math.min(...box.cells.map(([r, c]) => r));
  const maxRow = Math.max(...box.cells.map(([r, c]) => r));
  const minCol = Math.min(...box.cells.map(([r, c]) => c));
  const maxCol = Math.max(...box.cells.map(([r, c]) => c));
  
  const rowSpan = maxRow - minRow + 1;
  const colSpan = maxCol - minCol + 1;
  
  // Calculate position using constants
  const left = minCol * (CELL_WIDTH + CELL_GAP);
  const top = minRow * (CELL_HEIGHT + CELL_GAP);
  const width = colSpan * CELL_WIDTH + (colSpan - 1) * CELL_GAP;
  const height = rowSpan * CELL_HEIGHT + (rowSpan - 1) * CELL_GAP;
  
  const boxElement = document.createElement('div');
  boxElement.className = 'box';
  boxElement.dataset.boxId = box.id;
  boxElement.draggable = true;
  boxElement.style.cssText = `
    left: ${left}px;
    top: ${top}px;
    width: ${width}px;
    height: ${height}px;
  `;
  
  // Get corners for X buttons
  const corners = getBoxCorners(box);
  const [topLeft, topRight, bottomLeft, bottomRight] = corners;
  
  // Only show X on actual corners
  let cornersHtml = '';
  if (corners.length > 0) {
    const hasTopLeft = box.cells.some(([r, c]) => r === topLeft[0] && c === topLeft[1]);
    const hasTopRight = box.cells.some(([r, c]) => r === topRight[0] && c === topRight[1]);
    const hasBottomLeft = box.cells.some(([r, c]) => r === bottomLeft[0] && c === bottomLeft[1]);
    const hasBottomRight = box.cells.some(([r, c]) => r === bottomRight[0] && c === bottomRight[1]);
    
    if (hasTopLeft) cornersHtml += `<button class="box-corner-x top-left" data-row="${topLeft[0]}" data-col="${topLeft[1]}">✕</button>`;
    if (hasTopRight) cornersHtml += `<button class="box-corner-x top-right" data-row="${topRight[0]}" data-col="${topRight[1]}">✕</button>`;
    if (hasBottomLeft) cornersHtml += `<button class="box-corner-x bottom-left" data-row="${bottomLeft[0]}" data-col="${bottomLeft[1]}">✕</button>`;
    if (hasBottomRight) cornersHtml += `<button class="box-corner-x bottom-right" data-row="${bottomRight[0]}" data-col="${bottomRight[1]}">✕</button>`;
  }
  
  boxElement.innerHTML = `
    ${cornersHtml}
    <div class="box-controls top">
      <button class="box-control-btn" data-direction="up">↑</button>
    </div>
    <div class="box-controls bottom">
      <button class="box-control-btn" data-direction="down">↓</button>
    </div>
    <div class="box-controls left">
      <button class="box-control-btn" data-direction="left">←</button>
    </div>
    <div class="box-controls right">
      <button class="box-control-btn" data-direction="right">→</button>
    </div>
    <div class="box-icon">${boxType.icon}</div>
    <div class="box-title">${boxType.title}</div>
    <div class="box-preview">${getBoxPreview(box.type)}</div>
  `;
  
  // Attach box event listeners
  attachBoxEventListeners(boxElement, box.id);
  
  return boxElement;
}

// Get preview text for a box type
function getBoxPreview(boxType) {
  return BOX_PREVIEWS[boxType] || '';
}

// Render box library
function renderBoxLibrary() {
  const library = document.getElementById('boxLibrary');
  if (!library) return;
  
  library.innerHTML = Object.values(BOX_TYPES).map(boxType => `
    <div class="box-library-item" draggable="true" data-box-type="${boxType.id}">
      <div class="box-library-item-icon">${boxType.icon}</div>
      <div class="box-library-item-title">${boxType.title}</div>
      <div class="box-library-item-preview">${getBoxPreview(boxType.id)}</div>
    </div>
  `).join('');
  
  // Attach drag event listeners to library items
  library.querySelectorAll('.box-library-item').forEach(item => {
    item.addEventListener('dragstart', handleLibraryDragStart);
    item.addEventListener('dragend', handleLibraryDragEnd);
  });
}

// Attach event listeners to grid controls
function attachGridEventListeners() {
  // Column controls
  document.querySelectorAll('[data-action^="add-col"], [data-action="delete-col"]').forEach(btn => {
    btn.addEventListener('click', handleColumnControl);
  });
  
  // Row controls
  document.querySelectorAll('[data-action^="add-row"], [data-action="delete-row"]').forEach(btn => {
    btn.addEventListener('click', handleRowControl);
  });
  
  // Cell drop targets
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.addEventListener('dragover', handleCellDragOver);
    cell.addEventListener('dragleave', handleCellDragLeave);
    cell.addEventListener('drop', handleCellDrop);
  });
}

// Attach event listeners to a box
function attachBoxEventListeners(boxElement, boxId) {
  // Expansion controls
  boxElement.querySelectorAll('.box-control-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleBoxExpansion(boxId, btn.dataset.direction);
    });
  });
  
  // Corner X buttons
  boxElement.querySelectorAll('.box-corner-x').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleBoxCornerRemove(boxId, parseInt(btn.dataset.row), parseInt(btn.dataset.col));
    });
  });
  
  // Drag to move
  boxElement.addEventListener('dragstart', (e) => {
    draggedBoxId = boxId;
    e.dataTransfer.effectAllowed = 'move';
  });
  
  boxElement.addEventListener('dragend', () => {
    draggedBoxId = null;
  });
}

// Handle library drag start
function handleLibraryDragStart(e) {
  draggedBoxType = e.currentTarget.dataset.boxType;
  e.dataTransfer.effectAllowed = 'copy';
}

// Handle library drag end
function handleLibraryDragEnd(e) {
  draggedBoxType = null;
}

// Handle cell drag over
function handleCellDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drop-target');
}

// Handle cell drag leave
function handleCellDragLeave(e) {
  e.currentTarget.classList.remove('drop-target');
}

// Handle cell drop
function handleCellDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drop-target');
  
  const row = parseInt(e.currentTarget.dataset.row);
  const col = parseInt(e.currentTarget.dataset.col);
  
  if (draggedBoxType) {
    // Adding new box from library
    const result = addBox(currentLayout, draggedBoxType, row, col);
    if (result.success) {
      currentLayout = result.layout;
      saveLayout(currentLayout);
      renderGrid();
      showNotification('Box wurde hinzugefügt', 'success');
    } else {
      showNotification(result.message, 'error');
    }
  } else if (draggedBoxId) {
    // Moving existing box
    const result = moveBox(currentLayout, draggedBoxId, row, col);
    if (result.success) {
      currentLayout = result.layout;
      saveLayout(currentLayout);
      renderGrid();
      showNotification('Box wurde verschoben', 'success');
    } else {
      showNotification(result.message, 'error');
    }
  }
}

// Handle column controls
function handleColumnControl(e) {
  const action = e.currentTarget.dataset.action;
  const colIndex = parseInt(e.currentTarget.dataset.col);
  
  let newLayout = null;
  
  switch (action) {
    case 'add-col-left':
      newLayout = addColumn(currentLayout, colIndex, 'left');
      break;
    case 'add-col-right':
      newLayout = addColumn(currentLayout, colIndex, 'right');
      break;
    case 'delete-col':
      newLayout = deleteColumn(currentLayout, colIndex);
      if (!newLayout) {
        showNotification('Letzte Spalte kann nicht gelöscht werden', 'error');
        return;
      }
      break;
  }
  
  if (newLayout) {
    currentLayout = newLayout;
    saveLayout(currentLayout);
    renderGrid();
  }
}

// Handle row controls
function handleRowControl(e) {
  const action = e.currentTarget.dataset.action;
  const rowIndex = parseInt(e.currentTarget.dataset.row);
  
  let newLayout = null;
  
  switch (action) {
    case 'add-row-above':
      newLayout = addRow(currentLayout, rowIndex, 'above');
      break;
    case 'add-row-below':
      newLayout = addRow(currentLayout, rowIndex, 'below');
      break;
    case 'delete-row':
      newLayout = deleteRow(currentLayout, rowIndex);
      if (!newLayout) {
        showNotification('Letzte Zeile kann nicht gelöscht werden', 'error');
        return;
      }
      break;
  }
  
  if (newLayout) {
    currentLayout = newLayout;
    saveLayout(currentLayout);
    renderGrid();
  }
}

// Handle box expansion
function handleBoxExpansion(boxId, direction) {
  const result = expandBox(currentLayout, boxId, direction);
  
  if (result.success) {
    currentLayout = result.layout;
    saveLayout(currentLayout);
    renderGrid();
    showNotification('Box wurde erweitert', 'success');
  } else {
    showNotification(result.message, 'error');
  }
}

// Handle box corner removal
function handleBoxCornerRemove(boxId, row, col) {
  const result = removeCellFromBox(currentLayout, boxId, row, col);
  
  if (result.requiresSplit) {
    // Show split direction modal
    showSplitModal(boxId, [row, col]);
  } else if (result.success) {
    currentLayout = result.layout;
    saveLayout(currentLayout);
    renderGrid();
    showNotification('Zelle wurde entfernt', 'success');
  } else {
    showNotification(result.message, 'error');
  }
}

// Show split direction modal
function showSplitModal(boxId, corner) {
  splitModalData = { boxId, corner };
  
  const modalContainer = document.getElementById('splitModal');
  modalContainer.style.display = 'flex';
  modalContainer.className = 'modal-overlay';
  modalContainer.innerHTML = `
    <div class="modal">
      <h3>Trennrichtung wählen</h3>
      <p>Die Box ist zu groß für eine einfache Entfernung. Bitte wählen Sie, wie die Box getrennt werden soll:</p>
      <div class="modal-actions">
        <button class="primary" data-direction="horizontal">Horizontal trennen</button>
        <button class="primary" data-direction="vertical">Vertikal trennen</button>
        <button data-action="cancel">Abbrechen</button>
      </div>
    </div>
  `;
  
  // Attach event listeners
  modalContainer.querySelectorAll('button[data-direction]').forEach(btn => {
    btn.addEventListener('click', () => {
      handleSplitConfirm(btn.dataset.direction);
    });
  });
  
  modalContainer.querySelector('button[data-action="cancel"]').addEventListener('click', () => {
    hideSplitModal();
  });
}

// Hide split modal
function hideSplitModal() {
  const modalContainer = document.getElementById('splitModal');
  modalContainer.style.display = 'none';
  modalContainer.innerHTML = '';
  splitModalData = null;
}

// Handle split confirmation
function handleSplitConfirm(direction) {
  if (!splitModalData) return;
  
  const { boxId, corner } = splitModalData;
  const result = splitBox(currentLayout, boxId, corner, direction);
  
  if (result.success) {
    currentLayout = result.layout;
    saveLayout(currentLayout);
    renderGrid();
    showNotification('Box wurde getrennt', 'success');
  } else {
    showNotification(result.message, 'error');
  }
  
  hideSplitModal();
}

// Show notification
function showNotification(message, type = 'info') {
  const area = document.getElementById('notificationArea');
  if (!area) return;
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `<p class="notification-message">${message}</p>`;
  
  area.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Attach preview button event listeners
function attachPreviewButtons() {
  const previewOrderBtn = document.getElementById('previewOrderBtn');
  const previewInvoiceBtn = document.getElementById('previewInvoiceBtn');
  
  if (previewOrderBtn) {
    previewOrderBtn.addEventListener('click', async () => {
      const { showPreviewPDF } = await import('./layout-editor-preview.js');
      const result = await showPreviewPDF('order', false);
      
      if (result.success) {
        showNotification(result.message || 'Vorschau wurde geöffnet', 'success');
      } else {
        showNotification(result.message || 'Fehler beim Öffnen der Vorschau', 'error');
      }
    });
  }
  
  if (previewInvoiceBtn) {
    previewInvoiceBtn.addEventListener('click', async () => {
      const { showPreviewPDF } = await import('./layout-editor-preview.js');
      const result = await showPreviewPDF('invoice', false);
      
      if (result.success) {
        showNotification(result.message || 'Vorschau wurde geöffnet', 'success');
      } else {
        showNotification(result.message || 'Fehler beim Öffnen der Vorschau', 'error');
      }
    });
  }
}
