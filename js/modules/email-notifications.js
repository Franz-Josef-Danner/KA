// -----------------------------
// Email Notifications Module
// -----------------------------
// Integrates email notifications with various system events

import { queueEmailNotification, isEmailConfigured, getEmailConfig, markNotificationAsSent } from './email-config.js';
import { generatePDF } from './pdf-generator.js';
import { getRows as getFirmenRows, ensureInitialized as ensureFirmenInitialized } from './state.js';

// Constants for error messages
const MISSING_EMAIL_ALERT_MESSAGE = 'E-Mail-Benachrichtigung kann nicht gesendet werden: Keine E-Mail-Adresse für diesen Kunden vorhanden.';
const SEND_FAILED_ALERT_MESSAGE = 'E-Mail-Benachrichtigung konnte nicht gesendet werden. Bitte überprüfen Sie die E-Mail-Adresse.';

// Customer portal login URL
const CUSTOMER_LOGIN_URL = 'https://www.franzjosef-danner.at/accounting/kundenbereiche.html';

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

/**
 * Get company data from Firmenliste by company name
 * @param {string} firmaName - Company name to search for
 * @returns {Promise<object|null>} - Company data or null if not found
 */
async function getCompanyData(firmaName) {
  try {
    await ensureFirmenInitialized();
    const companies = getFirmenRows();
    const company = companies.find(c => c.Firma === firmaName);
    return company || null;
  } catch (error) {
    console.error('Failed to get company data:', error);
    return null;
  }
}

/**
 * Generate personalized greeting based on company data
 * Uses the same logic as kampagnen module for consistency
 * @param {object} company - Company data from Firmenliste
 * @returns {string} - Personalized greeting
 */
