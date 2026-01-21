// -----------------------------
// Kampagnen UI Helper Functions
// -----------------------------

/**
 * Show a success message
 */
export function showSuccessMessage(message) {
  const existingMessage = document.querySelector('.success-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'success-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}

/**
 * Show an error message
 */
export function showErrorMessage(message) {
  const existingMessage = document.querySelector('.error-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'error-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #f44336;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => messageDiv.remove(), 300);
  }, 5000);
}

/**
 * Format date to German locale
 */
export function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return isoString;
  }
}

/**
 * Clear the email form
 */
export function clearEmailForm() {
  const subjectInput = document.getElementById('email-subject');
  const bodyTextarea = document.getElementById('email-body');
  const recipientsInput = document.getElementById('email-recipients');
  
  if (subjectInput) subjectInput.value = '';
  if (bodyTextarea) bodyTextarea.value = '';
  if (recipientsInput) recipientsInput.value = '';
}
