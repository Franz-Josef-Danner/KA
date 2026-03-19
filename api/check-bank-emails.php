<?php
/**
 * API Endpoint: Automatic Bank Payment Email Check via IMAP
 *
 * Connects to the configured email inbox via IMAP, searches for unread
 * bank payment notification emails, extracts the invoice number and the
 * transferred amount, verifies that both match an existing invoice, and –
 * if they do – automatically marks that invoice as "bezahlt" (paid).
 *
 * This endpoint is called automatically when the user visits the dashboard.
 * It uses the same SMTP credentials (email + password) that are already stored
 * in backend/config.json; the IMAP-specific settings (host, port, folder, …)
 * are read from data/imap-config.json.
 *
 * Expected POST body: (no body required)
 * {}
 *
 * Successful response (HTTP 200):
 * {
 *   "success": true,
 *   "processed": 3,
 *   "paid": [ { "invoiceId": "F-02035-20260228-001", "amount": 744.00, "subject": "..." } ],
 *   "skipped": [ { "subject": "...", "reason": "..." } ],
 *   "message": "1 Rechnung(en) automatisch als bezahlt markiert.",
 *   "timestamp": "2026-03-11T..."
 * }
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

$inputRaw  = file_get_contents('php://input');
$inputData = json_decode($inputRaw, true);
$debugMode = is_array($inputData) && !empty($inputData['debug']);

$jsonFlags = JSON_UNESCAPED_UNICODE;
if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
    $jsonFlags |= JSON_INVALID_UTF8_SUBSTITUTE;
}

ob_start();
register_shutdown_function(function () use ($jsonFlags) {
    $last = error_get_last();
    if (!$last) {
        return;
    }

    $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR];
    if (!in_array($last['type'], $fatalTypes, true)) {
        return;
    }

    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json');
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    echo json_encode([
        'success' => false,
        'error'   => 'Fataler PHP-Fehler: ' . ($last['message'] ?? 'Unbekannt'),
        'file'    => $last['file'] ?? null,
        'line'    => $last['line'] ?? null,
        'timestamp' => date('c'),
    ], $jsonFlags);
});

function safeJsonEncode($payload, $flags) {
    $json = json_encode($payload, $flags);
    if ($json !== false) {
        return $json;
    }

    return json_encode([
        'success' => false,
        'error'   => 'JSON-Encoding fehlgeschlagen: ' . json_last_error_msg(),
        'timestamp' => date('c'),
    ], $flags);
}

// -------------------------------------------------------------------------
// 0. Check PHP IMAP extension
// -------------------------------------------------------------------------
if (!function_exists('imap_open')) {
    http_response_code(500);
    echo json_encode([
        'success'        => false,
        'imapMissing'    => true,
        'error'          => 'PHP IMAP-Erweiterung nicht verfügbar',
        'hint'           => 'Aktivieren Sie die PHP-Erweiterung "php_imap" auf Ihrem Server.',
    ]);
    exit;
}

// -------------------------------------------------------------------------
// 1. Load credentials from backend/config.json  (email + password)
// -------------------------------------------------------------------------
$backendConfigFile = __DIR__ . '/../backend/config.json';
if (!file_exists($backendConfigFile)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Backend nicht konfiguriert – backend/config.json fehlt.',
        'hint'    => 'Kopieren Sie backend/config.example.json zu backend/config.json und tragen Sie Ihre Zugangsdaten ein.',
    ]);
    exit;
}

$backendConfig = json_decode(file_get_contents($backendConfigFile), true);
if (!$backendConfig || empty($backendConfig['email']) || empty($backendConfig['password'])) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Ungültige Backend-Konfiguration (E-Mail oder Passwort fehlt).']);
    exit;
}

$loginEmail    = $backendConfig['email'];
$loginPassword = $backendConfig['password'];

// -------------------------------------------------------------------------
// 2. Load IMAP settings from data/imap-config.json (with defaults)
// -------------------------------------------------------------------------
$imapConfigFile = __DIR__ . '/../data/imap-config.json';
$imapConfig     = [];
if (file_exists($imapConfigFile)) {
    $imapConfig = json_decode(file_get_contents($imapConfigFile), true) ?? [];
}

// Auto-detect IMAP host if not set: smtp.provider.com → imap.provider.com
$imapHost = $imapConfig['host'] ?? '';
if (empty($imapHost) && !empty($backendConfig['smtp']['host'])) {
    $imapHost = preg_replace('/^smtp\./i', 'imap.', $backendConfig['smtp']['host']);
}

if (empty($imapHost)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'IMAP-Host nicht konfiguriert.',
        'hint'    => 'Tragen Sie den IMAP-Server in den Einstellungen ein (z. B. imap.world4you.com).',
    ]);
    exit;
}

$imapPort    = (int)   ($imapConfig['port']    ?? 993);
$imapSecure  = (bool)  ($imapConfig['secure']  ?? true);
$imapFolder  = trim(    $imapConfig['folder']  ?? 'INBOX/finanzen');
$markAsRead  = (bool)  ($imapConfig['markAsRead'] ?? true);
$deleteProcessed = (bool) ($imapConfig['deleteProcessed'] ?? false);
$archiveProcessed = (bool) ($imapConfig['archiveProcessed'] ?? false);
$archiveFolder = trim((string) ($imapConfig['archiveFolder'] ?? 'INBOX.finanzen.archiv'));
$recentDays  = 30;

function addFolderCandidate(&$folderCandidates, $value) {
    $trimmed = trim((string) $value);
    if ($trimmed === '') {
        return;
    }
    $folderCandidates[] = $trimmed;
}

// -------------------------------------------------------------------------
// 3. Build IMAP connection string and connect
//    Some providers expose localized folder names; try a small set of
//    folder variants before failing hard.
// -------------------------------------------------------------------------
$encFlag          = $imapSecure ? '/ssl' : '/notls';
$serverMailboxBase= "{{$imapHost}:{$imapPort}{$encFlag}/novalidate-cert}";

$folderCandidates = [];
addFolderCandidate($folderCandidates, $imapFolder);

if (!preg_match('/^INBOX[\/.]/i', $imapFolder) && strcasecmp($imapFolder, 'INBOX') !== 0) {
    addFolderCandidate($folderCandidates, 'INBOX/' . ltrim($imapFolder, '/'));
    addFolderCandidate($folderCandidates, 'INBOX.' . ltrim($imapFolder, '/'));
}

$imapFolderSlash = str_replace('.', '/', $imapFolder);
$imapFolderDot   = str_replace('/', '.', $imapFolder);
addFolderCandidate($folderCandidates, $imapFolderSlash);
addFolderCandidate($folderCandidates, $imapFolderDot);
addFolderCandidate($folderCandidates, preg_replace('/finanzen/i', 'Finanzen', $imapFolderSlash));
addFolderCandidate($folderCandidates, preg_replace('/finanzen/i', 'FINANZEN', $imapFolderSlash));

addFolderCandidate($folderCandidates, 'INBOX');
addFolderCandidate($folderCandidates, 'INBOX/Finanzen');
addFolderCandidate($folderCandidates, 'INBOX/finanzen');
addFolderCandidate($folderCandidates, 'INBOX/FINANZEN');
addFolderCandidate($folderCandidates, 'INBOX.Finanzen');
addFolderCandidate($folderCandidates, 'INBOX.finanzen');
addFolderCandidate($folderCandidates, 'Posteingang/Finanzen');
addFolderCandidate($folderCandidates, 'Posteingang.Finanzen');

$folderCandidates = array_values(array_unique(array_filter($folderCandidates, function ($v) {
    return trim((string) $v) !== '';
})));

$connection           = false;
$mailbox              = '';
$lastError            = '';
$successfulCandidates = [];
$candidateConnections = [];

foreach ($folderCandidates as $candidateFolder) {
    $candidateMailbox = $serverMailboxBase . $candidateFolder;
    $candidateConn = @imap_open($candidateMailbox, $loginEmail, $loginPassword, 0, 1, ['DISABLE_AUTHENTICATOR' => 'GSSAPI']);
    if ($candidateConn) {
        $candidateStatus = @imap_status($candidateConn, $candidateMailbox, SA_MESSAGES | SA_UNSEEN | SA_RECENT);
        $candidateMessages = (int) ($candidateStatus->messages ?? imap_num_msg($candidateConn));
        $candidateUnseen   = (int) ($candidateStatus->unseen ?? 0);
        $candidateRecent   = (int) ($candidateStatus->recent ?? 0);

        $candidateConnections[] = [
            'connection' => $candidateConn,
            'folder'     => $candidateFolder,
            'mailbox'    => $candidateMailbox,
            'messages'   => $candidateMessages,
            'unseen'     => $candidateUnseen,
            'recent'     => $candidateRecent,
            'score'      => ($candidateUnseen * 1000000) + ($candidateMessages * 1000) + $candidateRecent,
        ];
        $successfulCandidates[] = [
            'folder'   => $candidateFolder,
            'messages' => $candidateMessages,
            'unseen'   => $candidateUnseen,
            'recent'   => $candidateRecent,
        ];
        continue;
    }

    $lastError = imap_last_error() ?: $lastError;
    imap_errors(); // Clear stack between retries
}

if (!empty($candidateConnections)) {
    usort($candidateConnections, function ($a, $b) {
        return $b['score'] <=> $a['score'];
    });

    $best = array_shift($candidateConnections);
    $connection = $best['connection'];
    $mailbox    = $best['mailbox'];
    $imapFolder = $best['folder'];

    foreach ($candidateConnections as $candidate) {
        @imap_close($candidate['connection']);
    }
}

if (!$connection) {
    http_response_code(500);
    echo json_encode([
        'success'      => false,
        'error'        => 'IMAP-Verbindung fehlgeschlagen: ' . ($lastError ?: 'Unbekannter Fehler'),
        'mailbox'      => $serverMailboxBase . $imapFolder,
        'triedFolders' => $folderCandidates,
        'hint'         => 'Überprüfen Sie IMAP-Host, Port, Zugangsdaten und den Postfach-Ordner in den Einstellungen.',
    ]);
    exit;
}

$mailboxStats = [
    'totalMessages' => imap_num_msg($connection),
    'unseenCount'   => imap_num_recent($connection),
];

$status = @imap_status($connection, $serverMailboxBase . $imapFolder, SA_MESSAGES | SA_UNSEEN | SA_RECENT);
if ($status) {
    $mailboxStats = [
        'totalMessages' => (int) ($status->messages ?? $mailboxStats['totalMessages']),
        'unseenCount'   => (int) ($status->unseen ?? $mailboxStats['unseenCount']),
        'recentCount'   => (int) ($status->recent ?? 0),
    ];
}

// -------------------------------------------------------------------------
// 4. Search messages to process
//    - Prefer UNSEEN first (new incoming notifications)
//    - Fallback to recent messages so already-read mails are not missed
// -------------------------------------------------------------------------
$searchMode  = 'UNSEEN';
$messageNums = imap_search($connection, 'UNSEEN');
imap_errors(); // Clear error stack after search

if (!$messageNums) {
    $searchMode  = "RECENT_{$recentDays}D";
    $sinceDate   = date('d-M-Y', strtotime("-{$recentDays} days"));
    $messageNums = imap_search($connection, 'SINCE "' . $sinceDate . '"');
    imap_errors(); // Clear error stack after fallback search
}

if (!$messageNums) {
    $searchMode  = 'ALL';
    $messageNums = imap_search($connection, 'ALL');
    imap_errors(); // Clear error stack after ALL fallback
}

if (is_array($messageNums) && count($messageNums) > 500) {
    // Keep processing bounded on large inboxes while still analyzing the newest mails.
    $messageNums = array_slice($messageNums, -500);
}

if (!$messageNums) {
    imap_close($connection);
    $response = [
        'success'   => true,
        'processed' => 0,
        'paid'      => [],
        'skipped'   => [],
        'searchMode'=> $searchMode,
        'mailbox'   => $mailbox,
        'folderUsed'=> $imapFolder,
        'message'   => 'Keine neuen E-Mails im Postfach.',
        'timestamp' => date('c'),
    ];

    if ($debugMode) {
        $response['debug'] = [
            'mailboxStats' => $mailboxStats,
            'searchMode'   => $searchMode,
            'folderUsed'   => $imapFolder,
            'successfulFolders' => $successfulCandidates,
        ];
    }

    echo safeJsonEncode($response, $jsonFlags);
    exit;
}

// -------------------------------------------------------------------------
// 5. Load invoice/expense data
// -------------------------------------------------------------------------
$rechnungenFile = __DIR__ . '/../data/rechnungen.json';
$ausgabenFile   = __DIR__ . '/../data/ausgaben.json';
$invoices = [];
if (file_exists($rechnungenFile)) {
    $invoices = json_decode(file_get_contents($rechnungenFile), true) ?? [];
}

$expenses = [];
if (file_exists($ausgabenFile)) {
    $expenses = json_decode(file_get_contents($ausgabenFile), true) ?? [];
}

// -------------------------------------------------------------------------
// Helper: decode a MIME body part based on its encoding
//   0 = 7BIT, 1 = 8BIT, 2 = BINARY, 3 = BASE64, 4 = QUOTED-PRINTABLE
// -------------------------------------------------------------------------
function decodePart($body, $encoding) {
    switch ((int) $encoding) {
        case 3: return base64_decode($body);
        case 4: return quoted_printable_decode($body);
        default: return $body;
    }
}

// -------------------------------------------------------------------------
// Helper: mark IMAP message as seen across different PHP/IMAP environments.
// -------------------------------------------------------------------------
function markMessageSeen($connection, $msgNum) {
    if (function_exists('imap_setflag_full')) {
        @imap_setflag_full($connection, (string) $msgNum, '\\Seen');
        return;
    }

    // Defensive fallback for non-standard environments.
    if (function_exists('imap_set_flag_full')) {
        @imap_set_flag_full($connection, (string) $msgNum, '\\Seen');
    }
}

// -------------------------------------------------------------------------
// Helper: mark IMAP message for deletion.
// -------------------------------------------------------------------------
function markMessageDeleted($connection, $msgNum) {
    if (function_exists('imap_delete')) {
        @imap_delete($connection, (string) $msgNum);
        return;
    }

    if (function_exists('imap_setflag_full')) {
        @imap_setflag_full($connection, (string) $msgNum, '\\Deleted');
    }
}

// -------------------------------------------------------------------------
// Helper: build likely IMAP folder variants for move/archive targets.
// -------------------------------------------------------------------------
function buildFolderCandidates($folder) {
    $candidates = [];
    $folder = trim((string) $folder);
    if ($folder === '') {
        return $candidates;
    }

    $candidates[] = $folder;

    if (!preg_match('/^INBOX[\/.]/i', $folder) && strcasecmp($folder, 'INBOX') !== 0) {
        $trimmed = ltrim($folder, '/.');
        $candidates[] = 'INBOX/' . $trimmed;
        $candidates[] = 'INBOX.' . str_replace('/', '.', $trimmed);
    }

    $candidates[] = str_replace('.', '/', $folder);
    $candidates[] = str_replace('/', '.', $folder);

    $filtered = [];
    foreach ($candidates as $candidate) {
        $candidate = trim((string) $candidate);
        if ($candidate === '' || in_array($candidate, $filtered, true)) {
            continue;
        }
        $filtered[] = $candidate;
    }

    return $filtered;
}

// -------------------------------------------------------------------------
// Helper: move message to archive folder. Returns used target folder or null.
// -------------------------------------------------------------------------
function moveMessageToFolder($connection, $msgNum, $archiveFolder, $serverMailboxBase) {
    if (!function_exists('imap_mail_move')) {
        return null;
    }

    $targets = buildFolderCandidates($archiveFolder);
    foreach ($targets as $targetFolder) {
        $targetMailbox = $serverMailboxBase . $targetFolder;

        // Try to create target folder if missing.
        $exists = @imap_status($connection, $targetMailbox, SA_MESSAGES) !== false;
        if (!$exists && function_exists('imap_createmailbox')) {
            @imap_createmailbox($connection, imap_utf7_encode($targetMailbox));
        }

        if (@imap_mail_move($connection, (string) $msgNum, $targetFolder)) {
            return $targetFolder;
        }
    }

    return null;
}

// -------------------------------------------------------------------------
// Helper: parse a EUR amount from arbitrary text
// Supports formats like:
//   1.234,56 EUR / EUR 1.234,56 / 1234.56 EUR / EUR 1234,56 / 1234,56 €
// -------------------------------------------------------------------------
function extractEuroAmount($text) {
    $patterns = [
        '/(?:EUR|€)\s*([0-9]{1,3}(?:[\.,\s][0-9]{3})*[\.,][0-9]{2}|[0-9]+[\.,][0-9]{2})/i',
        '/([0-9]{1,3}(?:[\.,\s][0-9]{3})*[\.,][0-9]{2}|[0-9]+[\.,][0-9]{2})\s*(?:EUR|€)/i',
    ];

    foreach ($patterns as $pattern) {
        if (!preg_match($pattern, $text, $m)) {
            continue;
        }

        $raw = trim($m[1]);
        $raw = str_replace(' ', '', $raw);

        $lastComma = strrpos($raw, ',');
        $lastDot   = strrpos($raw, '.');

        if ($lastComma !== false && $lastDot !== false) {
            if ($lastComma > $lastDot) {
                $normalized = str_replace('.', '', $raw);
                $normalized = str_replace(',', '.', $normalized);
            } else {
                $normalized = str_replace(',', '', $raw);
            }
        } elseif ($lastComma !== false) {
            $normalized = str_replace('.', '', $raw);
            $normalized = str_replace(',', '.', $normalized);
        } else {
            $normalized = str_replace(',', '', $raw);
        }

        if (is_numeric($normalized)) {
            return (float) $normalized;
        }
    }

    return null;
}

// -------------------------------------------------------------------------
// Helper: normalize amount values from invoice JSON (string/number)
// -------------------------------------------------------------------------
function normalizeAmountValue($value) {
    if (is_int($value) || is_float($value)) {
        return (float) $value;
    }

    $text = trim((string) $value);
    if ($text === '') {
        return 0.0;
    }

    $withCurrency = extractEuroAmount($text . ' EUR');
    if ($withCurrency !== null) {
        return $withCurrency;
    }

    return (float) $text;
}

// -------------------------------------------------------------------------
// Helper: calculate invoice total from current data model
// - Prefer items[].Gesamtpreis (new format)
// - Apply Rabatt (%) when present
// - Fallback to legacy totals fields
// -------------------------------------------------------------------------
function calculateInvoiceAmount($invoice) {
    if (!is_array($invoice)) {
        return 0.0;
    }

    $itemTotal = 0.0;
    $hasItemTotals = false;

    if (isset($invoice['items']) && is_array($invoice['items']) && count($invoice['items']) > 0) {
        foreach ($invoice['items'] as $item) {
            if (!is_array($item) || !array_key_exists('Gesamtpreis', $item)) {
                continue;
            }
            $itemTotal += normalizeAmountValue($item['Gesamtpreis']);
            $hasItemTotals = true;
        }
    }

    if ($hasItemTotals) {
        $rabattPercent = normalizeAmountValue($invoice['Rabatt'] ?? 0);
        if ($rabattPercent > 0) {
            $itemTotal = $itemTotal * (1 - ($rabattPercent / 100));
        }
        return $itemTotal;
    }

    $legacyKeys = ['Gesamtsumme', 'Summe', 'Rechnungsbetrag', 'Betrag'];
    foreach ($legacyKeys as $key) {
        if (array_key_exists($key, $invoice) && trim((string) $invoice[$key]) !== '') {
            return normalizeAmountValue($invoice[$key]);
        }
    }

    return 0.0;
}

// -------------------------------------------------------------------------
// Helper: detect outgoing payment notification e-mails
// -------------------------------------------------------------------------
function isOutgoingPaymentEmail($text) {
    return preg_match('/kontoausgang|zahlungsausgang|ausgangsbuchung|ueberweisung an|überweisung an|lastschrift|abbuchung/i', $text) === 1;
}

// -------------------------------------------------------------------------
// Helper: extract recipient name from e-mail text
// -------------------------------------------------------------------------
function extractOutgoingRecipient($subject, $bodyText) {
    $bodyPatterns = [
        '/(?:Empf[aä]nger(?:name)?|Beg[üu]nstigter|Zahlungsempf[aä]nger)\s*[:\-]\s*([^\n\r]{2,120})/iu',
        '/(?:IBAN-Inhaber|Kontoinhaber)\s*[:\-]\s*([^\n\r]{2,120})/iu',
        '/(?:An)\s*[:\-]\s*([^\n\r]{2,120})/iu',
    ];

    foreach ($bodyPatterns as $pattern) {
        if (preg_match($pattern, $bodyText, $m)) {
            $candidate = trim($m[1]);
            if (!isBankServiceAlias($candidate)) {
                return $candidate;
            }
        }
    }

    // Subject fallback only if no explicit recipient line was found.
    if (preg_match('/(?:[ÜU]berweisung|Zahlung|Ausgangsbuchung)\s+(?:an)\s+([^\n\r\-:]{2,120})/iu', $subject, $m)) {
        $candidate = trim($m[1]);
        if (!isBankServiceAlias($candidate)) {
            return $candidate;
        }
    }

    return null;
}

// -------------------------------------------------------------------------
// Helper: detect intermediary/banking service names that are not recipients
// -------------------------------------------------------------------------
function isBankServiceAlias($name) {
    $n = mb_strtolower(trim((string) $name));
    if ($n === '') {
        return true;
    }

    $aliases = [
        'george', 'georg', 'sparkasse', 'online-banking', 'ebanking',
        'internetbanking', 'app', 'banking app', 'konto',
    ];

    foreach ($aliases as $alias) {
        if ($n === $alias || strpos($n, $alias) !== false) {
            return true;
        }
    }

    return false;
}

// -------------------------------------------------------------------------
// Helper: extract optional purpose from e-mail text
// -------------------------------------------------------------------------
function extractOutgoingPurpose($bodyText) {
    if (preg_match('/(?:Verwendungszweck|Zweck|Betreff)\s*[:\-]\s*([^\n\r]{2,180})/iu', $bodyText, $m)) {
        return trim($m[1]);
    }
    return null;
}

// -------------------------------------------------------------------------
// Helper: generate a unique expense ID
// -------------------------------------------------------------------------
function generateExpenseId() {
    return 'AUS-' . date('YmdHis') . '-' . substr(md5(uniqid('', true)), 0, 8);
}

// -------------------------------------------------------------------------
// Helper: check if expense import with same IMAP UID already exists
// -------------------------------------------------------------------------
function expenseExistsByImapUid($expenses, $uid) {
    if ($uid <= 0) {
        return false;
    }

    $uidTag = '[IMAP_UID:' . $uid . ']';
    foreach ($expenses as $expense) {
        $comments = (string) ($expense['Kommentare'] ?? '');
        if (strpos($comments, $uidTag) !== false) {
            return true;
        }
    }

    return false;
}

// -------------------------------------------------------------------------
// Helper: remember processed IMAP UID to avoid duplicate processing of
// already-read fallback results.
// -------------------------------------------------------------------------
function rememberProcessedUid($uid, &$processedUids, &$uidsChanged) {
    if ($uid > 0 && !isset($processedUids[(string) $uid])) {
        $processedUids[(string) $uid] = true;
        $uidsChanged = true;
    }
}

// -------------------------------------------------------------------------
// Helper: recursively extract plain-text from a MIME structure
// -------------------------------------------------------------------------
function extractTextFromParts($connection, $msgNum, $structure, $sectionPrefix = '') {
    // Simple message (not multipart)
    if (!isset($structure->parts)) {
        // type 0 = TEXT
        if ($structure->type === 0) {
            $section = $sectionPrefix ?: '1';
            $raw     = imap_fetchbody($connection, $msgNum, $section, FT_PEEK);
            return decodePart($raw, $structure->encoding);
        }
        return '';
    }

    // Multipart – iterate parts
    $text = '';
    foreach ($structure->parts as $i => $part) {
        $sectionNum = ($sectionPrefix ? $sectionPrefix . '.' : '') . ($i + 1);
        if ($part->type === 0) { // TEXT
            $subtype = strtolower($part->subtype ?? '');
            if ($subtype === 'plain' || $text === '') {
                $raw  = imap_fetchbody($connection, $msgNum, $sectionNum, FT_PEEK);
                $text .= decodePart($raw, $part->encoding) . "\n";
                // Prefer text/plain; stop after first plain-text part found
                if ($subtype === 'plain') break;
            }
        } elseif ($part->type === 1 && isset($part->parts)) {
            // Nested multipart
            $sub = extractTextFromParts($connection, $msgNum, $part, $sectionNum);
            if ($sub !== '') $text .= $sub;
        }
    }
    return $text;
}

// -------------------------------------------------------------------------
// 6. Process each unread message
// -------------------------------------------------------------------------
$processedUidsFile = __DIR__ . '/../data/bank-email-processed-uids.json';
$processedUids     = [];
$uidsChanged       = false;

if (file_exists($processedUidsFile)) {
    $uidRaw = json_decode(file_get_contents($processedUidsFile), true);
    if (is_array($uidRaw)) {
        foreach ($uidRaw as $uid) {
            $processedUids[(string) $uid] = true;
        }
    }
}

$paid     = [];
$createdExpenses = [];
$skipped  = [];
$invoicesModified = false;
$expensesModified = false;
$deletedCount = 0;
$archivedCount = 0;
$archiveFailures = 0;
$archiveUsedFolders = [];
$debugSamples = [];

foreach ($messageNums as $msgNum) {
    $msgUid = (int) imap_uid($connection, $msgNum);
    // Do not suppress actively unread messages: if a mail is still UNSEEN,
    // it should be re-evaluated after parser/matching fixes.
    $skipByUid = ($searchMode !== 'UNSEEN') && $msgUid > 0 && isset($processedUids[(string) $msgUid]);
    if ($skipByUid) {
        if ($debugMode && count($debugSamples) < 10) {
            $debugSamples[] = [
                'uid'    => $msgUid,
                'action' => 'skip_already_processed_uid',
            ];
        }
        continue;
    }

    // Get subject (decoded from RFC2047 encoding)
    $overview = imap_fetch_overview($connection, (string) $msgNum);
    $subject  = isset($overview[0]->subject) ? imap_utf8($overview[0]->subject) : '';

    // Get plain-text body
    $structure = imap_fetchstructure($connection, $msgNum);
    $bodyText  = extractTextFromParts($connection, $msgNum, $structure);

    // Fallback to raw body if extraction failed
    if (empty(trim($bodyText))) {
        $bodyText = imap_body($connection, $msgNum, FT_PEEK);
    }

    $fullText = $subject . "\n" . $bodyText;

    // --- Extract invoice number (Format: F-XXXXX-YYYYMMDD-NNN) ---
    $invoiceId = null;
    if (preg_match('/\b(F-\d{5}-\d{8}-\d{3})\b/', $fullText, $m)) {
        $invoiceId = $m[1];
    }

    // --- Extract transfer amount (supports EUR / € and de/en decimal notation) ---
    $amount = extractEuroAmount($fullText);

    // Try outgoing-payment import first if this is an outgoing transaction mail.
    if (isOutgoingPaymentEmail($fullText)) {
        $recipient = extractOutgoingRecipient($subject, $bodyText);
        $purpose   = extractOutgoingPurpose($bodyText) ?: trim($subject);

        if ($recipient !== null && $amount !== null) {
            if (!expenseExistsByImapUid($expenses, $msgUid)) {
                $newExpense = [
                    'Ausgaben_ID'       => generateExpenseId(),
                    'Datum'             => date('Y-m-d'),
                    'Empfaenger'        => $recipient,
                    'Verwendungszweck'  => $purpose,
                    'Rechnungsnummer'   => '',
                    'Betrag'            => number_format($amount, 2, '.', ''),
                    'Kategorie'         => 'Beruflich',
                    'Status'            => 'bezahlt',
                    'Deadline'          => '',
                    'IBAN'              => '',
                    'BIC'               => '',
                    'Kommentare'        => 'Automatisch aus Bank-Ausgangs-E-Mail importiert [IMAP_UID:' . $msgUid . ']',
                ];

                array_unshift($expenses, $newExpense);
                $createdExpenses[] = [
                    'expenseId'  => $newExpense['Ausgaben_ID'],
                    'recipient'  => $recipient,
                    'amount'     => $amount,
                    'subject'    => $subject,
                ];
                $expensesModified = true;

                if ($debugMode && count($debugSamples) < 10) {
                    $debugSamples[] = [
                        'uid'       => $msgUid,
                        'subject'   => $subject,
                        'recipient' => $recipient,
                        'amount'    => $amount,
                        'action'    => 'expense_imported',
                    ];
                }
            }

            if ($markAsRead) {
                markMessageSeen($connection, $msgNum);
            }

            if ($archiveProcessed && $archiveFolder !== '') {
                $usedArchiveFolder = moveMessageToFolder($connection, $msgNum, $archiveFolder, $serverMailboxBase);
                if ($usedArchiveFolder !== null) {
                    $archivedCount++;
                    if (!in_array($usedArchiveFolder, $archiveUsedFolders, true)) {
                        $archiveUsedFolders[] = $usedArchiveFolder;
                    }
                } else {
                    $archiveFailures++;
                    if ($deleteProcessed) {
                        markMessageDeleted($connection, $msgNum);
                        $deletedCount++;
                    }
                }
            } elseif ($deleteProcessed) {
                markMessageDeleted($connection, $msgNum);
                $deletedCount++;
            }

            rememberProcessedUid($msgUid, $processedUids, $uidsChanged);
            continue;
        }
    }

    // Skip messages without both required fields
    if ($invoiceId === null || $amount === null) {
        $skipped[] = [
            'subject' => $subject,
            'reason'  => 'Keine Rechnungsnummer ' . ($invoiceId === null ? '(fehlt)' : '') .
                         ($amount === null ? ' / kein EUR-Betrag (fehlt)' : ''),
        ];
        if ($debugMode && count($debugSamples) < 10) {
            $debugSamples[] = [
                'uid'       => $msgUid,
                'subject'   => $subject,
                'invoiceId' => $invoiceId,
                'amount'    => $amount,
                'action'    => 'skip_missing_fields',
            ];
        }
        rememberProcessedUid($msgUid, $processedUids, $uidsChanged);
        continue;
    }

    // Find invoice
    $matchIndex = null;
    foreach ($invoices as $idx => $invoice) {
        if (isset($invoice['Rechnungs_ID']) && $invoice['Rechnungs_ID'] === $invoiceId) {
            $matchIndex = $idx;
            break;
        }
    }

    if ($matchIndex === null) {
        $skipped[] = [
            'subject'   => $subject,
            'invoiceId' => $invoiceId,
            'reason'    => "Rechnung {$invoiceId} nicht gefunden",
        ];
        // Still mark as read so we don't reprocess on the next check
        if ($markAsRead) {
            markMessageSeen($connection, $msgNum);
        }
        if ($debugMode && count($debugSamples) < 10) {
            $debugSamples[] = [
                'uid'       => $msgUid,
                'subject'   => $subject,
                'invoiceId' => $invoiceId,
                'amount'    => $amount,
                'action'    => 'skip_invoice_not_found',
            ];
        }
        rememberProcessedUid($msgUid, $processedUids, $uidsChanged);
        continue;
    }

    $invoice = $invoices[$matchIndex];

    // Skip if already paid
    if (isset($invoice['Bezahlt']) && $invoice['Bezahlt'] === 'bezahlt') {
        $skipped[] = [
            'subject'   => $subject,
            'invoiceId' => $invoiceId,
            'reason'    => 'Bereits als bezahlt markiert',
        ];
        if ($markAsRead) {
            markMessageSeen($connection, $msgNum);
        }
        if ($debugMode && count($debugSamples) < 10) {
            $debugSamples[] = [
                'uid'       => $msgUid,
                'subject'   => $subject,
                'invoiceId' => $invoiceId,
                'amount'    => $amount,
                'action'    => 'skip_already_paid',
            ];
        }
        rememberProcessedUid($msgUid, $processedUids, $uidsChanged);
        continue;
    }

    // Compare amounts (1-cent tolerance for floating-point)
    $invoiceAmount = calculateInvoiceAmount($invoice);
    if (abs($invoiceAmount - $amount) > 0.01) {
        $skipped[] = [
            'subject'       => $subject,
            'invoiceId'     => $invoiceId,
            'reason'        => sprintf(
                'Betrag stimmt nicht überein: E-Mail %.2f EUR, Rechnung %.2f EUR',
                $amount,
                $invoiceAmount
            ),
        ];
        // Mark as read to avoid re-processing on every subsequent check.
        // The mismatch is logged in $skipped so the admin can review it.
        if ($markAsRead) {
            markMessageSeen($connection, $msgNum);
        }
        if ($debugMode && count($debugSamples) < 10) {
            $debugSamples[] = [
                'uid'           => $msgUid,
                'subject'       => $subject,
                'invoiceId'     => $invoiceId,
                'amount'        => $amount,
                'invoiceAmount' => $invoiceAmount,
                'action'        => 'skip_amount_mismatch',
            ];
        }
        rememberProcessedUid($msgUid, $processedUids, $uidsChanged);
        continue;
    }

    // Mark invoice as paid
    $invoices[$matchIndex]['Bezahlt'] = 'bezahlt';
    $invoicesModified = true;
    $paid[]   = [
        'invoiceId' => $invoiceId,
        'amount'    => $amount,
        'subject'   => $subject,
    ];

    if ($debugMode && count($debugSamples) < 10) {
        $debugSamples[] = [
            'uid'       => $msgUid,
            'subject'   => $subject,
            'invoiceId' => $invoiceId,
            'amount'    => $amount,
            'action'    => 'paid',
        ];
    }

    // Mark email as read
    if ($markAsRead) {
        markMessageSeen($connection, $msgNum);
    }

    if ($archiveProcessed && $archiveFolder !== '') {
        $usedArchiveFolder = moveMessageToFolder($connection, $msgNum, $archiveFolder, $serverMailboxBase);
        if ($usedArchiveFolder !== null) {
            $archivedCount++;
            if (!in_array($usedArchiveFolder, $archiveUsedFolders, true)) {
                $archiveUsedFolders[] = $usedArchiveFolder;
            }
            if ($debugMode && count($debugSamples) < 10) {
                $debugSamples[] = [
                    'uid'       => $msgUid,
                    'subject'   => $subject,
                    'invoiceId' => $invoiceId,
                    'action'    => 'archived',
                    'folder'    => $usedArchiveFolder,
                ];
            }
        } else {
            $archiveFailures++;
            if ($deleteProcessed) {
                markMessageDeleted($connection, $msgNum);
                $deletedCount++;
            }
        }
    } elseif ($deleteProcessed) {
        markMessageDeleted($connection, $msgNum);
        $deletedCount++;
    }

    rememberProcessedUid($msgUid, $processedUids, $uidsChanged);
}

if ((($deleteProcessed && $deletedCount > 0) || ($archiveProcessed && $archivedCount > 0)) && function_exists('imap_expunge')) {
    @imap_expunge($connection);
}

imap_errors(); // Clear any residual IMAP errors
imap_close($connection);

// -------------------------------------------------------------------------
// 7. Persist changes to rechnungen.json
// -------------------------------------------------------------------------
if ($invoicesModified) {
    if (file_exists($rechnungenFile)) {
        @copy($rechnungenFile, __DIR__ . '/../data/rechnungen.backup.json');
    }
    file_put_contents($rechnungenFile, json_encode($invoices, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

if ($expensesModified) {
    if (file_exists($ausgabenFile)) {
        @copy($ausgabenFile, __DIR__ . '/../data/ausgaben.backup.json');
    }
    file_put_contents($ausgabenFile, json_encode($expenses, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

if ($uidsChanged) {
    $uidList = array_map('intval', array_keys($processedUids));
    file_put_contents($processedUidsFile, json_encode(array_values($uidList), JSON_PRETTY_PRINT));
}

// -------------------------------------------------------------------------
// 8. Return results
// -------------------------------------------------------------------------
$paidCount = count($paid);
http_response_code(200);
$response = [
    'success'   => true,
    'processed' => $paidCount + count($createdExpenses) + count($skipped),
    'paid'      => $paid,
    'expensesImported' => $createdExpenses,
    'skipped'   => $skipped,
    'searchMode'=> $searchMode,
    'mailbox'   => $mailbox,
    'folderUsed'=> $imapFolder,
    'archived'  => $archivedCount,
    'deleted'   => $deletedCount,
    'archiveFailures' => $archiveFailures,
    'archiveUsedFolders' => $archiveUsedFolders,
    'message'   => ($paidCount > 0 || count($createdExpenses) > 0)
        ? ((
            ($paidCount > 0 ? "{$paidCount} Rechnung" . ($paidCount === 1 ? '' : 'en') . " als bezahlt markiert." : '') .
            ($paidCount > 0 && count($createdExpenses) > 0 ? ' ' : '') .
            (count($createdExpenses) > 0 ? count($createdExpenses) . ' Ausgabe(n) automatisch erfasst.' : '')
          ))
        : 'Keine neuen Zahlungseingänge gefunden.',
    'timestamp' => date('c'),
];

if ($debugMode) {
    $response['debug'] = [
        'mailboxStats'     => $mailboxStats,
        'matchedMessageCount' => is_array($messageNums) ? count($messageNums) : 0,
        'sampleActions'    => $debugSamples,
        'processedUidCount'=> count($processedUids),
        'successfulFolders'=> $successfulCandidates,
        'createdExpenses'  => $createdExpenses,
        'archiveFolder'    => $archiveFolder,
        'archiveProcessed' => $archiveProcessed,
        'archiveUsedFolders' => $archiveUsedFolders,
        'archived'         => $archivedCount,
        'deleted'          => $deletedCount,
        'archiveFailures'  => $archiveFailures,
    ];
}

echo safeJsonEncode($response, $jsonFlags);
