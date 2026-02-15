// -----------------------------
// Email Notifications Module
// -----------------------------
// Integrates email notifications with various system events

import { queueEmailNotification, isEmailConfigured, getEmailConfig } from './email-config.js';

// Send notification when a new customer is created
export function notifyNewCustomer(customerData) {
  if (!isEmailConfigured()) {
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
    alert(`⚠️ Hinweis: E-Mail-Benachrichtigungen sind nicht aktiviert.\n\n${itemType} wurde erfolgreich gespeichert, aber es wurde keine E-Mail-Benachrichtigung versendet.\n\nBitte aktivieren Sie E-Mail-Benachrichtigungen in den Einstellungen, wenn Sie automatische Benachrichtigungen erhalten möchten.`);
  } else if (notificationType && !config.notificationSettings[notificationType]) {
    const typeLabels = {
      newOrder: 'für neue Aufträge',
      newInvoice: 'für neue Rechnungen',
      newCustomer: 'für neue Kunden',
      paymentReceived: 'für Zahlungseingänge',
      orderDeleted: 'für gelöschte Aufträge',
      invoiceDeleted: 'für gelöschte Rechnungen',
      invoiceOverdue: 'für überfällige Rechnungen'
    };
    const typeLabel = typeLabels[notificationType] || 'für diesen Typ';
    alert(`⚠️ Hinweis: E-Mail-Benachrichtigungen ${typeLabel} sind deaktiviert.\n\n${itemType} wurde erfolgreich gespeichert, aber es wurde keine E-Mail-Benachrichtigung versendet.\n\nBitte aktivieren Sie diese Benachrichtigungen in den Einstellungen, wenn Sie automatische Benachrichtigungen erhalten möchten.`);
  } else {
    // Some other reason for failure
    alert(`⚠️ Hinweis: E-Mail-Benachrichtigung konnte nicht versendet werden.\n\n${itemType} wurde erfolgreich gespeichert, aber die E-Mail-Benachrichtigung konnte nicht in die Warteschlange eingereiht werden.\n\nBitte prüfen Sie Ihre E-Mail-Einstellungen.`);
  }
}

// Show info when email notification was successfully queued
export function showEmailNotificationQueued(itemType = 'Element') {
  alert(`ℹ️ ${itemType} wurde gespeichert.\n\nE-Mail-Benachrichtigung wurde in die Warteschlange eingereiht.\n\nHinweis: Die aktuelle Version speichert nur Benachrichtigungen. Für den tatsächlichen E-Mail-Versand ist eine Backend-Integration erforderlich.`);
}
