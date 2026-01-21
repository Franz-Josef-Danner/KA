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
    const subject = document.getElementById('email-subject')?.value || '';
    const body = document.getElementById('email-body')?.value || '';
    const recipients = document.getElementById('email-recipients')?.value || '';
    
    if (!subject && !body && !recipients) {
      showErrorMessage('Bitte füllen Sie mindestens ein Feld aus, um einen Entwurf zu speichern.');
      return;
    }
    
    if (currentDraftId) {
      // Update existing draft
      updateDraft(currentDraftId, { subject, body, recipients });
      showSuccessMessage('Entwurf aktualisiert!');
    } else {
      // Create new draft
      const draft = createDraft();
      updateDraft(draft.id, { subject, body, recipients });
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
    const subject = document.getElementById('email-subject')?.value || '';
    const body = document.getElementById('email-body')?.value || '';
    const recipients = document.getElementById('email-recipients')?.value || '';
    
    if (!recipients) {
      showErrorMessage('Bitte geben Sie mindestens einen Empfänger an.');
      return;
    }
    
    if (!subject && !body) {
      showErrorMessage('Bitte geben Sie einen Betreff oder eine Nachricht ein.');
      return;
    }
    
    // Show preview (since this is basic implementation without actual sending)
    const preview = `
E-Mail Vorschau:
──────────────────
An: ${recipients}
Betreff: ${subject || '(Kein Betreff)'}

${body || '(Keine Nachricht)'}
──────────────────
    `.trim();
    
    alert(preview + '\n\nHinweis: Dies ist eine Vorschau. Die Versand-Funktionalität wird in einer späteren Version hinzugefügt.');
    
    // Optionally save as draft and clear form
    if (confirm('Möchten Sie diese E-Mail als Entwurf speichern?')) {
      if (currentDraftId) {
        updateDraft(currentDraftId, { subject, body, recipients });
      } else {
        const draft = createDraft();
        updateDraft(draft.id, { subject, body, recipients });
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
  
  const subjectInput = document.getElementById('email-subject');
  const bodyTextarea = document.getElementById('email-body');
  const recipientsInput = document.getElementById('email-recipients');
  
  if (subjectInput) subjectInput.value = draft.subject || '';
  if (bodyTextarea) bodyTextarea.value = draft.body || '';
  if (recipientsInput) recipientsInput.value = draft.recipients || '';
  
  currentDraftId = draftId;
  showSuccessMessage('Entwurf geladen.');
}
