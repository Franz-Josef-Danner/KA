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

$status = [
    'configured' => false,
    'phpAvailable' => false,
    'smtpInlineExists' => false,
    'ready' => false,
    'issues' => []
];

// Check if PHP is available (it always should be since we're running PHP)
$status['phpAvailable'] = true;
$status['phpVersion'] = PHP_VERSION;

// Check if PHP SMTP inline sender exists
$smtpInlineFile = $backendDir . '/smtp-inline.php';
if (file_exists($smtpInlineFile)) {
    $status['smtpInlineExists'] = true;
} else {
    $status['issues'][] = [
        'type' => 'smtp_inline_missing',
        'severity' => 'critical',
        'message' => 'PHP SMTP-Inline-Sender fehlt',
        'solution' => 'Die Datei backend/smtp-inline.php muss existieren'
    ];
}
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
        } else {
            // Check for placeholder/example values
            $hasPlaceholders = false;
            
            // Check SMTP host
            if (isset($config['smtp']['host'])) {
                $host = strtolower($config['smtp']['host']);
                
                // Check for placeholder values
                if (strpos($host, 'example.com') !== false || 
                    strpos($host, 'ihr-provider') !== false ||
                    strpos($host, 'your-provider') !== false ||
                    $host === 'smtp.example.com') {
                    $status['issues'][] = [
                        'type' => 'placeholder_smtp',
                        'severity' => 'critical',
                        'message' => 'SMTP host ist noch Beispielwert (' . $config['smtp']['host'] . ')',
                        'solution' => 'Ersetzen Sie in backend/config.json mit echtem SMTP-Host (z.B. smtp.gmail.com, smtp.franzjosef-danner.at)'
                    ];
                    $hasPlaceholders = true;
                }
                
                // Check for test/development email services
                $testServices = [
                    'mailtrap.io' => 'Mailtrap',
                    'smtp.mailtrap.io' => 'Mailtrap',
                    'ethereal.email' => 'Ethereal Email',
                    'smtp.ethereal.email' => 'Ethereal Email',
                    'mailhog' => 'MailHog',
                    'mailcatcher' => 'MailCatcher',
                    'papercut' => 'Papercut SMTP',
                    'localhost' => 'Localhost',
                    '127.0.0.1' => 'Localhost'
                ];
                
                $isTestService = false;
                $testServiceName = '';
                foreach ($testServices as $pattern => $name) {
                    if (strpos($host, $pattern) !== false) {
                        $isTestService = true;
                        $testServiceName = $name;
                        break;
                    }
                }
                
                if ($isTestService) {
                    $status['testMode'] = true;
                    $status['testServiceName'] = $testServiceName;
                    $status['issues'][] = [
                        'type' => 'test_email_service',
                        'severity' => 'warning',
                        'message' => '⚠️ TEST-MODUS: ' . $testServiceName . ' erkannt (' . $config['smtp']['host'] . ')',
                        'solution' => 'E-Mails werden an Test-Service gesendet und NICHT zugestellt. Für echten E-Mail-Versand verwenden Sie einen produktiven SMTP-Server (z.B. smtp.gmail.com, smtp.world4you.com).',
                        'details' => [
                            'current' => $config['smtp']['host'],
                            'explanation' => $testServiceName . ' ist ein Entwicklungs-Tool, das E-Mails abfängt statt sie zuzustellen.',
                            'action' => 'Ändern Sie smtp.host in backend/config.json auf einen echten SMTP-Server.'
                        ]
                    ];
                }
            }
            
            // Check email address
            if (isset($config['email'])) {
                $email = strtolower($config['email']);
                if (strpos($email, 'example.com') !== false || 
                    strpos($email, 'ihre-email') !== false ||
                    strpos($email, 'your-email') !== false ||
                    strpos($email, '@ihr-provider') !== false) {
                    $status['issues'][] = [
                        'type' => 'placeholder_email',
                        'severity' => 'critical',
                        'message' => 'E-Mail-Adresse ist noch Beispielwert (' . $config['email'] . ')',
                        'solution' => 'Ersetzen Sie in backend/config.json mit echter E-Mail-Adresse'
                    ];
                    $hasPlaceholders = true;
                }
            }
            
            // Check password
            if (isset($config['password'])) {
                $password = strtolower($config['password']);
                if (strpos($password, 'your_password') !== false ||
                    strpos($password, 'ihr_smtp_passwort') !== false ||
                    strpos($password, 'ihr passwort') !== false ||
                    $password === 'password' ||
                    $password === 'passwort') {
                    $status['issues'][] = [
                        'type' => 'placeholder_password',
                        'severity' => 'critical',
                        'message' => 'Passwort ist noch Beispielwert',
                        'solution' => 'Ersetzen Sie in backend/config.json mit echtem SMTP-Passwort'
                    ];
                    $hasPlaceholders = true;
                }
            }
            
            if ($hasPlaceholders) {
                $status['configured'] = false;
            }
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

// Determine if ready (PHP + configured)
$status['ready'] = $status['phpAvailable'] && $status['smtpInlineExists'] && $status['configured'];

// Add setup instructions if not ready
if (!$status['ready']) {
    $status['setupInstructions'] = [
        'title' => 'Backend-Einrichtung erforderlich',
        'description' => 'Um E-Mails zu versenden, muss das Backend konfiguriert werden (PHP-basiert):',
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
                'title' => 'Testen',
                'description' => 'Testen Sie die E-Mail-Konfiguration durch das Versenden einer Test-E-Mail im Dashboard'
            ]
        ],
        'documentation' => [
            'EMAIL_SETUP_ANLEITUNG.md' => 'Vollständige Setup-Anleitung',
            'WORLD4YOU_INSTALLATION.md' => 'World4You Hosting-spezifische Anleitung'
        ]
    ];
}

http_response_code(200);
echo json_encode($status, JSON_PRETTY_PRINT);
