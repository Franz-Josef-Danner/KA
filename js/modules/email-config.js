// -----------------------------
// Email Configuration Module
// -----------------------------

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
    console.error('Failed to load email config:', error);
    return getDefaultEmailConfig();
  }
}

// Get default email configuration
function getDefaultEmailConfig() {
  return {
    enabled: false,
    service: 'smtp', // 'smtp' or 'api'
    smtp: {
      host: '',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: '',
        pass: ''
      }
    },
    api: {
      provider: '', // 'sendgrid', 'mailgun', 'ses', etc.
      apiKey: '',
      endpoint: ''
    },
    from: {
      name: '',
      email: ''
    },
    replyTo: '',
    testEmail: ''
  };
}

// Save email configuration to localStorage
export function saveEmailConfig(config) {
  try {
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save email config:', error);
    return false;
  }
}

// Validate email configuration
export function validateEmailConfig(config) {
  const errors = [];

  if (config.enabled) {
    // Validate from email
    if (!config.from.email || !isValidEmail(config.from.email)) {
      errors.push('Bitte geben Sie eine gültige Absender-E-Mail-Adresse ein.');
    }

    if (config.service === 'smtp') {
      // Validate SMTP settings
      if (!config.smtp.host) {
        errors.push('SMTP-Host ist erforderlich.');
      }
      if (!config.smtp.port || config.smtp.port < 1 || config.smtp.port > 65535) {
        errors.push('Bitte geben Sie einen gültigen SMTP-Port ein (1-65535).');
      }
      if (!config.smtp.auth.user) {
        errors.push('SMTP-Benutzername ist erforderlich.');
      }
      if (!config.smtp.auth.pass) {
        errors.push('SMTP-Passwort ist erforderlich.');
      }
    } else if (config.service === 'api') {
      // Validate API settings
      if (!config.api.provider) {
        errors.push('API-Provider ist erforderlich.');
      }
      if (!config.api.apiKey) {
        errors.push('API-Schlüssel ist erforderlich.');
      }
    }
  }

  return errors;
}

// Simple email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Email templates
export const EMAIL_TEMPLATES = {
  CUSTOMER_WELCOME: 'customer_welcome',
  PASSWORD_RESET: 'password_reset',
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  INVOICE_CREATED: 'invoice_created',
  INVOICE_REMINDER: 'invoice_reminder',
  TEST_EMAIL: 'test_email'
};

