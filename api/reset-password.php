<?php
/**
 * API Endpoint: Reset Password
 *
 * Verifies a reset token and updates the user's password hash.
 * Works for both admin users and customer accounts.
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

$input = file_get_contents('php://input');
$data  = json_decode($input, true);

if (empty($data['token']) || !is_string($data['token'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token fehlt']);
    exit;
}

if (empty($data['newPassword']) || !is_string($data['newPassword'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Neues Passwort fehlt']);
    exit;
}

if (strlen($data['newPassword']) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Das Passwort muss mindestens 8 Zeichen lang sein']);
    exit;
}

$token       = $data['token'];
$newPassword = $data['newPassword'];

$dataDir              = __DIR__ . '/../data';
$adminUsersFile       = $dataDir . '/admin-users.json';
$customerAccountsFile = $dataDir . '/customer-accounts.json';
$tokensFile           = $dataDir . '/password-reset-tokens.json';

// --- Load and validate token ---
if (!file_exists($tokensFile)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Ungültiger oder abgelaufener Reset-Link', 'errorCode' => 'TOKEN_INVALID']);
    exit;
}

$tokens = json_decode(file_get_contents($tokensFile), true);
if (!is_array($tokens)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Ungültiger oder abgelaufener Reset-Link', 'errorCode' => 'TOKEN_INVALID']);
    exit;
}

$now        = time();
$tokenIndex = null;
$tokenData  = null;

foreach ($tokens as $i => $t) {
    // Use hash_equals to prevent timing attacks
    if (isset($t['token']) && hash_equals($t['token'], $token) && isset($t['expires']) && $t['expires'] > $now) {
        $tokenIndex = $i;
        $tokenData  = $t;
        break;
    }
}

if ($tokenData === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Ungültiger oder abgelaufener Reset-Link', 'errorCode' => 'TOKEN_INVALID']);
    exit;
}

$email = $tokenData['email'];
$role  = $tokenData['role'];

// --- Hash new password the same way as the frontend (SHA-256 hex) ---
// NOTE: The frontend (auth.js) hashes passwords with crypto.subtle.digest('SHA-256')
// before sending them, so we must use the same algorithm here to stay compatible.
// Upgrading to bcrypt would require a coordinated frontend change.
$newPasswordHash = hash('sha256', $newPassword);

// --- Update password ---
$updated = false;

if ($role === 'admin' && file_exists($adminUsersFile)) {
    $admins = json_decode(file_get_contents($adminUsersFile), true);
    if (is_array($admins)) {
        foreach ($admins as &$admin) {
            if (strtolower($admin['email']) === strtolower($email)) {
                $admin['password'] = $newPasswordHash;
                $updated = true;
                break;
            }
        }
        unset($admin);
        if ($updated) {
            file_put_contents(
                $adminUsersFile,
                json_encode($admins, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );
        }
    }
} elseif ($role === 'customer' && file_exists($customerAccountsFile)) {
    $customers = json_decode(file_get_contents($customerAccountsFile), true);
    if (is_array($customers)) {
        foreach ($customers as &$customer) {
            if (strtolower($customer['email']) === strtolower($email)) {
                $customer['password'] = $newPasswordHash;
                $customer['updatedAt'] = date('c');
                $updated = true;
                break;
            }
        }
        unset($customer);
        if ($updated) {
            file_put_contents(
                $customerAccountsFile,
                json_encode($customers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            );
        }
    }
}

if (!$updated) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Benutzer nicht gefunden']);
    exit;
}

// --- Invalidate the used token ---
array_splice($tokens, $tokenIndex, 1);
file_put_contents($tokensFile, json_encode($tokens, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

http_response_code(200);
echo json_encode(['success' => true, 'message' => 'Passwort erfolgreich zurückgesetzt']);
