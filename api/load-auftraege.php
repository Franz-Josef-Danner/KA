<?php
/**
 * API Endpoint: Load Orders (Aufträge)
 * 
 * Returns the orders data from the JSON file
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

// Path to the data file
$dataFile = __DIR__ . '/../data/auftraege.json';

// Check if the file exists
if (!file_exists($dataFile)) {
    // Return empty array if file doesn't exist yet
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [],
        'message' => 'No data found, returning empty array'
    ]);
    exit;
}

// Read the data from the file
$jsonData = file_get_contents($dataFile);
$data = json_decode($jsonData, true);

// Validate the data
if ($data === null) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to parse data file']);
    exit;
}

// Success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => $data,
    'timestamp' => date('c')
]);
