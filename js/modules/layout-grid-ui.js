// -----------------------------
// Layout Grid UI Controller
// Handles rendering and interactions for the layout grid designer
// -----------------------------

import { LayoutGridState, BOX_TYPES } from './layout-grid.js';

class LayoutGridUI {
  constructor(gridContainerId, paletteContainerId, previewContainerId) {
    this.gridContainer = document.getElementById(gridContainerId);
    this.paletteContainer = document.getElementById(paletteContainerId);
    this.previewContainer = document.getElementById(previewContainerId);
    this.state = new LayoutGridState();
    
    this.draggedBoxType = null;
    this.draggedBoxElement = null;
    this.nextBoxId = 1;
    
    this.init();
  }

  init() {
    // Try to load saved state
    this.state.load();
    
    // Render initial grid and palette
    this.renderGrid();
    this.renderPalette();
    this.renderPreview();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Global drag events
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    document.addEventListener('drop', (e) => {
      e.preventDefault();
    });
  }

  renderGrid() {
    // Clear existing grid
    this.gridContainer.innerHTML = '';
    
    // Set grid template
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.state.cols}, 1fr)`;
    this.gridContainer.style.gridTemplateRows = `repeat(${this.state.rows}, 1fr)`;
    
    // Render column controls
    for (let c = 0; c < this.state.cols; c++) {
      const colControls = document.createElement('div');
      colControls.className = 'col-controls';
      colControls.style.left = `${40 + c * (120 + 8)}px`;
      
      const leftBtn = this.createButton('←', () => this.insertColumn(c));
      const rightBtn = this.createButton('→', () => this.insertColumn(c + 1));
      const deleteBtn = this.createButton('×', () => this.deleteColumn(c));
      deleteBtn.classList.add('delete-btn');
      
      colControls.appendChild(leftBtn);
      colControls.appendChild(deleteBtn);
      colControls.appendChild(rightBtn);
      
      this.gridContainer.appendChild(colControls);
    }
    
    // Render cells and row controls
    for (let r = 0; r < this.state.rows; r++) {
      // Row controls
      const rowControls = document.createElement('div');
      rowControls.className = 'row-controls';
      rowControls.style.top = `${40 + r * (100 + 8)}px`;
      
      const upBtn = this.createButton('↑', () => this.insertRow(r));
      const deleteBtn = this.createButton('×', () => this.deleteRow(r));
      deleteBtn.classList.add('delete-btn');
      const downBtn = this.createButton('↓', () => this.insertRow(r + 1));
      
      rowControls.appendChild(upBtn);
      rowControls.appendChild(deleteBtn);
      rowControls.appendChild(downBtn);
      
      this.gridContainer.appendChild(rowControls);
      
      // Cells
      for (let c = 0; c < this.state.cols; c++) {
        const cell = this.state.cells[r][c];
        const boxId = cell.boxId;
        
        // Skip if this cell is already rendered as part of a box
        if (boxId && this.isFirstCellOfBox(boxId, r, c)) {
          this.renderBox(boxId);
        } else if (!boxId) {
          this.renderEmptyCell(r, c);
        }
      }
    }
  }

  isFirstCellOfBox(boxId, row, col) {
    const box = this.state.boxes[boxId];
    return box && box.row === row && box.col === col;
  }

  renderEmptyCell(row, col) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.style.gridRow = row + 1;
    cell.style.gridColumn = col + 1;
    
    // Drop zone for boxes
    cell.addEventListener('dragenter', (e) => {
      e.preventDefault();
      cell.classList.add('drag-over');
    });
    
    cell.addEventListener('dragleave', (e) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
    });
    
    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      cell.classList.remove('drag-over');
      this.handleDrop(row, col);
    });
    
    this.gridContainer.appendChild(cell);
  }

  renderBox(boxId) {
    const box = this.state.boxes[boxId];
    if (!box) return;
    
    const boxType = BOX_TYPES[box.type];
    if (!boxType) return;
    
    const boxEl = document.createElement('div');
    boxEl.className = 'placed-box';
    boxEl.dataset.boxId = boxId;
    boxEl.style.gridRow = `${box.row + 1} / span ${box.rowSpan}`;
    boxEl.style.gridColumn = `${box.col + 1} / span ${box.colSpan}`;
    boxEl.draggable = true;
    
    // Box header with title
    const header = document.createElement('div');
    header.className = 'placed-box-header';
    
    const title = document.createElement('h4');
    title.className = 'placed-box-title';
    title.textContent = `${boxType.icon} ${boxType.title}`;
    header.appendChild(title);
    
    boxEl.appendChild(header);
    
    // Box content (placeholder)
    const content = document.createElement('div');
    content.className = 'placed-box-content';
    content.textContent = boxType.placeholder;
    boxEl.appendChild(content);
    
    // Expand controls
    const expandControls = document.createElement('div');
    expandControls.className = 'box-expand-controls';
    
    const upBtn = this.createButton('↑', (e) => {
      e.stopPropagation();
      this.expandBox(boxId, 'up');
    });
    const downBtn = this.createButton('↓', (e) => {
      e.stopPropagation();
      this.expandBox(boxId, 'down');
    });
    const leftBtn = this.createButton('←', (e) => {
      e.stopPropagation();
      this.expandBox(boxId, 'left');
    });
    const rightBtn = this.createButton('→', (e) => {
      e.stopPropagation();
      this.expandBox(boxId, 'right');
    });
    
    upBtn.className = 'expand-btn';
    downBtn.className = 'expand-btn';
    leftBtn.className = 'expand-btn';
    rightBtn.className = 'expand-btn';
    
    expandControls.appendChild(upBtn);
    expandControls.appendChild(leftBtn);
    expandControls.appendChild(downBtn);
    expandControls.appendChild(rightBtn);
    
    boxEl.appendChild(expandControls);
    
    // Remove button for each cell
    for (let r = box.row; r < box.row + box.rowSpan; r++) {
      for (let c = box.col; c < box.col + box.colSpan; c++) {
        const removeBtn = this.createButton('×', (e) => {
          e.stopPropagation();
          this.removeCellFromBox(boxId, r, c);
        });
        removeBtn.className = 'cell-remove-btn';
        removeBtn.style.top = `${4 + (r - box.row) * 100}px`;
        removeBtn.style.right = `${4 + (box.col + box.colSpan - c - 1) * 120}px`;
        boxEl.appendChild(removeBtn);
      }
    }
    
    // Drag to reposition
    boxEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', boxId);
      this.draggedBoxElement = boxEl;
      boxEl.classList.add('dragging');
    });
    
    boxEl.addEventListener('dragend', (e) => {
      boxEl.classList.remove('dragging');
      this.draggedBoxElement = null;
    });
    
    this.gridContainer.appendChild(boxEl);
  }

  renderPalette() {
    this.paletteContainer.innerHTML = '';
    
    for (const typeId in BOX_TYPES) {
      const boxType = BOX_TYPES[typeId];
      const boxEl = document.createElement('div');
      boxEl.className = 'draggable-box';
      boxEl.draggable = true;
      boxEl.dataset.type = typeId;
      
      // Check if this box is already in the grid
      const isInGrid = Object.values(this.state.boxes).some(box => box.type === typeId);
      if (isInGrid) {
        boxEl.classList.add('in-grid');
        boxEl.draggable = false;
      }
      
      const icon = document.createElement('div');
      icon.className = 'box-icon';
      icon.textContent = boxType.icon;
      boxEl.appendChild(icon);
      
      const title = document.createElement('h4');
      title.className = 'box-title';
      title.textContent = boxType.title;
      boxEl.appendChild(title);
      
      // Drag start
      boxEl.addEventListener('dragstart', (e) => {
        if (isInGrid) {
          e.preventDefault();
          return;
        }
        this.draggedBoxType = typeId;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', typeId);
        boxEl.classList.add('dragging');
      });
      
      boxEl.addEventListener('dragend', (e) => {
        boxEl.classList.remove('dragging');
        this.draggedBoxType = null;
      });
      
      this.paletteContainer.appendChild(boxEl);
    }
  }

  renderPreview() {
    if (Object.keys(this.state.boxes).length === 0) {
      this.previewContainer.innerHTML = '<p class="hint">Das Layout wird hier angezeigt, sobald Sie Elemente platziert haben</p>';
      return;
    }
    
    this.previewContainer.innerHTML = '';
    
    const doc = document.createElement('div');
    doc.className = 'preview-document';
    
    // Sort boxes by position (top to bottom, left to right)
    const sortedBoxes = Object.entries(this.state.boxes).sort((a, b) => {
      const boxA = a[1];
      const boxB = b[1];
      if (boxA.row !== boxB.row) return boxA.row - boxB.row;
      return boxA.col - boxB.col;
    });
    
    for (const [boxId, box] of sortedBoxes) {
      const boxType = BOX_TYPES[box.type];
      if (!boxType) continue;
      
      const previewBox = document.createElement('div');
      previewBox.className = 'preview-box';
      
      const title = document.createElement('div');
      title.className = 'preview-box-title';
      title.textContent = boxType.title;
      previewBox.appendChild(title);
      
      const content = document.createElement('div');
      content.className = 'preview-box-content';
      content.textContent = boxType.placeholder;
      previewBox.appendChild(content);
      
      doc.appendChild(previewBox);
    }
    
    this.previewContainer.appendChild(doc);
  }

  handleDrop(row, col) {
    if (!this.draggedBoxType) return;
    
    // Create new box ID
    const boxId = `box-${this.nextBoxId++}`;
    
    // Place box in grid
    const success = this.state.placeBox(boxId, this.draggedBoxType, row, col);
    
    if (success) {
      this.state.save();
      this.renderGrid();
      this.renderPalette();
      this.renderPreview();
    } else {
      alert('Diese Zelle ist bereits belegt!');
    }
  }

  expandBox(boxId, direction) {
    const result = this.state.expandBox(boxId, direction);
    
    if (result === true) {
      this.state.save();
      this.renderGrid();
      this.renderPreview();
    } else if (result && result.error) {
      alert(result.error);
    }
  }

  removeCellFromBox(boxId, row, col) {
    const result = this.state.shrinkBox(boxId, row, col);
    
    if (result === true) {
      this.state.save();
      this.renderGrid();
      this.renderPalette();
      this.renderPreview();
    } else if (result && result.needsDirection) {
      // Show modal to ask for direction
      this.showDirectionModal(boxId);
    }
  }

  showDirectionModal(boxId) {
    const modal = document.createElement('div');
    modal.className = 'direction-modal';
    
    const content = document.createElement('div');
    content.className = 'direction-modal-content';
    
    const title = document.createElement('h3');
    title.textContent = 'Richtung wählen';
    content.appendChild(title);
    
    const text = document.createElement('p');
    text.textContent = 'Die Box belegt mehrere Zellen. In welche Richtung soll die Box verkleinert werden?';
    content.appendChild(text);
    
    const buttons = document.createElement('div');
    buttons.className = 'direction-modal-buttons';
    
    const horizontalBtn = document.createElement('button');
    horizontalBtn.textContent = 'Horizontal';
    horizontalBtn.addEventListener('click', () => {
      this.state.shrinkBoxDirection(boxId, 'horizontal');
      this.state.save();
      this.renderGrid();
      this.renderPalette();
      this.renderPreview();
      document.body.removeChild(modal);
    });
    
    const verticalBtn = document.createElement('button');
    verticalBtn.textContent = 'Vertikal';
    verticalBtn.addEventListener('click', () => {
      this.state.shrinkBoxDirection(boxId, 'vertical');
      this.state.save();
      this.renderGrid();
      this.renderPalette();
      this.renderPreview();
      document.body.removeChild(modal);
    });
    
    buttons.appendChild(horizontalBtn);
    buttons.appendChild(verticalBtn);
    content.appendChild(buttons);
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  insertRow(atIndex) {
    this.state.addRow(atIndex);
    this.state.save();
    this.renderGrid();
    this.renderPreview();
  }

  deleteRow(index) {
    if (confirm('Möchten Sie diese Zeile wirklich löschen? Alle Boxen in dieser Zeile werden entfernt.')) {
      const success = this.state.deleteRow(index);
      if (success) {
        this.state.save();
        this.renderGrid();
        this.renderPalette();
        this.renderPreview();
      }
    }
  }

  insertColumn(atIndex) {
    this.state.addColumn(atIndex);
    this.state.save();
    this.renderGrid();
    this.renderPreview();
  }

  deleteColumn(index) {
    if (confirm('Möchten Sie diese Spalte wirklich löschen? Alle Boxen in dieser Spalte werden entfernt.')) {
      const success = this.state.deleteColumn(index);
      if (success) {
        this.state.save();
        this.renderGrid();
        this.renderPalette();
        this.renderPreview();
      }
    }
  }

  createButton(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'row-control-btn';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  reset() {
    if (confirm('Möchten Sie das Layout wirklich zurücksetzen? Alle Änderungen gehen verloren.')) {
      this.state.reset();
      this.nextBoxId = 1;
      this.renderGrid();
      this.renderPalette();
      this.renderPreview();
    }
  }

  save() {
    this.state.save();
    alert('Layout wurde erfolgreich gespeichert!');
  }
}

export { LayoutGridUI };
