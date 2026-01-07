// -----------------------------
// Email Service Module
// -----------------------------
import { getEmailConfig, getEmailTemplate } from './email-config.js';
import { getCompanySettings } from './settings.js';

// Queue for storing emails when backend is not available
const EMAIL_QUEUE_KEY = 'ka_email_queue';

/**
 * Send an email using configured service
 * Since this is a client-side application, emails are queued for backend processing
 * In a production environment, this would call a backend API
 */
export async function sendEmail(to, subject, htmlBody, textBody, attachments = []) {
  const config = getEmailConfig();

  if (!config.enabled) {
    console.warn('Email service is disabled');
    return {
      success: false,
      queued: false,
      message: 'E-Mail-Service ist deaktiviert'
    };
  }

  const email = {
    id: generateEmailId(),
    timestamp: new Date().toISOString(),
    from: {
      name: config.from.name,
      email: config.from.email
    },
    to: Array.isArray(to) ? to : [to],
    replyTo: config.replyTo || config.from.email,
    subject,
    html: htmlBody,
    text: textBody,
    attachments,
    status: 'pending'
  };

  // Queue the email for backend processing
  queueEmail(email);

  // In a real application, this would make an API call to the backend
  // For demonstration purposes, we'll simulate the API call
  console.log('Email queued for sending:', email);

  return {
    success: true,
    queued: true,
    emailId: email.id,
    message: 'E-Mail wurde zur Warteschlange hinzugefügt'
  };
}

/**
 * Send email using a template
 */
export async function sendTemplateEmail(templateType, to, templateData = {}) {
  const companySettings = getCompanySettings();
  
  // Merge company data with template data
  const data = {
    companyName: companySettings.companyName || 'KA System',
    loginUrl: window.location.origin + '/index.html',
    timestamp: new Date().toLocaleString('de-DE'),
    ...templateData
  };

  const template = getEmailTemplate(templateType, data);
  if (!template) {
    return {
      success: false,
      message: 'E-Mail-Vorlage nicht gefunden'
    };
  }

  return await sendEmail(to, template.subject, template.html, template.text);
}

/**
 * Send test email
 */
export async function sendTestEmail(testEmailAddress) {
  const config = getEmailConfig();
  
  if (!testEmailAddress || !isValidEmail(testEmailAddress)) {
    return {
      success: false,
      message: 'Bitte geben Sie eine gültige Test-E-Mail-Adresse ein'
    };
  }

  const companySettings = getCompanySettings();
  const data = {
    companyName: companySettings.companyName || 'KA System',
    timestamp: new Date().toLocaleString('de-DE')
  };

  const template = getEmailTemplate('test_email', data);
  if (!template) {
    return {
      success: false,
      message: 'Test-E-Mail-Vorlage nicht gefunden'
    };
  }

  return await sendEmail(testEmailAddress, template.subject, template.html, template.text);
}

/**
 * Queue email for later processing
 */
function queueEmail(email) {
  try {
    const queue = getEmailQueue();
    queue.push(email);
    localStorage.setItem(EMAIL_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Failed to queue email:', error);
    return false;
  }
}

/**
 * Get email queue
 */
export function getEmailQueue() {
  try {
    const raw = localStorage.getItem(EMAIL_QUEUE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load email queue:', error);
    return [];
  }
}

/**
 * Clear email queue
 */
export function clearEmailQueue() {
  try {
    localStorage.removeItem(EMAIL_QUEUE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear email queue:', error);
    return false;
  }
}

/**
 * Remove specific email from queue
 */
export function removeFromQueue(emailId) {
  try {
    const queue = getEmailQueue();
    const filteredQueue = queue.filter(email => email.id !== emailId);
    localStorage.setItem(EMAIL_QUEUE_KEY, JSON.stringify(filteredQueue));
    return true;
  } catch (error) {
    console.error('Failed to remove email from queue:', error);
    return false;
  }
}

/**
 * Mark email as sent
 */
export function markEmailAsSent(emailId) {
  try {
    const queue = getEmailQueue();
    const email = queue.find(e => e.id === emailId);
    if (email) {
      email.status = 'sent';
      email.sentAt = new Date().toISOString();
      localStorage.setItem(EMAIL_QUEUE_KEY, JSON.stringify(queue));
    }
    return true;
  } catch (error) {
    console.error('Failed to mark email as sent:', error);
    return false;
  }
}

/**
 * Mark email as failed
 */
export function markEmailAsFailed(emailId, errorMessage) {
  try {
    const queue = getEmailQueue();
    const email = queue.find(e => e.id === emailId);
    if (email) {
      email.status = 'failed';
      email.error = errorMessage;
      email.failedAt = new Date().toISOString();
      localStorage.setItem(EMAIL_QUEUE_KEY, JSON.stringify(queue));
    }
    return true;
  } catch (error) {
    console.error('Failed to mark email as failed:', error);
    return false;
  }
}

/**
 * Generate unique email ID
 */
function generateEmailId() {
  return 'email_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

/**
 * Validate email address
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Export email queue as JSON for backend processing
 */
export function exportEmailQueue() {
  const queue = getEmailQueue();
  const json = JSON.stringify(queue, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `email_queue_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
