#!/usr/bin/env node

/**
 * Email Sender Backend Script
 * 
 * This script processes email notifications from a queue and sends them via SMTP.
 * Can be run as a cronjob or as a standalone process.
 * 
 * Usage:
 *   node email-sender.js
 * 
 * Cronjob example (every 5 minutes):
 *   */5 * * * * cd /path/to/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configuration file path (should be kept secure, outside of git)
const CONFIG_FILE = path.join(__dirname, 'config.json');
const QUEUE_FILE = path.join(__dirname, 'email-queue.json');

/**
 * Load configuration from file
 */
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      console.error('❌ Configuration file not found:', CONFIG_FILE);
      console.log('📝 Please create config.json with your email settings.');
      console.log('   See config.example.json for the template.');
      process.exit(1);
    }
    
    const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ Error loading configuration:', error.message);
    process.exit(1);
  }
}

/**
 * Load email queue from file
 */
function loadQueue() {
  try {
    if (!fs.existsSync(QUEUE_FILE)) {
      return [];
    }
    
    const queueData = fs.readFileSync(QUEUE_FILE, 'utf8');
    return JSON.parse(queueData);
  } catch (error) {
    console.error('⚠️  Error loading queue:', error.message);
    return [];
  }
}

/**
 * Save email queue to file
 */
function saveQueue(queue) {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error saving queue:', error.message);
    return false;
  }
}

/**
 * Get email template based on notification type
 */
function getEmailTemplate(type, data) {
  const templates = {
    newCustomer: `
Neuer Kunde erstellt

Kunde: ${data.customerName || 'Unbekannt'}
Ansprechpartner: ${data.contactPerson || '-'}
E-Mail: ${data.email || '-'}
Telefon: ${data.phone || '-'}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    newOrder: `
Neuer Auftrag erstellt

Auftragsnummer: ${data.orderId || '-'}
Kunde: ${data.customerName || 'Unbekannt'}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Anzahl Artikel: ${data.items?.length || 0}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    newInvoice: `
Neue Rechnung erstellt

Rechnungsnummer: ${data.invoiceId || '-'}
Kunde: ${data.customerName || 'Unbekannt'}
Gesamtsumme: ${(data.total || 0).toFixed(2)} €
Fälligkeitsdatum: ${data.dueDate || '-'}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    paymentReceived: `
Zahlung eingegangen

Rechnungsnummer: ${data.invoiceId || '-'}
Kunde: ${data.customerName || 'Unbekannt'}
Betrag: ${(data.amount || 0).toFixed(2)} €
Zahlungsdatum: ${data.paymentDate || '-'}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}
`,
    contactMessage: `
Kontaktformular-Nachricht

Von: ${data.senderName || 'Unbekannt'}
E-Mail: ${data.senderEmail || '-'}
Betreff: ${data.subject || '-'}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}

Nachricht:
${data.message || '(Keine Nachricht)'}

---
Diese Nachricht wurde über das Kontaktformular im KA System gesendet.
`
  };
  
  return templates[type] || `Benachrichtigung: ${type}\n\n${JSON.stringify(data, null, 2)}`;
}

/**
 * Get email subject based on notification type
 */
function getEmailSubject(type, data) {
  const subjects = {
    newCustomer: `Neuer Kunde: ${data.customerName || 'Unbekannt'}`,
    newOrder: `Neuer Auftrag: ${data.orderId || '-'}`,
    newInvoice: `Neue Rechnung: ${data.invoiceId || '-'}`,
    paymentReceived: `Zahlung eingegangen: ${data.invoiceId || '-'}`,
    contactMessage: `Kontaktanfrage: ${data.subject || 'Kein Betreff'}`
  };
  
  return subjects[type] || 'KA System Benachrichtigung';
}

/**
 * Send email via SMTP
 */
async function sendEmail(config, notification) {
  const { type, data, recipientEmail } = notification;
  
  // Determine recipient: use recipientEmail if provided (test mode), otherwise use config email
  const recipient = recipientEmail || config.email;
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure, // true for 465, false for other ports
    auth: {
      user: config.email,
      pass: config.password
    }
  });
  
  // Email options
  const mailOptions = {
    from: `"${config.fromName || 'KA System'}" <${config.email}>`,
    to: recipient,
    subject: getEmailSubject(type, data),
    text: getEmailTemplate(type, data)
  };
  
  // Send email
  const info = await transporter.sendMail(mailOptions);
  
  return info;
}

/**
 * Process email queue
 */
async function processQueue() {
  console.log('🚀 Starting email queue processor...');
  console.log('⏰ Time:', new Date().toLocaleString('de-DE'));
  
  const config = loadConfig();
  const queue = loadQueue();
  
  if (queue.length === 0) {
    console.log('📭 Queue is empty. Nothing to send.');
    return;
  }
  
  console.log(`📬 Found ${queue.length} notification(s) in queue.`);
  
  let processedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < queue.length; i++) {
    const notification = queue[i];
    
    // Skip already sent or failed notifications
    if (notification.status === 'sent') {
      continue;
    }
    
    try {
      console.log(`📤 Sending notification ${i + 1}/${queue.length}: ${notification.type}`);
      
      const info = await sendEmail(config, notification);
      
      // Mark as sent
      notification.status = 'sent';
      notification.sentAt = new Date().toISOString();
      notification.messageId = info.messageId;
      
      processedCount++;
      console.log(`✅ Successfully sent: ${notification.type} (Message ID: ${info.messageId})`);
      
    } catch (error) {
      console.error(`❌ Error sending notification ${i + 1}:`, error.message);
      
      // Mark as failed
      notification.status = 'failed';
      notification.error = error.message;
      notification.failedAt = new Date().toISOString();
      notification.retryCount = (notification.retryCount || 0) + 1;
      
      errorCount++;
    }
  }
  
  // Save updated queue
  saveQueue(queue);
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Sent: ${processedCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📋 Total in queue: ${queue.length}`);
  console.log('\n✨ Done!\n');
}

// Run the processor
processQueue().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
