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

// Try to execute the email sender (PHP-based)
$output = [];
$returnCode = 0;

// Use PHP email sender (works on shared hosting without Node.js)
$phpEmailSender = $backendDir . '/php-email-sender.php';

if (!file_exists($phpEmailSender)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'PHP Email Sender nicht gefunden',
        'message' => 'Die Datei backend/php-email-sender.php fehlt.',
        'instructions' => [
            'Stellen Sie sicher, dass backend/php-email-sender.php existiert.'
        ]
    ]);
    exit();
}

// Execute PHP email sender
$command = "php " . escapeshellarg($phpEmailSender) . " 2>&1";
exec($command, $output, $returnCode);

// Parse the output
$outputText = implode("\n", $output);

// Try to parse JSON response (when called as API)
$jsonResponse = json_decode($outputText, true);

if ($jsonResponse && isset($jsonResponse['success'])) {
    // Got JSON response
    $sent = isset($jsonResponse['sent']) ? $jsonResponse['sent'] : 0;
    $failed = isset($jsonResponse['failed']) ? $jsonResponse['failed'] : 0;
    
    if ($sent > 0) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "$sent E-Mail" . ($sent > 1 ? 's' : '') . " wurde" . ($sent > 1 ? 'n' : '') . " erfolgreich versendet!",
            'count' => $sent,
            'failed' => $failed
        ]);
        exit();
    } else if ($failed > 0) {
        http_response_code(500);
        echo json_encode([
            'error' => 'E-Mails konnten nicht versendet werden',
            'message' => "$failed E-Mail(s) fehlgeschlagen",
            'sent' => 0,
            'failed' => $failed,
            'details' => isset($jsonResponse['errors']) ? implode(', ', $jsonResponse['errors']) : 'Siehe Logs',
            'instructions' => [
                'Überprüfen Sie die Backend-Konfiguration (backend/config.json)',
                'Prüfen Sie SMTP-Zugangsdaten',
                'Führen Sie manuell aus: php backend/php-email-sender.php'
            ]
        ]);
        exit();
    } else {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Keine E-Mails zum Versenden in der Warteschlange.',
            'count' => 0,
            'failed' => 0
        ]);
        exit();
    }
}

// Parse CLI output (fallback for old format)
$sentCount = 0;
$failedCount = 0;

if (preg_match('/✅ Sent: (\d+)/', $outputText, $matches)) {
    $sentCount = (int)$matches[1];
}

if (preg_match('/❌ Failed: (\d+)/', $outputText, $matches)) {
    $failedCount = (int)$matches[1];
}

if ($returnCode === 0 && $sentCount > 0) {
    // Emails were successfully sent
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "$sentCount E-Mail" . ($sentCount > 1 ? 's' : '') . " wurde" . ($sentCount > 1 ? 'n' : '') . " erfolgreich versendet!",
        'count' => $sentCount,
        'failed' => $failedCount
    ]);
    exit();
}

// Check if Node.js is available
exec('node --version 2>&1', $nodeCheck, $nodeCheckCode);
if ($nodeCheckCode !== 0) {
    // Node.js not available - queue emails for manual processing
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'queued' => count($approvedEmails),
        'message' => count($approvedEmails) . ' E-Mail' . (count($approvedEmails) > 1 ? 's' : '') . ' wurde' . (count($approvedEmails) > 1 ? 'n' : '') . ' in die Warteschlange eingereiht.',
        'info' => 'Node.js ist nicht verfügbar. E-Mails wurden gespeichert und müssen manuell versendet werden.',
        'instructions' => [
            'Option 1: Installieren Sie Node.js von https://nodejs.org/',
            'Option 2: Führen Sie manuell aus: cd backend && node email-sender.js',
            'Option 3: Richten Sie einen Cronjob ein (siehe backend/CRONJOB_SETUP.md)',
            '',
            'Die E-Mails wurden in backend/email-queue.json gespeichert und warten auf Versand.'
        ],
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
// Look for "✅ Sent: X" where X > 0, not just presence of ✅
$sentCount = 0;
if (preg_match('/✅ Sent: (\d+)/', $outputText, $matches)) {
    $sentCount = (int)$matches[1];
}

$failedCount = 0;
if (preg_match('/❌ Failed: (\d+)/', $outputText, $matches)) {
    $failedCount = (int)$matches[1];
}

if ($returnCode === 0 && $sentCount > 0) {
    // Emails were successfully sent
    // Load updated queue to get sent status
    $updatedQueue = [];
    if (file_exists($queueFile)) {
        $queueData = file_get_contents($queueFile);
        $updatedQueue = json_decode($queueData, true) ?? [];
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "$sentCount E-Mail" . ($sentCount > 1 ? 's' : '') . " wurde" . ($sentCount > 1 ? 'n' : '') . " erfolgreich versendet!",
        'count' => $sentCount,
        'failed' => $failedCount,
        'output' => $outputText,
        'updatedQueue' => $updatedQueue
    ]);
}

// If we got here, something went wrong
if (strpos($outputText, 'Configuration file not found') !== false || 
    strpos($outputText, 'config.json') !== false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Backend nicht konfiguriert',
        'message' => 'Die E-Mail-Konfiguration fehlt. E-Mails wurden in die Warteschlange eingereiht.',
        'instructions' => [
            '1. Öffnen Sie backend/config.example.json',
            '2. Kopieren Sie es zu backend/config.json',
            '3. Tragen Sie Ihre SMTP-Zugangsdaten ein',
            '4. Versuchen Sie erneut, E-Mails zu senden.',
            '',
            'Siehe EMAIL_SETUP_ANLEITUNG.md für Details.'
        ],
        'details' => $outputText,
        'queueFile' => $queueFile
    ]);
    exit();
}

// Check for authentication errors
if (strpos($outputText, 'authentication failed') !== false || 
    strpos($outputText, 'Invalid login') !== false ||
    strpos($outputText, 'EAUTH') !== false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Authentifizierung fehlgeschlagen',
        'message' => 'E-Mail-Zugangsdaten sind falsch.',
        'details' => $outputText,
        'instructions' => [
            'Überprüfen Sie backend/config.json:',
            '  • E-Mail-Adresse korrekt?',
            '  • Passwort korrekt?',
            '  • Bei Gmail: App-Passwort verwenden',
            'Testen Sie: php backend/php-email-sender.php'
        ]
    ]);
    exit();
}

// Generic error
http_response_code(500);
echo json_encode([
    'error' => 'Fehler beim E-Mail-Versand',
    'message' => 'E-Mails konnten nicht versendet werden.',
    'details' => $outputText,
    'instructions' => [
        'Überprüfen Sie die Backend-Konfiguration (backend/config.json)',
        'Prüfen Sie SMTP-Host, Port und Zugangsdaten',
        'Führen Sie manuell aus: php backend/php-email-sender.php',
        'Siehe EMAIL_SETUP_ANLEITUNG.md für Hilfe'
    ]
]);

