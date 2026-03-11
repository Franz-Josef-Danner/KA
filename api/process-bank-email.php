<?php
/**
 * API Endpoint: Process Bank Payment Notification Email
 *
 * Accepts the text body of a bank notification email, extracts the invoice
 * number and the transferred amount, looks up the invoice in rechnungen.json,
 * verifies that the amounts match, and – if they do – marks the invoice as
 * "bezahlt" (paid).
 *
 * Expected POST body (JSON):
 * {
 *   "emailBody": "<raw email text>"
 * }
 *
 * Successful response (HTTP 200):
 * {
 *   "success": true,
 *   "invoiceId": "F-02035-20260228-001",
 *   "amount": 744.00,
 *   "message": "Rechnung F-02035-20260228-001 wurde erfolgreich als bezahlt markiert.",
 *   "timestamp": "2026-03-11T06:00:00+00:00"
 * }
 *
 * Error responses (HTTP 4xx/5xx):
 * { "success": false, "error": "<message>" }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');  // TODO: Replace with specific domain in production
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

// Read and decode JSON body
$input = file_get_contents('php://input');
$data  = json_decode($input, true);

if ($data === null || !isset($data['emailBody']) || !is_string($data['emailBody'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Kein E-Mail-Text angegeben']);
    exit;
}

$emailBody = $data['emailBody'];

// -------------------------------------------------------------------------
// 1. Extract invoice number
//    Format: F-XXXXX-YYYYMMDD-NNN  (e.g. F-02035-20260228-001)
// -------------------------------------------------------------------------
$invoiceId = null;
if (preg_match('/\b(F-\d{5}-\d{8}-\d{3})\b/', $emailBody, $matches)) {
    $invoiceId = $matches[1];
}

if ($invoiceId === null) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Keine Rechnungsnummer in der E-Mail gefunden']);
    exit;
}

// -------------------------------------------------------------------------
// 2. Extract transferred amount
//    Supports German decimal notation:  "744,00 EUR"  or  "1.234,56 EUR"
// -------------------------------------------------------------------------
$amount = null;
if (preg_match('/(\d{1,3}(?:\.\d{3})*,\d{2})\s*EUR/', $emailBody, $matches)) {
    // Convert German decimal format to float:
    //   "1.234,56"  →  remove thousands-dot  →  "1234,56"
    //             →  replace comma with dot  →  "1234.56"
    $normalised = str_replace(['.', ','], ['', '.'], $matches[1]);
    $amount     = (float) $normalised;
}

if ($amount === null) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Kein EUR-Betrag in der E-Mail gefunden']);
    exit;
}

// -------------------------------------------------------------------------
// 3. Load invoices from JSON storage
// -------------------------------------------------------------------------
$dataFile = __DIR__ . '/../data/rechnungen.json';

if (!file_exists($dataFile)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Keine Rechnungsdaten gefunden']);
    exit;
}

$jsonData = file_get_contents($dataFile);
$invoices = json_decode($jsonData, true);

if (!is_array($invoices)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Fehler beim Lesen der Rechnungsdaten']);
    exit;
}

// -------------------------------------------------------------------------
// 4. Find the matching invoice by Rechnungs_ID
// -------------------------------------------------------------------------
$matchIndex = null;
foreach ($invoices as $index => $invoice) {
    if (isset($invoice['Rechnungs_ID']) && $invoice['Rechnungs_ID'] === $invoiceId) {
        $matchIndex = $index;
        break;
    }
}

if ($matchIndex === null) {
    http_response_code(404);
    echo json_encode([
        'success'   => false,
        'invoiceId' => $invoiceId,
        'amount'    => $amount,
        'error'     => "Rechnung {$invoiceId} wurde nicht gefunden",
    ]);
    exit;
}

$invoice = $invoices[$matchIndex];

// -------------------------------------------------------------------------
// 5. Check if the invoice is already marked as paid
// -------------------------------------------------------------------------
if (isset($invoice['Bezahlt']) && $invoice['Bezahlt'] === 'bezahlt') {
    http_response_code(200);
    echo json_encode([
        'success'     => true,
        'alreadyPaid' => true,
        'invoiceId'   => $invoiceId,
        'amount'      => $amount,
        'message'     => "Rechnung {$invoiceId} ist bereits als bezahlt markiert.",
    ]);
    exit;
}

// -------------------------------------------------------------------------
// 6. Compare the amounts (allow 1-cent tolerance for floating-point rounding)
// -------------------------------------------------------------------------
$invoiceAmount = (float) ($invoice['Gesamtsumme'] ?? 0);
$tolerance     = 0.01;

if (abs($invoiceAmount - $amount) > $tolerance) {
    http_response_code(422);
    echo json_encode([
        'success'       => false,
        'amountMismatch'=> true,
        'invoiceId'     => $invoiceId,
        'emailAmount'   => $amount,
        'invoiceAmount' => $invoiceAmount,
        'error'         => sprintf(
            'Betrag stimmt nicht überein: E-Mail zeigt %.2f EUR, Rechnung enthält %.2f EUR',
            $amount,
            $invoiceAmount
        ),
    ]);
    exit;
}

// -------------------------------------------------------------------------
// 7. Mark the invoice as paid and save
// -------------------------------------------------------------------------
$invoices[$matchIndex]['Bezahlt'] = 'bezahlt';

// Create backup of current data before overwriting
$backupFile = __DIR__ . '/../data/rechnungen.backup.json';
if (!copy($dataFile, $backupFile)) {
    error_log("Warning: Failed to create backup of rechnungen.json before bank-email update");
}

// Persist the updated invoice list
$newJsonData = json_encode($invoices, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents($dataFile, $newJsonData) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Fehler beim Speichern der aktualisierten Rechnungsdaten']);
    exit;
}

// -------------------------------------------------------------------------
// 8. Success response
// -------------------------------------------------------------------------
http_response_code(200);
echo json_encode([
    'success'   => true,
    'invoiceId' => $invoiceId,
    'amount'    => $amount,
    'message'   => "Rechnung {$invoiceId} wurde erfolgreich als bezahlt markiert.",
    'timestamp' => date('c'),
]);
