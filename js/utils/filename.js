// -----------------------------
// Filename Utilities
// -----------------------------

/**
 * Convert a string to hyphenated format (for filenames)
 * Replaces spaces and special characters with hyphens, removes multiple consecutive hyphens
 * 
 * @param {string} str - Input string to convert
 * @returns {string} Hyphenated string suitable for filenames
 * 
 * @example
 * toHyphenatedString("Website & Mobile App (2024)") // "Website-Mobile-App-2024"
 * toHyphenatedString("Test  String") // "Test-String"
 * toHyphenatedString("") // ""
 */
export function toHyphenatedString(str) {
  if (!str) return '';
  return str
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
}

/**
 * Generate PDF filename for orders or invoices with format: A_project-name_company-name_date
 * 
 * @param {string} documentType - Type of document ('order' or 'invoice')
 * @param {object} documentData - Document data containing Projekt, Firma, and date fields
 * @returns {string} Generated filename with .pdf extension
 * 
 * @example
 * generatePdfFilename('order', { Projekt: 'Website Redesign', Firma: 'Test AG', Auftragsdatum: '2024-01-15' })
 * // Returns: "A_Website-Redesign_Test-AG_2024-01-15.pdf"
 */
export function generatePdfFilename(documentType, documentData) {
  const prefix = 'A'; // Prefix for both orders (Auftrag) and invoices (Rechnung) as per requirement
  
  // Get project name (Projekt field)
  const projektName = toHyphenatedString(documentData.Projekt || 'Kein-Projekt');
  
  // Get company name (Firma field)
  const firmaName = toHyphenatedString(documentData.Firma || 'Unbekannt');
  
  // Get date from appropriate field based on document type
  // Date is already in YYYY-MM-DD format from HTML date input, no need to hyphenate
  let dateStr = 'Kein-Datum';
  if (documentType === 'order' && documentData.Auftragsdatum) {
    dateStr = documentData.Auftragsdatum;
  } else if (documentType === 'invoice' && documentData.Rechnungsdatum) {
    dateStr = documentData.Rechnungsdatum;
  }
  
  // Construct filename: A_project-name_company-name_date.pdf
  return `${prefix}_${projektName}_${firmaName}_${dateStr}.pdf`;
}
