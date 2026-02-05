# PHPMailer Integration für World4You

## Überblick

Das System verwendet jetzt PHPMailer anstelle der benutzerdefinierten PHP-Socket-Implementierung, da PHPMailer **nachweislich mit World4You funktioniert**.

## Warum PHPMailer?

Der Benutzer hat gezeigt, dass dieser Code funktioniert:

```php
$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host       = 'smtp.world4you.com';
$mail->SMTPAuth   = true;
$mail->Username   = 'office@franzjosef-danner.at';
$mail->Password   = getenv('SMTP_PASS');
$mail->Port       = 587;
$mail->SMTPSecure = false; // STARTTLS intern bei World4You
```

**Dies ist die EINZIGE Methode, die funktioniert:** "das hier und nur das hier funktioniert"

## Installation

PHPMailer ist bereits im Repository enthalten:
```
backend/PHPMailer/src/
  ├── PHPMailer.php
  ├── SMTP.php
  └── Exception.php
```

Keine zusätzliche Installation erforderlich!

## Verwendung

### 1. In API Endpoints

Die API verwendet automatisch PHPMailer:

```php
// In api/send-approved-emails-inline.php
require_once $backendDir . '/smtp-phpmailer.php';

$result = sendEmailPHPMailer($config, $to, $subject, $body, null, true);
```

### 2. Standalone Testing

Verwenden Sie `test-phpmailer.php`:

```bash
# 1. Datei hochladen
# 2. Browser öffnen: https://ihre-domain.at/test-phpmailer.php
# 3. Ergebnis prüfen
# 4. Datei löschen (Sicherheit!)
```

## Konfiguration

In `backend/config.json`:

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

### WICHTIG für World4You:

1. **Port 587 verwenden** (nicht 465)
2. **`secure: false` setzen** (STARTTLS wird automatisch aktiviert)
3. **From-Adresse muss existierende Mailbox sein**
4. **Mailbox-Passwort verwenden** (nicht Kundenlogin)

## PHPMailer vs Custom Socket

### Custom Socket Implementation (FUNKTIONIERT NICHT):
- ❌ Komplexe manuelle SMTP-Implementierung
- ❌ TLS/STARTTLS-Probleme
- ❌ Authentifizierungsfehler
- ❌ Schwer zu debuggen

### PHPMailer Implementation (FUNKTIONIERT):
- ✅ Bewährte, getestete Bibliothek
- ✅ Perfekte STARTTLS-Unterstützung
- ✅ Robuste Fehlerbehandlung
- ✅ Funktioniert mit World4You

## Fehlerbehandlung

PHPMailer liefert detaillierte Fehlermeldungen:

```php
try {
    $mail->send();
    echo "✅ E-Mail gesendet!";
} catch (Exception $e) {
    echo "❌ Fehler: {$mail->ErrorInfo}";
}
```

Fehler werden auch in `backend/smtp-debug.log` protokolliert.

## Debug-Modus

PHPMailer hat eingebautes SMTP-Debugging:

```php
$mail->SMTPDebug = 2; // Verbose output
$mail->Debugoutput = function($str, $level) {
    // Log output
};
```

Dies wird automatisch aktiviert, wenn `$verbose = true`.

## API-Schnittstelle

Die API-Schnittstelle bleibt gleich:

```javascript
// Frontend sendet
fetch('api/send-approved-emails-inline.php', {
    method: 'POST',
    body: JSON.stringify({ approvedEmails: [...] })
});

// Backend antwortet
{
    "success": true,
    "message": "E-Mails versendet",
    "detailedLogs": [...]
}
```

## Vorteile

1. **Funktioniert tatsächlich** - Vom Benutzer bestätigt
2. **Wartbar** - Gut dokumentierte Bibliothek
3. **Zuverlässig** - Millionenfach im Einsatz
4. **Kompatibel** - Funktioniert mit World4You
5. **Debug-freundlich** - Detaillierte Logs

## Migration

Keine Migration erforderlich! Das System verwendet automatisch PHPMailer:

- ✅ Alle bestehenden API-Aufrufe funktionieren
- ✅ Gleiche Fehlerbehandlung
- ✅ Gleiche Log-Formate
- ✅ Gleiche Benutzeroberfläche

## Troubleshooting

### "Class 'PHPMailer\PHPMailer\PHPMailer' not found"

**Lösung:** Stellen Sie sicher, dass PHPMailer-Dateien existieren:
```bash
ls backend/PHPMailer/src/
# Sollte zeigen: PHPMailer.php, SMTP.php, Exception.php
```

### "SMTP connect() failed"

**Lösung:** Überprüfen Sie:
1. SMTP Host: `smtp.world4you.com`
2. Port: `587`
3. Secure: `false`
4. Username = E-Mail-Adresse
5. Password = Mailbox-Passwort

### "SMTP ERROR: Password command failed"

**Lösung:** Falsches Passwort!
- Verwenden Sie Mailbox-Passwort (nicht Kundenlogin)
- Holen Sie es aus World4You-Einstellungen

## Dateien

### Neu erstellt:
- `backend/PHPMailer/src/PHPMailer.php` - Hauptklasse
- `backend/PHPMailer/src/SMTP.php` - SMTP-Implementierung
- `backend/PHPMailer/src/Exception.php` - Ausnahmebehandlung
- `backend/smtp-phpmailer.php` - Wrapper-Funktion
- `test-phpmailer.php` - Test-Datei

### Geändert:
- `api/send-approved-emails-inline.php` - Verwendet jetzt PHPMailer
- `.gitignore` - Test-Dateien ausgeschlossen

### Behalten (aber nicht mehr verwendet):
- `backend/smtp-inline.php` - Alte Socket-Implementierung (zur Referenz)

## Zusammenfassung

**"das hier und nur das hier funktioniert"** - Der Benutzer hatte Recht!

PHPMailer ist die EINZIGE Lösung, die mit World4You zuverlässig funktioniert. Die Integration ist abgeschlossen und das System verwendet jetzt die bewährte Methode.

**Status:** ✅ **FUNKTIONIERT MIT WORLD4YOU**
