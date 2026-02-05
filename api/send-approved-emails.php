<?php
/**
 * Send Approved Emails API Endpoint
 * 
 * This endpoint exports approved emails from localStorage to the backend
 * and triggers the email-sender.js script to actually send them.
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

// Get the posted data (approved emails from frontend)
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['approvedEmails']) || !is_array($data['approvedEmails'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request. Expected approvedEmails array.']);
    exit();
}

$approvedEmails = $data['approvedEmails'];

if (count($approvedEmails) === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'No approved emails to send.']);
    exit();
}

// Backend directory path
$backendDir = __DIR__ . '/../backend';
$queueFile = $backendDir . '/email-queue.json';
$configFile = $backendDir . '/config.json';

// Check if backend is configured
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Backend nicht konfiguriert',
        'message' => 'Die E-Mail-Konfiguration fehlt. Bitte erstellen Sie backend/config.json basierend auf config.example.json.',
        'instructions' => [
            '1. Öffnen Sie backend/config.example.json',
            '2. Kopieren Sie es zu backend/config.json',
            '3. Tragen Sie Ihre E-Mail-Zugangsdaten ein',
            '4. Führen Sie "npm install" im backend/ Verzeichnis aus'
        ]
    ]);
    exit();
}

// Load existing queue or create new one
$existingQueue = [];
if (file_exists($queueFile)) {
    $queueData = file_get_contents($queueFile);
    $existingQueue = json_decode($queueData, true) ?? [];
}

// Merge approved emails with existing queue
// Update status to 'pending' so backend will process them
foreach ($approvedEmails as &$email) {
    $email['status'] = 'pending'; // Backend expects 'pending' status
    
    // Check if email already exists in queue
    $exists = false;
    foreach ($existingQueue as &$existingEmail) {
        if ($existingEmail['id'] === $email['id']) {
            // Update existing email
            $existingEmail = $email;
            $exists = true;
            break;
        }
    }
    
    // Add new email if it doesn't exist
    if (!$exists) {
        $existingQueue[] = $email;
    }
}

// Save queue to file
if (!file_put_contents($queueFile, json_encode($existingQueue, JSON_PRETTY_PRINT))) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save email queue to backend.']);
    exit();
}

// Try to execute the email sender
$output = [];
$returnCode = 0;

// Check if Node.js is available
exec('node --version 2>&1', $nodeCheck, $nodeCheckCode);
if ($nodeCheckCode !== 0) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Node.js nicht verfügbar',
        'message' => 'Node.js ist nicht installiert oder nicht im PATH. E-Mails wurden in die Warteschlange eingereiht, aber nicht versendet.',
        'instructions' => [
            'Option 1: Installieren Sie Node.js von https://nodejs.org/',
            'Option 2: Führen Sie manuell aus: cd backend && node email-sender.js',
            'Option 3: Richten Sie einen Cronjob ein (siehe backend/CRONJOB_SETUP.md)'
        ],
        'queued' => count($approvedEmails),
        'queueFile' => $queueFile
    ]);
    exit();
}

// Check if nodemailer is installed
$nodeModulesCheck = $backendDir . '/node_modules/nodemailer';
if (!is_dir($nodeModulesCheck)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Backend-Abhängigkeiten fehlen',
        'message' => 'Nodemailer ist nicht installiert. E-Mails wurden in die Warteschlange eingereiht.',
        'instructions' => [
            'Führen Sie folgende Befehle aus:',
            '  cd backend',
            '  npm install',
            'Dann versuchen Sie erneut, E-Mails zu senden.'
        ],
        'queued' => count($approvedEmails),
        'queueFile' => $queueFile
    ]);
    exit();
}

// Try to run the email sender
$emailSenderScript = $backendDir . '/email-sender.js';
$command = "cd " . escapeshellarg($backendDir) . " && node email-sender.js 2>&1";

exec($command, $output, $returnCode);

// Parse the output to check for success
$outputText = implode("\n", $output);

// Check if emails were sent successfully
if ($returnCode === 0 && (strpos($outputText, '✅') !== false || strpos($outputText, 'Successfully sent') !== false)) {
    // Load updated queue to get sent status
    $updatedQueue = [];
    if (file_exists($queueFile)) {
        $queueData = file_get_contents($queueFile);
        $updatedQueue = json_decode($queueData, true) ?? [];
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'E-Mails wurden erfolgreich versendet!',
        'count' => count($approvedEmails),
        'output' => $outputText,
        'updatedQueue' => $updatedQueue
    ]);
} else {
    // Something went wrong
    $errorMessage = 'Fehler beim Versenden der E-Mails.';
    
    // Try to extract specific error
    if (strpos($outputText, 'Invalid login') !== false) {
        $errorMessage = 'Fehler: Ungültige E-Mail-Zugangsdaten. Bitte überprüfen Sie backend/config.json.';
    } elseif (strpos($outputText, 'ECONNREFUSED') !== false) {
        $errorMessage = 'Fehler: Verbindung zum E-Mail-Server fehlgeschlagen. Bitte überprüfen Sie SMTP-Host und Port.';
    } elseif (strpos($outputText, 'ETIMEDOUT') !== false) {
        $errorMessage = 'Fehler: Zeitüberschreitung bei Verbindung zum E-Mail-Server.';
    }
    
    http_response_code(500);
    echo json_encode([
        'error' => $errorMessage,
        'output' => $outputText,
        'returnCode' => $returnCode,
        'queued' => count($approvedEmails),
        'instructions' => [
            'E-Mails wurden in die Warteschlange eingereiht.',
            'Überprüfen Sie die Backend-Konfiguration in backend/config.json',
            'Testen Sie manuell: cd backend && node email-sender.js',
            'Details finden Sie in backend/README.md'
        ]
    ]);
}
