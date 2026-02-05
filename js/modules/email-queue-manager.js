// -----------------------------
// Email Queue Manager Module
// -----------------------------
// Manages pending email notifications with approve/reject functionality

import { getPendingNotifications, markNotificationAsSent } from './email-config.js';
import { getNotificationTemplate, getNotificationSubject } from './email-notifications.js';

// Get all pending notifications
function getEmailQueue() {
  try {
    const raw = localStorage.getItem('ka_email_queue');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load email queue:', error);
    return [];
  }
}

// Save email queue
function saveEmailQueue(queue) {
  try {
    localStorage.setItem('ka_email_queue', JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Failed to save email queue:', error);
    return false;
  }
}

// Get notification type label
export function getNotificationTypeLabel(type) {
  const labels = {
    newCustomer: 'Neuer Kunde',
    newOrder: 'Neuer Auftrag',
    newInvoice: 'Neue Rechnung',
    paymentReceived: 'Zahlungseingang'
  };
  return labels[type] || type;
}

// Approve a notification (mark as approved)
export function approveNotification(notificationId) {
  const queue = getEmailQueue();
  const notification = queue.find(item => item.id === notificationId);
  
  if (notification && notification.status === 'pending') {
    notification.status = 'approved';
    notification.approvedAt = new Date().toISOString();
    saveEmailQueue(queue);
    return true;
  }
  
  return false;
}

// Reject a notification (remove from queue)
export function rejectNotification(notificationId) {
  const queue = getEmailQueue();
  const filteredQueue = queue.filter(item => item.id !== notificationId);
  saveEmailQueue(filteredQueue);
  return true;
}

// Get approved notifications
export function getApprovedNotifications() {
  return getEmailQueue().filter(item => item.status === 'approved');
}

// Send approved notifications via backend
export async function sendApprovedNotifications() {
  const approved = getApprovedNotifications();
  
  if (approved.length === 0) {
    return {
      success: false,
      message: 'Keine genehmigten E-Mails zum Senden vorhanden.'
    };
  }
  
  try {
    // Call backend API to actually send emails
    const response = await fetch('api/send-approved-emails.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approvedEmails: approved
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // Backend successfully sent emails, mark them as sent
      approved.forEach(notification => {
        markNotificationAsSent(notification.id);
      });
      
      return {
        success: true,
        count: approved.length,
        message: `${approved.length} E-Mail${approved.length > 1 ? 's' : ''} wurde${approved.length > 1 ? 'n' : ''} erfolgreich versendet!`,
        details: result.output
      };
    } else {
      // Backend reported an error
      return {
        success: false,
        message: result.error || result.message || 'Fehler beim Versenden der E-Mails.',
        details: result.output,
        instructions: result.instructions
      };
    }
  } catch (error) {
    console.error('Error sending approved emails:', error);
    return {
      success: false,
      message: 'Verbindungsfehler: Konnte Backend nicht erreichen.',
      error: error.message,
      instructions: [
        'Überprüfen Sie, ob der Webserver läuft',
        'Überprüfen Sie, ob backend/config.json existiert',
        'Versuchen Sie es später erneut'
      ]
    };
  }
}

// Get email preview text
export function getEmailPreview(notification) {
  const template = getNotificationTemplate(notification.type, notification.data);
  const lines = template.split('\n').filter(line => line.trim());
  
  // Return first 3 lines as preview
  return lines.slice(0, 3).join('\n');
}

// Get email subject
export function getEmailSubjectText(notification) {
  return getNotificationSubject(notification.type, notification.data);
}

// Initialize email queue manager UI
export function initEmailQueueManager(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('Email queue manager container not found:', containerId);
    return;
  }
  
  renderEmailQueue(container);
  
  // Auto-refresh every 10 seconds
  setInterval(() => {
    renderEmailQueue(container);
  }, 10000);
}

