# Dauerhafte Ausgaben (Recurring Expenses) - Documentation

## Overview

The recurring expenses feature allows you to define expenses that repeat on a regular basis (daily, weekly, monthly, or yearly). These recurring expenses automatically generate regular expenses based on their schedule.

**Integration**: Recurring expenses are integrated into the main Ausgaben (Expenses) page with a tab interface, allowing easy switching between regular one-time expenses and recurring expenses.

## Features

- **Integrated Interface**: Manage both regular and recurring expenses from a single page with tabs
- **Recurring Expense Management**: Create and manage recurring expenses with the same fields as regular expenses
- **Recurrence Periods**: Daily, Weekly, Monthly, or Yearly
- **Start Date**: Define when the recurring expense begins
- **Due Day**: Specify which day of the period the payment is due
- **Automatic Generation**: Regular expenses are automatically created based on the schedule
- **Auto-paid Status**: Generated expenses are automatically marked as "bezahlt" (paid)

## User Interface

The recurring expenses management is integrated into the **Ausgaben** page with a tab interface.

### Accessing Recurring Expenses

1. Navigate to **Ausgaben** in the menu
2. Click on the **"Dauerhafte Ausgaben"** tab to switch to recurring expenses view
3. Click on **"Einmalige Ausgaben"** tab to switch back to regular expenses

### Creating a Recurring Expense

1. Navigate to **Ausgaben** and click the **"Dauerhafte Ausgaben"** tab
2. Click **+ Neue dauerhafte Ausgabe**
3. Fill in the required fields:
   - **Empfänger** (Recipient): Who receives the payment
   - **Verwendungszweck** (Purpose): What the payment is for
   - **Betrag** (Amount): Payment amount in euros (per installment)
   - **Wiederholungszeitraum** (Recurrence Period): Daily, Weekly, Monthly, or Yearly
   - **Beginn Datum** (Start Date): When the recurring expense begins
   - **Stichtag** (Due Day): Day of the period when payment is due
   - **Gesamtsumme** (Total Sum) *(optional)*: Total amount for installment payments. When set, the recurring expense will automatically stop after reaching this sum.
4. Click **Speichern** (Save)

### Gesamtsumme (Total Sum) Feature

The **Gesamtsumme** field allows you to set up installment payments that automatically stop after the total amount is reached:

- **How it works**: Enter the total amount you need to pay (e.g., 1000 €)
- **Automatic calculation**: The system will generate payments using the specified **Betrag** (installment amount)
- **Automatic stop**: Once the total sum is reached, no more payments will be generated
- **Partial final payment**: If the remaining amount is less than the regular installment, the final payment will be automatically adjusted

**Example**: 
- Betrag: 150 € (per month)
- Gesamtsumme: 400 €
- Result: The system generates: 150 € + 150 € + 100 € = 400 € (3 payments total)

**Leave empty** for unlimited recurring payments (traditional behavior).

### Stichtag (Due Day) Guidelines

- **Monthly**: Enter 1-31 for the day of the month
- **Weekly**: Enter 1-7 (1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday)
- **Daily**: The due day is ignored (payment due every day)
- **Yearly**: Uses the month and day from the start date

## Automatic Expense Generation

### Automatic Triggering

The system automatically checks for and generates due recurring expenses when the **Dashboard** is loaded. The generation happens automatically in the background whenever a user accesses the dashboard.

### How It Works

1. When you access the dashboard, the system automatically checks all recurring expenses
2. For each recurring expense, it calculates if an expense is due today
3. If due and not already generated, a new regular expense is created automatically
4. The generated expense is marked as "bezahlt" (paid)
5. The process runs silently in the background without disrupting the dashboard display

### Technical Details

1. The generation process checks each recurring expense to see if:
   - The start date has been reached
   - An expense is due today based on the recurrence schedule
   - An expense hasn't already been generated for today
2. If all conditions are met, it creates a regular expense with:
   - All fields copied from the recurring expense
   - Today's date
   - Status automatically set to "bezahlt" (paid)
   - A comment indicating it was auto-generated
   - A tracking field linking it to the recurring expense

## Data Storage

