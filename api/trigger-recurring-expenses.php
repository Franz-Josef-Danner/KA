<?php
/**
 * API Endpoint: Trigger Recurring Expense Generation
 * 
 * This endpoint triggers the recurring expense generation process.
 * Called automatically when the dashboard loads.
 */

// Set headers for JSON response
header('Content-Type: application/json');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Include the generation script logic
$dataDir = __DIR__ . '/../data';
$dauerhafteAusgabenFile = $dataDir . '/dauerhafte-ausgaben.json';
$ausgabenFile = $dataDir . '/ausgaben.json';

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
            return $currentDate->format('Y-m-d');
            
        case 'Wöchentlich':
            $targetDayOfWeek = intval($dueDay);
            if ($targetDayOfWeek < 1 || $targetDayOfWeek > 7) {
                $targetDayOfWeek = 1;
            }
            
            $currentDayOfWeek = intval($currentDate->format('N'));
            $daysToAdd = ($targetDayOfWeek - $currentDayOfWeek + 7) % 7;
            if ($daysToAdd == 0 && $currentDate < $reference) {
                $daysToAdd = 7;
            }
            $currentDate->modify("+$daysToAdd days");
            return $currentDate->format('Y-m-d');
            
        case 'Monatlich':
            $targetDay = intval($dueDay);
            if ($targetDay < 1 || $targetDay > 31) {
                $targetDay = 1;
            }
            
            $year = intval($currentDate->format('Y'));
            $month = intval($currentDate->format('m'));
            $daysInMonth = intval(date('t', mktime(0, 0, 0, $month, 1, $year)));
            $actualDay = min($targetDay, $daysInMonth);
            
            $dueDate = new DateTime("$year-$month-$actualDay");
            
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
            $year = intval($reference->format('Y'));
            $monthDay = $begin->format('m-d');
            $dueDate = new DateTime("$year-$monthDay");
            
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
 * Check if an expense already exists
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

try {
    // Check if recurring expenses file exists
    if (!file_exists($dauerhafteAusgabenFile)) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'No recurring expenses configured',
            'generated' => 0
        ]);
        exit;
    }
    
    // Load recurring expenses
    $dauerhafteAusgabenJson = file_get_contents($dauerhafteAusgabenFile);
    $dauerhafteAusgaben = json_decode($dauerhafteAusgabenJson, true);
    
    if (!is_array($dauerhafteAusgaben)) {
        throw new Exception('Failed to parse recurring expenses file');
    }
    
    // Load existing regular expenses
    $ausgaben = [];
    if (file_exists($ausgabenFile)) {
        $ausgabenJson = file_get_contents($ausgabenFile);
        $ausgaben = json_decode($ausgabenJson, true);
        if (!is_array($ausgaben)) {
            $ausgaben = [];
        }
    }
    
    // Current date
    $today = date('Y-m-d');
    $newExpensesCount = 0;
    $generatedExpenses = [];
    
    // Process each recurring expense
    foreach ($dauerhafteAusgaben as $dauerhafteAusgabe) {
        $recurringId = $dauerhafteAusgabe['Ausgaben_ID'] ?? '';
        $beginDate = $dauerhafteAusgabe['Beginn_Datum'] ?? '';
        $recurrencePeriod = $dauerhafteAusgabe['Wiederholungszeitraum'] ?? 'Monatlich';
        $dueDay = $dauerhafteAusgabe['Stichtag'] ?? '1';
        
        if (empty($beginDate) || empty($recurringId)) {
            continue;
        }
        
        // Check if begin date has been reached
        if ($beginDate > $today) {
            continue;
        }
        
        // Calculate next due date
        $nextDueDate = calculateNextDueDate($beginDate, $recurrencePeriod, $dueDay, $today);
        
        // Check if an expense is due today
        if ($nextDueDate === $today) {
            // Check if expense already exists
            if (expenseExists($ausgaben, $recurringId, $today)) {
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
                'Status' => 'bezahlt',
                'Deadline' => $today,
                'IBAN' => $dauerhafteAusgabe['IBAN'] ?? '',
                'BIC' => $dauerhafteAusgabe['BIC'] ?? '',
                'Kommentare' => ($dauerhafteAusgabe['Kommentare'] ?? '') . 
                               " [Automatisch generiert aus dauerhafter Ausgabe $recurringId]",
                'Recurring_ID' => $recurringId
            ];
            
            $ausgaben[] = $newExpense;
            $newExpensesCount++;
            $generatedExpenses[] = [
                'id' => $newExpense['Ausgaben_ID'],
                'recipient' => $newExpense['Empfaenger'],
                'amount' => $newExpense['Betrag']
            ];
        }
    }
    
    // Save updated expenses if any were added
    if ($newExpensesCount > 0) {
        $ausgabenJson = json_encode($ausgaben, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if (file_put_contents($ausgabenFile, $ausgabenJson) === false) {
            throw new Exception('Failed to save expenses file');
        }
    }
    
    // Success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Generated $newExpensesCount new expense(s)",
        'generated' => $newExpensesCount,
        'expenses' => $generatedExpenses
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
