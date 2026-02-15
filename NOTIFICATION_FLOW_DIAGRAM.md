# Email Notification Flow Diagram

## Before Changes (Old Behavior)

```
┌─────────────────────────────────────────────────────────────┐
│                    ALL NOTIFICATIONS                        │
│                                                             │
│  • New Customer                                            │
│  • New Order                                               │
│  • New Invoice                                             │
│  • Payment Received                                        │
│  • Order Deleted                                           │
│  • Invoice Deleted                                         │
│  • Invoice Overdue                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
            ┌─────────────────────┐
            │  Check if enabled   │
            │   in settings       │
            └──────────┬──────────┘
                       │
                       ↓
            ┌─────────────────────┐
            │ Auto-queue email    │
            │   (no prompt)       │
            └──────────┬──────────┘
                       │
                       ↓
            ┌─────────────────────┐
            │   Email Queue       │
            │ (for approval)      │
            └─────────────────────┘
```

## After Changes (New Behavior)

### Non-Overdue Notifications

```
┌─────────────────────────────────────────────────────────────┐
│              NON-OVERDUE NOTIFICATIONS                      │
│                                                             │
│  • New Customer                                            │
│  • New Order                                               │
│  • New Invoice                                             │
│  • Payment Received                                        │
│  • Order Deleted                                           │
│  • Invoice Deleted                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
            ┌─────────────────────┐
            │  Check if enabled   │
            │   in settings       │
            └──────────┬──────────┘
                       │
                       ↓
            ┌─────────────────────┐
            │ Show confirmation   │
            │     dialog:         │
            │ "Möchten Sie eine   │
            │ E-Mail senden?"     │
            └──────────┬──────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
         [OK]                 [Cancel]
            │                     │
            ↓                     ↓
    ┌──────────────┐      ┌──────────┐
    │ Queue email  │      │ No email │
    └──────────────┘      └──────────┘
```

### Overdue Invoice Notifications

```
┌─────────────────────────────────────────────────────────────┐
│              OVERDUE INVOICE NOTIFICATION                   │
│                                                             │
│  User visits Dashboard                                      │
│    ↓                                                        │
│  Check for overdue invoices (once per day)                 │
│    ↓                                                        │
│  Find unpaid invoices past due date                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
            ┌─────────────────────┐
            │  Check if enabled   │
            │   in settings       │
            └──────────┬──────────┘
                       │
                       ↓
            ┌─────────────────────┐
            │ Auto-queue email    │
            │  (NO PROMPT!)       │
            └──────────┬──────────┘
                       │
                       ↓
            ┌─────────────────────┐
            │   Email Queue       │
            │ (for approval)      │
            └─────────────────────┘
                       │
                       ↓
            ┌─────────────────────┐
            │   User reviews      │
            │ in Queue Manager    │
            └──────────┬──────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
        [Approve]             [Reject]
            │                     │
            ↓                     ↓
    ┌──────────────┐      ┌──────────┐
    │  Send email  │      │  Delete  │
    └──────────────┘      └──────────┘
```

## Key Differences

| Aspect                  | Old Behavior              | New Behavior                          |
|------------------------|---------------------------|---------------------------------------|
| Non-overdue notifications | Auto-queue (no prompt) | Confirmation dialog at action time    |
| Overdue invoices        | Auto-queue (no prompt)    | Auto-queue (no prompt) - UNCHANGED   |
| User control            | After queuing (queue mgr) | Before queuing (confirmation dialog) |
| Settings control        | Enable/disable types      | Enable/disable types - UNCHANGED     |

## User Experience

### Example 1: Creating a New Invoice

**Old:**
1. User creates invoice
2. Email automatically queued
3. User sees message: "Email queued"
4. User must go to queue manager to approve/reject

**New:**
1. User creates invoice
2. Confirmation dialog: "Möchten Sie eine E-Mail-Benachrichtigung für die neue Rechnung "RE-001" senden?"
3. User clicks OK → Email queued, OR User clicks Cancel → No email
4. Done! User made decision immediately

### Example 2: Overdue Invoice Check

**Old:**
1. User visits dashboard
2. System checks for overdue invoices
3. Overdue invoice found
4. Email automatically queued
5. User can review in queue manager

**New:**
1. User visits dashboard
2. System checks for overdue invoices
3. Overdue invoice found
4. Email automatically queued (NO CHANGE)
5. User can review in queue manager (NO CHANGE)

This preserves the "review before sending" workflow for overdue invoices while giving immediate control for other notifications.
