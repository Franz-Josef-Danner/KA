// -----------------------------
// Contact Form Module
// -----------------------------
// Handles contact form submission and email queueing

import { queueEmailNotification, isEmailConfigured } from './email-config.js';

// Validate contact form data
export function validateContactForm(formData) {
  const errors = [];
  
  // Validate sender name
  if (!formData.senderName || formData.senderName.length < 2) {
    errors.push('Bitte geben Sie einen gültigen Namen ein (mindestens 2 Zeichen).');
  }
  
  // Validate sender email
  if (!formData.senderEmail || !isValidEmail(formData.senderEmail)) {
    errors.push('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
  }
  
  // Validate subject
  if (!formData.subject || formData.subject.length < 3) {
    errors.push('Bitte geben Sie einen Betreff ein (mindestens 3 Zeichen).');
  }
  
  // Validate message
  if (!formData.message || formData.message.length < 10) {
    errors.push('Bitte geben Sie eine Nachricht ein (mindestens 10 Zeichen).');
  }
  
  return errors;
}

// Simple email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Send contact message
export function sendContactMessage(formData) {
  // Check if email is configured
  if (!isEmailConfigured()) {
    return {
      success: false,
      error: 'E-Mail-Benachrichtigungen sind nicht aktiviert. Bitte aktivieren Sie diese in den Einstellungen.'
    };
  }
  
  // Queue the contact message as an email notification
  const notificationId = queueEmailNotification('contactMessage', {
    senderName: formData.senderName,
    senderEmail: formData.senderEmail,
    subject: formData.subject,
    message: formData.message,
    timestamp: new Date().toISOString()
  });
  
  if (notificationId) {
    return {
      success: true,
      notificationId: notificationId
    };
  } else {
    return {
      success: false,
      error: 'Fehler beim Einreihen der Nachricht in die Warteschlange.'
    };
  }
}

// Get contact message template for email
export function getContactMessageTemplate(data) {
  return `
Kontaktformular-Nachricht

Von: ${data.senderName}
E-Mail: ${data.senderEmail}
Betreff: ${data.subject}
Zeitstempel: ${new Date(data.timestamp).toLocaleString('de-DE')}

Nachricht:
${data.message}

---
Diese Nachricht wurde über das Kontaktformular im KA System gesendet.
`;
}

// Get contact message email subject
export function getContactMessageSubject(data) {
  return `Kontaktanfrage: ${data.subject}`;
}
