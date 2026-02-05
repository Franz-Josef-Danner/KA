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
$testRecipient = 'office@franzjosef-danner.at'; // CHANGE THIS TO YOUR EMAIL!

// Check if placeholder email is still being used
if ($testRecipient === 'office@franzjosef-danner.at' || strpos($testRecipient, 'IHRE_EMAIL') !== false) {
    echo "<!DOCTYPE html>\n";
    echo "<html><head><title>SMTP Test - Konfiguration erforderlich</title>";
    echo "<style>body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; } ";
    echo ".error { background: #fff; border: 3px solid #e74c3c; border-radius: 8px; padding: 30px; max-width: 700px; margin: 0 auto; } ";
    echo "h1 { color: #e74c3c; } code { background: #f0f0f0; padding: 3px 8px; border-radius: 3px; font-family: monospace; } ";
    echo ".highlight { background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }</style>";
    echo "</head><body>";
    echo "<div class='error'>";
    echo "<h1>⚠️ Bitte E-Mail-Adresse ändern!</h1>";
    echo "<p><strong>Sie verwenden noch die Platzhalter-E-Mail-Adresse!</strong></p>";
    echo "<div class='highlight'>";
    echo "<p><strong>Aktuelle Adresse:</strong> <code>" . htmlspecialchars($testRecipient) . "</code></p>";
    echo "<p>Diese ist <strong>KEINE echte E-Mail-Adresse</strong> und wird von Gmail abgelehnt!</p>";
    echo "</div>";
    echo "<h2>So beheben Sie das Problem:</h2>";
    echo "<ol>";
    echo "<li>Öffnen Sie die Datei <code>test-mail.php</code> in einem Texteditor</li>";
    echo "<li>Suchen Sie Zeile 12: <code>\$testRecipient = 'office@franzjosef-danner.at';</code></li>";
    echo "<li>Ersetzen Sie <code>office@franzjosef-danner.at</code> mit <strong>Ihrer echten E-Mail-Adresse</strong></li>";
    echo "<li>Speichern Sie die Datei und laden Sie diese Seite neu</li>";
    echo "</ol>";
    echo "<h3>Beispiel:</h3>";
    echo "<pre style='background: #f0f0f0; padding: 15px; border-radius: 5px;'>";
    echo "// Vorher:\n";
    echo "\$testRecipient = 'office@franzjosef-danner.at';\n\n";
    echo "// Nachher:\n";
    echo "\$testRecipient = 'max.mustermann@gmail.com';  // Ihre echte E-Mail!";
    echo "</pre>";
    echo "<p><strong>Tipp:</strong> Nach dem Test sollten Sie diese Datei aus Sicherheitsgründen löschen!</p>";
    echo "</div>";
    echo "</body></html>";
    exit();
}

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

// Enable output buffering and flushing for real-time display
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', 0);
@ini_set('implicit_flush', 1);
@ob_end_clean(); // Clear any existing output buffers
ob_implicit_flush(1);

// Increase timeout for SMTP operations
set_time_limit(120); // Increased to 120 seconds for slow connections

echo "<!DOCTYPE html>\n";
echo "<html><head><title>SMTP Test</title>";
echo "<style>body { font-family: monospace; padding: 20px; max-width: 1200px; margin: 0 auto; } ";
echo "pre { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; } ";
echo ".success { color: green; font-weight: bold; } .error { color: red; font-weight: bold; } ";
echo ".warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }</style>";
echo "</head><body>";
echo "<h1>🧪 World4You SMTP Test</h1>\n";
echo "<p><strong>Empfänger:</strong> " . htmlspecialchars($testRecipient) . "</p>\n";
echo "<p><strong>Konfiguration:</strong> " . htmlspecialchars($config['smtp']['host']) . ":" . (isset($config['smtp']['port']) ? $config['smtp']['port'] : 587) . "</p>\n";

// Validate recipient email
if (!filter_var($testRecipient, FILTER_VALIDATE_EMAIL)) {
    echo "<div class='warning'>";
    echo "<strong>⚠️ Warnung:</strong> Die E-Mail-Adresse sieht ungültig aus: " . htmlspecialchars($testRecipient);
    echo "</div>\n";
}

echo "<hr>\n";
echo "<h2>Test wird ausgeführt...</h2>\n";
echo "<pre>\n";
flush();

// Send test email with verbose logging
try {
    $result = sendEmailSMTPInline($config, $testRecipient, $subject, $body, null, true);
    
    // Display log with real-time flushing
    if (isset($result['log']) && is_array($result['log'])) {
        foreach ($result['log'] as $logLine) {
            echo htmlspecialchars($logLine) . "\n";
            flush();
            @ob_flush(); // Force output buffer flush
        }
    }
} catch (Exception $e) {
    echo "❌ Exception occurred: " . htmlspecialchars($e->getMessage()) . "\n";
    echo "Stack trace:\n" . htmlspecialchars($e->getTraceAsString()) . "\n";
    $result = [
        'success' => false,
        'error' => $e->getMessage(),
        'log' => []
    ];
}

echo "</pre>\n";
echo "<hr>\n";

if ($result['success']) {
    echo "<h2 class='success'>✅ TEST ERFOLGREICH!</h2>\n";
    echo "<p><strong>Die E-Mail wurde erfolgreich an den SMTP-Server übergeben!</strong></p>\n";
    echo "<div style='background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;'>";
    echo "<h3>Was bedeutet das?</h3>";
    echo "<ul>";
    echo "<li>✅ Ihre SMTP-Konfiguration ist korrekt</li>";
    echo "<li>✅ Die Authentifizierung funktioniert</li>";
    echo "<li>✅ Der E-Mail-Versand funktioniert auf Ihrem Hosting</li>";
    echo "</ul>";
    echo "<p><strong>Überprüfen Sie das Postfach:</strong> " . htmlspecialchars($testRecipient) . "</p>";
    echo "<p><strong>Hinweis:</strong> Die E-Mail kann einige Minuten benötigen, um anzukommen. Prüfen Sie auch den Spam-Ordner!</p>";
    echo "</div>";
    
    echo "<div class='warning'>";
    echo "<h3>⚠️ Wichtige Hinweise:</h3>";
    echo "<ul>";
    echo "<li>Wenn die E-Mail <strong>nicht ankommt</strong>, überprüfen Sie den Spam-Ordner</li>";
    echo "<li>Bei Gmail kann es vorkommen, dass E-Mails von unbekannten Servern verzögert oder blockiert werden</li>";
    echo "<li>Eine Bounce-Message (Rückläufer) bedeutet, dass die E-Mail versendet wurde, aber vom Empfänger abgelehnt wurde</li>";
    echo "<li><strong>Tipp:</strong> Testen Sie mit Ihrer eigenen E-Mail-Adresse, die bei Ihrem Hosting existiert (z.B. office@ihre-domain.at)</li>";
    echo "</ul>";
    echo "</div>";
} else {
    echo "<h2 class='error'>❌ TEST FEHLGESCHLAGEN!</h2>\n";
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
@ob_end_flush(); // Final flush
