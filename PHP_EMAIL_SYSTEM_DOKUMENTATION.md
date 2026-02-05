# PHP-basiertes E-Mail-System - Vollständige Dokumentation

## Problem gelöst

**User-Anforderung:** "Node.js ist grundsätzlich nicht möglich, aber über PHP ist es möglich, darum muss es so eingerichtet werden."

**Lösung:** Das gesamte E-Mail-System wurde von Node.js auf PHP umgestellt und funktioniert jetzt auf jedem Shared Hosting ohne Node.js.

---

## Was wurde geändert

### 1. PHP E-Mail-Sender erstellt (`backend/php-email-sender.php`)

**12KB vollständige SMTP-Implementation in reinem PHP:**

✅ **Keine Abhängigkeiten**
- Kein Node.js erforderlich
- Kein npm install erforderlich
- Keine node_modules (spart 100+ MB)
- Funktioniert auf jedem Hosting mit PHP

✅ **Vollständige SMTP-Unterstützung**
- SMTP über PHP Sockets
- STARTTLS (Port 587)
- SSL/TLS (Port 465)
- AUTH LOGIN Authentifizierung
- Alle gängigen E-Mail-Provider

✅ **Features**
- Liest E-Mails aus Warteschlange
- Sendet via SMTP
- Markiert E-Mails als gesendet/fehlgeschlagen
- Detaillierte Fehlermeldungen
- CLI- und API-Modus
- JSON-Ausgabe

**Verwendung:**
```bash
# Manuell ausführen
php backend/php-email-sender.php

# Via Cronjob (alle 5 Minuten)
# */5 * * * * cd /pfad/zu/KA/backend && php php-email-sender.php >> /var/log/ka-email.log 2>&1
```

### 2. API-Endpunkt aktualisiert (`api/send-approved-emails.php`)

**Komplett umgeschrieben für PHP:**

Vorher:
```php
// Check if Node.js is available
exec('node --version 2>&1', $nodeCheck, $nodeCheckCode);
if ($nodeCheckCode !== 0) {
    // Error: Node.js not available
}

// Check if nodemailer is installed
$nodeModulesCheck = $backendDir . '/node_modules/nodemailer';
if (!is_dir($nodeModulesCheck)) {
    // Error: nodemailer missing
}

// Run Node.js email sender
$command = "cd backend && node email-sender.js";
exec($command, $output, $returnCode);
```

Nachher:
```php
// Use PHP email sender (works on shared hosting)
$phpEmailSender = $backendDir . '/php-email-sender.php';

// Execute PHP email sender
$command = "php " . escapeshellarg($phpEmailSender) . " 2>&1";
exec($command, $output, $returnCode);

// Parse JSON response
$jsonResponse = json_decode($outputText, true);
if ($jsonResponse && isset($jsonResponse['success'])) {
    // Handle success/failure
}
```

### 3. Backend Status API (`api/backend-status.php`)

**Status-Felder geändert:**

Vorher:
```json
{
  "configured": false,
  "nodeJsAvailable": false,
  "nodemailerInstalled": false,
  "ready": false
}
```

Nachher:
```json
{
  "configured": true,
  "phpAvailable": true,
  "phpEmailSenderExists": true,
  "phpVersion": "8.3.6",
  "ready": true
}
```

**Setup-Anweisungen:**
```json
{
  "setupInstructions": {
    "steps": [
      {
        "number": 1,
        "title": "Konfigurationsdatei erstellen",
        "command": "cd backend && cp config.example.json config.json"
      },
      {
        "number": 2,
        "title": "SMTP-Zugangsdaten eintragen"
      },
      {
        "number": 3,
        "title": "Testen",
        "command": "php backend/php-email-sender.php"
      }
    ]
  }
}
```

### 4. Frontend Widget (`js/modules/backend-status.js`)

**Status-Anzeige aktualisiert:**

```
✅ Konfiguration (Vorhanden)
✅ PHP (8.3.6)
✅ E-Mail Sender (Vorhanden)
📭 Warteschlange (0 wartend)
```

Alte Node.js/Nodemailer-Statusfelder werden als "veraltet" markiert, falls vorhanden.

---

