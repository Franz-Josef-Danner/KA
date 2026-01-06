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
// Note: Footer is excluded from the layout editor - it will be automatically placed at the bottom of PDFs
export function getDefaultLayoutTemplate() {
  return {
    elements: [
      { id: 'logo', type: 'logo', x: 20, y: 20, width: 120, height: 60, textAlign: 'left' },
      { id: 'company-name', type: 'company-name', x: 20, y: 90, width: 200, height: 20, textAlign: 'left' },
      { id: 'company-address', type: 'company-address', x: 20, y: 115, width: 180, height: 50, textAlign: 'left' },
      { id: 'company-contact', type: 'company-contact', x: 20, y: 170, width: 180, height: 35, textAlign: 'left' },
      { id: 'customer-info', type: 'customer-info', x: 400, y: 90, width: 180, height: 70, textAlign: 'left' },
      { id: 'document-header', type: 'document-header', x: 20, y: 230, width: 560, height: 40, textAlign: 'left' },
      { id: 'items-table', type: 'items-table', x: 20, y: 280, width: 560, height: 300, textAlign: 'left' },
      { id: 'totals', type: 'totals', x: 400, y: 590, width: 180, height: 70, textAlign: 'right' }
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

// Get sample company data for preview
// If actual company data exists (non-empty fields), use it; otherwise use sample data
export function getSampleCompanyData() {
  const actualSettings = getCompanySettings();
  
  return {
    companyName: actualSettings.companyName || 'Muster GmbH & Co. KG',
    address: actualSettings.address || 'Musterstraße 123\n12345 Musterstadt',
    email: actualSettings.email || 'kontakt@muster-firma.de',
    phone: actualSettings.phone || '+49 123 456789',
    logo: actualSettings.logo || '', // Use actual logo if exists, otherwise empty
    footerTextOrder: actualSettings.footerTextOrder || 'Geschäftsführer: Max Mustermann | HRB 12345 | Steuernr.: 123/456/78900',
    footerTextInvoice: actualSettings.footerTextInvoice || 'Bank: Musterbank | IBAN: DE89 3704 0044 0532 0130 00 | BIC: COBADEFFXXX | USt-ID: DE123456789'
  };
}

// Get sample customer data for preview
// Always use sample data for customer
export function getSampleCustomerData() {
  return {
    company: 'Musterkunde AG',
    contactPerson: 'Frau Maria Musterfrau',
    address: 'Kundenstraße 456\n54321 Kundenstadt',
    email: 'maria.musterfrau@musterkunde.de',
    phone: '+49 987 654321'
  };
}

// Get sample items for preview
// Always use sample data for items
export function getSampleItems() {
  return [
    {
      position: 1,
      description: 'Beratungsleistung Software-Entwicklung',
      quantity: 40,
      unit: 'Stunden',
      pricePerUnit: 95.00,
      total: 3800.00
    },
    {
      position: 2,
      description: 'Webhosting Premium Paket',
      quantity: 1,
      unit: 'Monat',
      pricePerUnit: 49.99,
      total: 49.99
    },
    {
      position: 3,
      description: 'SSL-Zertifikat',
      quantity: 1,
      unit: 'Jahr',
      pricePerUnit: 89.00,
      total: 89.00
    }
  ];
}

// Get sample document data for preview
export function getSampleDocumentData(documentType) {
  const items = getSampleItems();
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const vatRate = 0.19;
  const vat = subtotal * vatRate;
  const total = subtotal + vat;
  
  const baseData = {
    customer: getSampleCustomerData(),
    items: items,
    subtotal: subtotal,
    vat: vat,
    vatRate: vatRate,
    total: total,
    date: new Date().toLocaleDateString('de-DE')
  };
  
  if (documentType === 'order' || documentType === 'auftrag') {
    return {
      ...baseData,
      orderId: 'AUF-2024-001',
      orderDate: baseData.date,
      deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
    };
  } else if (documentType === 'invoice' || documentType === 'rechnung') {
    return {
      ...baseData,
      invoiceId: 'RE-2024-001',
      invoiceDate: baseData.date,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
    };
  }
  
  return baseData;
}
