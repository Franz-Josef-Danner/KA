# PDF Naming Logic Documentation

## Overview
This document describes the PDF naming convention implemented for the KA system.

## Naming Format

PDFs are now automatically named according to the following format:

```
{Prefix}_{project-name}_{company-name}_{date}.pdf
```

### Prefix
- **Aufträge (Orders)**: `A_`
- **Rechnungen (Invoices)**: `R_`

### Components

1. **Project Name** (`Projekt`): The project name from the order or invoice
   - Spaces are replaced with hyphens
   - Special characters are replaced with hyphens
   - Text is converted to lowercase
   - Multiple consecutive hyphens are collapsed to a single hyphen
   - Umlauts (ä, ö, ü, etc.) are preserved

2. **Company Name** (`Firma`): The company name from the order or invoice
   - Same sanitization rules as project name

3. **Date** (`Datum`): The order date (`Auftragsdatum`) or invoice date (`Rechnungsdatum`)
   - Format: `YYYY-MM-DD` with hyphens
   - If no date is available, the current date is used

### Examples

#### Order (Auftrag)
- Input:
  - Project: `Website Redesign`
  - Company: `Acme GmbH`
  - Date: `2024-01-15`
- Output: `A_website-redesign_acme-gmbh_2024-01-15.pdf`

#### Invoice (Rechnung)
- Input:
  - Project: `Projekt Alpha`
  - Company: `Müller & Söhne`
  - Date: `2024-02-20`
- Output: `R_projekt-alpha_müller-söhne_2024-02-20.pdf`

## Implementation

### Modified Files

1. **`js/modules/pdf-generator.js`**
   - Added `generatePDFFilename()` function to create filenames according to the naming convention
   - Updated `viewPDF()` function to accept document type and data for filename generation
   - Added download parameter to control whether PDF is viewed or downloaded

2. **`js/modules/kundenbereich-render.js`**
   - Updated order and invoice PDF button handlers to pass document type and data to `viewPDF()`
   - Set download parameter to `true` to download PDFs with proper filenames

### Function Signature

```javascript
export function generatePDFFilename(documentType, documentData)
```

**Parameters:**
- `documentType`: String - `'order'`, `'auftrag'`, `'invoice'`, or `'rechnung'`
- `documentData`: Object - The order or invoice data object containing:
  - `Projekt` or `projektName`: Project name
  - `Firma` or `customer.Firma` or `company`: Company name
  - `Auftragsdatum` or `orderDate`: Order date (for orders)
  - `Rechnungsdatum` or `invoiceDate`: Invoice date (for invoices)

**Returns:** String - The generated filename with `.pdf` extension

## Fallback Behavior

- If project name is missing: Uses `"unbekannt"` (unknown)
- If company name is missing: Uses `"unbekannt"` (unknown)
- If date is missing: Uses current date in `YYYY-MM-DD` format

## Browser Compatibility

The implementation uses standard JavaScript and jsPDF features that are compatible with modern browsers.
