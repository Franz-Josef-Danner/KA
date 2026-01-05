// -----------------------------
// Settings Module
// -----------------------------

const SETTINGS_KEY = 'ka_company_settings';
const LAYOUT_KEY = 'ka_pdf_layout_template';

// Get company settings from localStorage
export function getCompanySettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return getDefaultSettings();
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load company settings:', error);
    return getDefaultSettings();
  }
}

// Get default settings structure
function getDefaultSettings() {
  return {
    companyName: '',
    address: '',
    email: '',
    phone: '',
    logo: '', // Base64-encoded image or URL
    footerTextOrder: '',
    footerTextInvoice: ''
  };
}

// Save company settings to localStorage
export function saveCompanySettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save company settings:', error);
    return false;
  }
}

// Get PDF layout template from localStorage
export function getPdfLayoutTemplate() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) {
      return getDefaultLayoutTemplate();
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load PDF layout template:', error);
    return getDefaultLayoutTemplate();
  }
}

// Get default layout template structure
export function getDefaultLayoutTemplate() {
  return {
    elements: [
      { id: 'logo', type: 'logo', x: 20, y: 20, width: 120, height: 60 },
      { id: 'company-name', type: 'company-name', x: 20, y: 90, width: 200, height: 20 },
      { id: 'company-address', type: 'company-address', x: 20, y: 115, width: 180, height: 50 },
      { id: 'company-contact', type: 'company-contact', x: 20, y: 170, width: 180, height: 35 },
      { id: 'customer-info', type: 'customer-info', x: 400, y: 90, width: 180, height: 70 },
      { id: 'document-header', type: 'document-header', x: 20, y: 230, width: 560, height: 40 },
      { id: 'items-table', type: 'items-table', x: 20, y: 280, width: 560, height: 300 },
      { id: 'totals', type: 'totals', x: 400, y: 590, width: 180, height: 70 },
      { id: 'footer', type: 'footer', x: 20, y: 750, width: 560, height: 40 }
    ]
  };
}

// Save PDF layout template to localStorage
export function savePdfLayoutTemplate(layout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    return true;
  } catch (error) {
    console.error('Failed to save PDF layout template:', error);
    return false;
  }
}

// Validate settings
export function validateSettings(settings) {
  const errors = [];
  
  // Email validation
  if (settings.email && !isValidEmail(settings.email)) {
    errors.push('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
  }
  
  // Phone validation (basic check)
  if (settings.phone && !isValidPhone(settings.phone)) {
    errors.push('Bitte geben Sie eine gültige Telefonnummer ein.');
  }
  
  return errors;
}

// Simple email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Simple phone validation (allows various formats)
function isValidPhone(phone) {
  // Remove all whitespace for validation
  const cleanPhone = phone.replace(/\s/g, '');
  
  // Allow formats: +49123456789, 0123456789, +49(0)123456789, etc.
  // Must start with optional +, followed by digits, and optional () pairs
  const phoneRegex = /^[\+]?[\d]+([\(\d\)]*[\d\-]*)+$/;
  if (!phoneRegex.test(cleanPhone)) return false;
  
  // Must have at least 5 digits
  const digitCount = cleanPhone.replace(/\D/g, '').length;
  return digitCount >= 5;
}

// Convert image file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Ungültiges Dateiformat. Nur PNG, JPG und SVG sind erlaubt.'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
