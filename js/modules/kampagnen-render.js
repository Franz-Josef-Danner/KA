// -----------------------------
// Kampagnen Render Module
// -----------------------------
import { getDrafts } from './kampagnen-state.js';
import { formatDate } from './kampagnen-ui.js';

/**
 * Render the entire kampagnen page
 */
export function render() {
  renderMailInterface();
  renderDraftsList();
}

/**
 * Render the mail interface form
 */
function renderMailInterface() {
  const container = document.getElementById('mail-interface');
  if (!container) return;
  
  container.innerHTML = `
    <div class="mail-form">
      <div class="form-group">
        <label for="email-recipients">Empfänger:</label>
        <input 
          type="text" 
          id="email-recipients" 
          placeholder="beispiel@email.de (mehrere mit Komma trennen)"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="email-subject">Betreff:</label>
        <input 
          type="text" 
          id="email-subject" 
          placeholder="E-Mail Betreff eingeben"
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label for="email-body">Nachricht:</label>
        <textarea 
          id="email-body" 
          placeholder="Ihre Nachricht hier eingeben..."
          class="form-textarea"
          rows="10"
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button id="save-draft-btn" class="btn btn-secondary">Als Entwurf speichern</button>
        <button id="send-email-btn" class="btn btn-primary">E-Mail senden (Vorschau)</button>
      </div>
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
        <h3 class="draft-subject">${draft.subject || '(Kein Betreff)'}</h3>
        <div class="draft-actions">
          <button class="btn-small load-draft-btn" data-draft-id="${draft.id}">Laden</button>
          <button class="btn-small delete-draft-btn" data-draft-id="${draft.id}">Löschen</button>
        </div>
      </div>
      <div class="draft-meta">
        <span class="draft-date">Erstellt: ${formatDate(draft.createdAt)}</span>
        ${draft.recipients ? `<span class="draft-recipients">An: ${draft.recipients}</span>` : ''}
      </div>
      <div class="draft-preview">
        ${draft.body ? draft.body.substring(0, 100) + (draft.body.length > 100 ? '...' : '') : '(Keine Nachricht)'}
      </div>
    </div>
  `).join('');
  
  container.innerHTML = `
    <div class="drafts-container">
      ${draftsHtml}
    </div>
  `;
}
