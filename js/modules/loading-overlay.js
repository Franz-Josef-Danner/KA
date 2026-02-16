// -----------------------------
// Loading Overlay Module
// Provides UI blocking functionality during async operations
// -----------------------------

let overlayElement = null;

/**
 * Show a loading overlay to block UI interaction
 * @param {string} message - Optional message to display (default: "Bitte warten...")
 */
export function showLoadingOverlay(message = "Bitte warten...") {
  // Create overlay if it doesn't exist
  if (!overlayElement) {
    overlayElement = document.createElement('div');
    overlayElement.className = 'loading-overlay';
    overlayElement.innerHTML = `
      <div class="loading-overlay-content">
        <div class="loading-spinner"></div>
        <div class="loading-message"></div>
      </div>
    `;
    document.body.appendChild(overlayElement);
  }
  
  // Update message
  const messageElement = overlayElement.querySelector('.loading-message');
  if (messageElement) {
    messageElement.textContent = message;
  }
  
  // Show overlay
  overlayElement.style.display = 'flex';
  
  // Prevent scrolling on body
  document.body.style.overflow = 'hidden';
}

/**
 * Hide the loading overlay
 */
export function hideLoadingOverlay() {
  if (overlayElement) {
    overlayElement.style.display = 'none';
    
    // Restore scrolling on body
    document.body.style.overflow = '';
  }
}

/**
 * Wrap an async function with loading overlay
 * @param {Function} asyncFn - The async function to wrap
 * @param {string} message - Optional loading message
 * @returns {Function} Wrapped function
 */
export function withLoadingOverlay(asyncFn, message = "Bitte warten...") {
  return async function(...args) {
    try {
      showLoadingOverlay(message);
      return await asyncFn.apply(this, args);
    } finally {
      hideLoadingOverlay();
    }
  };
}
