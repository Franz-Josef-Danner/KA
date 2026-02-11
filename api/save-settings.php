<?php
/**
 * API Endpoint: Save Company Settings
 * 
 * Receives JSON data from the frontend and saves it to a JSON file
 */

// Set headers for JSON response
header('Content-Type: application/json');

// CORS headers - Configure for production!
// For development: Allow all origins
// For production: Replace * with your specific domain(s)
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

// Get the JSON data from the request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate the input
if ($data === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit;
}

// Validate required fields
if (!isset($data['companyName'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Company name is required']);
    exit;
}

// Path to the data file
$dataDir = __DIR__ . '/../data';
$dataFile = $dataDir . '/settings.json';

// Ensure the data directory exists
if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to create data directory']);
        exit;
    }
}

// Create a backup of the existing file before saving
if (file_exists($dataFile)) {
    $backupFile = $dataDir . '/settings.backup.json';
    if (!copy($dataFile, $backupFile)) {
        // Log backup failure but continue with save
        error_log("Warning: Failed to create backup of settings.json");
    }
}

// Save the data to the file
$jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents($dataFile, $jsonData) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save data']);
    exit;
}

// Success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Settings saved successfully',
    'timestamp' => date('c')
]);
