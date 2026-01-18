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

// Function to parse numbers in both German and English format
function parseGermanNumber($value) {
    if (empty($value) || !is_string($value)) {
        return 0;
    }
    
    // Remove currency symbols and whitespace first
    $cleaned = preg_replace('/[€$\s]/', '', $value);
    
    // Detect format by checking which separator appears last
    $lastDotPos = strrpos($cleaned, '.');
    $lastCommaPos = strrpos($cleaned, ',');
    
    if ($lastCommaPos !== false && ($lastDotPos === false || $lastCommaPos > $lastDotPos)) {
        // German format: comma is decimal separator, dot is thousands
        // Example: "5.000,50" or "1.234.567,89"
        $cleaned = str_replace('.', '', $cleaned); // Remove thousands separator
        $cleaned = str_replace(',', '.', $cleaned); // Replace decimal comma with dot
    } else if ($lastDotPos !== false && ($lastCommaPos === false || $lastDotPos > $lastCommaPos)) {
        // English format: dot is decimal separator, comma is thousands
        // Example: "5,000.50" or "1,234,567.89"
        $cleaned = str_replace(',', '', $cleaned); // Remove thousands separator
        // Dot is already decimal separator
    } else if ($lastCommaPos !== false) {
        // Only comma present - it's decimal separator (German)
        // Example: "450,50"
        $cleaned = str_replace(',', '.', $cleaned);
    }
    // else: only dot or neither - treat dot as decimal (English format)
    
    // Remove any remaining non-numeric characters except dot and minus
    $cleaned = preg_replace('/[^\d.-]/', '', $cleaned);
    
    return floatval($cleaned);
}

// Path to data files
$dataDir = __DIR__ . '/../data';
$rechnungenFile = $dataDir . '/rechnungen.json';
$auftraegFile = $dataDir . '/auftraege.json';
$ausgabenFile = $dataDir . '/ausgaben.json';
$artikellistenFile = $dataDir . '/artikellisten.json';

// Load data
$rechnungen = readJsonFile($rechnungenFile);
$auftraege = readJsonFile($auftraegFile);
$ausgaben = readJsonFile($ausgabenFile);
$artikellisten = readJsonFile($artikellistenFile);

// Default payment term in days
$DEFAULT_ZAHLUNGSZIEL_TAGE = 30;

// Build a map of Firmen_ID to zahlungsziel_tage for quick lookup
$paymentTermsMap = [];
foreach ($artikellisten as $artikelliste) {
    if (isset($artikelliste['firmen_id']) && isset($artikelliste['zahlungsziel_tage'])) {
        $paymentTermsMap[$artikelliste['firmen_id']] = intval($artikelliste['zahlungsziel_tage']);
    }
}

// Calculate statistics for open invoices (unbezahlt)
$openInvoicesCount = 0;
$openInvoicesSum = 0;
$invoicesDueSoon = 0; // < 4 days to deadline
$invoicesOverdue = 0; // past deadline

// Get current date for comparison
$today = new DateTime();
$today->setTime(0, 0, 0); // Set to midnight for accurate day comparison

foreach ($rechnungen as $invoice) {
    if (isset($invoice['Bezahlt']) && $invoice['Bezahlt'] === 'unbezahlt') {
        $openInvoicesCount++;
        
        // Calculate total from items array (new format) or Gesamtsumme field (old format)
        $invoiceTotal = 0;
        if (isset($invoice['items']) && is_array($invoice['items']) && count($invoice['items']) > 0) {
            // New format: calculate from items array
            foreach ($invoice['items'] as $item) {
                if (isset($item['Gesamtpreis'])) {
                    // Items store Gesamtpreis as number, but handle string format too
                    $gesamtpreis = is_numeric($item['Gesamtpreis']) 
                        ? floatval($item['Gesamtpreis']) 
                        : parseGermanNumber(strval($item['Gesamtpreis']));
                    $invoiceTotal += $gesamtpreis;
                }
            }
            
            // Apply discount if present
            $rabattPercent = isset($invoice['Rabatt']) ? floatval($invoice['Rabatt']) : 0;
            if ($rabattPercent > 0) {
                $invoiceTotal = $invoiceTotal * (1 - $rabattPercent / 100);
            }
        } else if (isset($invoice['Gesamtsumme'])) {
            // Old format: use Gesamtsumme field
            $invoiceTotal = parseGermanNumber($invoice['Gesamtsumme']);
        }
        
        $openInvoicesSum += $invoiceTotal;
        
        // Calculate deadline for this invoice
        if (isset($invoice['Rechnungsdatum']) && !empty($invoice['Rechnungsdatum'])) {
            try {
                $invoiceDate = new DateTime($invoice['Rechnungsdatum']);
                
                // Get payment terms (zahlungsziel_tage) for this invoice
                $zahlungszielTage = $DEFAULT_ZAHLUNGSZIEL_TAGE;
                if (isset($invoice['Firmen_ID']) && isset($paymentTermsMap[$invoice['Firmen_ID']])) {
                    $zahlungszielTage = $paymentTermsMap[$invoice['Firmen_ID']];
                }
                
                // Calculate deadline date
                $deadline = clone $invoiceDate;
                $deadline->modify("+{$zahlungszielTage} days");
                $deadline->setTime(0, 0, 0); // Set to midnight for accurate comparison
                
                // Calculate days until deadline
                $interval = $today->diff($deadline);
                $daysUntilDeadline = (int)$interval->format('%r%a'); // %r gives sign, %a gives days
                
                if ($daysUntilDeadline < 0) {
                    // Past deadline (negative days means deadline has passed)
                    $invoicesOverdue++;
                } else if ($daysUntilDeadline < 4) {
                    // Less than 4 days to deadline (0-3 days)
                    $invoicesDueSoon++;
                }
                // else: more than 4 days - no special category needed
                
            } catch (Exception $e) {
                // If date parsing fails, skip deadline calculation for this invoice
                error_log("Failed to parse invoice date: " . $invoice['Rechnungsdatum']);
            }
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
        
        // Calculate total from items array (new format) or Budget field (old format)
        $orderTotal = 0;
        if (isset($order['items']) && is_array($order['items']) && count($order['items']) > 0) {
            // New format: calculate from items array
            foreach ($order['items'] as $item) {
                if (isset($item['Gesamtpreis'])) {
                    // Items store Gesamtpreis as number, but handle string format too
                    $gesamtpreis = is_numeric($item['Gesamtpreis']) 
                        ? floatval($item['Gesamtpreis']) 
                        : parseGermanNumber(strval($item['Gesamtpreis']));
                    $orderTotal += $gesamtpreis;
                }
            }
            
            // Apply discount if present
            $rabattPercent = isset($order['Rabatt']) ? floatval($order['Rabatt']) : 0;
            if ($rabattPercent > 0) {
                $orderTotal = $orderTotal * (1 - $rabattPercent / 100);
            }
        } else if (isset($order['Budget'])) {
            // Old format: use Budget field
            $orderTotal = parseGermanNumber($order['Budget']);
        }
        
        $openOrdersSum += $orderTotal;
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
            'sum' => $openInvoicesSum,
            'dueSoon' => $invoicesDueSoon,
            'overdue' => $invoicesOverdue
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
