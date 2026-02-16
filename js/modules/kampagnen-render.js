// -----------------------------
// Kampagnen Render Module
// -----------------------------
import { getDrafts } from './kampagnen-state.js';
import { formatDate } from './kampagnen-ui.js';
import { COLUMNS, STATUS_OPTIONS } from './config.js';
import { getRows } from './state.js';
import { getEmailConfig } from './email-config.js';

// Track current status filter
let currentStatusFilter = 'Kunde';

/**
 * Get current status filter
 */
export function getStatusFilter() {
  return currentStatusFilter;
}

/**
 * Set current status filter
 */
export function setStatusFilter(status) {
  currentStatusFilter = status;
}

/**
 * Render the entire kampagnen page
 */
export function render() {
  renderMailInterface();
  renderPreviewList();
  renderDraftsList();
}

/**
 * Render the mail interface form with available variables
 */
function renderMailInterface() {
  const container = document.getElementById('mail-interface');
  if (!container) return;
  
  // Get available template variables from Firmenliste columns
  const templateVariables = COLUMNS.filter(col => col !== 'Firmen_ID').map(col => `{{${col}}}`).join(', ');
  
  // Add special placeholder for greeting
  const allVariables = templateVariables + ', {{Begrüßung}}';
  
  // Generate status options HTML
  const statusOptionsHtml = STATUS_OPTIONS.map(status => 
    `<option value="${status}" ${status === currentStatusFilter ? 'selected' : ''}>${status}</option>`
  ).join('');
  
  container.innerHTML = `
    <div class="mail-form">
      <div class="template-variables">
        <h3>Verfügbare Platzhalter:</h3>
        <p class="variables-list">${allVariables}</p>
        <p class="variables-hint">Verwenden Sie diese Platzhalter in Ihrer Nachricht. Sie werden automatisch mit den Daten aus der Firmenliste ersetzt.</p>
        <p class="variables-hint"><strong>{{Begrüßung}}</strong> - Generiert automatisch die passende Anrede basierend auf dem Geschlecht:
          <br>• Kein Geschlecht: "Liebes {{Firma}}-Team"
          <br>• Mann: "Sehr geehrter Herr {{Nachname}}"
          <br>• Frau: "Sehr geehrte Frau {{Nachname}}"
        </p>
      </div>
      
      <div class="form-group">
        <label for="status-filter">Firmen filtern nach Status:</label>
        <select id="status-filter" class="form-select">
          ${statusOptionsHtml}
        </select>
      </div>
      
      <div class="form-group">
        <label for="email-subject">Betreff:</label>
        <input 
          type="text" 
          id="email-subject" 
          placeholder="Betreff der E-Mail (z.B. Angebot für {{Firma}})"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="email-body">Nachricht:</label>
        <textarea 
          id="email-body" 
          placeholder="{{Begrüßung}},

vielen Dank für Ihr Interesse an unseren Dienstleistungen...

Mit freundlichen Grüßen

Hinweis: {{Begrüßung}} wird automatisch durch die passende Anrede ersetzt."
          class="form-textarea"
          rows="15"
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button id="save-draft-btn" class="btn btn-secondary">Als Entwurf speichern</button>
        <button id="copy-message-btn" class="btn btn-secondary">Nachricht kopieren</button>
        <button id="download-csv-btn" class="btn btn-secondary">Gefilterte Firmen als CSV</button>
        <button id="bulk-send-btn" class="btn btn-primary">E-Mails versenden</button>
      </div>
    </div>
  `;
}

/**
 * Render the preview list showing individual email previews
 */
