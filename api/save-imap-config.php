<?php
/**
 * API Endpoint: Save IMAP Configuration
 *
 * Persists the IMAP-specific settings to data/imap-config.json.
 * Credentials are NOT stored here – they come from backend/config.json.
 *
 * Expected POST body (JSON):
 * {
 *   "enabled":    true,
 *   "host":       "imap.world4you.com",
 *   "port":       993,
 *   "secure":     true,
 *   "folder":     "INBOX/finanzen",
 *   "markAsRead": true,
 *   "deleteProcessed": false,
 *   "archiveProcessed": false,
 *   "archiveFolder": "INBOX.finanzen.archiv"
 * }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');  // TODO: Replace with specific domain in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data  = json_decode($input, true);

if ($data === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

// Sanitise / validate fields
$config = [
    'enabled'    => (bool)  ($data['enabled']    ?? false),
    'host'       => trim((string) ($data['host']  ?? '')),
    'port'       => (int)   ($data['port']        ?? 993),
    'secure'     => (bool)  ($data['secure']      ?? true),
    'folder'     => trim((string) ($data['folder'] ?? 'INBOX/finanzen')),
    'markAsRead' => (bool)  ($data['markAsRead']  ?? true),
    'deleteProcessed' => (bool) ($data['deleteProcessed'] ?? false),
    'archiveProcessed' => (bool) ($data['archiveProcessed'] ?? false),
    'archiveFolder' => trim((string) ($data['archiveFolder'] ?? 'INBOX.finanzen.archiv')),
];

if (empty($config['folder'])) {
    $config['folder'] = 'INBOX/finanzen';
}
if (empty($config['archiveFolder'])) {
    $config['archiveFolder'] = 'INBOX.finanzen.archiv';
}
if ($config['port'] < 1 || $config['port'] > 65535) {
    $config['port'] = 993;
}

// Persist to data/imap-config.json
$dataDir  = __DIR__ . '/../data';
$dataFile = $dataDir . '/imap-config.json';

if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create data directory']);
        exit;
    }
}

$jsonData = json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents($dataFile, $jsonData) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save IMAP configuration']);
    exit;
}

http_response_code(200);
echo json_encode([
    'success'   => true,
    'message'   => 'IMAP-Konfiguration erfolgreich gespeichert.',
    'timestamp' => date('c'),
]);