- **Recurring Expenses**: Stored in `data/dauerhafte-ausgaben.json`
- **Generated Expenses**: Added to `data/ausgaben.json`
- **Logs**: Written to `data/recurring-expenses.log`

## API Endpoints

- **Load Recurring Expenses**: `api/load-dauerhafte-ausgaben.php`
- **Save Recurring Expenses**: `api/save-dauerhafte-ausgaben.php`
- **Trigger Generation**: `api/trigger-recurring-expenses.php` (POST) - Manually trigger expense generation

### API Response Example

Calling the trigger endpoint returns:
```json
{
  "success": true,
  "message": "Generated 2 new expense(s)",
  "generated": 2,
  "expenses": [
    {
      "id": "AUS-1234567890-abc123",
      "recipient": "Supplier Name",
      "amount": "99.99"
    }
  ]
}
```

## Examples

### Example 1: Monthly Rent Payment

- **Empfänger**: Landlord Name
- **Verwendungszweck**: Monthly Rent
- **Betrag**: 1200.00
- **Wiederholungszeitraum**: Monatlich
- **Beginn Datum**: 2026-01-01
- **Stichtag**: 1 (first day of each month)

Result: An expense for €1200 will be generated on the 1st of each month.

### Example 2: Weekly Service Payment

- **Empfänger**: Service Provider
- **Verwendungszweck**: Weekly Cleaning Service
- **Betrag**: 150.00
- **Wiederholungszeitraum**: Wöchentlich
- **Beginn Datum**: 2026-01-06
- **Stichtag**: 1 (Monday)

Result: An expense for €150 will be generated every Monday.

### Example 3: Yearly Insurance

- **Empfänger**: Insurance Company
- **Verwendungszweck**: Annual Insurance Premium
- **Betrag**: 2400.00
- **Wiederholungszeitraum**: Jährlich
- **Beginn Datum**: 2026-03-15
- **Stichtag**: (uses month/day from start date)

Result: An expense for €2400 will be generated on March 15th every year.

### Example 4: Installment Payment (NEW)

- **Empfänger**: Equipment Supplier
- **Verwendungszweck**: Equipment Purchase - Installment Plan
- **Betrag**: 250.00 (per month)
- **Wiederholungszeitraum**: Monatlich
- **Beginn Datum**: 2026-01-01
- **Stichtag**: 1 (first day of each month)
- **Gesamtsumme**: 1000.00

Result: The system generates 4 monthly payments of €250 each (250 + 250 + 250 + 250 = 1000), then automatically stops.

### Example 5: Installment with Partial Final Payment (NEW)

- **Empfänger**: Service Provider
- **Verwendungszweck**: Service Package - Payment Plan
- **Betrag**: 175.00 (per month)
- **Wiederholungszeitraum**: Monatlich
- **Beginn Datum**: 2026-02-01
- **Stichtag**: 1
- **Gesamtsumme**: 500.00

Result: The system generates 3 payments: €175 + €175 + €150 = €500 (final payment automatically adjusted to reach exactly €500).

## Troubleshooting

### Expenses Not Being Generated

1. **Check the dashboard**: Ensure you've accessed the dashboard recently to trigger generation

2. **Check browser console**: Open developer tools (F12) and check for errors when loading the dashboard

3. **Verify recurring expense data**: Check that the recurring expense has:
   - A valid start date
   - Correct stichtag value
   - Start date is not in the future

### Duplicate Expenses

The generation process includes duplicate detection. It checks if an expense with the same recurring ID and date already exists before creating a new one.

## Technical Details

### Recurrence Calculation

The generation process uses PHP's DateTime class to calculate due dates:

- **Daily**: Every day starting from the begin date
- **Weekly**: Specific day of the week (1-7)
- **Monthly**: Specific day of the month (1-31), adjusted for months with fewer days
- **Yearly**: Same month and day as the begin date each year

### Generated Expense Fields

Each generated expense includes:
- `Recurring_ID`: Links back to the source recurring expense
- `Status`: Automatically set to "bezahlt"
- `Kommentare`: Includes note about automatic generation
- All other fields copied from the recurring expense
