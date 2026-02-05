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
    // Use inline version for World4You compatibility (no exec())
    const response = await fetch('api/send-approved-emails-inline.php', {
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
            
            // Check if we have detailed logs
            const hasDetailedLogs = result.detailedLogs && result.detailedLogs.length > 0;
            
            if (hasDetailedLogs) {
              // Use enhanced modal display for better readability
              showDetailedSMTPErrorModal(result);
            } else {
              // Show basic error with instructions in modal
              if (result.instructions && result.instructions.length > 0) {
                errorMessage += '\n\n' + result.instructions.join('\n');
              }
              
              if (result.details) {
                errorMessage += '\n\n' + result.details;
              }
              
              // Show in a simple modal instead of alert for better readability
              showSimpleErrorModal(errorMessage, result);
            }
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

// Show detailed SMTP error modal with formatted logs
function showDetailedSMTPErrorModal(result) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;
  
  // Build detailed logs HTML
  let logsHTML = '';
  if (result.detailedLogs && result.detailedLogs.length > 0) {
    result.detailedLogs.forEach((log, index) => {
      const isSuccess = log.status === 'success';
      
      // Format SMTP log lines with color coding
      let smtpLinesHTML = '';
      if (log.log && log.log.length > 0) {
        smtpLinesHTML = log.log.map(line => {
          let color = '#555';
          let bgColor = '#f8f9fa';
          let icon = '•';
          
          // Color code based on content
          if (line.match(/^(220|250|235|354|221)/)) {
            // Success codes
            color = '#27ae60';
            bgColor = '#d5f4e6';
            icon = '✓';
          } else if (line.match(/^(5\d\d|4\d\d)/)) {
            // Error codes
            color = '#e74c3c';
            bgColor = '#ffe6e6';
            icon = '✗';
          } else if (line.match(/TLS|AUTH|STARTTLS/i)) {
            // Important steps
            color = '#3498db';
            bgColor = '#e3f2fd';
            icon = '⚡';
          }
          
          return `
            <div style="
              padding: 6px 12px;
              margin: 2px 0;
              background: ${bgColor};
              border-left: 3px solid ${color};
              font-family: 'Courier New', monospace;
              font-size: 12px;
              color: ${color};
              border-radius: 3px;
            ">
              <span style="margin-right: 8px; font-weight: bold;">${icon}</span>${escapeHtml(line)}
            </div>
          `;
        }).join('');
      }
      
      logsHTML += `
        <div style="
          border: 2px solid ${isSuccess ? '#27ae60' : '#e74c3c'};
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          background: ${isSuccess ? '#f0fdf4' : '#fff5f5'};
        ">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="
              font-size: 24px;
              margin-right: 12px;
            ">${isSuccess ? '✅' : '❌'}</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 16px; color: #2c3e50; margin-bottom: 4px;">
                E-Mail ${index + 1}: ${isSuccess ? 'Erfolgreich' : 'Fehlgeschlagen'}
              </div>
              <div style="font-size: 13px; color: #7f8c8d;">
                An: <strong>${escapeHtml(log.to)}</strong>
              </div>
              ${log.subject ? `
                <div style="font-size: 13px; color: #7f8c8d;">
                  Betreff: ${escapeHtml(log.subject)}
                </div>
              ` : ''}
            </div>
          </div>
          
          ${!isSuccess && log.error ? `
            <div style="
              background: #fee;
              border-left: 4px solid #e74c3c;
              padding: 12px 15px;
              margin-bottom: 15px;
              border-radius: 4px;
            ">
              <div style="font-weight: 600; color: #c0392b; margin-bottom: 4px;">
                ⚠️ Fehler:
              </div>
              <div style="color: #c0392b; font-size: 14px;">
                ${escapeHtml(log.error)}
              </div>
            </div>
          ` : ''}
          
          <details ${index === 0 ? 'open' : ''} style="margin-top: 15px;">
            <summary style="
              cursor: pointer;
              font-weight: 600;
              padding: 10px;
              background: #ecf0f1;
              border-radius: 4px;
              user-select: none;
            ">
              📋 SMTP Konversation (${log.log ? log.log.length : 0} Zeilen)
            </summary>
            <div style="
              margin-top: 10px;
              background: #f8f9fa;
              border-radius: 4px;
              padding: 15px;
              max-height: 400px;
              overflow-y: auto;
            ">
              ${smtpLinesHTML || '<div style="color: #999; text-align: center;">Keine Logs verfügbar</div>'}
            </div>
          </details>
          
          <button class="copy-log-btn" data-log-index="${index}" style="
            margin-top: 15px;
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          ">
            📋 Log kopieren
          </button>
        </div>
      `;
    });
  }
  
  content.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px;">
      <h2 style="margin: 0; color: #e74c3c; font-size: 28px;">
        ⚠️ E-Mail-Versand Fehlgeschlagen
      </h2>
      <button id="closeErrorModal" style="
        background: transparent;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #95a5a6;
        line-height: 1;
        padding: 0;
      ">×</button>
    </div>
    
    <div style="
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px 20px;
      margin-bottom: 25px;
      border-radius: 4px;
    ">
      <div style="font-weight: 600; color: #856404; margin-bottom: 8px;">
        📌 Was Sie jetzt tun können:
      </div>
      <ol style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px;">
        <li style="margin-bottom: 8px;">
          <strong>Prüfen Sie die SMTP-Logs unten</strong> - Sie zeigen exakt wo der Fehler auftrat
        </li>
        <li style="margin-bottom: 8px;">
          <strong>Öffnen Sie backend/config.json</strong> und überprüfen Sie:
          <ul style="margin-top: 5px;">
            <li>SMTP Host: <code>smtp.world4you.com</code> (bei World4You)</li>
            <li>SMTP Port: <code>587</code> (STARTTLS) oder <code>465</code> (SSL)</li>
            <li>E-Mail & Passwort: Korrekte Zugangsdaten?</li>
            <li>From-Adresse muss existierende Mailbox sein!</li>
          </ul>
        </li>
        <li style="margin-bottom: 8px;">
          <strong>Kopieren Sie die Logs</strong> und senden Sie sie an Support wenn nötig
        </li>
        <li>
          <strong>Überprüfen Sie:</strong> <code>backend/smtp-debug.log</code> für vollständige Historie
        </li>
      </ol>
    </div>
    
    <div style="margin-bottom: 20px;">
      <div style="font-weight: 600; font-size: 16px; color: #2c3e50; margin-bottom: 12px;">
        📊 Detaillierte SMTP-Kommunikation:
      </div>
      ${logsHTML}
    </div>
    
    <div style="
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 15px 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    ">
      <div style="font-weight: 600; color: #2e7d32; margin-bottom: 8px;">
        💡 Häufige Fehlerursachen:
      </div>
      <ul style="margin: 0; padding-left: 20px; color: #2e7d32; font-size: 13px;">
        <li><strong>535 Authentication failed</strong> → Falsches Passwort oder Username</li>
        <li><strong>454 TLS not available</strong> → Port falsch (nutzen Sie 587 statt 25)</li>
        <li><strong>550 Recipient rejected</strong> → Empfängeradresse ungültig</li>
        <li><strong>530 Must issue STARTTLS first</strong> → TLS-Konfiguration prüfen</li>
        <li><strong>Connection refused</strong> → SMTP Host falsch oder Firewall blockiert</li>
      </ul>
    </div>
    
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="copyAllLogs" style="
        background: #3498db;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      ">📋 Alle Logs kopieren</button>
      <button id="closeErrorModalBtn" style="
        background: #95a5a6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      ">Schließen</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Copy individual log
  content.querySelectorAll('.copy-log-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const logIndex = parseInt(e.target.getAttribute('data-log-index'));
      const log = result.detailedLogs[logIndex];
      
      let logText = `=== E-Mail Versand Log ===\n`;
      logText += `An: ${log.to}\n`;
      if (log.subject) logText += `Betreff: ${log.subject}\n`;
      logText += `Status: ${log.status}\n`;
      if (log.error) logText += `Fehler: ${log.error}\n`;
      logText += `\n=== SMTP Konversation ===\n`;
      if (log.log) {
        logText += log.log.join('\n');
      }
      
      navigator.clipboard.writeText(logText).then(() => {
        e.target.textContent = '✓ Kopiert!';
        setTimeout(() => {
          e.target.innerHTML = '📋 Log kopieren';
        }, 2000);
      });
    });
  });
  
  // Copy all logs
  content.querySelector('#copyAllLogs').addEventListener('click', () => {
    let allLogsText = `=== Alle E-Mail Versand Logs ===\n`;
    allLogsText += `Zeitstempel: ${new Date().toLocaleString('de-DE')}\n`;
    allLogsText += `Gesamt: ${result.detailedLogs.length} E-Mail(s)\n\n`;
    
    result.detailedLogs.forEach((log, index) => {
      allLogsText += `\n${'='.repeat(50)}\n`;
      allLogsText += `E-Mail ${index + 1}\n`;
      allLogsText += `${'='.repeat(50)}\n`;
      allLogsText += `An: ${log.to}\n`;
      if (log.subject) allLogsText += `Betreff: ${log.subject}\n`;
      allLogsText += `Status: ${log.status}\n`;
      if (log.error) allLogsText += `Fehler: ${log.error}\n`;
      allLogsText += `\nSMTP Konversation:\n`;
      if (log.log) {
        allLogsText += log.log.join('\n');
      }
      allLogsText += `\n`;
    });
    
    navigator.clipboard.writeText(allLogsText).then(() => {
      const btn = content.querySelector('#copyAllLogs');
      btn.textContent = '✓ Alle Logs kopiert!';
      setTimeout(() => {
        btn.innerHTML = '📋 Alle Logs kopieren';
      }, 2000);
    });
  });
  
  // Close handlers
  content.querySelector('#closeErrorModal').addEventListener('click', () => modal.remove());
  content.querySelector('#closeErrorModalBtn').addEventListener('click', () => modal.remove());
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  });
}

