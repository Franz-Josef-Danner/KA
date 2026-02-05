<?php
/**
 * Email Sending Diagnostic Test
 * 
 * This test performs a complete email send test with detailed diagnostics
 * Use this to identify why emails are failing
 * 
 * IMPORTANT: Delete this file after testing for security reasons!
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

// HTML header
echo "<!DOCTYPE html>\n";
echo "<html><head>\n";
echo "<title>Email Sending Diagnostic Test</title>\n";
echo "<style>\n";
echo "body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }\n";
echo ".container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n";
echo "h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }\n";
echo ".success { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }\n";
echo ".error { background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }\n";
echo ".warning { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }\n";
echo ".info { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }\n";
echo "pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; border: 1px solid #ddd; white-space: pre-wrap; word-wrap: break-word; }\n";
echo ".step { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }\n";
echo ".label { font-weight: 600; color: #2c3e50; }\n";
echo "</style>\n";
echo "</head><body>\n";
echo "<div class='container'>\n";

echo "<h1>📧 Email Sending Diagnostic Test</h1>\n";

// Step 1: Check config file
echo "<div class='step'>\n";
echo "<h2>Step 1: Check Configuration File</h2>\n";

$configFile = __DIR__ . '/backend/config.json';

if (!file_exists($configFile)) {
    echo "<div class='error'>\n";
    echo "<strong>❌ CRITICAL ERROR:</strong> Configuration file not found!<br>\n";
    echo "<strong>Expected location:</strong> $configFile<br><br>\n";
    echo "<strong>Solution:</strong><br>\n";
    echo "1. Copy backend/config.example.json to backend/config.json<br>\n";
    echo "2. Edit backend/config.json with your SMTP credentials<br>\n";
    echo "</div>\n";
    echo "</div></div></body></html>\n";
    exit();
}

echo "<div class='success'>✅ Configuration file exists</div>\n";

$configData = file_get_contents($configFile);
$config = json_decode($configData, true);

if (!$config) {
    echo "<div class='error'>\n";
    echo "<strong>❌ ERROR:</strong> Configuration file is not valid JSON<br>\n";
    echo "<strong>JSON Error:</strong> " . json_last_error_msg() . "<br>\n";
    echo "</div>\n";
    echo "</div></div></body></html>\n";
    exit();
}

echo "<div class='success'>✅ Configuration file is valid JSON</div>\n";

// Validate required fields
$requiredFields = ['email', 'password', 'smtp'];
$missingFields = [];
foreach ($requiredFields as $field) {
    if (!isset($config[$field])) {
        $missingFields[] = $field;
    }
}

if (!empty($missingFields)) {
    echo "<div class='error'>\n";
    echo "<strong>❌ ERROR:</strong> Missing required fields: " . implode(', ', $missingFields) . "<br>\n";
    echo "</div>\n";
    echo "</div></div></body></html>\n";
    exit();
}

echo "<div class='success'>✅ All required fields present</div>\n";

// Display sanitized config
echo "<div class='info'>\n";
echo "<strong>Configuration Summary:</strong><br>\n";
echo "• Email: " . htmlspecialchars($config['email']) . "<br>\n";
echo "• From Name: " . htmlspecialchars($config['fromName'] ?? 'Not set') . "<br>\n";
echo "• SMTP Host: " . htmlspecialchars($config['smtp']['host']) . "<br>\n";
echo "• SMTP Port: " . htmlspecialchars($config['smtp']['port'] ?? '587') . "<br>\n";
echo "• Password: " . (empty($config['password']) ? '❌ NOT SET' : '✅ SET (hidden)') . "<br>\n";
echo "</div>\n";

echo "</div>\n"; // end step 1

// Step 2: Check PHPMailer
echo "<div class='step'>\n";
echo "<h2>Step 2: Check PHPMailer Library</h2>\n";

$phpMailerFiles = [
    __DIR__ . '/backend/PHPMailer/src/PHPMailer.php',
    __DIR__ . '/backend/PHPMailer/src/SMTP.php',
    __DIR__ . '/backend/PHPMailer/src/Exception.php'
];

$phpMailerOk = true;
foreach ($phpMailerFiles as $file) {
    if (!file_exists($file)) {
        echo "<div class='error'>❌ Missing: " . basename($file) . "</div>\n";
        $phpMailerOk = false;
    }
}

if ($phpMailerOk) {
    echo "<div class='success'>✅ PHPMailer library files exist</div>\n";
    
    // Try to include
    try {
        require_once __DIR__ . '/backend/smtp-phpmailer.php';
        echo "<div class='success'>✅ PHPMailer library loaded successfully</div>\n";
    } catch (Exception $e) {
        echo "<div class='error'>❌ Error loading PHPMailer: " . htmlspecialchars($e->getMessage()) . "</div>\n";
        echo "</div></div></body></html>\n";
        exit();
    }
} else {
    echo "<div class='error'><strong>❌ PHPMailer library is incomplete</strong></div>\n";
    echo "</div></div></body></html>\n";
    exit();
}

echo "</div>\n"; // end step 2

// Step 3: Test SMTP Connection
echo "<div class='step'>\n";
echo "<h2>Step 3: Test SMTP Connection</h2>\n";

$host = $config['smtp']['host'];
$port = $config['smtp']['port'] ?? 587;

echo "<p>Testing connection to $host:$port...</p>\n";
flush();

$errno = 0;
$errstr = '';
$socket = @fsockopen($host, $port, $errno, $errstr, 10);

if ($socket) {
    fclose($socket);
    echo "<div class='success'>✅ SMTP server is reachable</div>\n";
} else {
    echo "<div class='error'>\n";
    echo "<strong>❌ Cannot connect to SMTP server</strong><br>\n";
    echo "Error: " . htmlspecialchars($errstr) . " (Code: $errno)<br>\n";
    echo "<br><strong>Possible causes:</strong><br>\n";
    echo "• Wrong SMTP host or port<br>\n";
    echo "• Firewall blocking the connection<br>\n";
    echo "• Server not reachable<br>\n";
    echo "</div>\n";
    echo "</div></div></body></html>\n";
    exit();
}

echo "</div>\n"; // end step 3

// Step 4: Try to send a test email
echo "<div class='step'>\n";
echo "<h2>Step 4: Test Email Sending</h2>\n";

// You need to set your test recipient here
$testRecipient = $config['email']; // Send to self by default

echo "<div class='warning'>\n";
echo "<strong>⚠️ Note:</strong> This will attempt to send a test email to: " . htmlspecialchars($testRecipient) . "<br>\n";
echo "If you want to test with a different address, you can modify this file.<br>\n";
echo "</div>\n";

$testSubject = "Test Email from KA System - " . date('Y-m-d H:i:s');
$testBody = "This is a test email sent from the KA System diagnostic tool.\n\n";
$testBody .= "If you receive this email, your SMTP configuration is working correctly!\n\n";
$testBody .= "Timestamp: " . date('Y-m-d H:i:s') . "\n";
$testBody .= "SMTP Host: " . $host . "\n";
$testBody .= "SMTP Port: " . $port . "\n";

echo "<p>Attempting to send test email...</p>\n";
echo "<pre>";
flush();

$result = sendEmailPHPMailer($config, $testRecipient, $testSubject, $testBody, null, true);

// Display logs
if (isset($result['log']) && is_array($result['log'])) {
    foreach ($result['log'] as $logLine) {
        echo htmlspecialchars($logLine) . "\n";
    }
}

echo "</pre>\n";

if ($result['success']) {
    echo "<div class='success'>\n";
    echo "<h3>✅ TEST SUCCESSFUL!</h3>\n";
    echo "<p><strong>The test email was sent successfully!</strong></p>\n";
    echo "<p>Check your inbox at: <strong>" . htmlspecialchars($testRecipient) . "</strong></p>\n";
    echo "<p>If the email arrives, your SMTP configuration is working correctly.</p>\n";
    echo "</div>\n";
    
    // Write to log file
    writeSmtpLog($result);
    echo "<div class='info'>📝 Results logged to backend/smtp-debug.log</div>\n";
    
} else {
    echo "<div class='error'>\n";
    echo "<h3>❌ TEST FAILED!</h3>\n";
    echo "<p><strong>Error:</strong> " . htmlspecialchars($result['error'] ?? 'Unknown error') . "</p>\n";
    echo "<br><strong>Common issues and solutions:</strong><br>\n";
    echo "<ul>\n";
    echo "<li><strong>535 Authentication failed</strong> → Wrong username or password</li>\n";
    echo "<li><strong>550 Sender rejected</strong> → FROM address must be an existing mailbox (World4You requirement)</li>\n";
    echo "<li><strong>554 Connection refused</strong> → Wrong SMTP host or port</li>\n";
    echo "<li><strong>454 TLS not available</strong> → Try port 587 for STARTTLS</li>\n";
    echo "</ul>\n";
    echo "</div>\n";
    
    // Write to log file anyway
    writeSmtpLog($result);
    echo "<div class='info'>📝 Error details logged to backend/smtp-debug.log</div>\n";
}

echo "</div>\n"; // end step 4

// Step 5: Check log file
echo "<div class='step'>\n";
echo "<h2>Step 5: Check Log File</h2>\n";

$logFile = __DIR__ . '/backend/smtp-debug.log';

if (file_exists($logFile)) {
    $logSize = filesize($logFile);
    echo "<div class='success'>✅ Log file exists (Size: " . number_format($logSize) . " bytes)</div>\n";
    
    echo "<p><strong>Last 20 lines of log file:</strong></p>\n";
    echo "<pre>";
    $lines = file($logFile);
    $lastLines = array_slice($lines, -20);
    echo htmlspecialchars(implode('', $lastLines));
    echo "</pre>\n";
} else {
    echo "<div class='warning'>⚠️ Log file does not exist yet</div>\n";
}

echo "</div>\n"; // end step 5

// Summary
echo "<div class='step'>\n";
echo "<h2>📋 Summary</h2>\n";

if ($result['success']) {
    echo "<div class='success'>\n";
    echo "<h3>✅ All Systems Working!</h3>\n";
    echo "<p>Your email configuration is working correctly. You should be able to send emails from the dashboard.</p>\n";
    echo "<p><strong>Next steps:</strong></p>\n";
    echo "<ol>\n";
    echo "<li>Check if the test email arrived in your inbox</li>\n";
    echo "<li>Try sending emails from the dashboard</li>\n";
    echo "<li>If dashboard emails don't work, check browser console for errors</li>\n";
    echo "<li><strong>DELETE this test file after testing!</strong></li>\n";
    echo "</ol>\n";
    echo "</div>\n";
} else {
    echo "<div class='error'>\n";
    echo "<h3>❌ Email Sending Failed</h3>\n";
    echo "<p>Review the error messages above and:</p>\n";
    echo "<ol>\n";
    echo "<li>Check backend/config.json credentials are correct</li>\n";
    echo "<li>Verify FROM address is an existing mailbox (World4You requirement)</li>\n";
    echo "<li>Check backend/smtp-debug.log for detailed error information</li>\n";
    echo "<li>Verify SMTP host and port are correct</li>\n";
    echo "</ol>\n";
    echo "</div>\n";
}

echo "</div>\n"; // end summary

echo "<div class='warning' style='margin-top: 30px;'>\n";
echo "<div class='label'>⚠️ Security Notice:</div>\n";
echo "<strong>DELETE this file after testing!</strong><br>\n";
echo "This test file should not remain on your production server.<br>\n";
echo "File location: " . __FILE__ . "\n";
echo "</div>\n";

echo "</div>\n"; // container
echo "</body></html>\n";
