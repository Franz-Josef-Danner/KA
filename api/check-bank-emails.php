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

// -------------------------------------------------------------------------
// 3. Build IMAP connection string and connect
// -------------------------------------------------------------------------
$encFlag  = $imapSecure ? '/ssl' : '/notls';
$mailbox  = "{{$imapHost}:{$imapPort}{$encFlag}/novalidate-cert}{$imapFolder}";

$connection = @imap_open($mailbox, $loginEmail, $loginPassword, 0, 1, ['DISABLE_AUTHENTICATOR' => 'GSSAPI']);
if (!$connection) {
    $lastError = imap_last_error();
    // Clear the IMAP error stack so subsequent requests are clean
    imap_errors();
    http_response_code(500);
    echo json_encode([
        'success'  => false,
        'error'    => 'IMAP-Verbindung fehlgeschlagen: ' . ($lastError ?: 'Unbekannter Fehler'),
        'mailbox'  => $mailbox,
        'hint'     => 'Überprüfen Sie IMAP-Host, Port und Zugangsdaten in den Einstellungen.',
    ]);
    exit;
}

// -------------------------------------------------------------------------
// 4. Search for unread (UNSEEN) messages
// -------------------------------------------------------------------------
$messageNums = imap_search($connection, 'UNSEEN');
imap_errors(); // Clear error stack after search

if (!$messageNums) {
    imap_close($connection);
    echo json_encode([
        'success'   => true,
        'processed' => 0,
        'paid'      => [],
        'skipped'   => [],
        'message'   => 'Keine neuen E-Mails im Postfach.',
        'timestamp' => date('c'),
    ]);
    exit;
}

// -------------------------------------------------------------------------
// 5. Load invoice data
// -------------------------------------------------------------------------
$dataFile = __DIR__ . '/../data/rechnungen.json';
$invoices = [];
if (file_exists($dataFile)) {
    $invoices = json_decode(file_get_contents($dataFile), true) ?? [];
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
$paid     = [];
$skipped  = [];
$modified = false;

foreach ($messageNums as $msgNum) {
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

    // --- Extract EUR amount (German decimal format: "744,00 EUR" or "1.234,56 EUR") ---
    $amount = null;
    if (preg_match('/(\d{1,3}(?:\.\d{3})*,\d{2})\s*EUR/', $fullText, $m)) {
        $normalised = str_replace(['.', ','], ['', '.'], $m[1]);
        $amount     = (float) $normalised;
    }

    // Skip messages without both required fields
    if ($invoiceId === null || $amount === null) {
        $skipped[] = [
            'subject' => $subject,
            'reason'  => 'Keine Rechnungsnummer ' . ($invoiceId === null ? '(fehlt)' : '') .
                         ($amount === null ? ' / kein EUR-Betrag (fehlt)' : ''),
        ];
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
            imap_set_flag_full($connection, (string) $msgNum, '\\Seen');
        }
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
            imap_set_flag_full($connection, (string) $msgNum, '\\Seen');
        }
        continue;
    }

    // Compare amounts (1-cent tolerance for floating-point)
    $invoiceAmount = (float) ($invoice['Gesamtsumme'] ?? 0);
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
            imap_set_flag_full($connection, (string) $msgNum, '\\Seen');
        }
        continue;
    }

    // Mark invoice as paid
    $invoices[$matchIndex]['Bezahlt'] = 'bezahlt';
    $modified = true;
    $paid[]   = [
        'invoiceId' => $invoiceId,
        'amount'    => $amount,
        'subject'   => $subject,
    ];

    // Mark email as read
    if ($markAsRead) {
        imap_set_flag_full($connection, (string) $msgNum, '\\Seen');
    }
}

imap_errors(); // Clear any residual IMAP errors
imap_close($connection);

// -------------------------------------------------------------------------
// 7. Persist changes to rechnungen.json
// -------------------------------------------------------------------------
if ($modified) {
    if (file_exists($dataFile)) {
        @copy($dataFile, __DIR__ . '/../data/rechnungen.backup.json');
    }
    file_put_contents($dataFile, json_encode($invoices, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// -------------------------------------------------------------------------
// 8. Return results
// -------------------------------------------------------------------------
$paidCount = count($paid);
http_response_code(200);
echo json_encode([
    'success'   => true,
    'processed' => $paidCount + count($skipped),
    'paid'      => $paid,
    'skipped'   => $skipped,
    'message'   => $paidCount > 0
        ? "{$paidCount} Rechnung" . ($paidCount === 1 ? '' : 'en') . " automatisch als bezahlt markiert."
        : 'Keine neuen Zahlungseingänge gefunden.',
    'timestamp' => date('c'),
]);
