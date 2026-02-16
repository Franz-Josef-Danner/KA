<?php
/**
 * SMTP Sending Function using PHPMailer for World4You Compatibility
 * 
 * This implementation uses PHPMailer library which has been proven to work
 * perfectly with World4You SMTP servers.
 * 
 * Based on user's working code that uses PHPMailer successfully.
 */

require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';
require_once __DIR__ . '/PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Send email via SMTP using PHPMailer (PROVEN TO WORK with World4You)
 * 
 * @param array $config Email configuration (from backend/config.json)
 * @param string $to Recipient email address
 * @param string $subject Email subject
 * @param string $body Email body (plain text)
 * @param string|null $from From address (defaults to config email)
 * @param bool $verbose Enable verbose logging
 * @param array|null $attachment Optional PDF attachment as ['data' => base64_string, 'filename' => string]
 * @return array Result with 'success', 'error', and 'log' keys
 */
function sendEmailPHPMailer($config, $to, $subject, $body, $from = null, $verbose = false, $attachment = null) {
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
        $log[] = "📧 Attempting to send email with PHPMailer:";
        $log[] = "   From: $from ($fromName)";
        $log[] = "   To: $to";
        $log[] = "   Subject: $subject";
        $log[] = "   SMTP Host: $host:$port";
        $log[] = "   Secure: " . ($secure ? 'SSL/TLS' : 'STARTTLS');
        $log[] = "";
    }
    
    try {
        $mail = new PHPMailer(true);
        
        // Enable SMTP debugging if verbose
        if ($verbose) {
            $mail->SMTPDebug = 2; // Verbose debug output
            $mail->Debugoutput = function($str, $level) use (&$log) {
                $log[] = trim($str);
            };
        } else {
            $mail->SMTPDebug = 0;
        }
        
        // Server settings
        $mail->isSMTP();
        $mail->Host       = $host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $username;
        $mail->Password   = $password;
        $mail->Port       = $port;
        
        // World4You specific: STARTTLS intern bei World4You
        // IMPORTANT: User's PROVEN working configuration - DO NOT CHANGE!
        // Port 587 with SMTPSecure = false - STARTTLS handled automatically by PHPMailer
        $mail->SMTPSecure = false; // STARTTLS intern bei World4You
        
        // Recipients
        $mail->setFrom($from, $fromName);
        $mail->addAddress($to);
        
        // Content
        $mail->isHTML(false);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = $subject;
        $mail->Body    = $body;
        
        // Add PDF attachment if provided
        if ($attachment && isset($attachment['data']) && isset($attachment['filename'])) {
            $log[] = "📎 Adding PDF attachment: " . $attachment['filename'];
            // Decode base64 data from frontend
            $pdfData = base64_decode($attachment['data']);
            if ($pdfData !== false) {
                // addStringAttachment: $string (binary), $filename, $encoding (how to encode for email - base64 is standard), $type (MIME type)
                $mail->addStringAttachment($pdfData, $attachment['filename'], 'base64', 'application/pdf');
                $log[] = "   ✓ Attachment added successfully";
            } else {
                $log[] = "   ⚠ Warning: Could not decode attachment data";
            }
        }
        
        // Send
        $log[] = "";
        $log[] = "📤 Sending email...";
        
        $mail->send();
        
        $log[] = "✅ Email sent successfully via PHPMailer!";
        
        return [
            'success' => true,
            'to' => $to,
            'subject' => $subject,
            'log' => $log
        ];
        
    } catch (Exception $e) {
        $log[] = "";
        $log[] = "❌ PHPMailer Error: " . $mail->ErrorInfo;
        $log[] = "Exception: " . $e->getMessage();
        
        return [
            'success' => false,
            'error' => $mail->ErrorInfo,
            'to' => $to,
            'subject' => $subject,
            'log' => $log
        ];
    } catch (\Exception $e) {
        $log[] = "";
        $log[] = "❌ General Error: " . $e->getMessage();
        
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'to' => $to,
            'subject' => $subject,
            'log' => $log
        ];
    }
}

/**
 * Write SMTP log to file
 * 
 * @param mixed $data Data to log
 * @return bool True on success, false on failure
 */
function writeSmtpLog($data) {
    $logFile = __DIR__ . '/smtp-debug.log';
    
    try {
        // Check if directory is writable
        if (!is_writable(__DIR__)) {
            error_log("SMTP Log Error: Directory " . __DIR__ . " is not writable");
            return false;
        }
        
        // Rotate if > 10MB
        if (file_exists($logFile) && filesize($logFile) > 10 * 1024 * 1024) {
            @rename($logFile, $logFile . '.old');
        }
        
        // Create log file if it doesn't exist with proper header
        if (!file_exists($logFile)) {
            $header = "# SMTP Debug Log\n";
            $header .= "# Created: " . date('c') . "\n";
            $header .= "# This file logs all SMTP operations for debugging\n";
            $header .= "# ================================================\n\n";
            @file_put_contents($logFile, $header);
        }
        
        // Write with timestamp
        $logEntry = "[" . date('c') . "]\n" .
                   print_r($data, true) .
                   "\n----------------------\n";
        
        $result = @file_put_contents($logFile, $logEntry, FILE_APPEND);
        
        if ($result === false) {
            error_log("SMTP Log Error: Failed to write to " . $logFile);
            return false;
        }
        
        return true;
        
    } catch (Exception $e) {
        error_log("SMTP Log Exception: " . $e->getMessage());
        return false;
    }
}
