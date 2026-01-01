// -----------------------------
// Modal Management
// -----------------------------
const modal = document.getElementById("addModal");
let lastFocusedElement = null;

// Get all focusable elements in modal
function getFocusableElements() {
  const focusableSelector = 'select, input, button, a[href], textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';
  const modalContent = modal.querySelector('.modal-content');
  return Array.from(modalContent.querySelectorAll(focusableSelector));
}

// Handle focus trap inside modal
function trapFocus(e) {
  if (e.key !== 'Tab') return;
  
  const focusableElements = getFocusableElements();
  if (focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (e.shiftKey) {
    // Shift+Tab: moving backwards
    if (document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab: moving forwards
    if (document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
}

// Open modal
export function openModal() {
  lastFocusedElement = document.activeElement;
  modal.classList.add("show");
  
  // Set focus to first focusable element with a small delay for screen readers
  setTimeout(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, 100);
  
  // Add keyboard event listeners
  document.addEventListener('keydown', handleModalKeydown);
}

// Close modal
export function closeModal() {
  modal.classList.remove("show");
  
  // Remove keyboard event listeners
  document.removeEventListener('keydown', handleModalKeydown);
  
  // Restore focus to element that opened modal
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

// Handle keyboard events in modal
function handleModalKeydown(e) {
  // Only handle keyboard events if modal is visible
  if (!modal.classList.contains('show')) return;
  
  if (e.key === 'Escape') {
    closeModal();
  } else if (e.key === 'Tab') {
    trapFocus(e);
  }
}

// Initialize modal event listeners
export function initModalListeners() {
  document.getElementById("closeModalBtn").addEventListener("click", () => {
    closeModal();
  });

  // Close modal when clicking outside of it
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}