// Get email template
export function getEmailTemplate(templateType, data = {}) {
  const templates = {
    [EMAIL_TEMPLATES.CUSTOMER_WELCOME]: {
      subject: 'Willkommen bei {{companyName}} - Ihr Kundenkonto wurde erstellt',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Willkommen bei {{companyName}}!</h2>
            <p>Sehr geehrte/r {{customerName}},</p>
            <p>Ihr Kundenkonto wurde erfolgreich erstellt.</p>
            <p><strong>Ihre Zugangsdaten:</strong></p>
            <ul>
              <li>Firmen-ID: <strong>{{firmenId}}</strong></li>
              <li>E-Mail: <strong>{{email}}</strong></li>
              <li>Passwort: <strong>{{password}}</strong></li>
            </ul>
            <p>Sie können sich unter folgendem Link anmelden:<br>
            <a href="{{loginUrl}}">{{loginUrl}}</a></p>
            <p><strong>Wichtig:</strong> Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung.</p>
            <p>Mit freundlichen Grüßen,<br>
            Ihr {{companyName}} Team</p>
          </body>
        </html>
      `,
      text: `
Willkommen bei {{companyName}}!

Sehr geehrte/r {{customerName}},

Ihr Kundenkonto wurde erfolgreich erstellt.

Ihre Zugangsdaten:
- Firmen-ID: {{firmenId}}
- E-Mail: {{email}}
- Passwort: {{password}}

Sie können sich unter folgendem Link anmelden:
{{loginUrl}}

Wichtig: Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung.

Mit freundlichen Grüßen,
Ihr {{companyName}} Team
      `
    },
    [EMAIL_TEMPLATES.ORDER_CREATED]: {
      subject: 'Neuer Auftrag {{orderId}} erstellt',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Neuer Auftrag erstellt</h2>
            <p>Sehr geehrte/r {{customerName}},</p>
            <p>Ihr Auftrag wurde erfolgreich erstellt.</p>
            <p><strong>Auftragsdetails:</strong></p>
            <ul>
              <li>Auftragsnummer: <strong>{{orderId}}</strong></li>
              <li>Datum: <strong>{{orderDate}}</strong></li>
              <li>Status: <strong>{{status}}</strong></li>
            </ul>
            <p>Sie können Ihre Aufträge jederzeit in Ihrem Kundenbereich einsehen.</p>
            <p>Mit freundlichen Grüßen,<br>
            Ihr {{companyName}} Team</p>
          </body>
        </html>
      `,
      text: `
Neuer Auftrag erstellt

Sehr geehrte/r {{customerName}},

Ihr Auftrag wurde erfolgreich erstellt.

Auftragsdetails:
- Auftragsnummer: {{orderId}}
- Datum: {{orderDate}}
- Status: {{status}}

Sie können Ihre Aufträge jederzeit in Ihrem Kundenbereich einsehen.

Mit freundlichen Grüßen,
Ihr {{companyName}} Team
      `
    },
    [EMAIL_TEMPLATES.INVOICE_CREATED]: {
      subject: 'Neue Rechnung {{invoiceId}}',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Neue Rechnung</h2>
            <p>Sehr geehrte/r {{customerName}},</p>
            <p>Eine neue Rechnung wurde für Sie erstellt.</p>
            <p><strong>Rechnungsdetails:</strong></p>
            <ul>
              <li>Rechnungsnummer: <strong>{{invoiceId}}</strong></li>
              <li>Datum: <strong>{{invoiceDate}}</strong></li>
              <li>Fälligkeitsdatum: <strong>{{dueDate}}</strong></li>
              <li>Betrag: <strong>{{amount}} €</strong></li>
            </ul>
            <p>Sie können Ihre Rechnungen jederzeit in Ihrem Kundenbereich einsehen und herunterladen.</p>
            <p>Mit freundlichen Grüßen,<br>
            Ihr {{companyName}} Team</p>
          </body>
        </html>
      `,
      text: `
Neue Rechnung

Sehr geehrte/r {{customerName}},

Eine neue Rechnung wurde für Sie erstellt.

Rechnungsdetails:
- Rechnungsnummer: {{invoiceId}}
- Datum: {{invoiceDate}}
- Fälligkeitsdatum: {{dueDate}}
- Betrag: {{amount}} €

Sie können Ihre Rechnungen jederzeit in Ihrem Kundenbereich einsehen und herunterladen.

Mit freundlichen Grüßen,
Ihr {{companyName}} Team
      `
    },
    [EMAIL_TEMPLATES.TEST_EMAIL]: {
      subject: 'Test-E-Mail von KA System',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Test-E-Mail</h2>
            <p>Dies ist eine Test-E-Mail vom KA System.</p>
            <p>Wenn Sie diese E-Mail erhalten haben, funktioniert Ihre E-Mail-Konfiguration korrekt.</p>
            <p>Zeitstempel: {{timestamp}}</p>
            <p>Mit freundlichen Grüßen,<br>
            Ihr {{companyName}} Team</p>
          </body>
        </html>
      `,
      text: `
Test-E-Mail

Dies ist eine Test-E-Mail vom KA System.

Wenn Sie diese E-Mail erhalten haben, funktioniert Ihre E-Mail-Konfiguration korrekt.

Zeitstempel: {{timestamp}}

Mit freundlichen Grüßen,
Ihr {{companyName}} Team
      `
    }
  };

  const template = templates[templateType];
  if (!template) {
    console.warn(`Template ${templateType} not found`);
    return null;
  }

  // Replace placeholders with data
  const result = {
    subject: replacePlaceholders(template.subject, data),
    html: replacePlaceholders(template.html, data),
    text: replacePlaceholders(template.text, data)
  };

  return result;
}

// Replace placeholders in template
function replacePlaceholders(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}