## Technische Details

### PHP SMTP-Implementation

```php
function sendEmailSMTP($config, $to, $subject, $body) {
    // 1. Verbindung zum SMTP-Server
    if ($secure && $port == 465) {
        $socket = fsockopen('ssl://' . $host, $port);
    } else {
        $socket = fsockopen($host, $port);
    }
    
    // 2. STARTTLS für Port 587
    if (!$secure && $port == 587) {
        fputs($socket, "STARTTLS\r\n");
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
    }
    
    // 3. Authentifizierung (AUTH LOGIN)
    fputs($socket, "AUTH LOGIN\r\n");
    fputs($socket, base64_encode($username) . "\r\n");
    fputs($socket, base64_encode($password) . "\r\n");
    
    // 4. E-Mail senden
    fputs($socket, "MAIL FROM: <$from>\r\n");
    fputs($socket, "RCPT TO: <$to>\r\n");
    fputs($socket, "DATA\r\n");
    fputs($socket, $headers . "\r\n" . $body . "\r\n.\r\n");
    
    // 5. Verbindung schließen
    fputs($socket, "QUIT\r\n");
    fclose($socket);
}
```

### E-Mail-Templates

```php
$templates = [
    'newCustomer' => [
        'subject' => 'Neuer Kunde erstellt',
        'body' => "Neuer Kunde: {customerName}\nE-Mail: {customerEmail}"
    ],
    'newOrder' => [
        'subject' => 'Neuer Auftrag',
        'body' => "Auftrag {orderNumber}\nKunde: {customerName}"
    ],
    'newInvoice' => [
        'subject' => 'Neue Rechnung',
        'body' => "Rechnung {invoiceNumber}\nBetrag: {totalAmount}"
    ],
    'paymentReceived' => [
        'subject' => 'Zahlungseingang',
        'body' => "Zahlung erhalten\nRechnung: {invoiceNumber}"
    ]
];
```

---

## Konfiguration

### config.json (wie vorher)

```json
{
  "email": "office@franzjosef-danner.at",
  "password": "IHR_PASSWORT",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.franzjosef-danner.at",
    "port": 587,
    "secure": false
  }
}
```

**Unterstützte SMTP-Provider:**
- World4You
- Gmail (mit App-Passwort)
- GMX
- Web.de
- Outlook/Hotmail
- Alle SMTP-Server

### SMTP-Ports

- **587** - STARTTLS (empfohlen)
- **465** - SSL/TLS
- **25** - Unverschlüsselt (nicht empfohlen)

---

## Einrichtung (3 Schritte)

### Schritt 1: Konfiguration erstellen

```bash
cd backend
cp config.example.json config.json
```

### Schritt 2: SMTP-Daten eintragen

Öffnen Sie `backend/config.json` und tragen Sie ein:
- E-Mail-Adresse
- Passwort
- SMTP-Host
- SMTP-Port

### Schritt 3: Testen

```bash
php backend/php-email-sender.php
```

Erwartete Ausgabe:
```
🚀 Starting PHP email queue processor...
⏰ Time: 05.02.2026, 15:45:00
📭 Queue is empty. Nothing to send.
✨ Done!
```

---

## Verwendung

### Im Dashboard

1. Öffnen Sie das Dashboard
2. Genehmigen Sie E-Mails (✓ Genehmigen)
3. Klicken Sie "📤 X E-Mail senden"
4. E-Mails werden sofort versendet!

### Manuell

```bash
php backend/php-email-sender.php
```

### Cronjob (automatisch)

**Crontab:**
```bash
crontab -e
# Fügen Sie hinzu:
# */5 * * * * cd /pfad/zu/KA/backend && php php-email-sender.php >> /var/log/ka-email.log 2>&1
```

**World4You Admin-Panel:**
1. Login → Cronjobs
2. Neuer Cronjob
3. Befehl: `php /pfad/zu/KA/backend/php-email-sender.php`
4. Intervall: Alle 5 Minuten

---

## Fehlerbehebung

### Problem: "Configuration file not found"

**Lösung:**
```bash
cd backend
cp config.example.json config.json
# Bearbeiten Sie config.json
```