export function renderPreviewList() {
  const container = document.getElementById('preview-list');
  if (!container) return;
  
  const messageBody = document.getElementById('email-body')?.value || '';
  
  if (!messageBody.trim()) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Geben Sie eine Nachricht ein, um die Vorschau zu sehen.</p>
      </div>
    `;
    return;
  }
  
  // Get companies with selected status from Firmenliste
  const companies = getRows().filter(row => row.Status === currentStatusFilter);
  
  if (companies.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Keine Firmen mit Status "${currentStatusFilter}" gefunden.</p>
      </div>
    `;
    return;
  }
  
  const previewsHtml = companies.map((company, index) => {
    const personalizedMessage = replaceTemplateVariables(messageBody, company);
    
    return `
      <div class="preview-item" data-company-id="${company.Firmen_ID}">
        <div class="preview-header">
          <h3 class="preview-title">${company.Firma || '(Keine Firma)'}</h3>
          <div class="preview-recipient">${company['E-mail'] || 'Keine E-Mail'}</div>
        </div>
        <div class="preview-body">
          ${escapeHtml(personalizedMessage).replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="preview-container">
      <div class="preview-count">
        ${companies.length} E-Mail${companies.length !== 1 ? 's' : ''} werden versendet (Status: ${currentStatusFilter})
      </div>
      ${previewsHtml}
    </div>
  `;
}

/**
 * Render the list of saved drafts
 */
export function renderDraftsList() {
  const container = document.getElementById('drafts-list');
  if (!container) return;
  
  const drafts = getDrafts();
  
  if (drafts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Keine gespeicherten Entwürfe vorhanden.</p>
      </div>
    `;
    return;
  }
  
  const draftsHtml = drafts.map(draft => `
    <div class="draft-item" data-draft-id="${draft.id}">
      <div class="draft-header">
        <h3 class="draft-subject">Entwurf vom ${formatDate(draft.createdAt)}</h3>
        <div class="draft-actions">
          <button class="btn-small load-draft-btn" data-draft-id="${draft.id}">Laden</button>
          <button class="btn-small delete-draft-btn" data-draft-id="${draft.id}">Löschen</button>
        </div>
      </div>
      <div class="draft-preview">
        ${draft.body ? escapeHtml(draft.body.substring(0, 200)).replace(/\n/g, '<br>') + (draft.body.length > 200 ? '...' : '') : '(Keine Nachricht)'}
      </div>
    </div>
  `).join('');
  
  container.innerHTML = `
    <div class="drafts-container">
      ${draftsHtml}
    </div>
  `;
}

/**
 * Replace template variables in message with actual company data
 */
function replaceTemplateVariables(message, company) {
  let result = message;
  
  // Handle special {{Begrüßung}} placeholder first
  if (result.includes('{{Begrüßung}}')) {
    const greeting = generateGreeting(company);
    result = result.replace(/\{\{Begrüßung\}\}/g, greeting);
  }
  
  // Replace each column variable
  COLUMNS.forEach(column => {
    const placeholder = `{{${column}}}`;
    const value = company[column] || '';
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });
  
  return result;
}

/**
 * Generate personalized greeting based on gender
 */
function generateGreeting(company) {
  const geschlecht = company.Geschlecht?.trim();
  const nachname = company.Nachname?.trim() || '';
  const firma = company.Firma?.trim() || '';
  
  if (!geschlecht) {
    // No gender selected: use company team greeting
    if (firma) {
      return `Liebes ${firma}-Team`;
    } else {
      return 'Sehr geehrte Damen und Herren';
    }
  } else if (geschlecht === 'Mann') {
    // Male: use formal male greeting if last name exists
    if (nachname) {
      return `Sehr geehrter Herr ${nachname}`;
    } else if (firma) {
      return `Liebes ${firma}-Team`;
    } else {
      return 'Sehr geehrte Damen und Herren';
    }
  } else if (geschlecht === 'Frau') {
    // Female: use formal female greeting if last name exists
    if (nachname) {
      return `Sehr geehrte Frau ${nachname}`;
    } else if (firma) {
      return `Liebes ${firma}-Team`;
    } else {
      return 'Sehr geehrte Damen und Herren';
    }
  }
  
  // Fallback to generic greeting
  if (firma) {
    return `Liebes ${firma}-Team`;
  } else {
    return 'Sehr geehrte Damen und Herren';
  }
}

/**
 * HTML escape helper
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
