// -----------------------------
// Email Notifications Module
// -----------------------------
// Integrates email notifications with various system events

import { queueEmailNotification, isEmailConfigured, getEmailConfig, markNotificationAsSent } from './email-config.js';

/**
 * Helper function to ask user if they want to send a notification
 * @param {string} message - Confirmation message
 * @returns {boolean} - True if user confirmed
 */
function confirmNotification(message) {
  return confirm(message);
}

// Helper to get email queue
function getEmailQueue() {
  try {
    const raw = localStorage.getItem('ka_email_queue');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load email queue:', error);
    return [];
  }
}

// Get notification template for email body
export function getNotificationTemplate(type, data) {
  const templates = {
    newCustomer: `
Neuer Kunde erstellt

Kunde: ${data.customerName}
Ansprechpartner: ${data.contactPerson}
E-Mail: ${data.email}
Telefon: ${data.phone}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    newOrder: `
Neuer Auftrag erstellt

Auftragsnummer: ${data.orderId}
Kunde: ${data.customerName}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Anzahl Artikel: ${data.items?.length ?? 0}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    newInvoice: `
Neue Rechnung erstellt

Rechnungsnummer: ${data.invoiceId}
Kunde: ${data.customerName}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Fälligkeitsdatum: ${data.dueDate}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    paymentReceived: `
Zahlung eingegangen

Rechnungsnummer: ${data.invoiceId}
Kunde: ${data.customerName}
Betrag: ${(data.amount || 0).toFixed(2)} €
Zahlungsdatum: ${data.paymentDate}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    orderDeleted: `
Auftrag gelöscht

Auftragsnummer: ${data.orderId}
Kunde: ${data.customerName}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Anzahl Artikel: ${data.items?.length ?? 0}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    invoiceDeleted: `
Rechnung gelöscht

Rechnungsnummer: ${data.invoiceId}
Kunde: ${data.customerName}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    invoiceOverdue: `
Rechnung überfällig

Rechnungsnummer: ${data.invoiceId}
Kunde: ${data.customerName}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Fälligkeitsdatum: ${data.dueDate}
Tage überfällig: ${data.daysPastDue}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`
  };
  
  return templates[type] || '';
}

// Get notification subject line
export function getNotificationSubject(type, data) {
  const subjects = {
    newCustomer: `Neuer Kunde: ${data.customerName}`,
    newOrder: `Neuer Auftrag: ${data.orderId}`,
    newInvoice: `Neue Rechnung: ${data.invoiceId}`,
    paymentReceived: `Zahlung eingegangen: ${data.invoiceId}`,
    orderDeleted: `Auftrag gelöscht: ${data.orderId}`,
    invoiceDeleted: `Rechnung gelöscht: ${data.invoiceId}`,
    invoiceOverdue: `Rechnung überfällig: ${data.invoiceId}`
  };
  
  return subjects[type] || 'KA System Benachrichtigung';
}

/**
 * Queue and immediately send a notification
 * This is used when the user confirms sending an email - we want to send it immediately
 * instead of requiring them to go to the dashboard to approve and send it manually
 * @param {string} type - Notification type
 * @param {object} data - Notification data
 * @returns {Promise<boolean>} - True if notification was sent successfully
 */
