// -----------------------------
// Email Error Display Module
// -----------------------------
// Displays email service errors to the user

import { getEmailErrorSummary, getFailedNotifications, retryFailedNotification, clearEmailQueue } from './email-config.js';

const ERROR_BANNER_ID = 'emailErrorBanner';
const ERROR_CHECK_INTERVAL = 30000; // Check every 30 seconds

// Initialize error display
export function initEmailErrorDisplay() {
  // Check for errors on page load
  displayEmailErrors();
  
  // Check periodically for new errors
  setInterval(displayEmailErrors, ERROR_CHECK_INTERVAL);
  
  // Listen for custom events from backend (if implemented)
  window.addEventListener('emailServiceError', handleEmailServiceError);
}

// Display email errors in a banner
export function displayEmailErrors() {
  const errorSummary = getEmailErrorSummary();
  
  if (!errorSummary) {
    // Remove banner if no errors
    removeBanner();
    return;
  }
  
  // Create or update banner
  let banner = document.getElementById(ERROR_BANNER_ID);
  
  if (!banner) {
    banner = createBanner();
    document.body.insertBefore(banner, document.body.firstChild);
  }
  
  updateBanner(banner, errorSummary);
}

// Create error banner element
function createBanner() {
  const banner = document.createElement('div');
  banner.id = ERROR_BANNER_ID;
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #e74c3c;
    color: white;
    padding: 15px 20px;
    z-index: 10000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
  `;
  
  return banner;
}

// Update banner content
function updateBanner(banner, errorSummary) {
  const failedNotifications = getFailedNotifications();
  
  banner.innerHTML = `
    <div style="flex: 1; display: flex; align-items: center;">
      <span style="font-size: 18px; margin-right: 10px;">⚠️</span>
      <div>
        <strong>E-Mail-Service-Fehler:</strong> ${errorSummary.message}
        ${errorSummary.latest.error ? `<br><small>Letzter Fehler: ${errorSummary.latest.error}</small>` : ''}
      </div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button id="emailErrorDetails" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      ">Details anzeigen</button>
      <button id="emailErrorDismiss" style="
        background: transparent;
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      ">✕ Ausblenden</button>
    </div>
  `;
  
  // Add event listeners
  banner.querySelector('#emailErrorDetails').addEventListener('click', () => showErrorDetails(failedNotifications));
  banner.querySelector('#emailErrorDismiss').addEventListener('click', dismissBanner);
}

// Show detailed error modal
function showErrorDetails(failedNotifications) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 30px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  `;
  
  let notificationsHTML = failedNotifications.map((notif, index) => `
    <div style="
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 10px;
      background: #f9f9f9;
    ">
      <div style="margin-bottom: 10px;">
        <strong>Benachrichtigung ${index + 1}:</strong> ${getNotificationTypeLabel(notif.type)}
      </div>
      <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
        <strong>Zeit:</strong> ${new Date(notif.timestamp).toLocaleString('de-DE')}
      </div>
      ${notif.recipientEmail ? `
        <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
          <strong>Empfänger:</strong> ${notif.recipientEmail}
        </div>
      ` : ''}
      ${notif.error ? `
        <div style="
          background: #ffe6e6;
          border-left: 3px solid #e74c3c;
          padding: 10px;
          margin-top: 10px;
          font-size: 13px;
          color: #c0392b;
        ">
          <strong>Fehler:</strong> ${notif.error}
        </div>
      ` : ''}
      <div style="margin-top: 10px;">
        <button data-notif-id="${notif.id}" class="retry-notification" style="
          background: #3498db;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">🔄 Erneut versuchen</button>
      </div>
    </div>
  `).join('');
  
  content.innerHTML = `
    <h2 style="margin: 0 0 20px 0; color: #e74c3c; font-size: 24px;">
      ⚠️ E-Mail-Service-Fehler
    </h2>
    <p style="margin-bottom: 20px; color: #666;">
      Folgende E-Mail-Benachrichtigungen konnten nicht gesendet werden:
    </p>
    <div style="margin-bottom: 20px;">
      ${notificationsHTML}
    </div>
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="clearAllErrors" style="
        background: #e74c3c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">Alle löschen</button>
      <button id="closeErrorModal" style="
        background: #95a5a6;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      ">Schließen</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Add event listeners
  content.querySelector('#closeErrorModal').addEventListener('click', () => modal.remove());
  content.querySelector('#clearAllErrors').addEventListener('click', () => {
    if (confirm('Möchten Sie wirklich alle fehlgeschlagenen Benachrichtigungen löschen?')) {
      clearEmailQueue();
      modal.remove();
      displayEmailErrors();
    }
  });
  
  // Retry buttons
  content.querySelectorAll('.retry-notification').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const notifId = e.target.getAttribute('data-notif-id');
      if (retryFailedNotification(notifId)) {
        alert('Die Benachrichtigung wurde wieder in die Warteschlange eingereiht.');
        modal.remove();
        displayEmailErrors();
      }
    });
  });
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Get notification type label
function getNotificationTypeLabel(type) {
  const labels = {
    newCustomer: 'Neuer Kunde',
    newOrder: 'Neuer Auftrag',
    newInvoice: 'Neue Rechnung',
    paymentReceived: 'Zahlungseingang'
  };
  return labels[type] || type;
}

// Dismiss banner temporarily
function dismissBanner() {
  removeBanner();
  // Store dismissal time to avoid immediate re-display
  sessionStorage.setItem('emailErrorBannerDismissed', Date.now().toString());
  
  // Re-check after 5 minutes
  setTimeout(() => {
    sessionStorage.removeItem('emailErrorBannerDismissed');
    displayEmailErrors();
  }, 300000);
}

// Remove banner
function removeBanner() {
  const banner = document.getElementById(ERROR_BANNER_ID);
  if (banner) {
    banner.remove();
  }
}

// Handle email service error event (for backend integration)
function handleEmailServiceError(event) {
  console.error('Email service error:', event.detail);
  
  // Refresh error display
  displayEmailErrors();
  
  // Optionally show immediate notification
  if (event.detail && event.detail.critical) {
    alert(`Kritischer E-Mail-Fehler: ${event.detail.message}`);
  }
}

// Manually trigger error for testing (can be called from console)
export function simulateEmailError(type, message) {
  const event = new CustomEvent('emailServiceError', {
    detail: {
      type: type || 'connection',
      message: message || 'Verbindung zum E-Mail-Server fehlgeschlagen',
      critical: true
    }
  });
  window.dispatchEvent(event);
}
