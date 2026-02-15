// -----------------------------
// Email Notifications Module
// -----------------------------
// Integrates email notifications with various system events

import { queueEmailNotification, isEmailConfigured, getEmailConfig } from './email-config.js';

/**
 * Helper function to ask user if they want to send a notification
 * @param {string} message - Confirmation message
 * @returns {boolean} - True if user confirmed
 */
function confirmNotification(message) {
  return confirm(message);
}

// Send notification when a new customer is created
export function notifyNewCustomer(customerData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before queuing
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für den neuen Kunden "${customerData.firma || 'Unbekannt'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  return queueEmailNotification('newCustomer', {
    customerName: customerData.firma || 'Unbekannt',
    contactPerson: customerData.ansprechpartner || '',
    email: customerData.email || '',
    phone: customerData.telefon || '',
    timestamp: new Date().toISOString()
  });
}

// Send notification when a new order is created
export function notifyNewOrder(orderData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before queuing
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für den neuen Auftrag "${orderData.orderId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  return queueEmailNotification('newOrder', {
    orderId: orderData.orderId || '',
    customerName: orderData.customerName || '',
    total: orderData.total || 0,
    items: orderData.items || [],
    timestamp: new Date().toISOString()
  });
}

// Send notification when a new invoice is created
export function notifyNewInvoice(invoiceData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before queuing
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für die neue Rechnung "${invoiceData.invoiceId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  return queueEmailNotification('newInvoice', {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    total: invoiceData.total || 0,
    dueDate: invoiceData.dueDate || '',
    timestamp: new Date().toISOString()
  });
}

// Send notification when a payment is received
export function notifyPaymentReceived(paymentData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before queuing
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für den Zahlungseingang der Rechnung "${paymentData.invoiceId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  return queueEmailNotification('paymentReceived', {
    invoiceId: paymentData.invoiceId || '',
    customerName: paymentData.customerName || '',
    amount: paymentData.amount || 0,
    paymentDate: paymentData.paymentDate || '',
    timestamp: new Date().toISOString()
  });
}

// Send notification when an order is deleted
export function notifyOrderDeleted(orderData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before queuing
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für den gelöschten Auftrag "${orderData.orderId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  return queueEmailNotification('orderDeleted', {
    orderId: orderData.orderId || '',
    customerName: orderData.customerName || '',
    total: orderData.total || 0,
    items: orderData.items || [],
    timestamp: new Date().toISOString()
  });
}

// Send notification when an invoice is deleted
export function notifyInvoiceDeleted(invoiceData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Ask for confirmation before queuing
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung für die gelöschte Rechnung "${invoiceData.invoiceId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  return queueEmailNotification('invoiceDeleted', {
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
