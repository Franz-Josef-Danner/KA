<?php
/**
 * API Endpoint: Save Admin Users
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

// Ensure data is an array
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Data must be an array']);
    exit;
}

// Validate each user object has required fields
foreach ($data as $user) {
    if (!is_array($user)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Each user must be an object']);
        exit;
    }
    if (empty($user['email']) || !filter_var($user['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Each user must have a valid email address']);
        exit;
    }
    if (empty($user['password']) || !is_string($user['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Each user must have a password hash']);
        exit;
    }
    if (empty($user['role']) || !in_array($user['role'], ['admin'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Each user must have a valid role']);
        exit;
    }
}

// Path to the data file
$dataDir = __DIR__ . '/../data';
$dataFile = $dataDir . '/admin-users.json';

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
    $backupFile = $dataDir . '/admin-users.backup.json';
    if (!copy($dataFile, $backupFile)) {
        // Log backup failure but continue with save
        error_log("Warning: Failed to create backup of admin-users.json");
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
    'message' => 'Data saved successfully',
    'timestamp' => date('c')
]);
