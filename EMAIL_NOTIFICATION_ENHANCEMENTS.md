# Email Notification Enhancement - Implementation Summary

## Overview
This implementation adds three new email notification types to the KA system:
1. **Order Deletion Notifications** - Sent when an order (Auftrag) is deleted
2. **Invoice Deletion Notifications** - Sent when an invoice (Rechnung) is deleted
3. **Overdue Invoice Notifications** - Sent when an invoice remains unpaid after its deadline

## Changes Made

### 1. Email Configuration Module (`js/modules/email-config.js`)
- Added three new notification types to default configuration:
  - `orderDeleted`
  - `invoiceDeleted`
  - `invoiceOverdue`
- These are enabled by default when email notifications are activated

### 2. Email Notifications Module (`js/modules/email-notifications.js`)
- Added three new notification functions:
  - `notifyOrderDeleted(orderData)` - Sends notification when order is deleted
  - `notifyInvoiceDeleted(invoiceData)` - Sends notification when invoice is deleted
  - `notifyInvoiceOverdue(invoiceData)` - Sends notification when invoice is overdue
- Added German email templates for all three notification types
- Added subject lines for all three notification types
- Updated warning message labels to include the new notification types

### 3. Settings Page (`einstellungen.html`)
- Added three new checkboxes in the email notification settings section:
  - "Gelöschte Aufträge" (Deleted Orders)
  - "Gelöschte Rechnungen" (Deleted Invoices)
  - "Überfällige Rechnungen" (Overdue Invoices)
- Updated form loading and saving code to handle the new settings

### 4. Invoice Rendering Module (`js/modules/rechnungen-render.js`)
- Imported `notifyInvoiceDeleted` function
- Modified the delete button handler to send notification before deletion
- Calculates invoice total and includes it in the notification

### 5. Order Rendering Module (`js/modules/auftraege-render.js`)
- Imported `notifyOrderDeleted` function
- Modified the delete button handler to send notification before deletion
- Calculates order total and includes it in the notification

### 6. Overdue Invoice Checker Module (`js/modules/overdue-invoice-checker.js`) - NEW FILE
- Created comprehensive system for checking overdue invoices
- Key features:
  - Checks invoices once per day (configurable interval)
  - Calculates deadline based on invoice date and payment terms
  - Tracks which invoices have already been notified (prevents duplicate notifications)
  - Calculates days past due for each overdue invoice
  - Integrates with artikelliste payment terms
  - Provides utility functions for testing and manual resets

### 7. Invoice UI Module (`js/modules/rechnungen-ui.js`)
- Imported `notifyPaymentReceived` and `clearInvoiceFromNotified`
- Enhanced `saveInvoice()` function to detect payment status changes
- Sends payment received notification when invoice is marked as paid
- Clears invoice from overdue notification list when paid
- Prevents duplicate overdue notifications after payment

### 8. Invoices App Entry Point (`js/rechnungen-app.js`)
- Imported `checkOverdueInvoices` function
- Calls overdue check when invoices page loads

### 9. Dashboard Page (`dashboard.html`)
- Imported `checkOverdueInvoices` function
- Calls overdue check when dashboard loads
- Ensures overdue invoices are checked regularly when user accesses the system

## How It Works

### Order/Invoice Deletion
1. User clicks delete button (−) on an order or invoice
2. Confirmation dialog is shown
3. If confirmed, system calculates the total before deletion
4. Notification is queued with order/invoice details
5. Item is deleted from the list
6. Email notification is processed by the email queue system

### Overdue Invoice Checking
1. System checks invoices once per day (24-hour interval)
2. For each unpaid invoice:
   - Retrieves payment terms from associated artikelliste
   - Calculates deadline based on invoice date + payment terms
   - Checks if deadline has passed
   - Calculates days past due
3. If invoice is overdue and hasn't been notified before:
   - Queues overdue notification
   - Marks invoice as notified (prevents duplicate notifications)
4. When invoice is paid:
   - System clears it from the notified list
   - If it becomes overdue again later, it will be notified again

### Payment Status Changes
1. User edits an invoice and changes status from "unbezahlt" to "bezahlt"
2. System detects the status change
3. Sends payment received notification
4. Clears invoice from overdue notification list
5. Updates invoice in storage

## Configuration
All three notification types can be independently enabled/disabled in the settings page under "E-Mail-Benachrichtigungen". They are enabled by default but can be turned off if not needed.

## Data Stored in Notifications

### Order Deletion
- Order ID (Auftrags_ID)
- Customer name (Firma)
- Total amount
- Order items
- Timestamp

### Invoice Deletion
- Invoice ID (Rechnungs_ID)
- Customer name (Firma)
- Total amount
- Timestamp

### Overdue Invoice
- Invoice ID (Rechnungs_ID)
- Customer name (Firma)
- Total amount
- Due date (formatted as DD.MM.YYYY)
- Days past due
- Timestamp

## Testing Notes
- All JavaScript files pass syntax validation
- Notification functions are called at the correct points in the workflow
- Settings UI properly loads and saves the new notification preferences
- Overdue checking respects the 24-hour interval to avoid excessive checks
- Duplicate overdue notifications are prevented via tracking system

## Future Enhancements
- Could add configuration for overdue check interval
- Could add multiple overdue notifications (e.g., at 7 days, 14 days, 30 days)
- Could add grace period before sending overdue notifications
- Could integrate with actual email sending backend (currently uses queue system)
