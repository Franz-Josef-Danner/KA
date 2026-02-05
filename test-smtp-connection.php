<?php
/**
 * SMTP Connection Test
 * 
 * Quick test to verify SMTP server connectivity
 * Tests connection WITHOUT authentication
 * 
 * IMPORTANT: Delete this file after testing for security reasons!
 */

// Load backend config
$configFile = __DIR__ . '/backend/config.json';

if (!file_exists($configFile)) {
    die("❌ Configuration file not found: $configFile\n\nCreate backend/config.json first!");
}

$configData = file_get_contents($configFile);
$config = json_decode($configData, true);

if (!$config) {
    die("❌ Invalid configuration file. Check backend/config.json for JSON errors.");
}

// Get SMTP settings
$host = $config['smtp']['host'];
$port = isset($config['smtp']['port']) ? $config['smtp']['port'] : 587;

// Set timeout
set_time_limit(30);

// HTML output
echo "<!DOCTYPE html>\n";
echo "<html><head>\n";
echo "<title>SMTP Connection Test</title>\n";
echo "<style>\n";
echo "body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }\n";
echo ".container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n";
echo "h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }\n";
echo ".info { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }\n";
echo ".success { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }\n";
echo ".error { background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }\n";
echo ".warning { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0; }\n";
echo "pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; border: 1px solid #ddd; }\n";
echo "code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }\n";
echo ".label { font-weight: 600; color: #2c3e50; }\n";
echo "</style>\n";
echo "</head><body>\n";
echo "<div class='container'>\n";

echo "<h1>🔌 SMTP Connection Test</h1>\n";

echo "<div class='info'>\n";
echo "<div class='label'>Configuration:</div>\n";
echo "<strong>SMTP Host:</strong> " . htmlspecialchars($host) . "<br>\n";
echo "<strong>SMTP Port:</strong> " . htmlspecialchars($port) . "\n";
echo "</div>\n";

echo "<h2>Test Results:</h2>\n";
echo "<pre>\n";

// Test connection
$startTime = microtime(true);
echo "🔌 Testing connection to " . htmlspecialchars($host) . ":" . htmlspecialchars($port) . "...\n\n";
flush();

$errno = 0;
$errstr = '';
$timeout = 10;

// Try to connect
$socket = @fsockopen($host, $port, $errno, $errstr, $timeout);

if ($socket) {
    $elapsed = round((microtime(true) - $startTime) * 1000, 2);
    echo "✅ CONNECTION SUCCESSFUL\n\n";
    echo "Connected to: " . htmlspecialchars($host) . ":" . htmlspecialchars($port) . "\n";
    echo "Time elapsed: {$elapsed}ms\n\n";
    
    // Read server greeting
    stream_set_timeout($socket, 5);
    $response = fgets($socket, 1024);
    
    if ($response) {
        echo "Server greeting:\n";
        echo htmlspecialchars($response) . "\n";
        
        // Check if it's a valid SMTP greeting (starts with 220)
        if (strpos($response, '220') === 0) {
            echo "\n✅ Server is responding correctly (220 OK)\n";
        } else {
            echo "\n⚠️ Unexpected response code (expected 220)\n";
        }
    }
    
    // Close connection
    fclose($socket);
    
    echo "</pre>\n";
    echo "<div class='success'>\n";
    echo "<div class='label'>Result:</div>\n";
    echo "• SMTP server is reachable<br>\n";
    echo "• Server accepts connections<br>\n";
    echo "• Ready for email sending\n";
    echo "</div>\n";
    
    echo "<div class='info'>\n";
    echo "<div class='label'>Next Steps:</div>\n";
    echo "1. Use <code>test-mail.php</code> for full email sending test with authentication<br>\n";
    echo "2. Configure your SMTP credentials in <code>backend/config.json</code><br>\n";
    echo "3. Test actual email sending from the dashboard\n";
    echo "</div>\n";
} else {
    echo "❌ CONNECTION FAILED\n\n";
    echo "Error: " . htmlspecialchars($errstr) . " (Code: $errno)\n";
    
    echo "</pre>\n";
    echo "<div class='error'>\n";
    echo "<div class='label'>Connection Error:</div>\n";
    echo "Could not connect to SMTP server.<br>\n";
    echo "<strong>Error:</strong> " . htmlspecialchars($errstr) . " (Code: $errno)\n";
    echo "</div>\n";
    
    echo "<div class='warning'>\n";
    echo "<div class='label'>Troubleshooting:</div>\n";
    echo "<ol>\n";
    echo "<li><strong>Check SMTP Host:</strong> Is <code>" . htmlspecialchars($host) . "</code> correct?</li>\n";
    echo "<li><strong>Check SMTP Port:</strong> Try 587 (STARTTLS) or 465 (SSL)</li>\n";
    echo "<li><strong>Firewall:</strong> Is port " . htmlspecialchars($port) . " blocked?</li>\n";
    echo "<li><strong>Hosting Provider:</strong> Contact support if issue persists</li>\n";
    echo "</ol>\n";
    echo "</div>\n";
    
    echo "<div class='info'>\n";
    echo "<div class='label'>Common SMTP Settings:</div>\n";
    echo "<strong>World4You:</strong> smtp.world4you.com Port 587<br>\n";
    echo "<strong>Gmail:</strong> smtp.gmail.com Port 587<br>\n";
    echo "<strong>Outlook:</strong> smtp-mail.outlook.com Port 587<br>\n";
    echo "<strong>1&1:</strong> smtp.1und1.de Port 587\n";
    echo "</div>\n";
}

echo "<div class='warning' style='margin-top: 30px;'>\n";
echo "<div class='label'>⚠️ Security Notice:</div>\n";
echo "<strong>DELETE this file after testing!</strong><br>\n";
echo "This test file should not remain on your production server.\n";
echo "</div>\n";

echo "<div style='margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px;'>\n";
echo "<small>\n";
echo "Test completed: " . date('Y-m-d H:i:s') . "<br>\n";
echo "Config file: backend/config.json<br>\n";
echo "For detailed SMTP logs, check: <code>backend/smtp-debug.log</code>\n";
echo "</small>\n";
echo "</div>\n";

echo "</div>\n"; // container
echo "</body></html>\n";
