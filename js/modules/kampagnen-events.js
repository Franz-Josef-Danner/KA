// -----------------------------
// Kampagnen Event Handlers
// -----------------------------
import { createDraft, updateDraft, deleteDraft, getDraftById } from './kampagnen-state.js';
import { renderDraftsList } from './kampagnen-render.js';
import { showSuccessMessage, showErrorMessage, clearEmailForm } from './kampagnen-ui.js';

let currentDraftId = null;

/**
 * Initialize all event handlers
 */
export function initEventHandlers() {
  initSaveDraftHandler();
  initSendEmailHandler();
  initDraftsListHandlers();
}

/**
 * Save draft button handler
 */
function initSaveDraftHandler() {
  const saveDraftBtn = document.getElementById('save-draft-btn');
  if (!saveDraftBtn) return;
  
  saveDraftBtn.addEventListener('click', () => {
    const body = document.getElementById('email-body')?.value || '';
    
    if (!body) {
      showErrorMessage('Bitte geben Sie eine Nachricht ein, um einen Entwurf zu speichern.');
      return;
    }
    
    if (currentDraftId) {
      // Update existing draft
      updateDraft(currentDraftId, { body });
      showSuccessMessage('Entwurf aktualisiert!');
    } else {
      // Create new draft
      const draft = createDraft();
      updateDraft(draft.id, { body });
      currentDraftId = draft.id;
      showSuccessMessage('Entwurf gespeichert!');
    }
    
    renderDraftsList();
  });
}

/**
 * Send email button handler (preview mode for now)
 */
function initSendEmailHandler() {
  const sendEmailBtn = document.getElementById('send-email-btn');
  if (!sendEmailBtn) return;
  
  sendEmailBtn.addEventListener('click', () => {
    const body = document.getElementById('email-body')?.value || '';
    
    if (!body) {
      showErrorMessage('Bitte geben Sie eine Nachricht ein.');
      return;
    }
    
    // Show preview (since this is basic implementation without actual sending)
    // TODO: Replace alert with a proper modal dialog in future enhancement
    const preview = `
Nachrichtenvorschau:
──────────────────

${body}

──────────────────
    `.trim();
    
    alert(preview + '\n\nHinweis: Dies ist eine Vorschau. Die Versand-Funktionalität wird in einer späteren Version hinzugefügt.');
    
    // Optionally save as draft and clear form
    // TODO: Replace confirm with a proper modal dialog in future enhancement
    if (confirm('Möchten Sie diese Nachricht als Entwurf speichern?')) {
      if (currentDraftId) {
        updateDraft(currentDraftId, { body });
      } else {
        const draft = createDraft();
        updateDraft(draft.id, { body });
      }
      renderDraftsList();
    }
    
    // Clear form and reset current draft
    clearEmailForm();
    currentDraftId = null;
    showSuccessMessage('Formular zurückgesetzt.');
  });
}

/**
 * Initialize handlers for draft list (load and delete)
 */
function initDraftsListHandlers() {
  const container = document.getElementById('drafts-list');
  if (!container) return;
  
  // Event delegation for load and delete buttons
  container.addEventListener('click', (e) => {
    const target = e.target;
    
    // Load draft
    if (target.classList.contains('load-draft-btn')) {
      const draftId = target.getAttribute('data-draft-id');
      loadDraftIntoForm(draftId);
    }
    
    // Delete draft
    if (target.classList.contains('delete-draft-btn')) {
      const draftId = target.getAttribute('data-draft-id');
      // TODO: Replace confirm with a proper modal dialog in future enhancement
      if (confirm('Möchten Sie diesen Entwurf wirklich löschen?')) {
        deleteDraft(draftId);
        if (currentDraftId === draftId) {
          clearEmailForm();
          currentDraftId = null;
        }
        renderDraftsList();
        showSuccessMessage('Entwurf gelöscht.');
      }
    }
  });
}

/**
 * Load a draft into the email form
 */
function loadDraftIntoForm(draftId) {
  const draft = getDraftById(draftId);
  if (!draft) {
    showErrorMessage('Entwurf nicht gefunden.');
    return;
  }
  
  const bodyTextarea = document.getElementById('email-body');
  
  if (bodyTextarea) bodyTextarea.value = draft.body || '';
  
  currentDraftId = draftId;
  showSuccessMessage('Entwurf geladen.');
}
