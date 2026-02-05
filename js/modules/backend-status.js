// Backend Status Display Module
// Shows the email backend configuration status

let statusCheckInterval = null;

// Get backend status
export async function getBackendStatus() {
  try {
    const response = await fetch('api/backend-status.php');
    if (!response.ok) {
      throw new Error('Failed to fetch backend status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching backend status:', error);
    return null;
  }
}

// Render backend status widget
export function renderBackendStatus(container) {
  if (!container) {
    console.error('Backend status container not found');
    return;
  }

  // Create status widget
  container.innerHTML = `
    <div id="backendStatusWidget" style="
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
        <h3 style="margin: 0; font-size: 18px; color: #2c3e50;">
          📧 E-Mail Backend Status
        </h3>
        <button id="refreshBackendStatus" style="
          background: #3498db;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        ">🔄 Aktualisieren</button>
      </div>
      <div id="backendStatusContent">
        <div style="text-align: center; padding: 20px;">
          <div class="spinner" style="
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          "></div>
          <p style="margin-top: 10px; color: #7f8c8d;">Status wird geladen...</p>
        </div>
      </div>
    </div>
  `;

  // Add spinner animation
  if (!document.getElementById('spinnerStyles')) {
    const style = document.createElement('style');
    style.id = 'spinnerStyles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Load status
  updateBackendStatus();

  // Add refresh button handler
  const refreshBtn = document.getElementById('refreshBackendStatus');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', updateBackendStatus);
  }

  // Auto-refresh every 30 seconds
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
  }
  statusCheckInterval = setInterval(updateBackendStatus, 30000);
}

