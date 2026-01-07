// -----------------------------
// Email Configuration Module
// -----------------------------
// Note: Server connection (IMAP/SMTP) is handled by backend
// This module only manages test email and notification preferences

const EMAIL_CONFIG_KEY = 'ka_email_config';

// Get email configuration from localStorage
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
    testEmail: '', // Test email address for development/testing purposes
    notificationSettings: {
      newCustomer: true,
      newOrder: true,
      newInvoice: true,
      paymentReceived: true
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

// Validate email configuration
export function validateEmailConfig(config) {
  const errors = [];
  
  // Only validate test email if provided
  if (config.testEmail && !isValidEmail(config.testEmail)) {
    errors.push('Bitte geben Sie eine gültige Test-E-Mail-Adresse ein.');
  }
  
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
export function queueEmailNotification(type, data) {
  const config = getEmailConfig();
  
  if (!config.enabled || !config.notificationSettings[type]) {
    return false;
  }
  
  // Use helper function to get the effective recipient email
  const recipientEmail = getRecipientEmail();
  
  // Generate unique ID for notification
  const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store notification in queue for future processing
  const queue = getEmailQueue();
  queue.push({
    id,
    type,
    data,
    recipientEmail: recipientEmail,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0
  });
  saveEmailQueue(queue);
  
  console.log(`Email notification queued: ${type}`, data);
  console.log(`Recipient: ${recipientEmail || 'Backend default'}${config.testEmail ? ' (Test Mode)' : ''}`);
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

// Get the effective recipient email (test email if set, otherwise backend default)
export function getRecipientEmail() {
  const config = getEmailConfig();
  return config.testEmail || null; // Returns test email or null (backend will use default)
}

// Test email configuration
// Note: This only validates the configuration format
export function testEmailConfig(config) {
  const errors = validateEmailConfig(config);
  
  if (errors.length > 0) {
    return {
      success: false,
      errors
    };
  }
  
  return {
    success: true,
    message: 'Konfiguration ist gültig. Die Server-Verbindung wird vom Backend verwaltet.'
  };
}
