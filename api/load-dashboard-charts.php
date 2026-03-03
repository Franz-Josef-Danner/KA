<?php
/**
 * API Endpoint: Load Dashboard Chart Data
 * 
 * Returns monthly data for:
 * 1. Actual trends (paid invoices revenue and paid expenses)
 * 2. Projected trends (with open invoices and expenses)
 */

// Set headers for JSON response
header('Content-Type: application/json');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Function to read and parse JSON file
function readJsonFile($filePath) {
    if (!file_exists($filePath)) {
        return [];
    }
    
    $jsonData = @file_get_contents($filePath);
    if ($jsonData === false) {
        return [];
    }
    
    $data = json_decode($jsonData, true);
    
    if ($data === null) {
        return [];
    }
    
    return $data;
}

// Function to parse numbers in both German and English format
function parseGermanNumber($value) {
    if (empty($value)) {
        return 0;
    }
    
    // Allow numeric types to pass through
    if (is_numeric($value) && !is_string($value)) {
        return floatval($value);
    }
    
    if (!is_string($value)) {
        return 0;
    }
    
    // Remove currency symbols and whitespace first
    $cleaned = preg_replace('/[€$\s]/', '', $value);
    
    // Detect format by checking which separator appears last
    $lastDotPos = strrpos($cleaned, '.');
    $lastCommaPos = strrpos($cleaned, ',');
    
    if ($lastCommaPos !== false && ($lastDotPos === false || $lastCommaPos > $lastDotPos)) {
        // German format: comma is decimal separator, dot is thousands
        $cleaned = str_replace('.', '', $cleaned);
        $cleaned = str_replace(',', '.', $cleaned);
    } else if ($lastDotPos !== false && ($lastCommaPos === false || $lastDotPos > $lastCommaPos)) {
        // English format: dot is decimal separator, comma is thousands
        $cleaned = str_replace(',', '', $cleaned);
    } else if ($lastCommaPos !== false) {
        // Only comma present - it's decimal separator (German)
        $cleaned = str_replace(',', '.', $cleaned);
    }
    
    // Remove any remaining non-numeric characters except dot and minus
    $cleaned = preg_replace('/[^\d.-]/', '', $cleaned);
    
    return floatval($cleaned);
}

// Function to calculate total from items or fallback field
function calculateTotal($record, $itemsField, $fallbackField) {
    $total = 0;
    
    if (isset($record['items']) && is_array($record['items'])) {
        // New format: calculate from items array
        foreach ($record['items'] as $item) {
            if (isset($item['Gesamtpreis'])) {
                $gesamtpreis = is_numeric($item['Gesamtpreis']) 
                    ? floatval($item['Gesamtpreis']) 
                    : parseGermanNumber(strval($item['Gesamtpreis']));
                $total += $gesamtpreis;
            }
        }
        
        // Apply discount if present
        $rabattPercent = isset($record['Rabatt']) ? floatval($record['Rabatt']) : 0;
        if ($rabattPercent > 0) {
            $total = $total * (1 - $rabattPercent / 100);
        }
    } else if (isset($record[$fallbackField])) {
        // Old format: use fallback field
        $total = parseGermanNumber($record[$fallbackField]);
    }
    
    return $total;
}

// Path to data files
$dataDir = __DIR__ . '/../data';
$rechnungenFile = $dataDir . '/rechnungen.json';
$auftraegFile = $dataDir . '/auftraege.json';
$ausgabenFile = $dataDir . '/ausgaben.json';

// Load data
$rechnungen = readJsonFile($rechnungenFile);
$auftraege = readJsonFile($auftraegFile);
$ausgaben = readJsonFile($ausgabenFile);

// Get current year
$currentYear = date('Y');

// Initialize monthly data arrays (months 1-12)
$monthlyPaidRevenue = array_fill(1, 12, 0);
$monthlyPaidExpenses = array_fill(1, 12, 0);
$monthlyOpenRevenue = array_fill(1, 12, 0);
$monthlyOpenExpenses = array_fill(1, 12, 0);

// Process paid invoices for actual revenue
foreach ($rechnungen as $invoice) {
    if (isset($invoice['Bezahlt']) && $invoice['Bezahlt'] === 'bezahlt') {
        // Use Zahlungsdatum (payment date) if available, otherwise Rechnungsdatum
        $dateField = isset($invoice['Zahlungsdatum']) && !empty($invoice['Zahlungsdatum']) 
            ? $invoice['Zahlungsdatum'] 
            : (isset($invoice['Rechnungsdatum']) ? $invoice['Rechnungsdatum'] : null);
        
        if ($dateField) {
            try {
                $date = new DateTime($dateField);
                if ($date->format('Y') == $currentYear) {
                    $month = (int)$date->format('n'); // Month without leading zero
                    $total = calculateTotal($invoice, 'items', 'Gesamtsumme');
                    $monthlyPaidRevenue[$month] += $total;
                }
            } catch (Exception $e) {
                // Skip invalid dates
            }
        }
    }
}