// Render email queue UI
function renderEmailQueue(container) {
  const pending = getPendingNotifications();
  const approved = getApprovedNotifications();
  
  if (pending.length === 0 && approved.length === 0) {
    container.innerHTML = `
      <div class="email-queue-empty">
        <div style="text-align: center; padding: 30px; color: #7f8c8d;">
          <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
          <div style="font-size: 16px;">Keine ausstehenden E-Mails</div>
        </div>
      </div>
    `;
    return;
  }
  
  const allNotifications = [...pending, ...approved];
  
  let html = `
    <div class="email-queue-header" style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 15px;
      background: #ecf0f1;
      border-radius: 8px;
    ">
      <div>
        <h3 style="margin: 0 0 5px 0;">E-Mail-Warteschlange</h3>
        <p style="margin: 0; font-size: 14px; color: #7f8c8d;">
          ${pending.length} wartend • ${approved.length} genehmigt
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        ${approved.length > 0 ? `
          <button id="sendApprovedBtn" style="
            background: #27ae60;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">📤 ${approved.length} E-Mail${approved.length > 1 ? 's' : ''} senden</button>
        ` : ''}
        <button id="refreshQueueBtn" style="
          background: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">🔄 Aktualisieren</button>
      </div>
    </div>
    <div class="email-queue-list">
  `;
  
  allNotifications.forEach((notification, index) => {
    const isApproved = notification.status === 'approved';
    const preview = getEmailPreview(notification);
    const subject = getEmailSubjectText(notification);
    
    html += `
      <div class="email-queue-item" data-notification-id="${notification.id}" style="
        border: 2px solid ${isApproved ? '#27ae60' : '#bdc3c7'};
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        background: ${isApproved ? '#d5f4e6' : 'white'};
        transition: all 0.3s ease;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="
                background: ${isApproved ? '#27ae60' : '#3498db'};
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
              ">${getNotificationTypeLabel(notification.type)}</span>
              ${isApproved ? `
                <span style="
                  background: #27ae60;
                  color: white;
                  padding: 4px 12px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: 500;
                ">✓ Genehmigt</span>
              ` : ''}
            </div>
            <div style="font-weight: 600; font-size: 15px; margin-bottom: 5px; color: #2c3e50;">
              ${subject}
            </div>
            <div style="font-size: 13px; color: #7f8c8d; margin-bottom: 8px;">
              ${new Date(notification.timestamp).toLocaleString('de-DE')}
              ${notification.recipientEmail ? ` • An: ${notification.recipientEmail}` : ''}
            </div>
            <div style="
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              font-size: 12px;
              color: #555;
              white-space: pre-line;
              max-height: 60px;
              overflow: hidden;
              position: relative;
            ">
              ${preview}
              <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 20px;
                background: linear-gradient(transparent, #f8f9fa);
              "></div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; margin-left: 15px;">
            ${!isApproved ? `
              <button class="approve-btn" data-id="${notification.id}" style="
                background: #27ae60;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                white-space: nowrap;
                font-weight: 500;
              ">✓ Genehmigen</button>
            ` : ''}
            <button class="reject-btn" data-id="${notification.id}" style="
              background: #e74c3c;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
              white-space: nowrap;
            ">✕ ${isApproved ? 'Zurückziehen' : 'Ablehnen'}</button>
            <button class="preview-btn" data-id="${notification.id}" style="
              background: #95a5a6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
              white-space: nowrap;
            ">👁 Vorschau</button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  container.innerHTML = html;
  
  // Add event listeners
  attachEventListeners(container);
}

// Attach event listeners to buttons
function attachEventListeners(container) {
  // Approve buttons
  container.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const notifId = e.target.getAttribute('data-id');
      if (approveNotification(notifId)) {
        renderEmailQueue(container);
      }
    });
  });
  
  // Reject buttons
  container.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const notifId = e.target.getAttribute('data-id');
      if (confirm('Möchten Sie diese E-Mail wirklich ablehnen?')) {
        if (rejectNotification(notifId)) {
          renderEmailQueue(container);
        }
      }
    });
  });
  
  // Preview buttons
  container.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const notifId = e.target.getAttribute('data-id');
      const queue = getEmailQueue();
      const notification = queue.find(item => item.id === notifId);
      if (notification) {
        showEmailPreview(notification);
      }
    });
  });
  
  // Send approved button
  const sendBtn = container.querySelector('#sendApprovedBtn');
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const approved = getApprovedNotifications();
      if (confirm(`Möchten Sie ${approved.length} genehmigte E-Mail${approved.length > 1 ? 's' : ''} wirklich senden?`)) {
        // Disable button and show loading state
        sendBtn.disabled = true;
        sendBtn.textContent = '⏳ Wird gesendet...';
        
        try {
          const result = await sendApprovedNotifications();
          
          if (result.success) {
            // Show success message with details
            let message = result.message;
            
            // Check if this was a queue-only operation (Node.js not available)
            if (result.info) {
              message = `⚠️ ${result.message}\n\n${result.info}`;
              if (result.instructions && result.instructions.length > 0) {
                message += '\n\n' + result.instructions.join('\n');
              }
            } else if (result.details) {
              message += '\n\nDetails:\n' + result.details;
            }
            
            // Show detailed logs if available
            if (result.detailedLogs && result.detailedLogs.length > 0) {
              message += '\n\n📋 Detaillierte Logs:';
              result.detailedLogs.forEach(log => {
                message += `\n\n${log.status === 'success' ? '✅' : '❌'} ${log.to}`;
                if (log.log && log.log.length > 0) {
                  message += '\n' + log.log.join('\n');
                }
              });
            }
            
            alert(message);
            renderEmailQueue(container);
          } else {
            // Show error message with instructions
            let errorMessage = result.message || 'Fehler beim Versenden der E-Mails.';
            
            if (result.instructions && result.instructions.length > 0) {
              errorMessage += '\n\n' + result.instructions.join('\n');
            }
            
            if (result.details) {
              errorMessage += '\n\n' + result.details;
            }
            
            // Show detailed SMTP logs if available
            if (result.detailedLogs && result.detailedLogs.length > 0) {
              errorMessage += '\n\n📋 Detaillierte SMTP Logs:';
              result.detailedLogs.forEach(log => {
                errorMessage += `\n\n❌ An: ${log.to}`;
                errorMessage += `\nBetreff: ${log.subject}`;
                errorMessage += `\nFehler: ${log.error}`;
                if (log.log && log.log.length > 0) {
                  errorMessage += '\n\nSMTP Kommunikation:\n' + log.log.join('\n');
                }
              });
            }
            
            alert(errorMessage);
          }
        } catch (error) {
          alert('Unerwarteter Fehler: ' + error.message);
        } finally {
          // Re-enable button
          sendBtn.disabled = false;
          sendBtn.textContent = `📤 ${approved.length} E-Mail${approved.length > 1 ? 's' : ''} senden`;
          renderEmailQueue(container);
        }
      }
    });
  }
  
  // Refresh button
  const refreshBtn = container.querySelector('#refreshQueueBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderEmailQueue(container);
    });
  }
}

// Show email preview modal
function showEmailPreview(notification) {
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
    max-width: 700px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  `;
  
  const template = getNotificationTemplate(notification.type, notification.data);
  const subject = getEmailSubjectText(notification);
  
  content.innerHTML = `
    <h2 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 24px;">
      📧 E-Mail-Vorschau
    </h2>
    
    <div style="margin-bottom: 20px;">
      <div style="
        background: #ecf0f1;
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 15px;
      ">
        <div style="margin-bottom: 10px;">
          <strong>Typ:</strong> ${getNotificationTypeLabel(notification.type)}
        </div>
        <div style="margin-bottom: 10px;">
          <strong>Empfänger:</strong> ${notification.recipientEmail || 'Backend-Standardadresse'}
        </div>
        <div style="margin-bottom: 10px;">
          <strong>Betreff:</strong> ${subject}
        </div>
        <div>
          <strong>Zeitstempel:</strong> ${new Date(notification.timestamp).toLocaleString('de-DE')}
        </div>
      </div>
      
      <div style="
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 20px;
      ">
        <div style="
          font-family: monospace;
          font-size: 13px;
          white-space: pre-line;
          color: #2c3e50;
        ">${template}</div>
      </div>
    </div>
    
    <div style="display: flex; justify-content: flex-end;">
      <button id="closePreviewModal" style="
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
  content.querySelector('#closePreviewModal').addEventListener('click', () => modal.remove());
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