async function queueAndSendImmediately(type, data) {
  // Queue the notification
  const notificationId = queueEmailNotification(type, data);
  
  if (!notificationId) {
    return false;
  }
  
  // Get the notification from the queue
  const queue = getEmailQueue();
  const notification = queue.find(item => item.id === notificationId);
  
  if (!notification) {
    console.error('Failed to find queued notification');
    return false;
  }
  
  // Prepare email data for backend
  const subject = getNotificationSubject(type, data);
  const body = getNotificationTemplate(type, data);
  const to = notification.recipientEmail || '';
  
  // Validate recipient email
  if (!to) {
    console.error('No recipient email configured');
    showEmailSendingError('Keine Empfänger-E-Mail-Adresse konfiguriert. Bitte konfigurieren Sie eine E-Mail-Adresse in den Einstellungen.');
    return false;
  }
  
  const emailToSend = {
    to: to,
    subject: subject,
    body: body,
    notificationId: notificationId
  };
  
  try {
    // Call backend API to send the email immediately
    const response = await fetch('api/send-approved-emails-inline.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approvedEmails: [emailToSend]
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      // Mark as sent
      markNotificationAsSent(notificationId);
      console.log(`Email sent successfully: ${type}`, data);
      return true;
    } else {
      // Email sending failed - leave in queue as pending so user can try again from dashboard
      console.error('Email sending failed:', result.error || result.message);
      
      // Show user-friendly error message
      const errorMessage = result.error || result.message || 'Fehler beim Versenden der E-Mail.';
      showEmailSendingError(errorMessage);
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    showEmailSendingError(error.message);
    return false;
  }
}

/**
 * Show email sending error with consistent formatting
 * @param {string} errorMessage - The error message to display
 */
function showEmailSendingError(errorMessage) {
  alert(
    `E-Mail konnte nicht versendet werden:\n\n${errorMessage}\n\n` +
    `Die Benachrichtigung bleibt in der Warteschlange und kann später über das Dashboard versendet werden.`
  );
}

// Send notification when a new customer is created
export async function notifyNewCustomer(customerData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für den neuen Kunden "${customerData.firma || 'Unbekannt'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Queue and send immediately
  return await queueAndSendImmediately('newCustomer', {
    customerName: customerData.firma || 'Unbekannt',
    contactPerson: customerData.ansprechpartner || '',
    email: customerData.email || '',
    phone: customerData.telefon || '',
    timestamp: new Date().toISOString()
  });
}

// Send notification when a new order is created
export async function notifyNewOrder(orderData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für den neuen Auftrag "${orderData.orderId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Queue and send immediately
  return await queueAndSendImmediately('newOrder', {
    orderId: orderData.orderId || '',
    customerName: orderData.customerName || '',
    total: orderData.total || 0,
    items: orderData.items || [],
    timestamp: new Date().toISOString()
  });
}

// Send notification when a new invoice is created
export async function notifyNewInvoice(invoiceData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für die neue Rechnung "${invoiceData.invoiceId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Queue and send immediately
  return await queueAndSendImmediately('newInvoice', {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    total: invoiceData.total || 0,
    dueDate: invoiceData.dueDate || '',
    timestamp: new Date().toISOString()
  });
}

// Send notification when a payment is received
export async function notifyPaymentReceived(paymentData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für den Zahlungseingang der Rechnung "${paymentData.invoiceId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Queue and send immediately
  return await queueAndSendImmediately('paymentReceived', {
    invoiceId: paymentData.invoiceId || '',
    customerName: paymentData.customerName || '',
    amount: paymentData.amount || 0,
    paymentDate: paymentData.paymentDate || '',
    timestamp: new Date().toISOString()
  });
}

// Send notification when an order is deleted
export async function notifyOrderDeleted(orderData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für den gelöschten Auftrag "${orderData.orderId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Queue and send immediately
  return await queueAndSendImmediately('orderDeleted', {
    orderId: orderData.orderId || '',
    customerName: orderData.customerName || '',
    total: orderData.total || 0,
    items: orderData.items || [],
    timestamp: new Date().toISOString()
  });
}

// Send notification when an invoice is deleted
export async function notifyInvoiceDeleted(invoiceData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für die gelöschte Rechnung "${invoiceData.invoiceId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Queue and send immediately
  return await queueAndSendImmediately('invoiceDeleted', {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    total: invoiceData.total || 0,
    timestamp: new Date().toISOString()
  });
}

// Send notification when an invoice is overdue
export function notifyInvoiceOverdue(invoiceData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  return queueEmailNotification('invoiceOverdue', {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    total: invoiceData.total || 0,
    dueDate: invoiceData.dueDate || '',
    daysPastDue: invoiceData.daysPastDue || 0,
    timestamp: new Date().toISOString()
  });
}

// Show warning when email notification failed
export function showEmailNotificationWarning(itemType = 'Element', notificationType = null) {
  const config = getEmailConfig();
  
  if (!config.enabled) {
    // Don't show a warning if email is disabled - user made a conscious choice
    return;
  } else if (notificationType && !config.notificationSettings[notificationType]) {
    // Don't show a warning if this notification type is disabled
    return;
  }
}

// Show info when email notification was successfully queued
export function showEmailNotificationQueued(itemType = 'Element') {
  // No need to show feedback for user-confirmed notifications
  // The user already knows they confirmed sending the email
}
