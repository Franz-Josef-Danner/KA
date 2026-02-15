# Email Notification Changes - Summary

## Problem Statement
In den Einstellungen kann man Benachrichtigungen aktivieren, wenn man neue Kunden, Aufträge oder Rechnungen erstellt, Rechnungen auf „bezahlt" setzt, Rechnungen oder Aufträge löscht oder wenn eine Rechnung überfällig ist.

**Anforderung:** Nur überfällige Rechnungen sollen in die Mail-Warteschlange kommen, um vom Benutzer bestätigt zu werden. Alle anderen Benachrichtigungen sollen direkt beim Erstellen, Löschen oder Ändern abgefragt werden, ob eine Mail versendet werden soll oder nicht.

## Implemented Solution

### Changes Made
1. **js/modules/email-notifications.js**
   - Added `confirmNotification()` helper function to show confirmation dialogs
   - Modified all notification functions EXCEPT `notifyInvoiceOverdue()` to ask for user confirmation before queuing
   - Simplified feedback functions (now no-ops) since confirmation is explicit

2. **einstellungen.html**
   - Updated help text to explain the new notification behavior

### Behavior

#### Überfällige Rechnungen (Overdue Invoices)
- Werden **automatisch** zur Mail-Warteschlange hinzugefügt
- Keine Bestätigungsfrage beim Hinzufügen
- Benutzer kann im Email Queue Manager bestätigen oder ablehnen
- Check erfolgt beim Besuchen des Dashboards (einmal pro Tag)

#### Alle anderen Benachrichtigungen
- **Bestätigungsfrage** beim Erstellen/Ändern/Löschen
- Benutzer entscheidet sofort: "Möchten Sie eine E-Mail-Benachrichtigung für ... senden?"
- Nur bei Bestätigung wird die Email in die Warteschlange eingereiht

### Modified Functions
✅ `notifyNewCustomer()` - Asks for confirmation
✅ `notifyNewOrder()` - Asks for confirmation
✅ `notifyNewInvoice()` - Asks for confirmation
✅ `notifyPaymentReceived()` - Asks for confirmation
✅ `notifyOrderDeleted()` - Asks for confirmation
✅ `notifyInvoiceDeleted()` - Asks for confirmation
⚡ `notifyInvoiceOverdue()` - NO confirmation (goes straight to queue)

## Testing

### Manual Testing Required
1. Test creating new customer → Should show confirmation dialog
2. Test creating new order → Should show confirmation dialog
3. Test creating new invoice → Should show confirmation dialog
4. Test marking invoice as paid → Should show confirmation dialog
5. Test deleting order → Should show confirmation dialog
6. Test deleting invoice → Should show confirmation dialog
7. Test visiting dashboard with overdue invoice → Should NOT show dialog, should auto-queue

### Verification
- Check browser console for notification messages
- Check localStorage: `ka_email_queue` for queued emails
- Use Email Queue Manager to see pending emails

## Backward Compatibility
- All existing code continues to work
- Settings page checkboxes still control which notification types are enabled
- Email queue system unchanged
- No breaking changes to API or data structures

## Security Analysis
- CodeQL scan completed: 0 alerts found
- No security vulnerabilities introduced
- Uses standard browser `confirm()` dialog
- No XSS risks (notification data is not rendered as HTML in dialogs)

## Files Changed
- `js/modules/email-notifications.js` (69 lines modified)
- `einstellungen.html` (6 lines added)

## Commits
1. "Add confirmation dialogs for non-overdue notifications" (9134a7f)
2. "Update settings page to explain notification behavior" (74b0073)

## Rollback
If needed, changes can be reverted using:
```bash
git revert 74b0073 9134a7f
```

## Next Steps
1. Deploy to test environment
2. Manual testing according to test plan
3. Get user feedback
4. Deploy to production if approved