### Problem: "authentication failed"

**Ursache:** E-Mail-Adresse oder Passwort falsch

**Lösung:**
1. Überprüfen Sie `backend/config.json`
2. E-Mail-Adresse korrekt?
3. Passwort korrekt?
4. Bei Gmail: App-Passwort verwenden!

### Problem: "Could not connect to SMTP server"

**Ursache:** SMTP-Host oder Port falsch

**Lösung:**
1. Überprüfen Sie SMTP-Host
2. Versuchen Sie verschiedene Ports (587, 465)
3. Prüfen Sie Firewall-Einstellungen

### Problem: E-Mails kommen nicht an

**Checkliste:**
1. ✅ Config erstellt?
2. ✅ SMTP-Daten korrekt?
3. ✅ Test ausgeführt?
4. ✅ Fehler in der Ausgabe?
5. ✅ Spam-Ordner geprüft?

**Test-Befehl:**
```bash
php backend/php-email-sender.php
```

---

## Migration von Node.js

### Was bleibt gleich

✅ `backend/config.json` - gleiches Format  
✅ `backend/email-queue.json` - gleiches format  
✅ Dashboard UI - keine Änderungen  
✅ API-Endpunkte - gleiche URLs  

### Was ist neu

📝 `backend/php-email-sender.php` - PHP statt Node.js  
🗑️ Node.js nicht mehr benötigt  
🗑️ `npm install` nicht mehr benötigt  
🗑️ `node_modules/` nicht mehr benötigt  

### Alte Dateien (können gelöscht werden)

- `backend/email-sender.js` (nicht mehr verwendet)
- `backend/package.json` (nicht mehr benötigt)
- `backend/package-lock.json` (nicht mehr benötigt)
- `backend/node_modules/` (nicht mehr benötigt)

---

## Vorteile der PHP-Lösung

### Für Shared Hosting

✅ **Funktioniert sofort** - PHP ist immer verfügbar  
✅ **Keine Installation** - Kein Node.js, kein npm  
✅ **Kleiner Footprint** - Keine node_modules (100+ MB)  
✅ **Einfaches Deployment** - PHP-Dateien hochladen

### Für Entwicklung

✅ **Weniger Abhängigkeiten** - Nur PHP  
✅ **Schnelleres Setup** - Keine npm install  
✅ **Einfacher zu debuggen** - Reines PHP  
✅ **Portabler** - Läuft überall mit PHP  

### Für Benutzer

✅ **Keine Fehlermeldungen** - "Node.js nicht verfügbar"  
✅ **Funktioniert sofort** - Nach Konfiguration  
✅ **Einfacher** - Weniger Setup-Schritte  
✅ **Zuverlässiger** - Keine Node.js-Abhängigkeit  

---

## Zusammenfassung

### Vorher (Node.js)

```
❌ Node.js erforderlich
❌ npm install erforderlich
❌ node_modules (100+ MB)
❌ Funktioniert nur auf VPS
❌ Komplex einzurichten
```

### Nachher (PHP)

```
✅ Nur PHP erforderlich
✅ Kein npm install
✅ Keine node_modules
✅ Funktioniert auf Shared Hosting
✅ Einfach einzurichten
```

---

## Support

### Dokumentation

- `EMAIL_SETUP_ANLEITUNG.md` - Setup-Anleitung
- `EMAIL_SCHNELL_REFERENZ.md` - Schnell-Referenz
- `WORLD4YOU_INSTALLATION.md` - World4You-spezifisch
- `backend/README.md` - Backend-Dokumentation

### Bei Problemen

1. Lesen Sie die Dokumentation
2. Prüfen Sie `backend/config.json`
3. Testen Sie: `php backend/php-email-sender.php`
4. Prüfen Sie Fehlermeldungen

---

## Fazit

✅ **System ist jetzt vollständig PHP-basiert**  
✅ **Funktioniert auf jedem Shared Hosting**  
✅ **Keine Node.js-Abhängigkeit mehr**  
✅ **Einfacher zu installieren und zu warten**  
✅ **Gleiche Funktionalität wie vorher**  

**Das E-Mail-System ist produktionsbereit für Shared Hosting! 🎉**