// Process paid expenses for actual expenses
foreach ($ausgaben as $expense) {
    if (isset($expense['Status']) && $expense['Status'] === 'bezahlt') {
        if (isset($expense['Datum']) && !empty($expense['Datum'])) {
            try {
                $date = new DateTime($expense['Datum']);
                if ($date->format('Y') == $currentYear) {
                    $month = (int)$date->format('n');
                    $amount = isset($expense['Betrag']) ? parseGermanNumber($expense['Betrag']) : 0;
                    $monthlyPaidExpenses[$month] += $amount;
                }
            } catch (Exception $e) {
                // Skip invalid dates
            }
        }
    }
}

// Process open invoices for projection
foreach ($rechnungen as $invoice) {
    if (isset($invoice['Bezahlt']) && $invoice['Bezahlt'] === 'unbezahlt') {
        // Use Rechnungsdatum for open invoices
        if (isset($invoice['Rechnungsdatum']) && !empty($invoice['Rechnungsdatum'])) {
            try {
                $date = new DateTime($invoice['Rechnungsdatum']);
                if ($date->format('Y') == $currentYear) {
                    $month = (int)$date->format('n');
                    $total = calculateTotal($invoice, 'items', 'Gesamtsumme');
                    $monthlyOpenRevenue[$month] += $total;
                }
            } catch (Exception $e) {
                // Skip invalid dates
            }
        }
    }
}

// Process open expenses for projection
foreach ($ausgaben as $expense) {
    if (isset($expense['Status']) && $expense['Status'] === 'unbezahlt') {
        if (isset($expense['Datum']) && !empty($expense['Datum'])) {
            try {
                $date = new DateTime($expense['Datum']);
                if ($date->format('Y') == $currentYear) {
                    $month = (int)$date->format('n');
                    $amount = isset($expense['Betrag']) ? parseGermanNumber($expense['Betrag']) : 0;
                    $monthlyOpenExpenses[$month] += $amount;
                }
            } catch (Exception $e) {
                // Skip invalid dates
            }
        }
    }
}

// Calculate cumulative (running totals) for actual data
$cumulativePaidRevenue = [];
$cumulativePaidExpenses = [];
$runningRevenue = 0;
$runningExpenses = 0;

for ($month = 1; $month <= 12; $month++) {
    $runningRevenue += $monthlyPaidRevenue[$month];
    $runningExpenses += $monthlyPaidExpenses[$month];
    $cumulativePaidRevenue[$month] = $runningRevenue;
    $cumulativePaidExpenses[$month] = $runningExpenses;
}

// Calculate projections based on average monthly trend from actual paid data
$currentMonth = (int)date('n');

$cumulativeProjectedRevenue = [];
$cumulativeProjectedExpenses = [];

// Start with actual cumulative totals
$projectedRevenue = $runningRevenue;
$projectedExpenses = $runningExpenses;

// Use average monthly trend from actual paid data for projection
$avgMonthlyRevenue = ($currentMonth > 0) ? $runningRevenue / $currentMonth : 0;
$avgMonthlyExpenses = ($currentMonth > 0) ? $runningExpenses / $currentMonth : 0;

for ($month = 1; $month <= 12; $month++) {
    if ($month <= $currentMonth) {
        // For past/current months, use actual data
        $cumulativeProjectedRevenue[$month] = $cumulativePaidRevenue[$month];
        $cumulativeProjectedExpenses[$month] = $cumulativePaidExpenses[$month];
    } else {
        // For future months, add projected amounts based on average monthly trend
        $projectedRevenue += $avgMonthlyRevenue;
        $projectedExpenses += $avgMonthlyExpenses;
        $cumulativeProjectedRevenue[$month] = $projectedRevenue;
        $cumulativeProjectedExpenses[$month] = $projectedExpenses;
    }
}

// Convert arrays to indexed format for JSON
$monthLabels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
$actualRevenue = array_values($cumulativePaidRevenue);
$actualExpenses = array_values($cumulativePaidExpenses);
$projectedRevenue = array_values($cumulativeProjectedRevenue);
$projectedExpenses = array_values($cumulativeProjectedExpenses);

// Success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => [
        'year' => $currentYear,
        'currentMonth' => $currentMonth,
        'labels' => $monthLabels,
        'actual' => [
            'revenue' => $actualRevenue,
            'expenses' => $actualExpenses
        ],
        'projected' => [
            'revenue' => $projectedRevenue,
            'expenses' => $projectedExpenses
        ]
    ],
    'timestamp' => date('c')
]);
