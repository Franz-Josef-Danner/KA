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
        <label for="email-body">Nachricht:</label>
        <textarea 
          id="email-body" 
          placeholder="Ihre Nachricht hier eingeben..."
          class="form-textarea"
          rows="15"
        ></textarea>
      </div>
      
      <div class="form-actions">
        <button id="save-draft-btn" class="btn btn-secondary">Als Entwurf speichern</button>
        <button id="send-email-btn" class="btn btn-primary">Vorschau</button>
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
        <h3 class="draft-subject">Entwurf vom ${formatDate(draft.createdAt)}</h3>
        <div class="draft-actions">
          <button class="btn-small load-draft-btn" data-draft-id="${draft.id}">Laden</button>
          <button class="btn-small delete-draft-btn" data-draft-id="${draft.id}">Löschen</button>
        </div>
      </div>
      <div class="draft-preview">
        ${draft.body ? draft.body.substring(0, 150) + (draft.body.length > 150 ? '...' : '') : '(Keine Nachricht)'}
      </div>
    </div>
  `).join('');
  
  container.innerHTML = `
    <div class="drafts-container">
      ${draftsHtml}
    </div>
  `;
}
