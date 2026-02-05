<?php
/**
 * PHP Email Sender (World4You compatible)
 */

// Paths
$configFile = __DIR__ . '/config.json';
$queueFile  = __DIR__ . '/email-queue.json';

/* -------------------------------------------------------------------------- */
/* CONFIG & QUEUE                                                              */
/* -------------------------------------------------------------------------- */

function loadConfig($configFile) {
    if (!file_exists($configFile)) {
        return ['error' => true, 'message' => 'config.json missing'];
    }
    $cfg = json_decode(file_get_contents($configFile), true);
    if (!$cfg || !isset($cfg['email'], $cfg['password'], $cfg['smtp'])) {
        return ['error' => true, 'message' => 'Invalid config.json'];
    }
    return $cfg;
}

function loadQueue($queueFile) {
    if (!file_exists($queueFile)) return [];
    return json_decode(file_get_contents($queueFile), true) ?? [];
}

function saveQueue($queueFile, $queue) {
    file_put_contents($queueFile, json_encode($queue, JSON_PRETTY_PRINT));
}

/* -------------------------------------------------------------------------- */
/* SMTP CORE                                                                   */
/* -------------------------------------------------------------------------- */

function smtpReadBlock($socket) {
    $data = '';
    do {
        $line = fgets($socket, 515);
        $data .= $line;
    } while (isset($line[3]) && $line[3] === '-');
    return $data;
}

function sendEmailSMTP($config, $to, $subject, $body, $from = null, $verbose = false) {

    $host = $config['smtp']['host'];
    $port = (int)($config['smtp']['port'] ?? 587);

    $user = $config['email'];
    $pass = $config['password'];
    $from = $from ?: $user;
    $fromName = $config['fromName'] ?? 'KA System';

    $log = [];

    $socket = fsockopen($host, $port, $errno, $errstr, 30);
    if (!$socket) {
        return ['success' => false, 'error' => "$errstr ($errno)"];
    }

    stream_set_timeout($socket, 30);

    $log[] = trim(fgets($socket));
    fputs($socket, "EHLO localhost\r\n");
    $ehlo = smtpReadBlock($socket);
    $log[] = trim($ehlo);

    /* ------------------------- STARTTLS (587 ONLY) ------------------------- */
    if ($port === 587) {
        fputs($socket, "STARTTLS\r\n");
        $resp = fgets($socket, 515);
        if (substr($resp, 0, 3) !== '220') {
            fclose($socket);
            return ['success' => false, 'error' => 'STARTTLS rejected'];
        }

        if (!stream_socket_enable_crypto(
            $socket,
            true,
            STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT
        )) {
            fclose($socket);
            return ['success' => false, 'error' => 'TLS 1.2 failed'];
        }

        fputs($socket, "EHLO localhost\r\n");
        $log[] = trim(smtpReadBlock($socket));
    }

    /* ------------------------------ AUTH LOGIN ------------------------------ */
    fputs($socket, "AUTH LOGIN\r\n");
    if (substr(fgets($socket), 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'error' => 'AUTH LOGIN failed'];
    }

    fputs($socket, base64_encode($user) . "\r\n");
    if (substr(fgets($socket), 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'error' => 'SMTP user rejected'];
    }

    fputs($socket, base64_encode($pass) . "\r\n");
    if (substr(fgets($socket), 0, 3) !== '235') {
        fclose($socket);
        return ['success' => false, 'error' => 'SMTP password rejected'];
    }

    /* ------------------------------- ENVELOPE ------------------------------- */
    fputs($socket, "MAIL FROM:<$from>\r\n");
    if (substr(fgets($socket), 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'error' => 'MAIL FROM rejected'];
    }

    fputs($socket, "RCPT TO:<$to>\r\n");
    if (substr(fgets($socket), 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'error' => 'RCPT TO rejected'];
    }

    fputs($socket, "DATA\r\n");
    if (substr(fgets($socket), 0, 3) !== '354') {
        fclose($socket);
        return ['success' => false, 'error' => 'DATA rejected'];
    }

    /* ------------------------------ MESSAGE -------------------------------- */
    $body = str_replace("\n.", "\n..", $body);

    $headers =
        "From: $fromName <$from>\r\n" .
        "To: <$to>\r\n" .
        "Subject: $subject\r\n" .
        "Date: " . date('r') . "\r\n" .
        "MIME-Version: 1.0\r\n" .
        "Content-Type: text/plain; charset=UTF-8\r\n" .
        "Content-Transfer-Encoding: 8bit\r\n";

    fputs($socket, $headers . "\r\n" . $body . "\r\n.\r\n");
    if (substr(fgets($socket), 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'error' => 'Message rejected'];
    }

    fputs($socket, "QUIT\r\n");
    fclose($socket);

    return ['success' => true, 'log' => $log];
}

/* -------------------------------------------------------------------------- */
/* MAIN                                                                        */
/* -------------------------------------------------------------------------- */

$config = loadConfig($configFile);
if (isset($config['error'])) {
    http_response_code(500);
    echo json_encode($config);
    exit;
}

$queue = loadQueue($queueFile);
$sent = $failed = 0;
$logs = [];

foreach ($queue as &$mail) {
    if (!in_array($mail['status'] ?? '', ['pending', 'approved'])) continue;

    $res = sendEmailSMTP(
        $config,
        $mail['recipientEmail'] ?? $config['email'],
        $mail['subject'] ?? 'KA Notification',
        $mail['body'] ?? '',
        null,
        true
    );

    if ($res['success']) {
        $mail['status'] = 'sent';
        $sent++;
    } else {
        $mail['status'] = 'failed';
        $mail['error']  = $res['error'];
        $failed++;
    }

    $logs[] = $res;
}

saveQueue($queueFile, $queue);

echo json_encode([
    'success' => $failed === 0,
    'sent' => $sent,
    'failed' => $failed,
    'logs' => $logs
]);
