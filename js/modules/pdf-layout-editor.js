// -----------------------------
// PDF Layout Editor Module
// -----------------------------
import { getPdfLayoutTemplate, savePdfLayoutTemplate, getDefaultLayoutTemplate } from './settings.js';

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

let currentLayout = null;
let canvas = null;
let activeElement = null;
let dragData = null;

export function initLayoutEditor() {
  canvas = document.getElementById('layoutCanvas');
  if (!canvas) {
    console.error('Layout canvas not found');
    return;
  }
  
  // Load current layout
  currentLayout = getPdfLayoutTemplate();
  
  // Render elements on canvas
  renderCanvas();
  
  // Setup event listeners
  setupPaletteItems();
  setupResetButton();
  setupPreviewButton();
  
  // Setup canvas drag and drop
  setupCanvasDragDrop();
}

function renderCanvas() {
  // Clear existing elements (except the label)
  const existingElements = canvas.querySelectorAll('.canvas-element');
  existingElements.forEach(el => el.remove());
  
  // Render each element
  if (currentLayout && currentLayout.elements) {
    currentLayout.elements.forEach(element => {
      createCanvasElement(element);
    });
  }
  
  // Update palette items availability
  updatePaletteAvailability();
}

function createCanvasElement(element) {
  const div = document.createElement('div');
  div.className = 'canvas-element';
  div.dataset.elementId = element.id;
  div.dataset.elementType = element.type;
  
  // Set position and size (scaled to canvas)
  const scale = getCanvasScale();
  div.style.left = `${element.x * scale}px`;
  div.style.top = `${element.y * scale}px`;
  div.style.width = `${element.width * scale}px`;
  div.style.height = `${element.height * scale}px`;
  
  // Content
  const content = document.createElement('div');
  content.className = 'element-content';
  content.textContent = ELEMENT_LABELS[element.type] || element.type;
  div.appendChild(content);
  
  // Remove button
  const removeBtn = document.createElement('div');
  removeBtn.className = 'remove-element';
  removeBtn.innerHTML = '×';
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeElement(element.id);
  });
  div.appendChild(removeBtn);
  
  // Resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';
  div.appendChild(resizeHandle);
  
  // Make draggable
  makeElementDraggable(div, element);
  
  // Make resizable
  makeElementResizable(div, element, resizeHandle);
  
  canvas.appendChild(div);
}