// Update backend status display
async function updateBackendStatus() {
  const contentDiv = document.getElementById('backendStatusContent');
  if (!contentDiv) return;

  const status = await getBackendStatus();
  
  if (!status) {
    contentDiv.innerHTML = `
      <div style="padding: 15px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
        <strong>⚠️ Warnung:</strong> Backend-Status konnte nicht abgerufen werden.
      </div>
    `;
    return;
  }

  let html = '';

  // Overall status indicator
  if (status.ready) {
    html += `
      <div style="padding: 15px; background: #d4edda; border-radius: 4px; border-left: 4px solid #28a745; margin-bottom: 15px;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 24px; margin-right: 10px;">✅</span>
          <div>
            <strong style="color: #155724;">Backend ist bereit</strong>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #155724;">
              E-Mails können versendet werden.
            </p>
          </div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div style="padding: 15px; background: #f8d7da; border-radius: 4px; border-left: 4px solid #dc3545; margin-bottom: 15px;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 24px; margin-right: 10px;">❌</span>
          <div>
            <strong style="color: #721c24;">Backend ist NICHT konfiguriert</strong>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #721c24;">
              E-Mails werden nur in die Warteschlange eingereiht, können aber nicht versendet werden.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // Status details
  html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 15px;">`;
  
  // Config status
  html += `
    <div style="padding: 10px; background: ${status.configured ? '#d4edda' : '#f8d7da'}; border-radius: 4px;">
      <div style="font-size: 20px; margin-bottom: 5px;">${status.configured ? '✅' : '❌'}</div>
      <div style="font-weight: bold; font-size: 14px;">Konfiguration</div>
      <div style="font-size: 12px; color: #666;">${status.configured ? 'Vorhanden' : 'Fehlt'}</div>
    </div>
  `;
  
  // Node.js status
  html += `
    <div style="padding: 10px; background: ${status.nodeJsAvailable ? '#d4edda' : '#f8d7da'}; border-radius: 4px;">
      <div style="font-size: 20px; margin-bottom: 5px;">${status.nodeJsAvailable ? '✅' : '❌'}</div>
      <div style="font-weight: bold; font-size: 14px;">Node.js</div>
      <div style="font-size: 12px; color: #666;">${status.nodeJsAvailable ? (status.nodeVersion || 'Installiert') : 'Nicht verfügbar'}</div>
    </div>
  `;
  
  // Nodemailer status
  html += `
    <div style="padding: 10px; background: ${status.nodemailerInstalled ? '#d4edda' : '#f8d7da'}; border-radius: 4px;">
      <div style="font-size: 20px; margin-bottom: 5px;">${status.nodemailerInstalled ? '✅' : '❌'}</div>
      <div style="font-weight: bold; font-size: 14px;">Nodemailer</div>
      <div style="font-size: 12px; color: #666;">${status.nodemailerInstalled ? 'Installiert' : 'Fehlt'}</div>
    </div>
  `;
  
  // Queue status
  html += `
    <div style="padding: 10px; background: ${status.queuedEmails > 0 ? '#fff3cd' : '#d4edda'}; border-radius: 4px;">
      <div style="font-size: 20px; margin-bottom: 5px;">${status.queuedEmails > 0 ? '📬' : '📭'}</div>
      <div style="font-weight: bold; font-size: 14px;">Warteschlange</div>
      <div style="font-size: 12px; color: #666;">${status.queuedEmails} wartend</div>
    </div>
  `;
  
  html += `</div>`;

  // Issues
  if (status.issues && status.issues.length > 0) {
    html += `
      <div style="margin-top: 15px;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #2c3e50;">⚠️ Probleme</h4>
    `;
    
    status.issues.forEach(issue => {
      const bgColor = issue.severity === 'critical' ? '#f8d7da' : '#fff3cd';
      const borderColor = issue.severity === 'critical' ? '#dc3545' : '#ffc107';
      
      html += `
        <div style="padding: 10px; background: ${bgColor}; border-radius: 4px; border-left: 3px solid ${borderColor}; margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 3px;">${issue.message}</div>
          <div style="font-size: 13px; color: #666;">💡 ${issue.solution}</div>
        </div>
      `;
    });
    
    html += `</div>`;
  }

  // Setup instructions
  if (status.setupInstructions && !status.ready) {
    html += `
      <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 4px; border-left: 4px solid #2196f3;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #1976d2;">
          📋 ${status.setupInstructions.title}
        </h4>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #555;">
          ${status.setupInstructions.description}
        </p>
        <div style="background: white; border-radius: 4px; padding: 15px;">
    `;
    
    status.setupInstructions.steps.forEach(step => {
      html += `
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold; color: #2196f3; margin-bottom: 5px;">
            Schritt ${step.number}: ${step.title}
          </div>
          <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
            ${step.description}
          </div>
      `;
      
      if (step.command) {
        html += `
          <div style="background: #f5f5f5; padding: 8px; border-radius: 3px; font-family: monospace; font-size: 12px; margin-top: 5px;">
            ${step.command}
          </div>
        `;
      }
      
      html += `</div>`;
    });
    
    html += `
          <div style="margin-top: 15px; font-size: 13px; color: #666;">
            <strong>📚 Dokumentation:</strong><br>
    `;
    
    Object.entries(status.setupInstructions.documentation).forEach(([file, desc]) => {
      html += `• <span style="font-family: monospace;">${file}</span> - ${desc}<br>`;
    });
    
    html += `
          </div>
        </div>
      </div>
    `;
  }

  // Hosting-specific help (when Node.js not available)
  if (status.hostingHelp && !status.nodeJsAvailable) {
    html += `
      <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 4px; border-left: 4px solid #ffc107;">
        <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #856404;">
          💡 ${status.hostingHelp.title}
        </h4>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #856404;">
          ${status.hostingHelp.description}
        </p>
        <div style="background: white; border-radius: 4px; padding: 15px;">
    `;
    
    status.hostingHelp.options.forEach((option, index) => {
      html += `
        <div style="margin-bottom: ${index < status.hostingHelp.options.length - 1 ? '20px' : '0'}; padding-bottom: ${index < status.hostingHelp.options.length - 1 ? '15px' : '0'}; border-bottom: ${index < status.hostingHelp.options.length - 1 ? '1px solid #eee' : 'none'};">
          <div style="font-weight: bold; color: #856404; margin-bottom: 5px; font-size: 15px;">
            ${option.title}
          </div>
          <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
            ${option.description}
          </div>
          <div style="background: #f8f9fa; padding: 8px; border-radius: 3px; font-size: 13px; color: #495057; margin-bottom: 5px;">
            <strong>→</strong> ${option.action}
          </div>
      `;
      
      if (option.details && option.details.length > 0) {
        html += `<ul style="margin: 8px 0 0 20px; font-size: 12px; color: #666;">`;
        option.details.forEach(detail => {
          html += `<li style="margin-bottom: 3px;">${detail}</li>`;
        });
        html += `</ul>`;
      }
      
      if (option.providers && option.providers.length > 0) {
        html += `<ul style="margin: 8px 0 0 20px; font-size: 12px; color: #666;">`;
        option.providers.forEach(provider => {
          html += `<li style="margin-bottom: 3px;">${provider}</li>`;
        });
        html += `</ul>`;
      }
      
      if (option.note) {
        html += `
          <div style="margin-top: 5px; font-size: 12px; color: #28a745;">
            ✓ ${option.note}
          </div>
        `;
      }
      
      html += `</div>`;
    });
    
    html += `
        </div>
      </div>
    `;
  }

  contentDiv.innerHTML = html;
}

// Cleanup function
export function cleanupBackendStatus() {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }
}
