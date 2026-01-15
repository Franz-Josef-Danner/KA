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
