<?php
/**
 * PHP Email Sender
 * 
 * PHP-based email sender that works on shared hosting without Node.js
 * Processes email notifications from queue and sends them via SMTP
 * 
 * Usage:
 *   php backend/php-email-sender.php
 * 
 * Cronjob example (every 5 minutes):
 *   Asterisk-Slash-5 * * * * cd /pfad/zu/KA/backend && php php-email-sender.php >> /var/log/ka-email.log 2>&1
 */

// Configuration file path
$configFile = __DIR__ . '/config.json';
$queueFile = __DIR__ . '/email-queue.json';

/**
 * Load configuration from file
 */
function loadConfig($configFile) {
    if (!file_exists($configFile)) {
        return [
            'error' => true,
            'message' => 'Configuration file not found: ' . $configFile,
            'instruction' => 'Please create backend/config.json with your email settings.'
        ];
    }
    
    $configData = file_get_contents($configFile);
    $config = json_decode($configData, true);
    
    if (!$config) {
        return [
            'error' => true,
            'message' => 'Invalid configuration file',
            'instruction' => 'Please check backend/config.json for JSON syntax errors.'
        ];
    }
    
    // Validate required fields
    $required = ['email', 'password', 'smtp'];
    foreach ($required as $field) {
        if (!isset($config[$field])) {
            return [
                'error' => true,
                'message' => "Missing required field: $field",
                'instruction' => 'Please check backend/config.json'
            ];
        }
    }
    
    return $config;
}

/**
 * Load email queue from file
 */
function loadQueue($queueFile) {
    if (!file_exists($queueFile)) {
        return [];
    }
    
    $queueData = file_get_contents($queueFile);
    return json_decode($queueData, true) ?? [];
}

/**
 * Save email queue to file
 */
function saveQueue($queueFile, $queue) {
    return file_put_contents($queueFile, json_encode($queue, JSON_PRETTY_PRINT));
}

/**
 * Send email via SMTP using PHP sockets
 */
