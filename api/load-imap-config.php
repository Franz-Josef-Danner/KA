<?php
/**
 * API Endpoint: Load IMAP Configuration
 *
 * Returns the IMAP configuration used for automatic bank-email checking.
 * Credentials (email + password) come from backend/config.json.
 * IMAP-specific settings (host, port, folder …) are stored in data/imap-config.json.
 *
 * Also returns whether the PHP IMAP extension is available and whether
 * backend credentials are configured, so the frontend can show setup hints.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');  // TODO: Replace with specific domain in production
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Determine system capabilities
$imapAvailable       = function_exists('imap_open');
$backendConfigFile   = __DIR__ . '/../backend/config.json';
$backendConfigured   = false;
$suggestedImapHost   = '';

if (file_exists($backendConfigFile)) {
    $bc = json_decode(file_get_contents($backendConfigFile), true);
    if (!empty($bc['email']) && !empty($bc['password'])) {
        $backendConfigured = true;
        // Suggest IMAP host derived from SMTP host
        if (!empty($bc['smtp']['host'])) {
            $suggestedImapHost = preg_replace('/^smtp\./i', 'imap.', $bc['smtp']['host']);
        }
    }
}

// Load IMAP-specific settings
$dataFile   = __DIR__ . '/../data/imap-config.json';
$imapConfig = null;
if (file_exists($dataFile)) {
    $raw = file_get_contents($dataFile);
    $imapConfig = json_decode($raw, true);
    if ($imapConfig === null) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to parse imap-config.json']);
        exit;
    }
}

http_response_code(200);
echo json_encode([
    'success'           => true,
    'data'              => $imapConfig,
    'imapAvailable'     => $imapAvailable,
    'backendConfigured' => $backendConfigured,
    'suggestedImapHost' => $suggestedImapHost,
    'timestamp'         => date('c'),
]);
