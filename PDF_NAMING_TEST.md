# PDF Naming Convention - Test Guide

## Overview
This guide describes how to test the new PDF naming convention for orders (Aufträge) and invoices (Rechnungen).

## Requirements
PDFs should be named according to the pattern:
```
A_project-name-with-hyphens_company-name-with-hyphens_date-with-hyphens.pdf
```

Both orders and invoices use the prefix "A".

## Examples
- Order with project "Website Redesign", company "Firma AG", date "2024-01-15":
  - Filename: `A_Website-Redesign_Firma-AG_2024-01-15.pdf`

- Invoice with project "Mobile App", company "Tech GmbH", date "2024-02-20":
  - Filename: `A_Mobile-App_Tech-GmbH_2024-02-20.pdf`

## Manual Testing Steps

### Test 1: Create and View Order PDF

1. Start the application (requires HTTP server):
   ```bash
   cd /home/runner/work/KA/KA
   python3 -m http.server 8080
   ```

2. Open browser and navigate to: `http://localhost:8080`

3. Login with demo credentials:
   - Email: `demo@example.com`
   - Password: `demo123`

4. Navigate to "Aufträge" (Orders)

5. Click "+ Neuer Auftrag" to create a new order

6. Fill in the form:
   - Auftrags-ID: `AU-001`
   - Auftragsdatum: Select today's date (e.g., `2024-01-15`)
   - Firma: Select a company from dropdown (e.g., `Test Firma`)
   - Projekt: Enter project name (e.g., `Website Redesign`)
   - Add at least one article

7. Click "📄 PDF anzeigen" button

8. **Verify:**
   - [ ] PDF opens in a new browser tab
   - [ ] PDF displays correctly with all order information
   - [ ] When you try to save the PDF from browser, suggested filename follows pattern:
     `A_Website-Redesign_Test-Firma_2024-01-15.pdf`
   - [ ] Console log shows: `PDF generated with filename: A_Website-Redesign_Test-Firma_2024-01-15.pdf`

### Test 2: Create and View Invoice PDF

1. Navigate to "Rechnungen" (Invoices)

2. Click "+ Neue Rechnung" to create a new invoice

3. Fill in the form:
   - Rechnungs-ID: `RE-001`
   - Rechnungsdatum: Select today's date (e.g., `2024-01-15`)
   - Firma: Select a company from dropdown
   - Projekt: Enter project name (e.g., `Mobile App`)
   - Add at least one article

4. Click "📄 PDF anzeigen" button

5. **Verify:**
   - [ ] PDF opens in a new browser tab
   - [ ] PDF displays correctly with all invoice information
   - [ ] When you try to save the PDF from browser, suggested filename follows pattern:
     `A_Mobile-App_Company-Name_2024-01-15.pdf`
   - [ ] Console log shows the generated filename

### Test 3: Special Characters in Names

Test that special characters are properly converted to hyphens.

1. Create an order with:
   - Projekt: `Website & Mobile App (2024)`
   - Expected filename part: `Website-Mobile-App-2024`

2. **Verify:**
   - [ ] Special characters `&`, `(`, `)` are removed
   - [ ] Multiple spaces become single hyphens
   - [ ] No leading or trailing hyphens

### Test 4: Missing Fields

Test behavior when optional fields are missing.

1. Create an order without entering a project name

2. **Verify:**
   - [ ] Filename uses `Kein-Projekt` as default
   - [ ] Format: `A_Kein-Projekt_Company-Name_2024-01-15.pdf`

### Test 5: PDF Opens in New Tab (Not Downloaded)

1. Click "📄 PDF anzeigen" on any order or invoice

2. **Verify:**
   - [ ] PDF opens in a new browser tab (using blob URL)
   - [ ] User can view the PDF in the browser
   - [ ] User is NOT prompted to download immediately
   - [ ] User can still download from browser's "Save as..." option

## Browser Compatibility

Test in multiple browsers to ensure consistent behavior:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Known Limitations

1. When opening a PDF via blob URL in a new tab, the browser's default filename might be a blob URL hash. However, when users choose to save the PDF, modern browsers should suggest a reasonable filename.

2. The filename is logged to console for debugging purposes but is not directly visible to users unless they check the console or try to save the PDF.

## Implementation Details

### Files Modified
- `auftraege.html` - Added "PDF anzeigen" button to order modal
- `rechnungen.html` - Added "PDF anzeigen" button to invoice modal  
- `js/modules/auftraege-ui.js` - Added PDF generation and filename logic for orders
- `js/modules/rechnungen-ui.js` - Added PDF generation and filename logic for invoices
- `js/modules/pdf-generator.js` - Updated viewPDF to accept optional filename parameter

### Functions Added
- `toHyphenatedString(str)` - Converts strings to hyphenated format
- `generateOrderPdfFilename(orderData)` - Generates filename for orders
- `generateInvoicePdfFilename(invoiceData)` - Generates filename for invoices
- `viewOrderPdf()` - Handles order PDF generation and viewing
- `viewInvoicePdf()` - Handles invoice PDF generation and viewing