function sendEmailSMTP($config, $to, $subject, $body, $from = null, $verbose = false) {
    $smtp = $config['smtp'];
    $host = $smtp['host'];
    $port = isset($smtp['port']) ? $smtp['port'] : 587;
    $secure = isset($smtp['secure']) ? $smtp['secure'] : false;
    $username = $config['email'];
    $password = $config['password'];
    $fromName = isset($config['fromName']) ? $config['fromName'] : 'KA System';
    
    $log = [];
    
    if (!$from) {
        $from = $username;
    }
    
    if ($verbose) {
        $log[] = "📧 Attempting to send email:";
        $log[] = "   From: $from";
        $log[] = "   To: $to";
        $log[] = "   Subject: $subject";
        $log[] = "   SMTP Host: $host:$port";
        $log[] = "   Secure: " . ($secure ? 'Yes (SSL/TLS)' : ($port == 587 ? 'STARTTLS' : 'No'));
    }
    
    try {
        // Connect to SMTP server
        $errno = 0;
        $errstr = '';
        
        if ($verbose) {
            $log[] = "\n🔌 Connecting to SMTP server...";
        }
        
        if ($secure && $port == 465) {
            // SSL connection
            $socket = @fsockopen('ssl://' . $host, $port, $errno, $errstr, 30);
        } else {
            // Regular or STARTTLS connection
            $socket = @fsockopen($host, $port, $errno, $errstr, 30);
        }
        
        if (!$socket) {
            $error = "Could not connect to SMTP server $host:$port - $errstr ($errno)";
            if ($verbose) {
                $log[] = "❌ Connection failed: $error";
            }
            return [
                'success' => false,
                'error' => $error,
                'log' => $log,
                'details' => [
                    'host' => $host,
                    'port' => $port,
                    'errno' => $errno,
                    'errstr' => $errstr
                ]
            ];
        }
        
        if ($verbose) {
            $log[] = "✅ Connected to $host:$port";
        }
        
        // Read greeting
        $response = fgets($socket, 515);
        if ($verbose) {
            $log[] = "Server: " . trim($response);
        }
        if (substr($response, 0, 3) != '220') {
            fclose($socket);
            return ['success' => false, 'error' => 'SMTP greeting failed: ' . $response, 'log' => $log];
        }
        
        // Send EHLO
        $serverName = isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost';
        fputs($socket, "EHLO $serverName\r\n");
        $response = fgets($socket, 515);
        if ($verbose) {
            $log[] = "Client: EHLO $serverName";
            $log[] = "Server: " . trim($response);
        }
        
        // Read all EHLO responses
        while (substr($response, 3, 1) == '-') {
            $response = fgets($socket, 515);
            if ($verbose) {
                $log[] = "Server: " . trim($response);
            }
        }
        
        // STARTTLS if needed
        if (!$secure && $port == 587) {
            if ($verbose) {
                $log[] = "\n🔒 Starting TLS encryption...";
                $log[] = "Client: STARTTLS";
            }
            fputs($socket, "STARTTLS\r\n");
            $response = fgets($socket, 515);
            if ($verbose) {
                $log[] = "Server: " . trim($response);
            }
            if (substr($response, 0, 3) != '220') {
                fclose($socket);
                return ['success' => false, 'error' => 'STARTTLS failed: ' . $response, 'log' => $log];
            }
            
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                return ['success' => false, 'error' => 'Failed to enable TLS encryption', 'log' => $log];
            }
            
            if ($verbose) {
                $log[] = "✅ TLS encryption enabled";
            }
            
            // Send EHLO again after STARTTLS
            fputs($socket, "EHLO $serverName\r\n");
            $response = fgets($socket, 515);
            if ($verbose) {
                $log[] = "Client: EHLO $serverName";
                $log[] = "Server: " . trim($response);
            }
            while (substr($response, 3, 1) == '-') {
                $response = fgets($socket, 515);
                if ($verbose) {
                    $log[] = "Server: " . trim($response);
                }
            }
        }
        
        // AUTH LOGIN
        if ($verbose) {
            $log[] = "\n🔑 Authenticating...";
            $log[] = "Client: AUTH LOGIN";
        }
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 515);
        if ($verbose) {
            $log[] = "Server: " . trim($response);
        }
        if (substr($response, 0, 3) != '334') {
            fclose($socket);
            return ['success' => false, 'error' => 'AUTH LOGIN not supported or failed: ' . $response, 'log' => $log];
        }
        
        // Send username
        fputs($socket, base64_encode($username) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '334') {
            fclose($socket);
            $error = 'Username authentication failed: ' . $response . ' (Check username: ' . $username . ')';
            if ($verbose) {
                $log[] = "❌ " . $error;
            }
            return ['success' => false, 'error' => $error, 'log' => $log];
        }
        
        // Send password
        fputs($socket, base64_encode($password) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) != '235') {
            fclose($socket);
            $error = 'Password authentication failed: ' . $response . ' (Check password or use app-specific password for Gmail)';
            if ($verbose) {
                $log[] = "❌ " . $error;
            }
            return ['success' => false, 'error' => $error, 'log' => $log];
        }
        
        if ($verbose) {
            $log[] = "✅ Authentication successful";
        }
        
        // MAIL FROM
        if ($verbose) {
            $log[] = "\n📤 Sending email...";
            $log[] = "Client: MAIL FROM: <$from>";
        }
        fputs($socket, "MAIL FROM: <$from>\r\n");
        $response = fgets($socket, 515);
        if ($verbose) {
            $log[] = "Server: " . trim($response);
        }
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            return ['success' => false, 'error' => 'MAIL FROM failed: ' . $response, 'log' => $log];
        }
        
        // RCPT TO
        if ($verbose) {
            $log[] = "Client: RCPT TO: <$to>";
        }
        fputs($socket, "RCPT TO: <$to>\r\n");
        $response = fgets($socket, 515);
        if ($verbose) {
            $log[] = "Server: " . trim($response);
        }
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            $error = 'RCPT TO failed: ' . $response . ' (Invalid recipient: ' . $to . ')';
            if ($verbose) {
                $log[] = "❌ " . $error;
            }
            return ['success' => false, 'error' => $error, 'log' => $log];
        }
        
        // DATA
        if ($verbose) {
            $log[] = "Client: DATA";
        }
        fputs($socket, "DATA\r\n");
        $response = fgets($socket, 515);
        if ($verbose) {
            $log[] = "Server: " . trim($response);
        }
        if (substr($response, 0, 3) != '354') {
            fclose($socket);
            return ['success' => false, 'error' => 'DATA command failed: ' . $response, 'log' => $log];
        }
        
        // Build email headers and body
        $headers = "From: $fromName <$from>\r\n";
        $headers .= "To: <$to>\r\n";
        $headers .= "Subject: $subject\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "Content-Transfer-Encoding: 8bit\r\n";
        
        // Send headers and body
        fputs($socket, $headers . "\r\n" . $body . "\r\n.\r\n");
        $response = fgets($socket, 515);
        if ($verbose) {
            $log[] = "Client: [Email content]";
            $log[] = "Server: " . trim($response);
        }
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            $error = 'Message not accepted: ' . $response;
            if ($verbose) {
                $log[] = "❌ " . $error;
            }
            return ['success' => false, 'error' => $error, 'log' => $log];
        }
        
        // QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        if ($verbose) {
            $log[] = "\n✅ Email sent successfully!";
            $log[] = "   To: $to";
            $log[] = "   Subject: $subject";
        }
        
        return [
            'success' => true,
            'log' => $log,
            'recipient' => $to,
            'subject' => $subject
        ];
        
    } catch (Exception $e) {
        $error = 'Exception: ' . $e->getMessage();
        if ($verbose) {
            $log[] = "❌ " . $error;
        }
        return [
            'success' => false,
            'error' => $error,
            'log' => $log
        ];
    }
}

