<?php
/**
 * Cronjob Script: Generate Regular Expenses from Recurring Expenses
 * 
 * This script processes recurring expenses (dauerhafte Ausgaben) and generates
 * regular expenses (Ausgaben) based on their recurrence schedule.
 * 
 * Run this script daily via cronjob:
 * 0 0 * * * /usr/bin/php /path/to/KA/generate-recurring-expenses.php
 */

// Define paths
$dataDir = __DIR__ . '/data';
$dauerhafteAusgabenFile = $dataDir . '/dauerhafte-ausgaben.json';
$ausgabenFile = $dataDir . '/ausgaben.json';
$logFile = $dataDir . '/recurring-expenses.log';

/**
 * Log a message to the log file
 */
function logMessage($message) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] $message\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);
    echo $logEntry;
}

/**
 * Calculate the next due date for a recurring expense
 */
function calculateNextDueDate($beginDate, $recurrencePeriod, $dueDay, $referenceDate) {
    $begin = new DateTime($beginDate);
    $reference = new DateTime($referenceDate);
    
    // Start from begin date or reference date, whichever is later
    $currentDate = ($begin > $reference) ? clone $begin : clone $reference;
    
    switch ($recurrencePeriod) {
        case 'Täglich':
            // For daily, the due day is ignored
            return $currentDate->format('Y-m-d');
            
        case 'Wöchentlich':
            // Due day is 1-7 (Monday to Sunday)
            $targetDayOfWeek = intval($dueDay);
            if ($targetDayOfWeek < 1 || $targetDayOfWeek > 7) {
                $targetDayOfWeek = 1; // Default to Monday
            }
            
            // Adjust to the target day of week
            $currentDayOfWeek = intval($currentDate->format('N')); // 1 (Monday) to 7 (Sunday)
            $daysToAdd = ($targetDayOfWeek - $currentDayOfWeek + 7) % 7;
            if ($daysToAdd == 0 && $currentDate < $reference) {
                $daysToAdd = 7; // Move to next week if we're before reference
            }
            $currentDate->modify("+$daysToAdd days");
            return $currentDate->format('Y-m-d');
            
        case 'Monatlich':
            // Due day is 1-31 (day of month)
            $targetDay = intval($dueDay);
            if ($targetDay < 1 || $targetDay > 31) {
                $targetDay = 1; // Default to 1st of month
            }
            
            // Set to the target day of the current month
            $year = intval($currentDate->format('Y'));
            $month = intval($currentDate->format('m'));
            
            // Adjust day if it exceeds the number of days in the month
            $daysInMonth = intval(date('t', mktime(0, 0, 0, $month, 1, $year)));
            $actualDay = min($targetDay, $daysInMonth);
            
            $dueDate = new DateTime("$year-$month-$actualDay");
            
            // If due date is before reference date, move to next month
            if ($dueDate < $reference) {
                $currentDate->modify('first day of next month');
                $year = intval($currentDate->format('Y'));
                $month = intval($currentDate->format('m'));
                $daysInMonth = intval(date('t', mktime(0, 0, 0, $month, 1, $year)));
                $actualDay = min($targetDay, $daysInMonth);
                $dueDate = new DateTime("$year-$month-$actualDay");
            }
            
            return $dueDate->format('Y-m-d');
            
        case 'Jährlich':
            // Due day is typically month and day (e.g., 1231 for Dec 31)
            // For simplicity, use the begin date's month and day
            $year = intval($reference->format('Y'));
            $monthDay = $begin->format('m-d');
            $dueDate = new DateTime("$year-$monthDay");
            
            // If due date is before reference date, move to next year
            if ($dueDate < $reference) {
                $year++;
                $dueDate = new DateTime("$year-$monthDay");
            }
            
            return $dueDate->format('Y-m-d');
            
        default:
            return $currentDate->format('Y-m-d');
    }
}

/**
 * Check if an expense already exists for this recurring expense on this date
 */
function expenseExists($ausgaben, $recurringId, $date) {
    foreach ($ausgaben as $expense) {
        if (isset($expense['Recurring_ID']) && 
            $expense['Recurring_ID'] === $recurringId && 
            $expense['Datum'] === $date) {
            return true;
        }
    }
    return false;
}

/**
 * Generate a unique ID for an expense
 */
function generateExpenseId() {
    return 'AUS-' . time() . '-' . bin2hex(random_bytes(5));
}

