<?php
/**
 * Send Approved Emails API Endpoint - INLINE VERSION (World4You Compatible)
 * 
 * This version DOES NOT use exec() - sends emails inline in the same HTTP request
 * Compatible with World4You shared hosting where exec() is disabled
 * 
 * CRITICAL: This file sends emails DIRECTLY via SMTP without calling external processes
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
$configFile = $backendDir . '/config.json';

// Load configuration
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Backend nicht konfiguriert',
        'message' => 'Die E-Mail-Konfiguration fehlt. Bitte erstellen Sie backend/config.json basierend auf config.example.json.',
        'instructions' => [
            '1. Öffnen Sie backend/config.example.json',
            '2. Kopieren Sie es zu backend/config.json',
            '3. Tragen Sie Ihre E-Mail-Zugangsdaten ein'
        ]
    ]);
    exit();
}

$configData = file_get_contents($configFile);
$config = json_decode($configData, true);

if (!$config || !isset($config['email']) || !isset($config['password']) || !isset($config['smtp'])) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Ungültige Konfiguration',
        'message' => 'backend/config.json ist ungültig oder unvollständig.'
    ]);
    exit();
}

// Include SMTP sending function (using PHPMailer - PROVEN to work with World4You!)
require_once $backendDir . '/smtp-phpmailer.php';

// Initialize log file if it doesn't exist (ensures it's always available for debugging)
$logFile = $backendDir . '/smtp-debug.log';
if (!file_exists($logFile)) {
    $header = "# SMTP Debug Log\n";
    $header .= "# Created: " . date('c') . "\n";
    $header .= "# This file logs all SMTP operations for debugging\n";
    $header .= "# ================================================\n\n";
    @file_put_contents($logFile, $header);
}


// Send emails inline
$sentCount = 0;
$failedCount = 0;
$errors = [];
$detailedLogs = [];

foreach ($approvedEmails as $email) {
    $to = isset($email['to']) ? $email['to'] : (isset($email['recipient']) ? $email['recipient'] : '');
    $subject = isset($email['subject']) ? $email['subject'] : 'KA System Benachrichtigung';
    $body = isset($email['body']) ? $email['body'] : (isset($email['message']) ? $email['message'] : '');
    
    if (empty($to)) {
        $failedCount++;
        $errors[] = [
            'to' => 'unknown',
            'error' => 'Keine Empfängeradresse angegeben'
        ];
        continue;
    }
    
    // Send email via SMTP using PHPMailer (verbose mode for debugging)
    $result = sendEmailPHPMailer($config, $to, $subject, $body, null, true);
    
    // Log to file for persistence
    writeSmtpLog($result);
    
    if ($result['success']) {
        $sentCount++;
        $detailedLogs[] = [
            'status' => 'success',
            'to' => $to,
            'subject' => $subject,
            'log' => $result['log']
        ];
    } else {
        $failedCount++;
        $errors[] = [
            'to' => $to,
            'error' => $result['error']
        ];
        $detailedLogs[] = [
            'status' => 'failed',
            'to' => $to,
            'subject' => $subject,
            'error' => $result['error'],
            'log' => $result['log']
        ];
    }
}

// Return response
if ($sentCount > 0 && $failedCount === 0) {
    // All emails sent successfully
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "$sentCount E-Mail" . ($sentCount > 1 ? 's' : '') . " wurde" . ($sentCount > 1 ? 'n' : '') . " erfolgreich versendet!",
        'count' => $sentCount,
        'failed' => 0,
        'detailedLogs' => $detailedLogs
    ]);
} else if ($sentCount > 0) {
    // Some emails sent, some failed
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "$sentCount E-Mail" . ($sentCount > 1 ? 's' : '') . " versendet, $failedCount fehlgeschlagen.",
        'count' => $sentCount,
        'failed' => $failedCount,
        'errors' => $errors,
        'detailedLogs' => $detailedLogs
    ]);
} else {
    // All emails failed
    http_response_code(500);
    
    $errorDetails = [];
    foreach ($errors as $error) {
        $errorDetails[] = "❌ An: " . $error['to'] . " - " . $error['error'];
    }
    
    // Collect all unique error messages for better diagnostics
    $uniqueErrors = [];
    foreach ($detailedLogs as $log) {
        if (isset($log['error']) && !in_array($log['error'], $uniqueErrors)) {
            $uniqueErrors[] = $log['error'];
        }
    }
    
    echo json_encode([
        'error' => 'E-Mails konnten nicht versendet werden',
        'message' => "$failedCount E-Mail(s) fehlgeschlagen",
        'sent' => 0,
        'failed' => $failedCount,
        'details' => implode("\n", $errorDetails),
        'errors' => $errors,
        'uniqueErrors' => $uniqueErrors,
        'detailedLogs' => $detailedLogs,
        'instructions' => [
            '📋 Fehlerbehebung:',
            '1. Öffnen Sie backend/config.json',
            '2. Überprüfen Sie:',
            '   • SMTP Host: Ist der Server richtig?',
            '   • SMTP Port: 587 (STARTTLS) oder 465 (SSL)?',
            '   • E-Mail: Ist die Absender-Adresse korrekt?',
            '   • Passwort: Ist das Passwort richtig?',
            '   • Bei World4You: From-Adresse muss existierende Mailbox sein!',
            '3. Siehe detaillierte Logs für SMTP-Konversation'
        ]
    ]);
}
