<?php
/**
 * Send Contact Message API Endpoint
 * 
 * This endpoint handles contact form submissions and queues them for email sending.
 * It integrates with the email notification system.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit();
}

// Get the posted data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate required fields
if (!isset($data['senderName']) || !isset($data['senderEmail']) || 
    !isset($data['subject']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit();
}

// Validate email format
if (!filter_var($data['senderEmail'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit();
}

// Validate message length
if (strlen($data['message']) < 10) {
    http_response_code(400);
    echo json_encode(['error' => 'Message too short (minimum 10 characters)']);
    exit();
}

// Create notification data
$notification = [
    'id' => 'contactMessage_' . time() . '_' . bin2hex(random_bytes(5)),
    'type' => 'contactMessage',
    'data' => [
        'senderName' => htmlspecialchars($data['senderName'], ENT_QUOTES, 'UTF-8'),
        'senderEmail' => filter_var($data['senderEmail'], FILTER_SANITIZE_EMAIL),
        'subject' => htmlspecialchars($data['subject'], ENT_QUOTES, 'UTF-8'),
        'message' => htmlspecialchars($data['message'], ENT_QUOTES, 'UTF-8'),
        'timestamp' => date('c')
    ],
    'recipientEmail' => $data['recipientEmail'] ?? null,
    'timestamp' => date('c'),
    'status' => 'pending',
    'retryCount' => 0
];

// Load existing queue
$queueFile = __DIR__ . '/../backend/email-queue.json';
$queue = [];

if (file_exists($queueFile)) {
    $queueData = file_get_contents($queueFile);
    $queue = json_decode($queueData, true) ?? [];
}

// Add notification to queue
$queue[] = $notification;

// Save queue
if (!file_put_contents($queueFile, json_encode($queue, JSON_PRETTY_PRINT))) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save notification to queue']);
    exit();
}

// Return success response
http_response_code(200);
echo json_encode([
    'success' => true,
    'notificationId' => $notification['id'],
    'message' => 'Contact message queued successfully'
]);