function generateGreeting(company) {
  if (!company) {
    return 'Sehr geehrte Damen und Herren';
  }
  
  const geschlecht = company.Geschlecht?.trim();
  const nachname = company.Nachname?.trim() || '';
  const vorname = company.Vorname?.trim() || '';
  const firma = company.Firma?.trim() || '';
  const persoenlich = company.Persönlich === 'true' || company.Persönlich === true;
  
  if (!geschlecht) {
    // No gender selected: use company team greeting
    if (firma) {
      return `Liebes ${firma}-Team`;
    } else {
      return 'Sehr geehrte Damen und Herren';
    }
  } else if (geschlecht === 'Mann') {
    // Male: check if personal checkbox is activated
    if (persoenlich && vorname) {
      return `Lieber ${vorname}`;
    } else if (nachname) {
      return `Sehr geehrter Herr ${nachname}`;
    } else if (firma) {
      return `Liebes ${firma}-Team`;
    } else {
      return 'Sehr geehrte Damen und Herren';
    }
  } else if (geschlecht === 'Frau') {
    // Female: check if personal checkbox is activated
    if (persoenlich && vorname) {
      return `Liebe ${vorname}`;
    } else if (nachname) {
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

// Get notification template for email body
export async function getNotificationTemplate(type, data) {
  // Get company data to check Persönlich checkbox
  const company = data.customerName ? await getCompanyData(data.customerName) : null;
  const isPersoenlich = company ? (company.Persönlich === 'true' || company.Persönlich === true) : false;
  const greeting = generateGreeting(company);
  
  const templates = {
    newCustomer: `
Neuer Kunde erstellt

Kunde: ${data.customerName}
Ansprechpartner: ${data.contactPerson}
E-Mail: ${data.email}
Telefon: ${data.phone}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    newOrder: isPersoenlich ? `${greeting},

ich habe den folgenden Auftrag angelegt.

Auftragsnummer: ${data.orderId}
Kunde: ${data.customerName}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Anzahl Artikel: ${data.items?.length ?? 0}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}

Bei Unklarheiten bitte einfach melden.

LG
Franz` : `${greeting},

der folgende Auftrag wurde erfolgreich angelegt.

Auftragsnummer: ${data.orderId}
Kunde: ${data.customerName}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Anzahl Artikel: ${data.items?.length ?? 0}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}

Diese Nachricht dient als automatische Bestätigung der Auftragserfassung.

Bei Rückfragen antworten Sie bitte direkt auf diese E-Mail.

Mit freundlichen Grüßen
Franz Josef Danner`,
    newInvoice: isPersoenlich ? `${greeting},

hier ist die aktuelle Rechnung.

Rechnungsnummer: ${data.invoiceId}
Kunde: ${data.customerName}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Anzahl Artikel: ${data.items?.length ?? 0}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}

Sollte etwas nicht stimmen, bitte Bescheid geben.

LG
Franz` : `${greeting},

eine neue Rechnung wurde erfolgreich erstellt.

Rechnungsnummer: ${data.invoiceId}
Kunde: ${data.customerName}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Anzahl Artikel: ${data.items?.length ?? 0}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}${data.dueDate ? `
Fälligkeitsdatum: ${data.dueDate}` : ''}

Bitte überweisen Sie den Betrag fristgerecht.

Bei Fragen stehen wir gerne zur Verfügung.

Mit freundlichen Grüßen
Franz Josef Danner`,
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
`,
    customerWelcome: `
${data.customerName ? `Guten Tag,` : `Sehr geehrte Damen und Herren,`}

willkommen bei unserem Kundenbereich!

Ihre Zugangsdaten lauten:

Benutzername: ${data.username}
Passwort: ${data.password}

Sie können sich unter folgendem Link einloggen:
${data.loginLink}

Bitte bewahren Sie diese Zugangsdaten sicher auf.

Mit freundlichen Grüßen
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
    invoiceOverdue: `Rechnung überfällig: ${data.invoiceId}`,
    customerWelcome: `Willkommen - Ihre Zugangsdaten zum Kundenbereich`
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
  const body = await getNotificationTemplate(type, data);
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
  
  // Check if customer email exists
  const customerEmail = customerData.email || '';
  if (!customerEmail) {
    alert('E-Mail-Benachrichtigung kann nicht gesendet werden: Keine E-Mail-Adresse für diesen Kunden vorhanden.');
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung an ${customerEmail} für den neuen Kunden "${customerData.firma || 'Unbekannt'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Queue and send immediately
  const result = await queueAndSendImmediately('newCustomer', {
    customerName: customerData.firma || 'Unbekannt',
    contactPerson: customerData.ansprechpartner || '',
    email: customerEmail,
    customerEmail: customerEmail,
    phone: customerData.telefon || '',
    timestamp: new Date().toISOString()
  });
  
  if (!result) {
    alert(SEND_FAILED_ALERT_MESSAGE);
  }
  
  return result;
}

/**
 * Send welcome email with credentials to a new customer
 * 
 * SECURITY NOTE: This function sends passwords in plain text via email.
 * While not ideal from a security perspective, this matches the existing
 * pattern in the codebase where passwords are shown to admins in the UI.
 * For improved security, consider implementing:
 * - A temporary one-time password that expires after first login
 * - A secure password reset link instead of sending the password
 * - Allowing users to set their own password upon first login
 * 
 * @param {object} customerData - Customer data including email, password, and username
 * @returns {Promise<boolean>} - True if email was sent successfully
 */
export async function sendCustomerWelcomeEmail(customerData) {
  const customerEmail = customerData.email;
  const username = customerData.username || customerEmail;
  const password = customerData.password;
  const customerName = customerData.customerName;
  
  if (!customerEmail) {
    console.error('Cannot send welcome email: No customer email provided');
    return false;
  }
  
  if (!password) {
    console.error('Cannot send welcome email: No password provided');
    return false;
  }
  
  try {
    // Prepare email data
    const subject = getNotificationSubject('customerWelcome', {});
    const body = await getNotificationTemplate('customerWelcome', {
      username: username,
      password: password,
      loginLink: CUSTOMER_LOGIN_URL,
      customerName: customerName
    });
    
    const emailData = {
      to: customerEmail,
      subject: subject,
      body: body
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
      console.log(`Welcome email sent successfully to ${customerEmail}`);
      return true;
    } else {
      const errorMessage = result.error || result.message || 'Fehler beim Versenden der E-Mail.';
      console.error('Welcome email sending failed:', errorMessage);
      return false;
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

// Send notification when a new order is created
export async function notifyNewOrder(orderData, fullDocument = null) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Check if customer email exists
  const customerEmail = orderData.customerEmail || '';
  if (!customerEmail) {
    alert('E-Mail-Benachrichtigung kann nicht gesendet werden: Keine E-Mail-Adresse für diesen Kunden vorhanden.');
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung an ${customerEmail} für den neuen Auftrag "${orderData.orderId || 'N/A'}" senden?`
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
  const result = await queueAndSendImmediately('newOrder', {
    orderId: orderData.orderId || '',
    customerName: orderData.customerName || '',
    customerEmail: customerEmail,
    total: orderData.total || 0,
    items: orderData.items || [],
    timestamp: new Date().toISOString()
  }, pdfAttachment);
  
  if (!result) {
    alert(SEND_FAILED_ALERT_MESSAGE);
  }
  
  return result;
}