function makeElementDraggable(div, element) {
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  
  div.addEventListener('mousedown', (e) => {
    if (e.target.className === 'resize-handle' || e.target.className === 'remove-element') {
      return;
    }
    
    isDragging = true;
    activeElement = div;
    div.classList.add('active');
    
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(div.style.left) || 0;
    startTop = parseInt(div.style.top) || 0;
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging || activeElement !== div) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newLeft = Math.max(0, Math.min(canvas.offsetWidth - div.offsetWidth, startLeft + deltaX));
    const newTop = Math.max(0, Math.min(canvas.offsetHeight - div.offsetHeight, startTop + deltaY));
    
    div.style.left = `${newLeft}px`;
    div.style.top = `${newTop}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      if (activeElement === div) {
        div.classList.remove('active');
        updateElementPosition(element, div);
        activeElement = null;
      }
    }
  });
}

function makeElementResizable(div, element, resizeHandle) {
  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    activeElement = div;
    div.classList.add('active');
    
    startX = e.clientX;
    startY = e.clientY;
    startWidth = div.offsetWidth;
    startHeight = div.offsetHeight;
    
    e.preventDefault();
    e.stopPropagation();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isResizing || activeElement !== div) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    const newWidth = Math.max(80, Math.min(canvas.offsetWidth - parseInt(div.style.left), startWidth + deltaX));
    const newHeight = Math.max(40, Math.min(canvas.offsetHeight - parseInt(div.style.top), startHeight + deltaY));
    
    div.style.width = `${newWidth}px`;
    div.style.height = `${newHeight}px`;
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      if (activeElement === div) {
        div.classList.remove('active');
        updateElementPosition(element, div);
        activeElement = null;
      }
    }
  });
}

function updateElementPosition(element, div) {
  const scale = getCanvasScale();
  const x = Math.round(parseInt(div.style.left) / scale);
  const y = Math.round(parseInt(div.style.top) / scale);
  const width = Math.round(div.offsetWidth / scale);
  const height = Math.round(div.offsetHeight / scale);
  
  // Update element in layout
  const layoutElement = currentLayout.elements.find(e => e.id === element.id);
  if (layoutElement) {
    layoutElement.x = x;
    layoutElement.y = y;
    layoutElement.width = width;
    layoutElement.height = height;
  }
  
  // Save layout
  savePdfLayoutTemplate(currentLayout);
}

function getCanvasScale() {
  // A4 dimensions in mm: 210 x 297
  // We use a base width of 600px for the layout coordinates
  const baseWidth = 600;
  const canvasWidth = canvas.offsetWidth;
  return canvasWidth / baseWidth;
}

function setupPaletteItems() {
  const paletteItems = document.querySelectorAll('.palette-item');
  
  paletteItems.forEach(item => {
    item.addEventListener('click', () => {
      const elementType = item.dataset.element;
      addElementToCanvas(elementType);
    });
    
    // Drag from palette
    item.addEventListener('dragstart', (e) => {
      if (item.classList.contains('disabled')) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', item.dataset.element);
    });
    
    item.setAttribute('draggable', 'true');
  });
}

function setupCanvasDragDrop() {
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('text/plain');
    if (elementType) {
      // Calculate drop position relative to canvas
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      addElementToCanvas(elementType, x, y);
    }
  });
}

function addElementToCanvas(elementType, x = null, y = null) {
  // Check if element already exists
  const exists = currentLayout.elements.some(e => e.type === elementType);
  if (exists) {
    alert('Dieses Element ist bereits auf der Vorlage vorhanden.');
    return;
  }
  
  // Calculate position
  const scale = getCanvasScale();
  let posX, posY;
  
  if (x !== null && y !== null) {
    // Use drop position
    posX = Math.round(x / scale);
    posY = Math.round(y / scale);
  } else {
    // Use center position
    posX = Math.round(300 / scale);
    posY = Math.round(200 / scale);
  }
  
  // Default size based on element type
  let width = 200;
  let height = 60;
  
  if (elementType === 'logo') {
    width = 120;
    height = 60;
  } else if (elementType === 'items-table') {
    width = 560;
    height = 300;
  } else if (elementType === 'document-header' || elementType === 'footer') {
    width = 560;
    height = 50;
  }
  
  // Create new element
  const newElement = {
    id: elementType,
    type: elementType,
    x: posX,
    y: posY,
    width: width,
    height: height
  };
  
  // Add to layout
  currentLayout.elements.push(newElement);
  savePdfLayoutTemplate(currentLayout);
  
  // Render on canvas
  createCanvasElement(newElement);
  updatePaletteAvailability();
}

function removeElement(elementId) {
  // Remove from layout
  currentLayout.elements = currentLayout.elements.filter(e => e.id !== elementId);
  savePdfLayoutTemplate(currentLayout);
  
  // Remove from canvas
  const elementDiv = canvas.querySelector(`[data-element-id="${elementId}"]`);
  if (elementDiv) {
    elementDiv.remove();
  }
  
  updatePaletteAvailability();
}

function updatePaletteAvailability() {
  const paletteItems = document.querySelectorAll('.palette-item');
  
  paletteItems.forEach(item => {
    const elementType = item.dataset.element;
    const exists = currentLayout.elements.some(e => e.type === elementType);
    
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
        currentLayout = getDefaultLayoutTemplate();
        savePdfLayoutTemplate(currentLayout);
        renderCanvas();
      }
    });
  }
}

function setupPreviewButton() {
  const previewBtn = document.getElementById('previewPdfBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      alert('Die Vorschau-Funktion wird in einer zukünftigen Version implementiert. Das Layout wird automatisch bei der PDF-Generierung verwendet.');
    });
  }
}

export function getLayoutTemplate() {
  return currentLayout || getPdfLayoutTemplate();
}
