# Email Queue Debug Guide - Critical Regression

## Problem
After synchronizing PDF generation parameters (using standard template), no emails appear in queue.

## Symptoms
- Creating invoice/order shows success message
- Message says "In die Warteschlange eingereiht" (transferred to queue)
- But queue is empty (no emails visible)

## Debug Steps

### Step 1: Check Console Logs

1. **Open Browser Console**
   - Press F12
   - Go to "Console" tab
   - Clear console (trash icon)

2. **Create Invoice/Order**
   - Go to Rechnungen or Aufträge page
   - Create new invoice/order with items
   - Click "Speichern"

3. **Check Console Output**
   - Look for these log messages:
   ```
   notifyNewInvoice called with data: {hasItems: true, invoiceId: "..."}
   Generating PDF for invoice...
   PDF für Rechnung generiert: ... Größe: ... bytes
   PDF attachment added to notification
   Calling queueEmailNotification...
   Email notification queued: newInvoice ...
   queueEmailNotification result: ...
   ```

### Step 2: Identify Where It Breaks

**If you see:**

**A. No logs at all**
- Problem: `notifyNewInvoice/notifyNewOrder` not being called
- Possible cause: Email config disabled or notification type disabled

**B. Logs stop at "Generating PDF"**
- Problem: PDF generation hangs or fails
- Possible cause: jsPDF library not loading, network issue

**C. "Failed to generate PDF" error**
- Problem: PDF generation throws error
- Check the error message
- Possible cause: Standard template issue, missing data

**D. "PDF generation returned null"**
- Problem: generatePDF returns null instead of doc
- Possible cause: Library load failure, parameter mismatch

**E. "No PDF attachment - queuing email without attachment"**
- PDF failed but process continues
- Email should still be queued

**F. Logs complete but no queue visible**
- Problem: Queue storage or display issue
- Check: Is queue visible on Settings page?
- Check: LocalStorage `ka_email_queue` key

### Step 3: Check Email Configuration

1. **Go to Settings (Einstellungen)**
2. **Check Email Settings:**
   - ☑️ E-Mail-Benachrichtigungen aktivieren - Must be checked
   - ☑️ Neue Rechnungen - Must be checked (for invoices)
   - ☑️ Neue Aufträge - Must be checked (for orders)

3. **Check Queue Section:**
   - Scroll to bottom of Settings page
   - See "E-Mail-Warteschlange" section
   - Check if queue shows emails

### Step 4: Check LocalStorage

1. **Open Browser Console**
2. **Run this command:**
   ```javascript
   JSON.parse(localStorage.getItem('ka_email_queue'))
   ```
3. **Check output:**
   - Should show array of queued emails
   - If null/empty: Queue is truly empty
   - If has data: Queue storage works but display broken

### Step 5: Manual Queue Test

Try queuing directly from console:

```javascript
import('./js/modules/email-config.js').then(module => {
  const result = module.queueEmailNotification('newInvoice', {
    invoiceId: 'TEST-001',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    total: 100,
    timestamp: new Date().toISOString()
  });
  console.log('Manual queue result:', result);
});
```

If this works, problem is in `notifyNewInvoice/notifyNewOrder`.

## Possible Causes & Solutions

### Cause 1: PDF Generation Hanging

**Symptoms:** Logs stop at "Generating PDF"

**Solution:** 
- Check network connectivity
- Check if jsPDF CDN is blocked
- Try clearing browser cache

**Temporary Fix:**
Revert to old parameters (no standard template):
```javascript
const pdfDoc = await generatePDF('rechnung', invoiceData);
```

### Cause 2: Standard Template Error

**Symptoms:** "Failed to generate PDF" with error message

**Solution:**
- Check error details
- Standard template might be missing elements
- Try with custom template instead

### Cause 3: Async/Await Issue

**Symptoms:** Logs complete but fast/no delay

**Solution:**
- PDF generation might not be properly awaited
- Check if Promise is resolving correctly

### Cause 4: Queue Function Changed

**Symptoms:** "Calling queueEmailNotification" but no result

**Solution:**
- Check if `queueEmailNotification` was modified
- Check if localStorage permissions exist

### Cause 5: Email Config Disabled

**Symptoms:** No logs at all, function returns false immediately

**Solution:**
- Go to Settings
- Enable email notifications
- Enable specific notification types

## Quick Fix: Revert Parameters

If nothing works, revert the PDF generation parameters:

**In `js/modules/email-notifications.js`:**

Change from:
```javascript
const pdfDoc = await generatePDF('invoice', invoiceData, false, null, true);
```

Back to:
```javascript
const pdfDoc = await generatePDF('rechnung', invoiceData);
```

This will restore queue functionality but PDFs might be incomplete again.

## Report Back

Please provide:
1. ✅ Console log output (all messages)
2. ✅ Where logs stop (which message is last)
3. ✅ Any error messages
4. ✅ Email config status (enabled/disabled)
5. ✅ LocalStorage queue content (from Step 4)

This information will help identify the exact cause of the regression.
