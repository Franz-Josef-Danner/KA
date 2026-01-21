// -----------------------------
// Kampagnen State Management
// -----------------------------

const KAMPAGNEN_STORAGE_KEY = 'ka_kampagnen_drafts';

let emailDrafts = [];

/**
 * Load email drafts from localStorage
 */
export function loadDrafts() {
  try {
    const raw = localStorage.getItem(KAMPAGNEN_STORAGE_KEY);
    if (!raw) {
      emailDrafts = [];
      return emailDrafts;
    }
    emailDrafts = JSON.parse(raw);
    return emailDrafts;
  } catch (error) {
    console.error('Failed to load email drafts:', error);
    emailDrafts = [];
    return emailDrafts;
  }
}

/**
 * Save email drafts to localStorage
 */
export function saveDrafts() {
  try {
    localStorage.setItem(KAMPAGNEN_STORAGE_KEY, JSON.stringify(emailDrafts));
    return true;
  } catch (error) {
    console.error('Failed to save email drafts:', error);
    return false;
  }
}

/**
 * Get all email drafts
 */
export function getDrafts() {
  return emailDrafts;
}

/**
 * Create a new email draft
 */
export function createDraft() {
  const draft = {
    id: `draft_${Date.now()}`,
    subject: '',
    body: '',
    recipients: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  emailDrafts.push(draft);
  saveDrafts();
  return draft;
}

/**
 * Update an existing draft
 */
export function updateDraft(id, updates) {
  const index = emailDrafts.findIndex(d => d.id === id);
  if (index === -1) {
    return null;
  }
  
  emailDrafts[index] = {
    ...emailDrafts[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  saveDrafts();
  return emailDrafts[index];
}

/**
 * Delete a draft
 */
export function deleteDraft(id) {
  const index = emailDrafts.findIndex(d => d.id === id);
  if (index === -1) {
    return false;
  }
  
  emailDrafts.splice(index, 1);
  saveDrafts();
  return true;
}

/**
 * Get a specific draft by ID
 */
export function getDraftById(id) {
  return emailDrafts.find(d => d.id === id);
}

/**
 * Initialize state - load drafts from storage
 */
export async function ensureInitialized() {
  loadDrafts();
}
