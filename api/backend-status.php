<?php
/**
 * Backend Status Check API
 * 
 * Checks if the email backend is properly configured and ready to send emails
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$backendDir = __DIR__ . '/../backend';
$configFile = $backendDir . '/config.json';
$queueFile = $backendDir . '/email-queue.json';

$status = [
    'configured' => false,
    'nodeJsAvailable' => false,
    'nodemailerInstalled' => false,
    'ready' => false,
    'queuedEmails' => 0,
    'issues' => []
];

// Check if config.json exists
if (!file_exists($configFile)) {
    $status['issues'][] = [
        'type' => 'config_missing',
        'severity' => 'critical',
        'message' => 'Backend-Konfiguration fehlt (config.json)',
        'solution' => 'Erstellen Sie backend/config.json mit Ihren SMTP-Zugangsdaten'
    ];
} else {
    $status['configured'] = true;
    
    // Check if config is valid
    try {
        $config = json_decode(file_get_contents($configFile), true);
        if (!isset($config['email']) || !isset($config['password']) || !isset($config['smtp'])) {
            $status['issues'][] = [
                'type' => 'config_invalid',
                'severity' => 'critical',
                'message' => 'Backend-Konfiguration ist unvollständig',
                'solution' => 'Überprüfen Sie backend/config.json (E-Mail, Passwort, SMTP-Einstellungen)'
            ];
            $status['configured'] = false;
        }
    } catch (Exception $e) {
        $status['issues'][] = [
            'type' => 'config_invalid',
            'severity' => 'critical',
            'message' => 'Backend-Konfiguration enthält Fehler',
            'solution' => 'Überprüfen Sie das JSON-Format in backend/config.json'
        ];
        $status['configured'] = false;
    }
}

// Check if Node.js is available
exec('node --version 2>&1', $nodeCheck, $nodeCheckCode);
if ($nodeCheckCode === 0) {
    $status['nodeJsAvailable'] = true;
    $status['nodeVersion'] = trim($nodeCheck[0]);
} else {
    $status['issues'][] = [
        'type' => 'nodejs_missing',
        'severity' => 'critical',
        'message' => 'Node.js ist nicht installiert oder nicht verfügbar',
        'solution' => 'Installieren Sie Node.js von https://nodejs.org/'
    ];
}

// Check if nodemailer is installed
$nodeModulesCheck = $backendDir . '/node_modules/nodemailer';
if (is_dir($nodeModulesCheck)) {
    $status['nodemailerInstalled'] = true;
} else {
    $status['issues'][] = [
        'type' => 'nodemailer_missing',
        'severity' => 'critical',
        'message' => 'Nodemailer ist nicht installiert',
        'solution' => 'Führen Sie aus: cd backend && npm install'
    ];
}

// Check queue
if (file_exists($queueFile)) {
    try {
        $queue = json_decode(file_get_contents($queueFile), true);
        if (is_array($queue)) {
            $pendingEmails = array_filter($queue, function($item) {
                return isset($item['status']) && in_array($item['status'], ['pending', 'approved']);
            });
            $status['queuedEmails'] = count($pendingEmails);
            
            if ($status['queuedEmails'] > 0 && !$status['configured']) {
                $status['issues'][] = [
                    'type' => 'emails_waiting',
                    'severity' => 'warning',
                    'message' => $status['queuedEmails'] . ' E-Mail(s) warten auf Versand',
                    'solution' => 'Konfigurieren Sie das Backend, um E-Mails zu versenden'
                ];
            }
        }
    } catch (Exception $e) {
        // Ignore queue parsing errors
    }
}

// Determine if ready
$status['ready'] = $status['configured'] && $status['nodeJsAvailable'] && $status['nodemailerInstalled'];

// Add setup instructions if not ready
if (!$status['ready']) {
    $status['setupInstructions'] = [
        'title' => 'Backend-Einrichtung erforderlich',
        'description' => 'Um E-Mails zu versenden, muss das Backend konfiguriert werden:',
        'steps' => [
            [
                'number' => 1,
                'title' => 'Konfigurationsdatei erstellen',
                'command' => 'cd backend && cp config.example.json config.json',
                'description' => 'Erstellen Sie config.json aus der Vorlage'
            ],
            [
                'number' => 2,
                'title' => 'SMTP-Zugangsdaten eintragen',
                'description' => 'Bearbeiten Sie backend/config.json und tragen Sie Ihre E-Mail-Zugangsdaten ein',
                'fields' => ['email', 'password', 'smtp.host', 'smtp.port']
            ],
            [
                'number' => 3,
                'title' => 'Dependencies installieren',
                'command' => 'cd backend && npm install',
                'description' => 'Installieren Sie die erforderlichen Node.js-Pakete'
            ],
            [
                'number' => 4,
                'title' => 'Testen',
                'command' => 'cd backend && node email-sender.js',
                'description' => 'Testen Sie die Konfiguration'
            ]
        ],
        'documentation' => [
            'EMAIL_SETUP_ANLEITUNG.md' => 'Vollständige Setup-Anleitung',
            'EMAIL_SCHNELL_REFERENZ.md' => 'Schnell-Referenz',
            'backend/README.md' => 'Backend-Dokumentation'
        ]
    ];
}

http_response_code(200);
echo json_encode($status, JSON_PRETTY_PRINT);
