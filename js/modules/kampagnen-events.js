// -----------------------------
// Kampagnen Event Handlers
// -----------------------------
import { createDraft, updateDraft, deleteDraft, getDraftById } from './kampagnen-state.js';
import { renderPreviewList, renderDraftsList } from './kampagnen-render.js';
import { showSuccessMessage, showErrorMessage, clearEmailForm } from './kampagnen-ui.js';
import { ensureInitialized as ensureCompanyDataInitialized } from './state.js';

let currentDraftId = null;

/**
 * Initialize all event handlers
 */
export function initEventHandlers() {
  initTabHandlers();
  initSaveDraftHandler();
  initGeneratePreviewHandler();
  initTextareaChangeHandler();
  initDraftsListHandlers();
}

/**
 * Tab switching handler
 */
function initTabHandlers() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const targetContent = document.getElementById(`${targetTab}-tab`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
      
      // If switching to drafts tab, refresh the drafts list
      if (targetTab === 'drafts') {
        renderDraftsList();
      }
    });
  });
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
    
    // Refresh drafts list
    renderDraftsList();
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
  
  // Switch to generate tab
  const generateTab = document.querySelector('.tab-button[data-tab="generate"]');
  if (generateTab) {
    generateTab.click();
  }
  
  // Load draft content into textarea
  const bodyTextarea = document.getElementById('email-body');
  if (bodyTextarea) bodyTextarea.value = draft.body || '';
  
  currentDraftId = draftId;
  showSuccessMessage('Entwurf geladen.');
  
  // Auto-generate preview
  ensureCompanyDataInitialized().then(() => {
    renderPreviewList();
  });
}