/**
 * Get email template based on notification type
 */
function getEmailTemplate($type, $data) {
    $templates = [
        'newCustomer' => [
            'subject' => 'Neuer Kunde erstellt',
            'body' => "Neuer Kunde erstellt\n\n" .
                     "Name: {customerName}\n" .
                     "E-Mail: {customerEmail}\n" .
                     "Firmenname: {companyName}\n\n" .
                     "Dieser Kunde wurde im KA System erstellt."
        ],
        'newOrder' => [
            'subject' => 'Neuer Auftrag erstellt',
            'body' => "Neuer Auftrag erstellt\n\n" .
                     "Auftragsnummer: {orderNumber}\n" .
                     "Kunde: {customerName}\n" .
                     "Gesamtbetrag: {totalAmount}\n\n" .
                     "Ein neuer Auftrag wurde im KA System erstellt."
        ],
        'newInvoice' => [
            'subject' => 'Neue Rechnung erstellt',
            'body' => "Neue Rechnung erstellt\n\n" .
                     "Rechnungsnummer: {invoiceNumber}\n" .
                     "Kunde: {customerName}\n" .
                     "Gesamtbetrag: {totalAmount}\n\n" .
                     "Eine neue Rechnung wurde im KA System erstellt."
        ],
        'paymentReceived' => [
            'subject' => 'Zahlungseingang',
            'body' => "Zahlungseingang erhalten\n\n" .
                     "Rechnungsnummer: {invoiceNumber}\n" .
                     "Kunde: {customerName}\n" .
                     "Betrag: {amount}\n\n" .
                     "Eine Zahlung wurde im KA System verzeichnet."
        ]
    ];
    
    if (!isset($templates[$type])) {
        return [
            'subject' => 'KA System Benachrichtigung',
            'body' => json_encode($data, JSON_PRETTY_PRINT)
        ];
    }
    
    $template = $templates[$type];
    $subject = $template['subject'];
    $body = $template['body'];
    
    // Replace placeholders
    foreach ($data as $key => $value) {
        $body = str_replace('{' . $key . '}', $value, $body);
        $subject = str_replace('{' . $key . '}', $value, $subject);
    }
    
    return [
        'subject' => $subject,
        'body' => $body
    ];
}

// Main execution
if (php_sapi_name() === 'cli') {
    echo "🚀 Starting PHP email queue processor...\n";
    echo "⏰ Time: " . date('d.m.Y, H:i:s') . "\n\n";
}

