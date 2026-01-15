// -----------------------------
// PDF Helper Functions
// -----------------------------

/**
 * Helper function to sanitize and format filename components
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text suitable for filenames
 */
export function sanitizeFilenameComponent(text) {
  if (!text) return 'unbekannt';
  // Replace spaces and special characters with hyphens, remove multiple hyphens
  return text
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate filename for PDF download
 * @param {string} prefix - Prefix for the filename ('A' for Aufträge, 'R' for Rechnungen)
 * @param {string} projektName - Project name
 * @param {string} firmaName - Company name
 * @param {string} datum - Date
 * @returns {string} Generated filename for the PDF
 */
export function generatePdfFilename(prefix, projektName, firmaName, datum) {
  const sanitizedProjekt = sanitizeFilenameComponent(projektName);
  const sanitizedFirma = sanitizeFilenameComponent(firmaName);
  const sanitizedDatum = sanitizeFilenameComponent(datum);
  
  return `${prefix}_${sanitizedProjekt}_${sanitizedFirma}_${sanitizedDatum}.pdf`;
}

/**
 * Enrich document (order/invoice) data with full company information for PDF generation
 * @param {Object} document - The order or invoice document
 * @param {Function} getCompaniesFunc - Function to get companies list
 * @returns {Object} Enriched document with company data
 */
export function enrichDocumentWithCompanyData(document, getCompaniesFunc) {
  // Create a copy of the document to avoid modifying the original
  const enrichedDoc = { ...document };
  
  // If document already has company address (legacy format), return as-is
  if (enrichedDoc.Firmenadresse) {
    return enrichedDoc;
  }
  
  // Look up company information
  const companies = getCompaniesFunc();
  let company = null;
  
  // Try to find company by Firmen_ID first (new format)
  if (enrichedDoc.Firmen_ID) {
    company = companies.find(c => c.Firmen_ID === enrichedDoc.Firmen_ID);
  }
  
  // Fall back to finding by Firma name (legacy format)
  if (!company && enrichedDoc.Firma) {
    company = companies.find(c => c.Firma === enrichedDoc.Firma);
  }
  
  // Enrich document with company data if found
  if (company) {
    // Add company name if not present
    if (!enrichedDoc.Firma) {
      enrichedDoc.Firma = company.Firma;
    }
    // Add company address
    enrichedDoc.Firmenadresse = company.Firmenadresse || company.Adresse || '';
    // Add company email if not already present
    if (!enrichedDoc.Firmen_Email) {
      enrichedDoc.Firmen_Email = company.Firmen_Email || company.Email || '';
    }
  }
  
  return enrichedDoc;
}
