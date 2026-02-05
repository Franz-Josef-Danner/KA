<?php
/**
 * SMTP Connection Test for World4You
 * 
 * This file tests if SMTP sending works on your hosting.
 * Upload it to your web root and access it via browser.
 * 
 * IMPORTANT: Replace with YOUR email address for testing!
 */

// Configuration
$testRecipient = 'IHRE_EMAIL@gmail.com'; // CHANGE THIS TO YOUR EMAIL!

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

// Include SMTP inline function
require_once __DIR__ . '/backend/smtp-inline.php';

// Test email
$subject = 'World4You SMTP Test - ' . date('Y-m-d H:i:s');
$body = "Dies ist ein Test-E-Mail vom KA System.\n\n";
$body .= "Wenn Sie diese E-Mail erhalten, funktioniert SMTP auf Ihrem World4You Hosting!\n\n";
$body .= "Konfiguration:\n";
$body .= "- SMTP Host: " . $config['smtp']['host'] . "\n";
$body .= "- SMTP Port: " . (isset($config['smtp']['port']) ? $config['smtp']['port'] : 587) . "\n";
$body .= "- From: " . $config['email'] . "\n";
$body .= "- To: " . $testRecipient . "\n\n";
$body .= "Zeitstempel: " . date('Y-m-d H:i:s') . "\n";

echo "<html><head><title>SMTP Test</title>";
echo "<style>body { font-family: monospace; padding: 20px; } pre { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; }</style>";
echo "</head><body>";
echo "<h1>🧪 World4You SMTP Test</h1>\n";
echo "<p><strong>Empfänger:</strong> $testRecipient</p>\n";
echo "<p><strong>Konfiguration:</strong> " . $config['smtp']['host'] . ":" . (isset($config['smtp']['port']) ? $config['smtp']['port'] : 587) . "</p>\n";
echo "<hr>\n";
echo "<h2>Test wird ausgeführt...</h2>\n";
echo "<pre>\n";

// Send test email with verbose logging
$result = sendEmailSMTPInline($config, $testRecipient, $subject, $body, null, true);

// Display log
foreach ($result['log'] as $logLine) {
    echo htmlspecialchars($logLine) . "\n";
}

echo "</pre>\n";
echo "<hr>\n";

if ($result['success']) {
    echo "<h2 style='color: green;'>✅ TEST ERFOLGREICH!</h2>\n";
    echo "<p><strong>Die E-Mail wurde versendet!</strong></p>\n";
    echo "<p>Überprüfen Sie das Postfach von: <strong>$testRecipient</strong></p>\n";
    echo "<p>Wenn die E-Mail ankommt, funktioniert SMTP korrekt auf Ihrem Hosting.</p>\n";
    echo "<p style='color: blue;'><strong>✅ Ihr World4You Hosting unterstützt SMTP-Versand!</strong></p>\n";
} else {
    echo "<h2 style='color: red;'>❌ TEST FEHLGESCHLAGEN!</h2>\n";
    echo "<p><strong>Fehler:</strong> " . htmlspecialchars($result['error']) . "</p>\n";
    echo "<h3>Mögliche Ursachen:</h3>\n";
    echo "<ul>\n";
    echo "<li>SMTP-Zugangsdaten in backend/config.json sind falsch</li>\n";
    echo "<li>SMTP-Host oder Port ist falsch</li>\n";
    echo "<li>Passwort ist falsch (oder abgelaufen)</li>\n";
    echo "<li>From-Adresse ist keine existierende Mailbox (World4You Anforderung!)</li>\n";
    echo "<li>World4You blockiert SMTP (unwahrscheinlich)</li>\n";
    echo "</ul>\n";
    echo "<h3>Überprüfen Sie:</h3>\n";
    echo "<ol>\n";
    echo "<li><strong>backend/config.json:</strong> Sind alle Zugangsdaten korrekt?</li>\n";
    echo "<li><strong>From-Adresse:</strong> Ist \"" . htmlspecialchars($config['email']) . "\" eine EXISTIERENDE Mailbox?</li>\n";
    echo "<li><strong>SMTP-Zugangsdaten:</strong> Sind Username und Passwort korrekt?</li>\n";
    echo "<li><strong>Port:</strong> Versuchen Sie 587 (STARTTLS) oder 465 (SSL)</li>\n";
    echo "</ol>\n";
}

echo "<hr>\n";
echo "<p><small>Test abgeschlossen: " . date('Y-m-d H:i:s') . "</small></p>\n";
echo "<p><strong>WICHTIG:</strong> Löschen Sie diese Datei nach dem Test aus Sicherheitsgründen!</p>\n";
echo "</body></html>\n";
