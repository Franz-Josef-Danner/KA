// -----------------------------
// Email Configuration Module
// -----------------------------
// Note: Server connection (IMAP/SMTP) is handled by backend
// This module only manages test email and notification preferences

const EMAIL_CONFIG_KEY = 'ka_email_config';

// API endpoints
const API_BASE_URL = './api';
const SAVE_EMAIL_CONFIG_ENDPOINT = `${API_BASE_URL}/save-email-config.php`;
const LOAD_EMAIL_CONFIG_ENDPOINT = `${API_BASE_URL}/load-email-config.php`;

// Flag to track if we're using API storage
let usingApiStorage = true;

// Get email configuration from localStorage (synchronous fallback)
export function getEmailConfig() {
  try {
    const raw = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (!raw) {
      return getDefaultEmailConfig();
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load email configuration:', error);
    return getDefaultEmailConfig();
  }
}

// Get default email configuration structure
function getDefaultEmailConfig() {
  return {
    enabled: false,
    notificationSettings: {
      newOrder: true,
      newInvoice: true,
      paymentReceived: true,
      orderDeleted: true,
      invoiceDeleted: true,
      invoiceOverdue: true
    }
  };
}

// Save email configuration to localStorage
export function saveEmailConfig(config) {
  try {
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save email configuration:', error);
    return false;
  }
}

/**
 * Load email configuration from server via API
 */
async function loadEmailConfigFromServer() {
  try {
    const response = await fetch(LOAD_EMAIL_CONFIG_ENDPOINT, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown server error');
    }

    return result.data;
  } catch (error) {
    console.error('Failed to load email config from server:', error);
    return null;
  }
}

/**
 * Save email configuration to server via API
 */
async function saveEmailConfigToServer(config) {
  try {
    const response = await fetch(SAVE_EMAIL_CONFIG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Unknown server error');
    }

    return true;
  } catch (error) {
    console.error('Failed to save email config to server:', error);
    return false;
  }
}

/**
 * Load email configuration from server or localStorage (async version)
 * Tries server first, falls back to localStorage if server fails
 */
export async function loadEmailConfigAsync() {
  // Try to load from server first
  const serverData = await loadEmailConfigFromServer();
  
  if (serverData) {
    usingApiStorage = true;
    // Save to localStorage as cache
    saveEmailConfig(serverData);
    return serverData;
  }
  
  // Fallback to localStorage
  usingApiStorage = false;
  console.log('Falling back to localStorage for email config');
  return getEmailConfig();
}

/**
 * Save email configuration to server or localStorage (async version)
 * Tries server first, falls back to localStorage if server fails
 */
export async function saveEmailConfigAsync(config) {
  // Always save to localStorage first as backup
  const localSaved = saveEmailConfig(config);
  
  // Try to save to server
  const serverSaved = await saveEmailConfigToServer(config);
  
  if (serverSaved) {
    usingApiStorage = true;
    return true;
  }
  
  // If server save fails, localStorage is still updated
  usingApiStorage = false;
  console.warn('Server save failed for email config, using localStorage only');
  return localSaved;
}

// Validate email configuration
// Note: Kept for compatibility with einstellungen.html form validation.
// Currently no validation is needed since testEmail was removed.
// Customer email validation happens at notification time in queueEmailNotification().
export function validateEmailConfig(config) {
  const errors = [];
  return errors;
}

// Simple email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if email is configured and enabled
export function isEmailConfigured() {
  const config = getEmailConfig();
  // Backend handles server configuration, we just check if enabled
  return config.enabled;
}

// Queue email notification
// Note: This is a placeholder for future backend integration
// Frontend cannot send emails directly
export function queueEmailNotification(type, data, bypassNotificationSettings = false) {
  const config = getEmailConfig();
  
  // Check if email is enabled
  if (!config.enabled) {
    return false;
  }
  
  // Check notification settings unless explicitly bypassed (e.g., when user confirms via dialog)
  if (!bypassNotificationSettings && !config.notificationSettings[type]) {
    return false;
  }
  
  // Get customer email - this is now the ONLY recipient
  const customerEmail = data.customerEmail || '';
  
  // Validate customer email exists
  if (!customerEmail) {
    console.error('Cannot queue email notification: No customer email address provided');
    return false;
  }
  
  // Validate email format
  if (!isValidEmail(customerEmail)) {
    console.error('Cannot queue email notification: Invalid customer email address format');
    return false;
  }
  
  // Generate unique ID for notification
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  // Store notification in queue for future processing
  const queue = getEmailQueue();
  queue.push({
    id,
    type,
    data,
    recipientEmail: customerEmail, // Always use customer email
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0
  });
  saveEmailQueue(queue);
  
  console.log(`Email notification queued: ${type}`, data);
  console.log(`Recipient: ${customerEmail}`);
  return id; // Return ID for tracking
}

// Get email notification queue
function getEmailQueue() {
  try {
    const raw = localStorage.getItem('ka_email_queue');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load email queue:', error);
    return [];
  }
}

// Save email notification queue
function saveEmailQueue(queue) {
  try {
    localStorage.setItem('ka_email_queue', JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Failed to save email queue:', error);
    return false;
  }
}

// Clear email notification queue
export function clearEmailQueue() {
  try {
    localStorage.removeItem('ka_email_queue');
    return true;
  } catch (error) {
    console.error('Failed to clear email queue:', error);
    return false;
  }
}

// Get pending email notifications
export function getPendingNotifications() {
  return getEmailQueue().filter(item => item.status === 'pending');
}

// Get failed email notifications
export function getFailedNotifications() {
  return getEmailQueue().filter(item => item.status === 'failed');
}

// Mark notification as failed
export function markNotificationAsFailed(notificationId, errorMessage) {
  const queue = getEmailQueue();
  const notification = queue.find(item => item.id === notificationId);
  
  if (notification) {
    notification.status = 'failed';
    notification.error = errorMessage;
    notification.failedAt = new Date().toISOString();
    saveEmailQueue(queue);
    return true;
  }
  
  return false;
}

// Mark notification as sent
export function markNotificationAsSent(notificationId) {
  const queue = getEmailQueue();
  const notification = queue.find(item => item.id === notificationId);
  
  if (notification) {
    notification.status = 'sent';
    notification.sentAt = new Date().toISOString();
    saveEmailQueue(queue);
    return true;
  }
  
  return false;
}

// Retry failed notification
export function retryFailedNotification(notificationId) {
  const queue = getEmailQueue();
  const notification = queue.find(item => item.id === notificationId);
  
  if (notification && notification.status === 'failed') {
    notification.status = 'pending';
    delete notification.error;
    delete notification.failedAt;
    notification.retryCount = (notification.retryCount || 0) + 1;
    saveEmailQueue(queue);
    return true;
  }
  
  return false;
}

// Get error summary for display
export function getEmailErrorSummary() {
  const failed = getFailedNotifications();
  
  if (failed.length === 0) {
    return null;
  }
  
  return {
    count: failed.length,
    latest: failed[failed.length - 1],
    message: `${failed.length} E-Mail-Benachrichtigung${failed.length > 1 ? 'en' : ''} konnte${failed.length > 1 ? 'n' : ''} nicht gesendet werden.`
  };
}