// Send notification when a new invoice is created
export async function notifyNewInvoice(invoiceData, fullDocument = null) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Check if customer email exists
  const customerEmail = invoiceData.customerEmail || '';
  if (!customerEmail) {
    alert('E-Mail-Benachrichtigung kann nicht gesendet werden: Keine E-Mail-Adresse für diesen Kunden vorhanden.');
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung an ${customerEmail} für die neue Rechnung "${invoiceData.invoiceId || 'N/A'}" senden?`
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
  const result = await queueAndSendImmediately('newInvoice', {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    customerEmail: customerEmail,
    total: invoiceData.total || 0,
    dueDate: invoiceData.dueDate || '',
    timestamp: new Date().toISOString()
  }, pdfAttachment);
  
  if (!result) {
    alert(SEND_FAILED_ALERT_MESSAGE);
  }
  
  return result;
}

// Send notification when a payment is received
export async function notifyPaymentReceived(paymentData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Check if customer email exists
  const customerEmail = paymentData.customerEmail || '';
  if (!customerEmail) {
    alert('E-Mail-Benachrichtigung kann nicht gesendet werden: Keine E-Mail-Adresse für diesen Kunden vorhanden.');
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung an ${customerEmail} für den Zahlungseingang der Rechnung "${paymentData.invoiceId || 'N/A'}" senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
  // Queue and send immediately
  const result = await queueAndSendImmediately('paymentReceived', {
    invoiceId: paymentData.invoiceId || '',
    customerName: paymentData.customerName || '',
    customerEmail: customerEmail,
    amount: paymentData.amount || 0,
    paymentDate: paymentData.paymentDate || '',
    timestamp: new Date().toISOString()
  });
  
  if (!result) {
    alert(SEND_FAILED_ALERT_MESSAGE);
  }
  
  return result;
}

// Send notification when an order is deleted
export async function notifyOrderDeleted(orderData, fullDocument = null) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Check if customer email exists
  const customerEmail = orderData.customerEmail || '';
  if (!customerEmail) {
    alert('E-Mail-Benachrichtigung kann nicht gesendet werden: Keine E-Mail-Adresse für diesen Kunden vorhanden.');
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung an ${customerEmail} für den gelöschten Auftrag "${orderData.orderId || 'N/A'}" senden?`
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
  const result = await queueAndSendImmediately('orderDeleted', {
    orderId: orderData.orderId || '',
    customerName: orderData.customerName || '',
    customerEmail: customerEmail,
    total: orderData.total || 0,
    items: orderData.items || [],
    timestamp: new Date().toISOString()
  }, pdfAttachment);
  
  if (!result) {
    alert(SEND_FAILED_ALERT_MESSAGE);
  }
  
  return result;
}

// Send notification when an invoice is deleted
export async function notifyInvoiceDeleted(invoiceData, fullDocument = null) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Check if customer email exists
  const customerEmail = invoiceData.customerEmail || '';
  if (!customerEmail) {
    alert('E-Mail-Benachrichtigung kann nicht gesendet werden: Keine E-Mail-Adresse für diesen Kunden vorhanden.');
    return false;
  }
  
  // Ask for confirmation before sending
  const shouldSend = confirmNotification(
    `Möchten Sie eine E-Mail-Benachrichtigung an ${customerEmail} für die gelöschte Rechnung "${invoiceData.invoiceId || 'N/A'}" senden?`
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
  const result = await queueAndSendImmediately('invoiceDeleted', {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    customerEmail: customerEmail,
    total: invoiceData.total || 0,
    timestamp: new Date().toISOString()
  }, pdfAttachment);
  
  if (!result) {
    alert(SEND_FAILED_ALERT_MESSAGE);
  }
  
  return result;
}

// Send notification when an invoice is overdue
export function notifyInvoiceOverdue(invoiceData) {
  if (!isEmailConfigured()) {
    return false;
  }
  
  // Check if customer email exists
  const customerEmail = invoiceData.customerEmail || '';
  if (!customerEmail) {
    console.error('Overdue invoice notification cannot be sent: No customer email address');
    return false;
  }
  
  return queueEmailNotification('invoiceOverdue', {
    invoiceId: invoiceData.invoiceId || '',
    customerName: invoiceData.customerName || '',
    customerEmail: customerEmail,
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
  // Confirm before sending
  const shouldSend = confirm(
    `Rechnung "${invoiceData.Rechnungs_ID || 'N/A'}" an ${customerEmail} senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
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
  // Confirm before sending
  const shouldSend = confirm(
    `Auftrag "${orderData.Auftrags_ID || 'N/A'}" an ${customerEmail} senden?`
  );
  
  if (!shouldSend) {
    return false;
  }
  
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