// Load configuration
$config = loadConfig($configFile);
if (isset($config['error']) && $config['error']) {
    $message = "❌ " . $config['message'] . "\n";
    if (isset($config['instruction'])) {
        $message .= "📝 " . $config['instruction'] . "\n";
    }
    
    if (php_sapi_name() === 'cli') {
        echo $message;
        exit(1);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $config['message'],
            'instruction' => $config['instruction'] ?? ''
        ]);
        exit();
    }
}

// Load queue
$queue = loadQueue($queueFile);

if (empty($queue)) {
    if (php_sapi_name() === 'cli') {
        echo "📭 Queue is empty. Nothing to send.\n";
        echo "✨ Done!\n";
        exit(0);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'No emails in queue',
            'sent' => 0,
            'failed' => 0
        ]);
        exit();
    }
}

// Process emails
$sent = 0;
$failed = 0;
$errors = [];
$detailedLogs = [];

// Enable verbose mode when not in CLI (for API calls)
$verbose = (php_sapi_name() !== 'cli');

foreach ($queue as $key => &$email) {
    // Skip emails that are not pending or approved
    if (!isset($email['status']) || !in_array($email['status'], ['pending', 'approved'])) {
        continue;
    }
    
    // Get email details
    $to = isset($email['recipientEmail']) ? $email['recipientEmail'] : $config['email'];
    $type = isset($email['type']) ? $email['type'] : 'notification';
    $data = isset($email['data']) ? $email['data'] : [];
    
    // Get template
    $template = getEmailTemplate($type, $data);
    $subject = isset($email['subject']) ? $email['subject'] : $template['subject'];
    $body = isset($email['body']) ? $email['body'] : $template['body'];
    
    // Send email with verbose logging
    $result = sendEmailSMTP($config, $to, $subject, $body, null, $verbose);
    
    if ($result['success']) {
        $email['status'] = 'sent';
        $email['sentAt'] = date('c');
        $email['recipient'] = $to;
        $sent++;
        
        if (php_sapi_name() === 'cli') {
            echo "✅ Sent to: $to - $subject\n";
        }
        
        // Store detailed log for API response
        if (isset($result['log'])) {
            $detailedLogs[] = [
                'status' => 'success',
                'to' => $to,
                'subject' => $subject,
                'log' => $result['log']
            ];
        }
    } else {
        $email['status'] = 'failed';
        $email['error'] = $result['error'];
        $email['failedAt'] = date('c');
        $failed++;
        $errors[] = [
            'to' => $to,
            'subject' => $subject,
            'error' => $result['error']
        ];
        
        if (php_sapi_name() === 'cli') {
            echo "❌ Failed to: $to - " . $result['error'] . "\n";
            if (isset($result['log']) && is_array($result['log'])) {
                echo "   Debug log:\n";
                foreach ($result['log'] as $logLine) {
                    echo "   " . $logLine . "\n";
                }
            }
        }
        
        // Store detailed log for API response
        if (isset($result['log'])) {
            $detailedLogs[] = [
                'status' => 'failed',
                'to' => $to,
                'subject' => $subject,
                'error' => $result['error'],
                'log' => $result['log']
            ];
        }
    }
}

// Save updated queue
saveQueue($queueFile, $queue);

// Output summary
if (php_sapi_name() === 'cli') {
    echo "\n📊 Summary:\n";
    echo "   ✅ Sent: $sent\n";
    echo "   ❌ Failed: $failed\n";
    echo "✨ Done!\n";
} else {
    $response = [
        'success' => ($sent > 0 || $failed == 0),
        'sent' => $sent,
        'failed' => $failed,
        'total' => $sent + $failed
    ];
    
    if ($failed > 0) {
        $response['errors'] = $errors;
        $response['detailedLogs'] = $detailedLogs;
    }
    
    // If all failed, this is an error
    if ($sent == 0 && $failed > 0) {
        $response['success'] = false;
    }
    
    echo json_encode($response);
}

exit($failed > 0 ? 1 : 0);
