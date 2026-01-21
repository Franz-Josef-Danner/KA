// -----------------------------
// Kampagnen Render Module
// -----------------------------
import { getDrafts } from './kampagnen-state.js';
import { formatDate } from './kampagnen-ui.js';
import { COLUMNS } from './config.js';
import { getRows } from './state.js';

/**
 * Render the entire kampagnen page
 */
export function render() {
  renderMailInterface();
  renderPreviewList();
}

/**
 * Render the mail interface form with available variables
 */
function renderMailInterface() {
  const container = document.getElementById('mail-interface');
  if (!container) return;
  
  // Get available template variables from Firmenliste columns
  const templateVariables = COLUMNS.filter(col => col !== 'Firmen_ID').map(col => `{{${col}}}`).join(', ');
  
  container.innerHTML = `
    <div class="mail-form">
      <div class="template-variables">
        <h3>Verfügbare Platzhalter:</h3>
        <p class="variables-list">${templateVariables}</p>
        <p class="variables-hint">Verwenden Sie diese Platzhalter in Ihrer Nachricht. Sie werden automatisch mit den Daten aus der Firmenliste ersetzt.</p>
      </div>
      
      <div class="form-group">
        <label for="email-body">Nachricht:</label>
        <textarea 
          id="email-body" 
          placeholder="Guten Tag {{Gender}} {{Nachname}},

vielen Dank für Ihr Interesse an {{Firma}}...

Verwenden Sie {{Platzhalter}} für dynamische Inhalte."
          class="form-textarea"
          rows="15"
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button id="save-draft-btn" class="btn btn-secondary">Als Entwurf speichern</button>
        <button id="generate-preview-btn" class="btn btn-primary">Vorschau generieren</button>
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
        <p>Geben Sie eine Nachricht ein und klicken Sie auf "Vorschau generieren", um die Vorschau zu sehen.</p>
      </div>
    `;
    return;
  }
  
  // Get companies with "Kunde" status from Firmenliste
  const companies = getRows().filter(row => row.Status === 'Kunde');
  
  if (companies.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Keine Kunden in der Firmenliste gefunden. Nur Firmen mit Status "Kunde" werden hier angezeigt.</p>
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
        ${companies.length} E-Mail${companies.length !== 1 ? 's' : ''} werden versendet
      </div>
      ${previewsHtml}
    </div>
  `;
}

/**
 * Replace template variables in message with actual company data
 */
function replaceTemplateVariables(message, company) {
  let result = message;
  
  // Replace each column variable
  COLUMNS.forEach(column => {
    const placeholder = `{{${column}}}`;
    const value = company[column] || '';
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });
  
  return result;
}

/**
 * HTML escape helper
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
