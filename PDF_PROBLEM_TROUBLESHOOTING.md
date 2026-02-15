# PDF Attachment Problem - Troubleshooting Guide

## Problem
Email queue and sending works, but attached PDFs are incomplete - only footer is visible. This affects both invoices (Rechnungen) and orders (Aufträge).

## Quick Diagnosis

### Step 1: Use Test Page (Fastest)

1. Open `test-pdf-generation.html` in your web browser
2. Click "Test Invoice PDF" button
3. Open the downloaded `test-invoice.pdf`
4. **Check if items table is visible**

**Result A: Items ARE visible in test PDF**
→ PDF generation code works fine
→ Problem is in data passing from UI
→ Go to Step 2

**Result B: Items NOT visible in test PDF (only footer)**
→ PDF rendering has a bug
→ Check console output in test page
→ Share output with developer

### Step 2: Test with Real Data

1. Open Browser Console (F12 → Console tab)
2. Go to Rechnungen or Aufträge page
3. Create NEW invoice/order
4. **Add at least one Artikel (item)**
5. Fill in:
   - Artikel name
   - Beschreibung (optional)
   - Menge (quantity)
   - Einzelpreis (price)
6. Save the invoice/order
7. **Check console output**

### Step 3: Analyze Console Output

Look for these debug messages:

```
DEBUG: Generating PDF for invoice with data:
```

**Check these values:**
- `hasItems:` should be `true`
- `itemsIsArray:` should be `true`
- `itemsLength:` should be > 0
- `items:` should show array like `[{Artikel: "...", ...}]`

**Warning Message:**
```
WARNING: Invoice has no items! PDF will be incomplete.
```
If you see this → Items are not being passed to PDF generator

## Common Causes & Solutions

### Cause 1: Items Not Added in UI
**Symptom:** Console shows `itemsLength: 0`

**Solution:**
1. When creating invoice/order, click "Artikel hinzufügen" button
2. Fill in ALL required fields for each item
3. Make sure items appear in the table in the modal
4. Then click "Speichern"

### Cause 2: Items Not Saved to Form Data
**Symptom:** Console shows `hasItems: false` or `items: undefined`

**Solution:**
This is a code bug. The `getFormData()` function is not properly including items.

**To fix:**
Check `js/modules/rechnungen-ui.js` line ~684:
```javascript
formData.items = currentInvoiceItems.map(item => ({
  Artikel: sanitizeText(item.Artikel || ""),
  Beschreibung: sanitizeText(item.Beschreibung || ""),
  Menge: sanitizeText(item.Menge || ""),
  Einheit: sanitizeText(item.Einheit || ""),
  Einzelpreis: sanitizeText(item.Einzelpreis || ""),
  Gesamtpreis: sanitizeText(item.Gesamtpreis || "")
}));
```

Make sure `currentInvoiceItems` is populated when modal is opened.

### Cause 3: Items Lost During Notification
**Symptom:** Console shows items exist but PDF is still empty

**Solution:**
Check that `...formData` is used in notification data:

In `js/modules/rechnungen-ui.js` line ~753:
```javascript
const notificationData = {
  ...formData, // <-- Must include this!
  invoiceId: formData.Rechnungs_ID || 'N/A',
  // ... other fields
};
```

### Cause 4: Field Name Mismatch
**Symptom:** PDF generator can't find items

**Solution:**
Items must have German field names with capital letters:
- ✅ `Artikel` (correct)
- ❌ `artikel` (wrong)
- ✅ `Beschreibung` (correct)
- ❌ `description` (wrong)

PDF generator checks for both, but prefers German capital names.

## Debug Output Examples

### ✅ GOOD (Items Present)
```
DEBUG: Generating PDF for invoice with data: {
  hasItems: true,
  itemsIsArray: true,
  itemsLength: 2,
  items: [
    {
      Artikel: "Web Development",
      Beschreibung: "Homepage erstellen",
      Menge: "1",
      Einheit: "Stk",
      Einzelpreis: "1500.00",
      Gesamtpreis: "1500.00"
    },
    {
      Artikel: "Hosting",
      Beschreibung: "Jahreshosting",
      Menge: "1",
      Einheit: "Jahr",
      Einzelpreis: "200.00",
      Gesamtpreis: "200.00"
    }
  ],
  invoiceId: "RE-20240215-001",
  allKeys: ["Rechnungs_ID", "Rechnungsdatum", "Firma", ..., "items"]
}

DEBUG: renderItemsTableWithFooter called with documentData: {
  hasItems: true,
  itemsIsArray: true,
  itemsLength: 2
}

DEBUG: Parsed items for PDF: {
  itemsLength: 2,
  items: [
    {
      artikel: "Web Development",
      beschreibung: "Homepage erstellen",
      menge: "1",
      einheit: "Stk",
      einzelpreis: "1500.00",
      gesamtpreis: "1500.00"
    },
    ...
  ]
}

DEBUG: PDF generated successfully, size: 28934
```

### ❌ BAD (Items Missing)
```
DEBUG: Generating PDF for invoice with data: {
  hasItems: false,
  itemsIsArray: false,
  itemsLength: 0,
  items: undefined,
  invoiceId: "RE-20240215-001",
  allKeys: ["Rechnungs_ID", "Rechnungsdatum", "Firma", ...]  <-- "items" missing!
}

WARNING: Invoice has no items! PDF will be incomplete.

DEBUG: renderItemsTableWithFooter called with documentData: {
  hasItems: false,
  itemsIsArray: false,
  itemsLength: 0
}

DEBUG: Parsed items for PDF: {
  itemsLength: 0,
  items: []
}

DEBUG: PDF generated successfully, size: 8234  <-- Small size = only footer
```

## Technical Details

### Data Flow
1. User adds items in UI modal → stored in `currentInvoiceItems` array
2. User clicks Save → `getFormData()` creates `formData` with `items` array
3. `saveInvoice()` creates `notificationData = {...formData, ...}`
4. Calls `notifyNewInvoice(notificationData)`
5. Inside notification: `generatePDF('rechnung', invoiceData)`
6. PDF generator reads `invoiceData.items` array
7. Calls `renderItemsTableWithFooter()` which maps German→lowercase fields
8. Renders items table with all items

### Where Items Can Be Lost
- ❌ Items not added in UI
- ❌ `currentInvoiceItems` empty when Save is clicked
- ❌ `getFormData()` doesn't include items
- ❌ Spread operator `...formData` missing in notification data
- ❌ Items array has wrong structure (wrong field names)

## Quick Fix Checklist

- [ ] Test page shows items correctly → Code is fine
- [ ] Real UI adds items to modal before saving
- [ ] Console shows `hasItems: true` and `itemsLength > 0`
- [ ] Console shows items array with proper structure
- [ ] PDF downloads and can be opened
- [ ] PDF shows items table (not just footer)

## Still Not Working?

If you've tried everything and PDFs still only show footer:

1. **Capture full console output** (copy entire console log)
2. **Take screenshot** of invoice/order modal with items added
3. **Download the PDF** and try to open it
4. **Share all information** with developer

The debug logs will show exactly where items are being lost.
