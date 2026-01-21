// -----------------------------
// Kampagnen Event Handlers
// -----------------------------
import { createDraft, updateDraft, deleteDraft, getDraftById } from './kampagnen-state.js';
import { renderPreviewList } from './kampagnen-render.js';
import { showSuccessMessage, showErrorMessage, clearEmailForm } from './kampagnen-ui.js';
import { ensureInitialized as ensureCompanyDataInitialized } from './state.js';

let currentDraftId = null;

/**
 * Initialize all event handlers
 */
export function initEventHandlers() {
  initSaveDraftHandler();
  initGeneratePreviewHandler();
  initTextareaChangeHandler();
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
  });
}

/**
 * Generate preview button handler
 */
function initGeneratePreviewHandler() {
  const generatePreviewBtn = document.getElementById('generate-preview-btn');
  if (!generatePreviewBtn) return;
  
  generatePreviewBtn.addEventListener('click', async () => {
    const body = document.getElementById('email-body')?.value || '';
    
    if (!body) {
      showErrorMessage('Bitte geben Sie eine Nachricht ein.');
      return;
    }
    
    // Ensure company data is loaded
    await ensureCompanyDataInitialized();
    
    // Render preview list
    renderPreviewList();
    showSuccessMessage('Vorschau generiert!');
  });
}

/**
 * Textarea change handler to auto-update preview
 */
function initTextareaChangeHandler() {
  const textarea = document.getElementById('email-body');
  if (!textarea) return;
  
  let debounceTimer;
  textarea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Auto-update preview if there's content
      if (textarea.value.trim()) {
        ensureCompanyDataInitialized().then(() => {
          renderPreviewList();
        });
      }
    }, 1000); // Wait 1 second after user stops typing
  });
}
