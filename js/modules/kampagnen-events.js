// -----------------------------
// Kampagnen Event Handlers
// -----------------------------
import { createDraft, updateDraft, deleteDraft, getDraftById } from './kampagnen-state.js';
import { renderPreviewList, renderDraftsList, getStatusFilter, setStatusFilter } from './kampagnen-render.js';
import { showSuccessMessage, showErrorMessage, clearEmailForm } from './kampagnen-ui.js';
import { ensureInitialized as ensureCompanyDataInitialized } from './state.js';
import { getRows } from './state.js';
import { COLUMNS } from './config.js';
import { getEmailConfig } from './email-config.js';

let currentDraftId = null;

/**
 * Initialize all event handlers
 */
export function initEventHandlers() {
  initTabHandlers();
  initSaveDraftHandler();
  initCopyMessageHandler();
  initStatusFilterHandler();
  initDownloadCSVHandler();
  initTextareaChangeHandler();
  initDraftsListHandlers();
  initBulkSendHandler();
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
 * Copy message button handler
 */
function initCopyMessageHandler() {
  const copyBtn = document.getElementById('copy-message-btn');
  if (!copyBtn) return;
  
  copyBtn.addEventListener('click', async () => {
    const body = document.getElementById('email-body')?.value || '';
    
    if (!body) {
      showErrorMessage('Keine Nachricht zum Kopieren vorhanden.');
      return;
    }
    
    try {
      // Use Clipboard API to copy text
      await navigator.clipboard.writeText(body);
      showSuccessMessage('Nachricht in Zwischenablage kopiert!');
    } catch (err) {
      // Fallback for older browsers
      try {
        const textarea = document.getElementById('email-body');
        textarea.select();
        document.execCommand('copy');
        showSuccessMessage('Nachricht in Zwischenablage kopiert!');
      } catch (fallbackErr) {
        showErrorMessage('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
      }
    }
  });
}

/**
 * Status filter change handler
 */
function initStatusFilterHandler() {
  const statusFilter = document.getElementById('status-filter');
  if (!statusFilter) return;
  
  statusFilter.addEventListener('change', async (e) => {
    const selectedStatus = e.target.value;
    setStatusFilter(selectedStatus);
    
    // Ensure company data is loaded
    await ensureCompanyDataInitialized();
    
    // Update preview with new filter
    renderPreviewList();
  });
}

/**
 * Download CSV button handler
 */
function initDownloadCSVHandler() {
  const downloadBtn = document.getElementById('download-csv-btn');
  if (!downloadBtn) return;
  
  downloadBtn.addEventListener('click', async () => {
    // Ensure company data is loaded
    await ensureCompanyDataInitialized();
    
    const status = getStatusFilter();
    const companies = getRows().filter(row => row.Status === status);
    
    if (companies.length === 0) {
      showErrorMessage(`Keine Firmen mit Status "${status}" gefunden.`);
      return;
    }
    
    // Generate CSV
    const csv = generateCSV(companies);
    
    // Download CSV file
    downloadCSVFile(csv, `firmen_${status.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    
    showSuccessMessage(`${companies.length} Firmen als CSV heruntergeladen.`);
  });
}

/**
 * Generate CSV from company data
 */
function generateCSV(companies) {
  if (companies.length === 0) return '';
  
  // CSV header
  const header = COLUMNS.join(',');
  
  // CSV rows
  const rows = companies.map(company => {
    return COLUMNS.map(column => {
      const value = company[column] || '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
}

/**
 * Download CSV file
 */
function downloadCSVFile(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
      } else {
        renderPreviewList(); // Show empty state
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

/**
 * Bulk send handler - sends emails to all filtered companies
 */
function initBulkSendHandler() {
  const sendButton = document.getElementById('bulk-send-btn');
  if (!sendButton) return;
  
  sendButton.addEventListener('click', async () => {
    await ensureCompanyDataInitialized();
    
    const subjectInput = document.getElementById('email-subject');
    const bodyTextarea = document.getElementById('email-body');
    const targetStatus = getStatusFilter();
    
    const subjectTemplate = subjectInput?.value?.trim() || '';
    const bodyTemplate = bodyTextarea?.value?.trim() || '';
    
    if (!bodyTemplate) {
      showErrorMessage('Bitte geben Sie eine Nachricht ein.');
      return;
    }
    
    const filteredCompanies = getRows().filter(c => c.Status === targetStatus);
    
    if (filteredCompanies.length === 0) {
      showErrorMessage(`Keine Firmen mit Status "${targetStatus}" gefunden.`);
      return;
    }
    
    // Validate companies have email addresses
    const companiesWithEmail = filteredCompanies.filter(c => c['E-mail'] && c['E-mail'].trim());
    const missingEmailCount = filteredCompanies.length - companiesWithEmail.length;
    
    if (companiesWithEmail.length === 0) {
      showErrorMessage('Keine der gefilterten Firmen hat eine E-Mail-Adresse.');
      return;
    }
    
    let warningMsg = `${companiesWithEmail.length} E-Mail(s) werden an die jeweiligen Kunden versendet`;
    if (missingEmailCount > 0) {
      warningMsg += ` (${missingEmailCount} Firma(en) ohne E-Mail werden übersprungen)`;
    }
    
    warningMsg += '. Fortfahren?';
    
    if (!confirm(warningMsg)) {
      return;
    }
    
    // Disable button and show progress
    sendButton.disabled = true;
    sendButton.textContent = 'Wird versendet...';
    
    try {
      const batchTimestamp = Date.now();
      const emailPayload = companiesWithEmail.map((companyData, idx) => {
        const personalizedSubject = applyVariableSubstitution(subjectTemplate, companyData);
        const personalizedBody = applyVariableSubstitution(bodyTemplate, companyData);
        
        // Always use actual customer email
        const recipientEmail = companyData['E-mail'].trim();
        
        return {
          id: `campaign_${batchTimestamp}_${idx}`,
          to: recipientEmail,
          recipientEmail: recipientEmail,
          subject: personalizedSubject || 'Nachricht von KA System',
          body: personalizedBody,
          status: 'approved',
          companyName: companyData.Firma || 'Unbekannt',
          timestamp: new Date().toISOString()
        };
      });
      
      const response = await fetch('./api/send-approved-emails-inline.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedEmails: emailPayload })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const successCount = result.count || result.sent || 0;
        const successMsg = `✅ ${successCount} E-Mail(s) erfolgreich an Kunden versendet!`;
        showSuccessMessage(successMsg);
        
        // Clear form after successful send
        if (bodyTextarea) bodyTextarea.value = '';
        if (subjectInput) subjectInput.value = '';
        renderPreviewList();
      } else {
        const errorMsg = result.message || result.error || 'Unbekannter Fehler';
        showErrorMessage(`❌ Fehler: ${errorMsg}`);
        
        if (result.details) {
          console.error('Send error details:', result.details);
        }
      }
      
    } catch (err) {
      console.error('Email send failed:', err);
      showErrorMessage(`❌ Netzwerkfehler: ${err.message}`);
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = 'E-Mails versenden';
    }
  });
}

/**
 * Apply variable substitution to template string
 */
function applyVariableSubstitution(template, dataRecord) {
  let output = template;
  
  // Handle special {{Begrüßung}} placeholder first
  if (output.includes('{{Begrüßung}}')) {
    const greeting = generateGreeting(dataRecord);
    output = output.split('{{Begrüßung}}').join(greeting);
  }
  
  COLUMNS.forEach(columnName => {
    const variablePattern = `{{${columnName}}}`;
    const replacementValue = dataRecord[columnName] || '';
    // Use split/join for better performance instead of regex
    output = output.split(variablePattern).join(replacementValue);
  });
  
  return output;
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
