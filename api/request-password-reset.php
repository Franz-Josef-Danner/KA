<?php
/**
 * API Endpoint: Request Password Reset
 *
 * Generates a secure reset token, stores it, and sends a reset-link email.
 * Works for both admin users and customer accounts.
 * Always returns success to avoid email enumeration.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');  // TODO: Replace with specific domain in production
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// --- Token configuration ---
const TOKEN_BYTE_LENGTH      = 32;   // 64 hex chars
const TOKEN_EXPIRATION_SECS  = 3600; // 1 hour

$input = file_get_contents('php://input');
$data  = json_decode($input, true);

if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Ungültige E-Mail-Adresse']);
    exit;
}

$requestedEmail = strtolower(trim($data['email']));

$dataDir              = __DIR__ . '/../data';
$adminUsersFile       = $dataDir . '/admin-users.json';
$customerAccountsFile = $dataDir . '/customer-accounts.json';
$tokensFile           = $dataDir . '/password-reset-tokens.json';

// --- Find the user ---
$foundEmail = null;
$foundRole  = null;

// Check admin users
if (file_exists($adminUsersFile)) {
    $admins = json_decode(file_get_contents($adminUsersFile), true);
    if (is_array($admins)) {
        foreach ($admins as $admin) {
            if (strtolower($admin['email']) === $requestedEmail) {
                $foundEmail = $admin['email'];
                $foundRole  = 'admin';
                break;
            }
        }
    }
}

// Check customer accounts if not found in admin users
if ($foundEmail === null && file_exists($customerAccountsFile)) {
    $customers = json_decode(file_get_contents($customerAccountsFile), true);
    if (is_array($customers)) {
        foreach ($customers as $customer) {
            if (strtolower($customer['email']) === $requestedEmail) {
                $foundEmail = $customer['email'];
                $foundRole  = 'customer';
                break;
            }
        }
    }
}

// Always respond with success to avoid email enumeration
if ($foundEmail === null) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Falls eine E-Mail-Adresse mit diesem Konto verknüpft ist, wurde eine E-Mail mit einem Zurücksetzen-Link versendet.'
    ]);
    exit;
}

// --- Generate token ---
$token   = bin2hex(random_bytes(TOKEN_BYTE_LENGTH));
$expires = time() + TOKEN_EXPIRATION_SECS;

// --- Load existing tokens ---
$tokens = [];
if (file_exists($tokensFile)) {
    $existing = json_decode(file_get_contents($tokensFile), true);
    if (is_array($existing)) {
        // Remove expired tokens and existing tokens for this email
        $now = time();
        foreach ($existing as $t) {
            if (isset($t['expires']) && $t['expires'] > $now && strtolower($t['email']) !== $requestedEmail) {
                $tokens[] = $t;
            }
        }
    }
}

$tokens[] = [
    'token'   => $token,
    'email'   => $foundEmail,
    'role'    => $foundRole,
    'expires' => $expires,
];

// --- Ensure data directory exists ---
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

if (file_put_contents($tokensFile, json_encode($tokens, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Fehler beim Speichern des Reset-Tokens']);
    exit;
}

// --- Build reset URL ---
$scheme   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
// Use SCRIPT_NAME to reliably determine the application root path
$rootPath = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
$resetUrl = $scheme . '://' . $host . $rootPath . '/passwort-zuruecksetzen.html?token=' . urlencode($token);

// --- Send email ---
$backendDir = __DIR__ . '/../backend';
$configFile = $backendDir . '/config.json';

if (!file_exists($configFile)) {
    // Config missing – still return success but log the issue
    error_log('Password reset: backend/config.json not found, email not sent for ' . $foundEmail);
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Falls eine E-Mail-Adresse mit diesem Konto verknüpft ist, wurde eine E-Mail mit einem Zurücksetzen-Link versendet.'
    ]);
    exit;
}

$config = json_decode(file_get_contents($configFile), true);

if (!$config || empty($config['email']) || empty($config['password']) || empty($config['smtp'])) {
    error_log('Password reset: backend/config.json is invalid, email not sent for ' . $foundEmail);
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Falls eine E-Mail-Adresse mit diesem Konto verknüpft ist, wurde eine E-Mail mit einem Zurücksetzen-Link versendet.'
    ]);
    exit;
}

require_once $backendDir . '/smtp-phpmailer.php';

$subject = 'KA System – Passwort zurücksetzen';
$body    = "Hallo,\n\n"
         . "Sie haben das Zurücksetzen Ihres Passworts für das KA System angefordert.\n\n"
         . "Klicken Sie auf den folgenden Link, um ein neues Passwort zu vergeben:\n"
         . $resetUrl . "\n\n"
         . "Dieser Link ist 1 Stunde lang gültig.\n\n"
         . "Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren. "
         . "Ihr Passwort bleibt unverändert.\n\n"
         . "Mit freundlichen Grüßen,\nKA System";

sendEmailPHPMailer($config, $foundEmail, $subject, $body);

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Falls eine E-Mail-Adresse mit diesem Konto verknüpft ist, wurde eine E-Mail mit einem Zurücksetzen-Link versendet.'
]);