// Show simple error modal (for errors without detailed SMTP logs)
function showSimpleErrorModal(errorMessage, result) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 30px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  `;
  
  content.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 25px;">
      <h2 style="margin: 0; color: #e74c3c; font-size: 28px;">
        ⚠️ Fehler beim E-Mail-Versand
      </h2>
      <button id="closeSimpleErrorModal" style="
        background: transparent;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #95a5a6;
        line-height: 1;
        padding: 0;
      ">×</button>
    </div>
    
    <div style="
      background: #fff5f5;
      border-left: 4px solid #e74c3c;
      padding: 20px;
      margin-bottom: 25px;
      border-radius: 4px;
    ">
      <div style="white-space: pre-line; font-size: 14px; color: #2c3e50; line-height: 1.6;">
        ${escapeHtml(errorMessage)}
      </div>
    </div>
    
    <div style="
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 15px 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    ">
      <div style="font-weight: 600; color: #2e7d32; margin-bottom: 8px;">
        💡 Nächste Schritte:
      </div>
      <ol style="margin: 0; padding-left: 20px; color: #2e7d32; font-size: 13px;">
        <li style="margin-bottom: 6px;">
          Überprüfen Sie <code>backend/config.json</code> auf Korrektheit
        </li>
        <li style="margin-bottom: 6px;">
          Testen Sie die Verbindung mit <code>test-smtp-connection.php</code>
        </li>
        <li style="margin-bottom: 6px;">
          Prüfen Sie <code>backend/smtp-debug.log</code> für Details
        </li>
        <li>
          Bei World4You: From-Adresse muss existierende Mailbox sein
        </li>
      </ol>
    </div>
    
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="copyError" style="
        background: #3498db;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      ">📋 Fehler kopieren</button>
      <button id="closeSimpleErrorBtn" style="
        background: #95a5a6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
      ">Schließen</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Helper function
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Copy error
  content.querySelector('#copyError').addEventListener('click', () => {
    navigator.clipboard.writeText(errorMessage).then(() => {
      const btn = content.querySelector('#copyError');
      btn.textContent = '✓ Kopiert!';
      setTimeout(() => {
        btn.innerHTML = '📋 Fehler kopieren';
      }, 2000);
    });
  });
  
  // Close handlers
  content.querySelector('#closeSimpleErrorModal').addEventListener('click', () => modal.remove());
  content.querySelector('#closeSimpleErrorBtn').addEventListener('click', () => modal.remove());
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  });
}
