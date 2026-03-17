<?php
/**
 * API Endpoint: Save Planning Entries (Planung)
 *
 * Receives JSON data from the frontend and saves it to a JSON file
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
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
$data = json_decode($input, true);

if ($data === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Data must be an array']);
    exit;
}

$dataDir = __DIR__ . '/../data';
$dataFile = $dataDir . '/planung.json';

if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create data directory']);
        exit;
    }
}

if (file_exists($dataFile)) {
    $backupFile = $dataDir . '/planung.backup.json';
    if (!copy($dataFile, $backupFile)) {
        error_log("Warning: Failed to create backup of planung.json");
    }
}

$jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents($dataFile, $jsonData) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save data']);
    exit;
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Data saved successfully',
    'timestamp' => date('c')
]);
