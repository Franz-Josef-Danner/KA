<?php
/**
 * API Endpoint: Load Planning Entries (Planung)
 *
 * Returns the planning data from the JSON file
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
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

$dataFile = __DIR__ . '/../data/planung.json';

if (!file_exists($dataFile)) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [],
        'message' => 'No data found, returning empty array'
    ]);
    exit;
}

$jsonData = file_get_contents($dataFile);
$data = json_decode($jsonData, true);

if ($data === null) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to parse data file']);
    exit;
}

http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $data,
    'timestamp' => date('c')
]);
