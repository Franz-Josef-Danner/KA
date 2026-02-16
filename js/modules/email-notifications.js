// -----------------------------
// Email Notifications Module
// -----------------------------
// Integrates email notifications with various system events

import { queueEmailNotification, isEmailConfigured, getEmailConfig, markNotificationAsSent } from './email-config.js';
import { generatePDF } from './pdf-generator.js';

/**
 * Helper function to ask user if they want to send a notification
 * @param {string} message - Confirmation message
 * @returns {boolean} - True if user confirmed
 */
function confirmNotification(message) {
  return confirm(message);
}

/**
 * Generate PDF and convert to base64 for email attachment
 * @param {string} documentType - 'invoice' or 'order'
 * @param {object} documentData - The document data
 * @returns {Promise<object|null>} - Object with {data: base64String, filename: string} or null on error
 */
async function generatePDFAttachment(documentType, documentData) {
  try {
    // Generate the PDF document using standard template for customer-facing emails
    const pdfDoc = await generatePDF(documentType, documentData, false, null, true);
    
    if (!pdfDoc) {
      console.error('Failed to generate PDF for email attachment');
      return null;
    }
    
    // Convert PDF to base64
    const pdfBase64 = pdfDoc.output('datauristring'); // Returns "data:application/pdf;base64,..."
    const base64Data = pdfBase64.split(',')[1]; // Extract just the base64 part
    
    // Generate filename
    const dateString = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    let filename;
    if (documentType === 'invoice' || documentType === 'rechnung') {
      const invoiceId = documentData.invoiceId || documentData.Rechnungs_ID || 'N-A';
      filename = `Rechnung_${invoiceId}_${dateString}.pdf`;
    } else {
      const orderId = documentData.orderId || documentData.Auftrags_ID || 'N-A';
      filename = `Auftrag_${orderId}_${dateString}.pdf`;
    }
    
    return {
      data: base64Data,
      filename: filename
    };
  } catch (error) {
    console.error('Error generating PDF attachment:', error);
    return null;
  }
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
 * @param {object|null} attachment - Optional PDF attachment with {data: base64, filename: string}
 * @returns {Promise<boolean>} - True if notification was sent successfully
 */
async function queueAndSendImmediately(type, data, attachment = null) {
  // Queue the notification with bypassing notification settings check
  // since the user has already confirmed via dialog
  const notificationId = queueEmailNotification(type, data, true);
  
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
  
  // Add attachment if provided
  if (attachment) {
    emailToSend.attachment = attachment;
  }
  
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
export async function notifyNewOrder(orderData, fullDocument = null) {
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
  
  // Generate PDF attachment for the order
  // Use fullDocument if provided (should always be provided in practice),
  // otherwise construct a minimal document from orderData as fallback
  const documentForPdf = fullDocument || {
    Auftrags_ID: orderData.orderId,
    Firma: orderData.customerName,
    Ansprechpartner: orderData.contactPerson,
    Artikel: orderData.items,
    Projekt: orderData.project,
    Status: orderData.status
  };
  const pdfAttachment = await generatePDFAttachment('order', documentForPdf);
  
  // Queue and send immediately with attachment
  return await queueAndSendImmediately('newOrder', {
    orderId: orderData.orderId || '',
    customerName: orderData.customerName || '',
    total: orderData.total || 0,
    items: orderData.items || [],
    timestamp: new Date().toISOString()
  }, pdfAttachment);
}

// Send notification when a new invoice is created
export async function notifyNewInvoice(invoiceData, fullDocument = null) {
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
  
  // Generate PDF attachment for the invoice
  // Use fullDocument if provided, otherwise construct from invoiceData
  const documentForPdf = fullDocument || {
    Rechnungs_ID: invoiceData.invoiceId,
    Firma: invoiceData.customerName,
    Ansprechpartner: invoiceData.contactPerson,
    items: invoiceData.items,
    Projekt: invoiceData.project,
    Auftrags_ID: invoiceData.orderId
  };
  const pdfAttachment = await generatePDFAttachment('invoice', documentForPdf);
  
  // Queue and send immediately with attachment
  return await queueAndSendImmediately('newInvoice', {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    total: invoiceData.total || 0,
    dueDate: invoiceData.dueDate || '',
    timestamp: new Date().toISOString()
  }, pdfAttachment);
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
export async function notifyOrderDeleted(orderData, fullDocument = null) {
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
  
  // Generate PDF attachment for the deleted order
  // Use fullDocument if provided, otherwise construct from orderData
  const documentForPdf = fullDocument || {
    Auftrags_ID: orderData.orderId,
    Firma: orderData.customerName,
    Artikel: orderData.items
  };
  const pdfAttachment = await generatePDFAttachment('order', documentForPdf);
  
  // Queue and send immediately with attachment
  return await queueAndSendImmediately('orderDeleted', {
    orderId: orderData.orderId || '',
    customerName: orderData.customerName || '',
    total: orderData.total || 0,
    items: orderData.items || [],
    timestamp: new Date().toISOString()
  }, pdfAttachment);
}

// Send notification when an invoice is deleted
export async function notifyInvoiceDeleted(invoiceData, fullDocument = null) {
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
  
  // Generate PDF attachment for the deleted invoice
  // Use fullDocument if provided, otherwise construct from invoiceData
  const documentForPdf = fullDocument || {
    Rechnungs_ID: invoiceData.invoiceId,
    Firma: invoiceData.customerName,
    items: invoiceData.items
  };
  const pdfAttachment = await generatePDFAttachment('invoice', documentForPdf);
  
  // Queue and send immediately with attachment
  return await queueAndSendImmediately('invoiceDeleted', {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    total: invoiceData.total || 0,
    timestamp: new Date().toISOString()
  }, pdfAttachment);
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

/**
 * Send invoice to customer
 * @param {object} invoiceData - The complete invoice data
 * @param {string} customerEmail - Customer's email address
 * @returns {Promise<boolean>} - True if sent successfully
 */
export async function sendInvoiceToCustomer(invoiceData, customerEmail) {
  if (!customerEmail) {
    alert('Keine E-Mail-Adresse für diesen Kunden vorhanden. Bitte fügen Sie eine E-Mail-Adresse in der Firmenliste hinzu.');
    return false;
  }
  
  // Confirm before sending
  const shouldSend = confirm(
    `Rechnung "${invoiceData.Rechnungs_ID || 'N/A'}" an ${customerEmail} senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Show loading state
  const loadingMessage = 'PDF wird generiert und E-Mail wird versendet...';
  console.log(loadingMessage);
  
  try {
    // Generate PDF attachment
    const pdfAttachment = await generatePDFAttachment('invoice', invoiceData);
    
    if (!pdfAttachment) {
      alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
      return false;
    }
    
    // Prepare email data
    const subject = `Rechnung ${invoiceData.Rechnungs_ID || 'N/A'}`;
    const body = `Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung ${invoiceData.Rechnungs_ID || 'N/A'}.

Mit freundlichen Grüßen`;
    
    const emailData = {
      to: customerEmail,
      subject: subject,
      body: body,
      attachment: pdfAttachment
    };
    
    // Send email via backend
    const response = await fetch('api/send-approved-emails-inline.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approvedEmails: [emailData]
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert(`Rechnung erfolgreich an ${customerEmail} gesendet!`);
      return true;
    } else {
      const errorMessage = result.error || result.message || 'Unbekannter Fehler';
      alert(`Fehler beim Versenden der E-Mail:\n\n${errorMessage}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending invoice to customer:', error);
    alert(`Fehler beim Versenden der E-Mail:\n\n${error.message}`);
    return false;
  }
}

/**
 * Send order to customer
 * @param {object} orderData - The complete order data
 * @param {string} customerEmail - Customer's email address
 * @returns {Promise<boolean>} - True if sent successfully
 */
export async function sendOrderToCustomer(orderData, customerEmail) {
  if (!customerEmail) {
    alert('Keine E-Mail-Adresse für diesen Kunden vorhanden. Bitte fügen Sie eine E-Mail-Adresse in der Firmenliste hinzu.');
    return false;
  }
  
  // Confirm before sending
  const shouldSend = confirm(
    `Auftrag "${orderData.Auftrags_ID || 'N/A'}" an ${customerEmail} senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Show loading state
  const loadingMessage = 'PDF wird generiert und E-Mail wird versendet...';
  console.log(loadingMessage);
  
  try {
    // Generate PDF attachment
    const pdfAttachment = await generatePDFAttachment('order', orderData);
    
    if (!pdfAttachment) {
      alert('Fehler beim Generieren der PDF. Bitte versuchen Sie es erneut.');
      return false;
    }
    
    // Prepare email data
    const subject = `Auftrag ${orderData.Auftrags_ID || 'N/A'}`;
    const body = `Sehr geehrte Damen und Herren,

anbei erhalten Sie den Auftrag ${orderData.Auftrags_ID || 'N/A'}.

Mit freundlichen Grüßen`;
    
    const emailData = {
      to: customerEmail,
      subject: subject,
      body: body,
      attachment: pdfAttachment
    };
    
    // Send email via backend
    const response = await fetch('api/send-approved-emails-inline.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approvedEmails: [emailData]
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      alert(`Auftrag erfolgreich an ${customerEmail} gesendet!`);
      return true;
    } else {
      const errorMessage = result.error || result.message || 'Unbekannter Fehler';
      alert(`Fehler beim Versenden der E-Mail:\n\n${errorMessage}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending order to customer:', error);
    alert(`Fehler beim Versenden der E-Mail:\n\n${error.message}`);
    return false;
  }
}
