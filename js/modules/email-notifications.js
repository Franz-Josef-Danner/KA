// -----------------------------
// Email Notifications Module
// -----------------------------
// Integrates email notifications with various system events

import { queueEmailNotification, isEmailConfigured, getEmailConfig } from './email-config.js';
import { generatePDF } from './pdf-generator.js';

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
export async function notifyNewOrder(orderData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Generate PDF for the order
  let pdfBase64 = null;
  let pdfFilename = null;
  try {
    const pdfDoc = await generatePDF('auftrag', orderData);
    if (pdfDoc) {
      const pdfBlob = pdfDoc.output('blob');
      pdfBase64 = await blobToBase64(pdfBlob);
      pdfFilename = `Auftrag_${orderData.orderId || orderData.Auftrags_ID || 'unbekannt'}.pdf`;
    }
  } catch (error) {
    console.error('Failed to generate PDF for order notification:', error);
  }
  
  const notificationData = {
    orderId: orderData.orderId || '',
    customerName: orderData.customerName || '',
    customerEmail: orderData.customerEmail || orderData.Firmen_Email || '',
    total: orderData.total || 0,
    items: orderData.items || [],
    timestamp: new Date().toISOString()
  };
  
  // Add PDF attachment if generated successfully
  if (pdfBase64 && pdfFilename) {
    notificationData.attachments = [{
      filename: pdfFilename,
      content: pdfBase64,
      encoding: 'base64'
    }];
  }
  
  return queueEmailNotification('newOrder', notificationData);
}

// Send notification when a new invoice is created
export async function notifyNewInvoice(invoiceData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Generate PDF for the invoice
  let pdfBase64 = null;
  let pdfFilename = null;
  try {
    const pdfDoc = await generatePDF('rechnung', invoiceData);
    if (pdfDoc) {
      const pdfBlob = pdfDoc.output('blob');
      pdfBase64 = await blobToBase64(pdfBlob);
      pdfFilename = `Rechnung_${invoiceData.invoiceId || invoiceData.Rechnungs_ID || 'unbekannt'}.pdf`;
    }
  } catch (error) {
    console.error('Failed to generate PDF for invoice notification:', error);
  }
  
  const notificationData = {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    customerEmail: invoiceData.customerEmail || invoiceData.Firmen_Email || '',
    total: invoiceData.total || 0,
    dueDate: invoiceData.dueDate || '',
    timestamp: new Date().toISOString()
  };
  
  // Add PDF attachment if generated successfully
  if (pdfBase64 && pdfFilename) {
    notificationData.attachments = [{
      filename: pdfFilename,
      content: pdfBase64,
      encoding: 'base64'
    }];
  }
  
  return queueEmailNotification('newInvoice', notificationData);
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
    paymentReceived: `Zahlung eingegangen: ${data.invoiceId}`
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
      paymentReceived: 'für Zahlungseingänge'
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

// Helper function to convert Blob to Base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove the data:application/pdf;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
