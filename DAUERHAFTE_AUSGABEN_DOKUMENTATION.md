# Dauerhafte Ausgaben (Recurring Expenses) - Documentation

## Overview

The recurring expenses feature allows you to define expenses that repeat on a regular basis (daily, weekly, monthly, or yearly). These recurring expenses automatically generate regular expenses based on their schedule.

## Features

- **Recurring Expense Management**: Create and manage recurring expenses with the same fields as regular expenses
- **Recurrence Periods**: Daily, Weekly, Monthly, or Yearly
- **Start Date**: Define when the recurring expense begins
- **Due Day**: Specify which day of the period the payment is due
- **Automatic Generation**: Regular expenses are automatically created based on the schedule
- **Auto-paid Status**: Generated expenses are automatically marked as "bezahlt" (paid)

## User Interface

The recurring expenses management page is available in the navigation menu under "Dauerhafte Ausgaben".

### Creating a Recurring Expense

1. Navigate to **Dauerhafte Ausgaben** in the menu
2. Click **+ Neue dauerhafte Ausgabe**
3. Fill in the required fields:
   - **Empfänger** (Recipient): Who receives the payment
   - **Verwendungszweck** (Purpose): What the payment is for
   - **Betrag** (Amount): Payment amount in euros
   - **Wiederholungszeitraum** (Recurrence Period): Daily, Weekly, Monthly, or Yearly
   - **Beginn Datum** (Start Date): When the recurring expense begins
   - **Stichtag** (Due Day): Day of the period when payment is due
4. Click **Speichern** (Save)

### Stichtag (Due Day) Guidelines

- **Monthly**: Enter 1-31 for the day of the month
- **Weekly**: Enter 1-7 (1=Monday, 7=Sunday)
- **Daily**: The due day is ignored (payment due every day)
- **Yearly**: Uses the month and day from the start date

## Automatic Expense Generation

### Cronjob Script

The system includes a PHP script `generate-recurring-expenses.php` that processes recurring expenses and generates regular expenses automatically.

### Setup Instructions

1. **Make the script executable** (optional, for direct execution):
   ```bash
   chmod +x /path/to/KA/generate-recurring-expenses.php
   ```

2. **Configure Cronjob**: Add the following line to your crontab to run the script daily at midnight:
   ```bash
   crontab -e
   ```
   
   Add this line:
   ```bash
   0 0 * * * /usr/bin/php /path/to/KA/generate-recurring-expenses.php >> /var/log/ka-recurring-expenses.log 2>&1
   ```

3. **Alternative Schedule**: Run every day at 6 AM:
   ```bash
   0 6 * * * /usr/bin/php /path/to/KA/generate-recurring-expenses.php >> /var/log/ka-recurring-expenses.log 2>&1
   ```

### Manual Execution

You can also run the script manually for testing:
```bash
cd /path/to/KA
php generate-recurring-expenses.php
```

### How It Works

1. The script runs daily (or as configured in cron)
2. It checks each recurring expense to see if:
   - The start date has been reached
   - An expense is due today based on the recurrence schedule
   - An expense hasn't already been generated for today
3. If all conditions are met, it creates a regular expense with:
   - All fields copied from the recurring expense
   - Today's date
   - Status automatically set to "bezahlt" (paid)
   - A comment indicating it was auto-generated
   - A tracking field linking it to the recurring expense

### Logs

The script logs all activities to `data/recurring-expenses.log`. Check this file to:
- Monitor script execution
- Verify expense generation
- Troubleshoot issues

Example log output:
```
[2026-01-18 00:00:00] Starting recurring expenses generation
[2026-01-18 00:00:00] Loaded 5 recurring expenses
[2026-01-18 00:00:00] Loaded 120 existing expenses
[2026-01-18 00:00:00] Generated new expense for recurring ID DAUS-123: AUS-456
[2026-01-18 00:00:00] Successfully generated and saved 1 new expenses
[2026-01-18 00:00:00] Recurring expenses generation completed successfully
```

## Data Storage

- **Recurring Expenses**: Stored in `data/dauerhafte-ausgaben.json`
- **Generated Expenses**: Added to `data/ausgaben.json`
- **Logs**: Written to `data/recurring-expenses.log`

## API Endpoints

- **Load Recurring Expenses**: `api/load-dauerhafte-ausgaben.php`
- **Save Recurring Expenses**: `api/save-dauerhafte-ausgaben.php`

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

## Troubleshooting

### Expenses Not Being Generated

1. **Check the cronjob is running**: View cron logs
   ```bash
   grep CRON /var/log/syslog
   ```

2. **Check script logs**: View the recurring expenses log
   ```bash
   cat data/recurring-expenses.log
   ```

3. **Run script manually**: Test the script execution
   ```bash
   php generate-recurring-expenses.php
   ```

4. **Verify recurring expense data**: Check that the recurring expense has:
   - A valid start date
   - Correct stichtag value
   - Start date is not in the future

### Duplicate Expenses

The script includes duplicate detection. It checks if an expense with the same recurring ID and date already exists before creating a new one.

## Technical Details

### Recurrence Calculation

The script uses PHP's DateTime class to calculate due dates:

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
