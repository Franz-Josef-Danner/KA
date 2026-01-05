// -----------------------------
// PDF Layout Editor Module
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
  'footer': 'Fußzeile'
};

let currentLayout = null;
let canvas = null;
let activeElement = null;
let selectedElements = new Set();
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
  setupAlignmentButtons();
  
  // Setup canvas drag and drop
  setupCanvasDragDrop();
  
  // Setup canvas click for deselection
  setupCanvasClick();
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

// Render content for different element types with actual data
function renderElementContent(contentDiv, element) {
  const companySettings = getCompanySettings();
  
  switch (element.type) {
    case 'logo':
      if (companySettings.logo) {
        // Create image element for logo
        const img = document.createElement('img');
        img.src = companySettings.logo;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.pointerEvents = 'none';
        contentDiv.appendChild(img);
      } else {
        // Show placeholder if no logo
        contentDiv.textContent = ELEMENT_LABELS[element.type];
        contentDiv.style.display = 'flex';
        contentDiv.style.alignItems = 'center';
        contentDiv.style.justifyContent = 'center';
        contentDiv.style.fontSize = '12px';
        contentDiv.style.color = '#999';
      }
      break;
      
    case 'company-name':
      if (companySettings.companyName) {
        contentDiv.textContent = companySettings.companyName;
        contentDiv.style.fontSize = '14px';
        contentDiv.style.fontWeight = 'bold';
        contentDiv.style.overflow = 'hidden';
        contentDiv.style.textOverflow = 'ellipsis';
        contentDiv.style.whiteSpace = 'nowrap';
      } else {
        contentDiv.textContent = ELEMENT_LABELS[element.type];
        contentDiv.style.fontSize = '12px';
        contentDiv.style.color = '#999';
      }
      break;
      
    case 'company-address':
      if (companySettings.address) {
        contentDiv.textContent = companySettings.address;
        contentDiv.style.fontSize = '10px';
        contentDiv.style.whiteSpace = 'pre-wrap';
        contentDiv.style.overflow = 'hidden';
        contentDiv.style.lineHeight = '1.4';
      } else {
        contentDiv.textContent = ELEMENT_LABELS[element.type];
        contentDiv.style.fontSize = '12px';
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
        contentDiv.style.overflow = 'hidden';
        contentDiv.style.lineHeight = '1.4';
      } else {
        contentDiv.textContent = ELEMENT_LABELS[element.type];
        contentDiv.style.fontSize = '12px';
        contentDiv.style.color = '#999';
      }
      break;
      
    default:
      // For other elements, show label
      contentDiv.textContent = ELEMENT_LABELS[element.type] || element.type;
      break;
  }
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
  
  // Content - render differently based on element type
  const content = document.createElement('div');
  content.className = 'element-content';
  renderElementContent(content, element);
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
  let startX, startY, startPositions;
  
  div.addEventListener('mousedown', (e) => {
    if (e.target.className === 'resize-handle' || e.target.className === 'remove-element') {
      return;
    }
    
    // Handle multi-select with Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      toggleElementSelection(div);
      e.preventDefault();
      return;
    }
    
    // If clicking on unselected element, clear selection and select this one
    if (!selectedElements.has(div)) {
      clearSelection();
      selectElement(div);
    }
    
    isDragging = true;
    activeElement = div;
    
    startX = e.clientX;
    startY = e.clientY;
    
    // Store start positions for all selected elements
    startPositions = new Map();
    selectedElements.forEach(el => {
      startPositions.set(el, {
        left: parseInt(el.style.left) || 0,
        top: parseInt(el.style.top) || 0
      });
    });
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !activeElement) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // Move all selected elements
    selectedElements.forEach(el => {
      const startPos = startPositions.get(el);
      if (!startPos) return;
      
      const newLeft = Math.max(0, Math.min(canvas.offsetWidth - el.offsetWidth, startPos.left + deltaX));
      const newTop = Math.max(0, Math.min(canvas.offsetHeight - el.offsetHeight, startPos.top + deltaY));
      
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
    });
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      if (activeElement) {
        // Update positions for all selected elements
        selectedElements.forEach(el => {
          const elementId = el.dataset.elementId;
          const layoutElement = currentLayout.elements.find(e => e.id === elementId);
          if (layoutElement) {
            updateElementPosition(layoutElement, el);
          }
        });
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
  } else if (elementType === 'company-name') {
    width = 200;
    height = 20;
  } else if (elementType === 'company-address') {
    width = 180;
    height = 50;
  } else if (elementType === 'company-contact') {
    width = 180;
    height = 35;
  } else if (elementType === 'customer-info') {
    width = 180;
    height = 70;
  } else if (elementType === 'items-table') {
    width = 560;
    height = 300;
  } else if (elementType === 'totals') {
    width = 180;
    height = 70;
  } else if (elementType === 'document-header' || elementType === 'footer') {
    width = 560;
    height = 40;
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
    previewBtn.addEventListener('click', async () => {
      try {
        // Dynamically import the PDF generator module
        const { generatePDF } = await import('./pdf-generator.js');
        const { getSampleDocumentData } = await import('./settings.js');
        
        // Get sample data for preview
        const sampleData = getSampleDocumentData('invoice');
        
        // Generate PDF with sample data (useSampleCompanyData = true)
        const pdf = await generatePDF('invoice', sampleData, true);
        
        if (pdf) {
          // Open the PDF in a new window
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

// Refresh canvas to show updated company settings (logo, name, address, contact)
export function refreshCanvas() {
  if (canvas) {
    renderCanvas();
  }
}

// Selection management functions
function selectElement(div) {
  selectedElements.add(div);
  div.classList.add('selected');
}

function deselectElement(div) {
  selectedElements.delete(div);
  div.classList.remove('selected');
}

function toggleElementSelection(div) {
  if (selectedElements.has(div)) {
    deselectElement(div);
  } else {
    selectElement(div);
  }
}

function clearSelection() {
  selectedElements.forEach(el => {
    el.classList.remove('selected');
  });
  selectedElements.clear();
}

function setupCanvasClick() {
  canvas.addEventListener('mousedown', (e) => {
    // Only clear selection if clicking on canvas itself
    if (e.target === canvas || e.target.classList.contains('canvas-label')) {
      if (!e.ctrlKey && !e.metaKey) {
        clearSelection();
      }
    }
  });
}

// Alignment functions
function setupAlignmentButtons() {
  // Vertical alignment (to each other)
  document.getElementById('alignLeftBtn')?.addEventListener('click', () => alignElements('left'));
  document.getElementById('alignCenterVBtn')?.addEventListener('click', () => alignElements('centerV'));
  document.getElementById('alignRightBtn')?.addEventListener('click', () => alignElements('right'));
  
  // Horizontal alignment (to each other)
  document.getElementById('alignTopBtn')?.addEventListener('click', () => alignElements('top'));
  document.getElementById('alignCenterHBtn')?.addEventListener('click', () => alignElements('centerH'));
  document.getElementById('alignBottomBtn')?.addEventListener('click', () => alignElements('bottom'));
  
  // Document alignment
  document.getElementById('alignDocLeftBtn')?.addEventListener('click', () => alignToDocument('left'));
  document.getElementById('alignDocCenterVBtn')?.addEventListener('click', () => alignToDocument('centerV'));
  document.getElementById('alignDocRightBtn')?.addEventListener('click', () => alignToDocument('right'));
  document.getElementById('alignDocTopBtn')?.addEventListener('click', () => alignToDocument('top'));
  document.getElementById('alignDocCenterHBtn')?.addEventListener('click', () => alignToDocument('centerH'));
  document.getElementById('alignDocBottomBtn')?.addEventListener('click', () => alignToDocument('bottom'));
}

function alignElements(type) {
  if (selectedElements.size < 2) {
    alert('Bitte wählen Sie mindestens zwei Elemente aus (Strg+Klick).');
    return;
  }
  
  const elements = Array.from(selectedElements);
  
  switch(type) {
    case 'left':
      // Align all to leftmost element
      const leftmost = Math.min(...elements.map(el => parseInt(el.style.left)));
      elements.forEach(el => el.style.left = `${leftmost}px`);
      break;
      
    case 'centerV':
      // Align all to average vertical center
      const avgCenterX = elements.reduce((sum, el) => 
        sum + parseInt(el.style.left) + el.offsetWidth / 2, 0) / elements.length;
      elements.forEach(el => {
        el.style.left = `${avgCenterX - el.offsetWidth / 2}px`;
      });
      break;
      
    case 'right':
      // Align all to rightmost element
      const rightmost = Math.max(...elements.map(el => parseInt(el.style.left) + el.offsetWidth));
      elements.forEach(el => {
        el.style.left = `${rightmost - el.offsetWidth}px`;
      });
      break;
      
    case 'top':
      // Align all to topmost element
      const topmost = Math.min(...elements.map(el => parseInt(el.style.top)));
      elements.forEach(el => el.style.top = `${topmost}px`);
      break;
      
    case 'centerH':
      // Align all to average horizontal center
      const avgCenterY = elements.reduce((sum, el) => 
        sum + parseInt(el.style.top) + el.offsetHeight / 2, 0) / elements.length;
      elements.forEach(el => {
        el.style.top = `${avgCenterY - el.offsetHeight / 2}px`;
      });
      break;
      
    case 'bottom':
      // Align all to bottommost element
      const bottommost = Math.max(...elements.map(el => parseInt(el.style.top) + el.offsetHeight));
      elements.forEach(el => {
        el.style.top = `${bottommost - el.offsetHeight}px`;
      });
      break;
  }
  
  // Update all element positions in the layout
  elements.forEach(el => {
    const elementId = el.dataset.elementId;
    const layoutElement = currentLayout.elements.find(e => e.id === elementId);
    if (layoutElement) {
      updateElementPosition(layoutElement, el);
    }
  });
}

function alignToDocument(type) {
  if (selectedElements.size === 0) {
    alert('Bitte wählen Sie mindestens ein Element aus (Strg+Klick).');
    return;
  }
  
  const elements = Array.from(selectedElements);
  const canvasWidth = canvas.offsetWidth;
  const canvasHeight = canvas.offsetHeight;
  const margin = 20; // 20px margin from edges
  
  switch(type) {
    case 'left':
      elements.forEach(el => el.style.left = `${margin}px`);
      break;
      
    case 'centerV':
      elements.forEach(el => {
        el.style.left = `${(canvasWidth - el.offsetWidth) / 2}px`;
      });
      break;
      
    case 'right':
      elements.forEach(el => {
        el.style.left = `${canvasWidth - el.offsetWidth - margin}px`;
      });
      break;
      
    case 'top':
      elements.forEach(el => el.style.top = `${margin}px`);
      break;
      
    case 'centerH':
      elements.forEach(el => {
        el.style.top = `${(canvasHeight - el.offsetHeight) / 2}px`;
      });
      break;
      
    case 'bottom':
      elements.forEach(el => {
        el.style.top = `${canvasHeight - el.offsetHeight - margin}px`;
      });
      break;
  }
  
  // Update all element positions in the layout
  elements.forEach(el => {
    const elementId = el.dataset.elementId;
    const layoutElement = currentLayout.elements.find(e => e.id === elementId);
    if (layoutElement) {
      updateElementPosition(layoutElement, el);
    }
  });
}