// Main execution
logMessage("Starting recurring expenses generation");

// Check if recurring expenses file exists
if (!file_exists($dauerhafteAusgabenFile)) {
    logMessage("No recurring expenses file found. Exiting.");
    exit(0);
}

// Load recurring expenses
$dauerhafteAusgabenJson = file_get_contents($dauerhafteAusgabenFile);
$dauerhafteAusgaben = json_decode($dauerhafteAusgabenJson, true);

if (!is_array($dauerhafteAusgaben)) {
    logMessage("ERROR: Failed to parse recurring expenses file");
    exit(1);
}

logMessage("Loaded " . count($dauerhafteAusgaben) . " recurring expenses");

// Load existing regular expenses
$ausgaben = [];
if (file_exists($ausgabenFile)) {
    $ausgabenJson = file_get_contents($ausgabenFile);
    $ausgaben = json_decode($ausgabenJson, true);
    if (!is_array($ausgaben)) {
        logMessage("WARNING: Failed to parse expenses file, starting with empty array");
        $ausgaben = [];
    }
}

logMessage("Loaded " . count($ausgaben) . " existing expenses");

// Current date
$today = date('Y-m-d');
$newExpensesCount = 0;

// Process each recurring expense
foreach ($dauerhafteAusgaben as $dauerhafteAusgabe) {
    $recurringId = $dauerhafteAusgabe['Ausgaben_ID'] ?? '';
    $beginDate = $dauerhafteAusgabe['Beginn_Datum'] ?? '';
    $recurrencePeriod = $dauerhafteAusgabe['Wiederholungszeitraum'] ?? 'Monatlich';
    $dueDay = $dauerhafteAusgabe['Stichtag'] ?? '1';
    
    if (empty($beginDate) || empty($recurringId)) {
        logMessage("WARNING: Skipping recurring expense with missing begin date or ID");
        continue;
    }
    
    // Check if begin date has been reached
    if ($beginDate > $today) {
        logMessage("Skipping recurring expense $recurringId - begin date not yet reached");
        continue;
    }
    
    // Calculate next due date
    $nextDueDate = calculateNextDueDate($beginDate, $recurrencePeriod, $dueDay, $today);
    
    // Check if an expense is due today
    if ($nextDueDate === $today) {
        // Check if expense already exists
        if (expenseExists($ausgaben, $recurringId, $today)) {
            logMessage("Expense already exists for recurring ID $recurringId on $today");
            continue;
        }
        
        // Generate a new regular expense
        $newExpense = [
            'Ausgaben_ID' => generateExpenseId(),
            'Datum' => $today,
            'Empfaenger' => $dauerhafteAusgabe['Empfaenger'] ?? '',
            'Verwendungszweck' => $dauerhafteAusgabe['Verwendungszweck'] ?? '',
            'Rechnungsnummer' => $dauerhafteAusgabe['Rechnungsnummer'] ?? '',
            'Betrag' => $dauerhafteAusgabe['Betrag'] ?? '0.00',
            'Kategorie' => $dauerhafteAusgabe['Kategorie'] ?? 'Beruflich',
            'Status' => 'bezahlt', // Automatically mark as paid
            'Deadline' => $today,
            'IBAN' => $dauerhafteAusgabe['IBAN'] ?? '',
            'BIC' => $dauerhafteAusgabe['BIC'] ?? '',
            'Kommentare' => ($dauerhafteAusgabe['Kommentare'] ?? '') . 
                           " [Automatisch generiert aus dauerhafter Ausgabe $recurringId]",
            'Recurring_ID' => $recurringId // Track which recurring expense generated this
        ];
        
        $ausgaben[] = $newExpense;
        $newExpensesCount++;
        
        logMessage("Generated new expense for recurring ID $recurringId: " . $newExpense['Ausgaben_ID']);
    }
}

// Save updated expenses if any were added
if ($newExpensesCount > 0) {
    $ausgabenJson = json_encode($ausgaben, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if (file_put_contents($ausgabenFile, $ausgabenJson) === false) {
        logMessage("ERROR: Failed to save expenses file");
        exit(1);
    }
    logMessage("Successfully generated and saved $newExpensesCount new expenses");
} else {
    logMessage("No new expenses generated");
}

logMessage("Recurring expenses generation completed successfully");
exit(0);
