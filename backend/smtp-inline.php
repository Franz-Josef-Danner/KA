<?php
/**
 * SMTP Inline Sending Function for World4You Compatibility
 * 
 * This file contains SMTP sending logic that works WITHOUT exec()
 * Can be included directly in API endpoints for inline email sending
 * 
 * CRITICAL: NO external process calls - everything happens in same PHP request
 */

/**
 * Send email via SMTP using PHP sockets (INLINE - no exec())
 * 
 * @param array $config Email configuration (from backend/config.json)
 * @param string $to Recipient email address
 * @param string $subject Email subject
 * @param string $body Email body (plain text)
 * @param string|null $from From address (defaults to config email)
 * @param bool $verbose Enable verbose logging
 * @return array Result with 'success', 'error', and 'log' keys
 */
function sendEmailSMTPInline($config, $to, $subject, $body, $from = null, $verbose = false) {
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
                'log' => $log
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
            $error = 'Password authentication failed: ' . $response . ' (Check password or use app-specific password)';
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
        $headers .= "To: $to\r\n";
        $headers .= "Subject: $subject\r\n";
        $headers .= "Date: " . date('r') . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "Content-Transfer-Encoding: 8bit\r\n";
        
        // Send email content
        fputs($socket, $headers . "\r\n" . $body . "\r\n.\r\n");
        $response = fgets($socket, 515);
        if ($verbose) {
            $log[] = "Server: " . trim($response);
        }
        
        if (substr($response, 0, 3) != '250') {
            fclose($socket);
            return ['success' => false, 'error' => 'Email sending failed: ' . $response, 'log' => $log];
        }
        
        if ($verbose) {
            $log[] = "✅ Email sent successfully!";
        }
        
        // QUIT
        fputs($socket, "QUIT\r\n");
        fgets($socket, 515);
        fclose($socket);
        
        return [
            'success' => true,
            'log' => $log
        ];
        
    } catch (Exception $e) {
        if ($verbose) {
            $log[] = "❌ Exception: " . $e->getMessage();
        }
        return [
            'success' => false,
            'error' => 'Exception: ' . $e->getMessage(),
            'log' => $log
        ];
    }
}
