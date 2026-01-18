<?php
/**
 * API Endpoint: Load Dashboard Statistics
 * 
 * Returns statistics about open invoices, orders, and expenses
 */

// Set headers for JSON response
header('Content-Type: application/json');

// CORS headers - Configure for production!
// For development: Allow all origins
// For production: Replace * with your specific domain(s)
header('Access-Control-Allow-Origin: *');  // TODO: Replace with specific domain in production
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

// Function to parse German formatted number (e.g., "1.234,56" -> 1234.56)
function parseGermanNumber($value) {
    if (empty($value) || !is_string($value)) {
        return 0;
    }
    
    // Remove thousands separator (.) and replace decimal comma with dot
    $cleaned = str_replace('.', '', $value);
    $cleaned = str_replace(',', '.', $cleaned);
    
    // Remove currency symbols and whitespace
    $cleaned = preg_replace('/[^\d.-]/', '', $cleaned);
    
    return floatval($cleaned);
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

// Calculate statistics for open invoices (unbezahlt)
$openInvoicesCount = 0;
$openInvoicesSum = 0;

foreach ($rechnungen as $invoice) {
    if (isset($invoice['Bezahlt']) && $invoice['Bezahlt'] === 'unbezahlt') {
        $openInvoicesCount++;
        
        if (isset($invoice['Gesamtsumme'])) {
            $openInvoicesSum += parseGermanNumber($invoice['Gesamtsumme']);
        }
    }
}

// Calculate statistics for open orders (Status: "in Arbeit" or empty or "offen")
$openOrdersCount = 0;
$openOrdersSum = 0;

foreach ($auftraege as $order) {
    $status = isset($order['Status']) ? $order['Status'] : '';
    
    // Consider order as open if status is "in Arbeit", empty, or "offen"
    if ($status === 'in Arbeit' || $status === '' || $status === 'offen') {
        $openOrdersCount++;
        
        if (isset($order['Budget'])) {
            $openOrdersSum += parseGermanNumber($order['Budget']);
        }
    }
}

// Calculate statistics for open expenses (Status: "unbezahlt")
$openExpensesCount = 0;
$openExpensesSum = 0;

foreach ($ausgaben as $expense) {
    if (isset($expense['Status']) && $expense['Status'] === 'unbezahlt') {
        $openExpensesCount++;
        
        if (isset($expense['Betrag'])) {
            $openExpensesSum += parseGermanNumber($expense['Betrag']);
        }
    }
}

// Success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => [
        'openInvoices' => [
            'count' => $openInvoicesCount,
            'sum' => $openInvoicesSum
        ],
        'openOrders' => [
            'count' => $openOrdersCount,
            'sum' => $openOrdersSum
        ],
        'openExpenses' => [
            'count' => $openExpensesCount,
            'sum' => $openExpensesSum
        ]
    ],
    'timestamp' => date('c')
]);
