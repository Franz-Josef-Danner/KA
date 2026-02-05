# Quick Start: PHPMailer Integration

## ✅ Was wurde implementiert

Ihr PHPMailer-Code ("das hier und nur das hier funktioniert") ist jetzt die Basis des E-Mail-Systems!

## 🚀 Sofort loslegen

### 1. Test-Datei erstellen

Erstellen Sie `test-phpmailer.php` im Hauptverzeichnis:

```php
<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/backend/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/backend/PHPMailer/src/SMTP.php';
require __DIR__ . '/backend/PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;

// Load configuration
$configFile = __DIR__ . '/backend/config.json';
if (!file_exists($configFile)) {
    die("❌ ERROR: backend/config.json not found!");
}

$config = json_decode(file_get_contents($configFile), true);

$mail = new PHPMailer(true);

try {
    $mail->SMTPDebug = 2;
    $mail->Debugoutput = 'html';
    
    $mail->isSMTP();
    $mail->Host       = $config['smtp']['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['email'];
    $mail->Password   = $config['password'];
    $mail->Port       = isset($config['smtp']['port']) ? $config['smtp']['port'] : 587;
    $mail->SMTPSecure = false; // STARTTLS intern bei World4You
    $mail->SMTPAutoTLS = true;
    
    $mail->setFrom($config['email'], isset($config['fromName']) ? $config['fromName'] : 'SMTP Test');
    $mail->addAddress('deine.private@gmail.com'); // ← ÄNDERN SIE DIES!
    
    $mail->isHTML(false);
    $mail->Subject = 'PHPMailer SMTP Test';
    $mail->Body    = 'Wenn Sie diese E-Mail erhalten, funktioniert PHPMailer perfekt!';
    
    $mail->send();
    
    echo "\n\n<div style='background:#d4edda;color:#155724;padding:20px;margin:20px;border:2px solid #28a745;'>";
    echo "<h2>✅ MAIL OK</h2>";
    echo "<p>E-Mail wurde erfolgreich versendet!</p>";
    echo "</div>";
    
} catch (Exception $e) {
    echo "\n\n<div style='background:#f8d7da;color:#721c24;padding:20px;margin:20px;border:2px solid #dc3545;'>";
    echo "<h2>❌ FEHLER</h2>";
    echo "<p>PHPMailer Error: {$mail->ErrorInfo}</p>";
    echo "<p>Exception: {$e->getMessage()}</p>";
    echo "</div>";
}
```

### 2. Testen

```
1. test-phpmailer.php hochladen
2. Browser öffnen: https://franzjosef-danner.at/test-phpmailer.php
3. Ergebnis prüfen:
   ✅ "MAIL OK" → PHPMailer funktioniert!
   ❌ Fehler → Konfiguration prüfen
4. Datei LÖSCHEN (Sicherheit!)
```

### 3. Dashboard verwenden

```
1. dashboard.html öffnen
2. E-Mail-Warteschlange
3. E-Mail genehmigen
4. "📤 Senden" klicken
5. Sollte jetzt funktionieren!
```

## ⚙️ Konfiguration

`backend/config.json`:

```json
{
  "email": "office@franzjosef-danner.at",
  "password": "IHR_MAILBOX_PASSWORT",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.world4you.com",
    "port": 587,
    "secure": false
  }
}
```

### ⚠️ WICHTIG für World4You:

- ✅ Port **587** (nicht 465)
- ✅ `"secure": false` (STARTTLS automatisch)
- ✅ From-Adresse = existierende Mailbox
- ✅ Mailbox-Passwort (nicht Kundenlogin!)

## 🔍 Troubleshooting

### "Class 'PHPMailer\PHPMailer\PHPMailer' not found"

**Lösung:** PHPMailer-Dateien fehlen
```bash
ls backend/PHPMailer/src/
# Sollte zeigen: PHPMailer.php, SMTP.php, Exception.php
```

### "SMTP connect() failed"

**Lösung:** Konfiguration prüfen
- SMTP Host: `smtp.world4you.com`
- Port: `587`
- Secure: `false`

### "SMTP ERROR: Password command failed"

**Lösung:** Falsches Passwort
- Mailbox-Passwort verwenden (nicht Kundenlogin)
- Aus World4You-Einstellungen holen

### "Authentication failed"

**Lösung:** Username prüfen
- Username = vollständige E-Mail-Adresse
- z.B. `office@franzjosef-danner.at`

## 📋 Logs ansehen

### Via FTP:
```
backend/smtp-debug.log
```

### Inhalt:
```
[2026-02-05T20:14:00+00:00]
Array
(
    [success] => 1
    [to] => kunde@example.com
    [log] => Array
        (
            [0] => 📧 Attempting to send email with PHPMailer...
            [1] => ✅ Email sent successfully via PHPMailer!
        )
)
```

## 📖 Weitere Dokumentation

- `PHPMAILER_INTEGRATION.md` - Vollständige technische Dokumentation
- `README.md` - Allgemeine Projektdokumentation
- `backend/config.example.json` - Konfigurationsbeispiel

## ✅ Zusammenfassung

1. ✅ PHPMailer ist integriert
2. ✅ Basiert auf Ihrem funktionierenden Code
3. ✅ Verwendet `SMTPSecure = false` für STARTTLS
4. ✅ Funktioniert mit World4You
5. ✅ Dashboard sendet über PHPMailer

**Ihr Code der funktioniert ist jetzt die Basis! 🎉**
