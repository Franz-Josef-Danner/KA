# World4You Hosting - Kompletter Einrichtungs-Guide

## ⚠️ KRITISCH: World4You Shared Hosting und E-Mail-Versand

**Wenn E-Mails nicht ankommen, obwohl das System "Erfolg" meldet:**

### Das Problem
Auf World4You Shared Hosting sind **exec(), shell_exec(), system()** standardmäßig **DEAKTIVIERT**.

Das bedeutet:
- ❌ PHP kann keine externen Prozesse starten
- ❌ `exec("php backend/php-email-sender.php")` wird ignoriert
- ❌ Keine Fehlermeldung, keine Exception
- ❌ UI zeigt "Erfolg" aber nichts passiert
- ❌ **Silent Failure** - E-Mails werden NIE versendet

### Die Lösung: PHPMailer mit Inline SMTP

**✅ Das System verwendet jetzt PHPMailer mit direktem SMTP-Versand:**

```php
// FUNKTIONIERT auf World4You:
require_once 'backend/smtp-phpmailer.php';
$result = sendEmailPHPMailer($config, $to, $subject, $body, null, true);
// ↑ Alles im selben PHP-Prozess, keine exec() Aufrufe!
```

**Vorteile:**
- ✅ Funktioniert auf World4You Shared Hosting
- ✅ Keine Silent Failures mehr
- ✅ Sofortiges Feedback
- ✅ Detaillierte Logs

Siehe auch: [PHPMAILER_INTEGRATION.md](PHPMAILER_INTEGRATION.md)

---

## Node.js und Nodemailer auf World4You

### Problem
Sie sehen im Dashboard:
- ❌ Node.js: Nicht verfügbar
- ❌ Nodemailer: Fehlt

### Wichtig zu wissen über World4You Hosting

World4You bietet verschiedene Hosting-Pakete an:

### 1. **Shared Hosting / Webhosting Pakete** ❌
- **Node.js NICHT verfügbar**
- Nur PHP, HTML, CSS, JavaScript (Browser-seitig)
- Keine Shell/SSH-Zugriff
- Keine Möglichkeit, Node.js zu installieren

### 2. **VPS (Virtual Private Server)** ✅
- **Node.js kann installiert werden**
- Voller Root-Zugriff
- SSH-Zugang verfügbar
- Vollständige Kontrolle über Server

### 3. **Managed Server** ✅
- **Node.js kann installiert werden**
- Eingeschränkter Zugriff, aber Node.js-Support möglich
- Abhängig vom Paket

## So prüfen Sie Ihr Hosting-Paket

### Schritt 1: Login in World4You Kundenbereich
1. Gehen Sie zu https://www.world4you.com/
2. Melden Sie sich an
3. Wählen Sie Ihr Webhosting-Paket

### Schritt 2: Prüfen Sie die Paket-Details
Suchen Sie nach:
- "SSH-Zugang" oder "Shell-Zugang"
- "VPS" oder "Virtual Server"
- "Root-Zugang"
- "Node.js Support"

## Lösungen je nach Hosting-Typ

---

## Lösung 1: Sie haben Shared Hosting (Standard Webhosting)

### ❌ Node.js Installation NICHT möglich

Bei Standard Webhosting-Paketen können Sie Node.js nicht installieren.

### ✅ Alternative Lösungen:

#### Option A: Upgrade auf VPS
**Empfohlen für volle Funktionalität**

1. Kontaktieren Sie World4You Support
2. Fragen Sie nach VPS-Upgrade
3. VPS-Pakete beginnen ab ca. €10-15/Monat
4. Danach können Sie Node.js installieren (siehe unten)

**Vorteile:**
- Volle Kontrolle
- Node.js + alle Module
- Bessere Performance

#### Option B: PHP-basierter E-Mail-Versand mit PHPMailer
**✅ EMPFOHLEN: Funktioniert auf World4You Shared Hosting**

Das System verwendet jetzt PHPMailer für den E-Mail-Versand. Diese Lösung:
- ✅ Funktioniert auf World4You ohne Node.js
- ✅ Keine exec() Aufrufe (vermeidet Silent Failures)
- ✅ Bewährte, robuste Bibliothek
- ✅ Automatisch integriert im Dashboard

**Setup:**
1. PHPMailer ist bereits im Verzeichnis `backend/PHPMailer/` enthalten
2. Konfigurieren Sie `backend/config.json`:
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

**World4You spezifische Anforderungen:**
- ✅ Port **587** (nicht 465)
- ✅ `"secure": false` (STARTTLS wird automatisch aktiviert)
- ✅ From-Adresse = existierende Mailbox (World4You Anforderung!)
- ✅ Mailbox-Passwort (nicht Kundenlogin!)

**Verwendung:**
Das Dashboard sendet E-Mails automatisch über PHPMailer. Keine weitere Aktion erforderlich!

Siehe: [PHPMAILER_INTEGRATION.md](PHPMAILER_INTEGRATION.md) für Details.

#### Option B-Alt: Einfaches PHP mail()
**Nur als Fallback - PHPMailer ist besser**

Sie können E-Mails direkt mit PHP versenden, ohne Node.js:

**Erstellen Sie:** `backend/php-email-sender.php`

```php
<?php
/**
 * PHP E-Mail Sender (Alternative zu Node.js)
 * Für Shared Hosting ohne Node.js
 */

// Queue-Datei laden
$queueFile = __DIR__ . '/email-queue.json';

if (!file_exists($queueFile)) {
    die("Keine E-Mails in der Warteschlange.\n");
}

$queue = json_decode(file_get_contents($queueFile), true);
if (empty($queue)) {
    die("Warteschlange ist leer.\n");
}

$sent = 0;
$failed = 0;

foreach ($queue as $key => $email) {
    if ($email['status'] !== 'pending' && $email['status'] !== 'approved') {
        continue;
    }
    
    $to = $email['recipientEmail'] ?? 'office@franzjosef-danner.at';
    $subject = $email['subject'] ?? 'Benachrichtigung';
    $message = $email['body'] ?? '';
    
    // E-Mail-Header
    $headers = "From: KA System <office@franzjosef-danner.at>\r\n";
    $headers .= "Reply-To: office@franzjosef-danner.at\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    // E-Mail senden
    if (mail($to, $subject, $message, $headers)) {
        $queue[$key]['status'] = 'sent';
        $queue[$key]['sentAt'] = date('c');
        $sent++;
        echo "✅ E-Mail gesendet an: $to\n";
    } else {
        $queue[$key]['status'] = 'failed';
        $queue[$key]['error'] = 'PHP mail() function failed';
        $failed++;
        echo "❌ Fehler beim Senden an: $to\n";
    }
}

// Queue speichern
file_put_contents($queueFile, json_encode($queue, JSON_PRETTY_PRINT));

echo "\n📊 Zusammenfassung:\n";
echo "   ✅ Gesendet: $sent\n";
echo "   ❌ Fehlgeschlagen: $failed\n";
?>
```

**Verwendung:**
```bash
# Manuell ausführen via Browser
php backend/php-email-sender.php
```

**Nachteile dieser Methode:**
- Weniger Kontrolle über E-Mail-Formatierung
- Kann als Spam markiert werden
- Keine erweiterten SMTP-Features
- Abhängig von Server-Konfiguration

#### Option C: Externen E-Mail-Service nutzen
**Am einfachsten für Shared Hosting**

Services wie SendGrid, Mailgun, oder Amazon SES:

1. Kostenloses Kontingent verfügbar (oft 100-200 E-Mails/Tag)
2. Keine Server-Installation nötig
3. Bessere Zustellbarkeit
4. Einfache PHP-Integration

**Beispiel mit SendGrid:**
```php
// In Ihrer PHP-Datei
$apiKey = 'IHR_SENDGRID_API_KEY';
$from = 'office@franzjosef-danner.at';
$to = 'empfaenger@example.com';
$subject = 'Betreff';
$body = 'Nachricht';

$data = [
    'personalizations' => [[
        'to' => [['email' => $to]],
        'subject' => $subject
    ]],
    'from' => ['email' => $from],
    'content' => [[
        'type' => 'text/plain',
        'value' => $body
    ]]
];

$ch = curl_init('https://api.sendgrid.com/v3/mail/send');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);
```

---

## Lösung 2: Sie haben VPS oder Managed Server

### ✅ Node.js kann installiert werden!

#### Schritt 1: SSH-Verbindung herstellen

```bash
# Verbinden Sie sich mit Ihrem Server
ssh benutzername@ihr-server.world4you.com
```

**SSH-Zugangsdaten finden:**
1. World4You Kundenbereich
2. Ihr VPS/Server auswählen
3. SSH-Zugangsdaten anzeigen

#### Schritt 2: Node.js installieren

**Für Ubuntu/Debian (häufigste World4You VPS-Option):**

```bash
# System aktualisieren
sudo apt update
sudo apt upgrade -y

# Node.js Repository hinzufügen (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js installieren
sudo apt install -y nodejs

# Prüfen
node --version  # Sollte v20.x.x anzeigen
npm --version   # Sollte 10.x.x anzeigen
```

**Für CentOS/RHEL:**

```bash
# System aktualisieren
sudo yum update -y

# Node.js Repository hinzufügen
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# Node.js installieren
sudo yum install -y nodejs

# Prüfen
node --version
npm --version
```

#### Schritt 3: KA System hochladen

```bash
# Via SFTP oder SCP hochladen
# Oder via Git:
cd /var/www/html  # Oder Ihr Webroot
git clone https://github.com/Franz-Josef-Danner/KA.git
cd KA
```

#### Schritt 4: Backend einrichten

```bash
# Zum Backend-Verzeichnis wechseln
cd backend

# Dependencies installieren
npm install

# Konfiguration erstellen
cp config.example.json config.json

# Config bearbeiten (mit nano oder vim)
nano config.json
```

**config.json ausfüllen:**
```json
{
  "email": "office@franzjosef-danner.at",
  "password": "IHR_EMAIL_PASSWORT",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.franzjosef-danner.at",
    "port": 587,
    "secure": false
  }
}
```

#### Schritt 5: Testen

```bash
# Test-Lauf
node email-sender.js
```

Erwartete Ausgabe:
```
🚀 Starting email queue processor...
⏰ Time: ...
📭 Queue is empty. Nothing to send.
✨ Done!
```

#### Schritt 6: Firewall-Einstellungen (falls nötig)

```bash
# Ports für SMTP öffnen
sudo ufw allow 587/tcp  # STARTTLS
sudo ufw allow 465/tcp  # SSL/TLS
```

---

## Häufige Probleme und Lösungen

### Problem: "Permission denied" beim npm install

**Lösung:**
```bash
# npm-Rechte korrigieren
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Oder mit sudo installieren
cd backend
sudo npm install
```

### Problem: "node: command not found"

**Lösung:**
```bash
# Node.js-Pfad finden
which node

# Falls nicht gefunden, neu installieren (siehe oben)
# Oder PATH aktualisieren:
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc
```

### Problem: E-Mails werden nicht versendet

**Lösung 1: SMTP-Credentials prüfen**
```bash
cd backend
cat config.json  # Überprüfen Sie die Einstellungen
```

**Lösung 2: Manueller Test**
```bash
node email-sender.js
# Lesen Sie die Fehlermeldungen
```

**Lösung 3: Port 587 Firewall**
```bash
# Testen Sie die Verbindung
telnet smtp.franzjosef-danner.at 587

# Falls Timeout, Firewall prüfen
sudo ufw status
```

---

## Empfehlung für World4You Kunden

### Wenn Sie Standard Webhosting haben:
✅ **Empfehlung:** Upgrade auf World4You VPS
- VPS M: ca. €12/Monat
- Voller Node.js Support
- Bessere Performance
- Mehr Kontrolle

**Alternativ:**
- PHP-basierte E-Mail-Lösung (siehe oben)
- Externer E-Mail-Service (SendGrid, etc.)

### Wenn Sie VPS haben:
✅ **Perfekt!** Folgen Sie "Lösung 2" oben

---

## Zusammenfassung

| Hosting-Typ | Node.js möglich? | Lösung |
|------------|------------------|---------|
| Webhosting Basic/Standard | ❌ Nein | PHP-Alternative oder VPS-Upgrade |
| Webhosting Premium | ❌ Meist nein | PHP-Alternative oder VPS-Upgrade |
| VPS / Virtual Server | ✅ Ja | Node.js installieren (siehe Anleitung) |
| Managed Server | ✅ Ja | Node.js installieren oder Support fragen |

---

## Support und Hilfe

### World4You Support kontaktieren
- **Telefon:** +43 (0)662 / 45 27 27
- **E-Mail:** support@world4you.com
- **Support-Portal:** https://support.world4you.com/

**Fragen Sie:**
- "Habe ich SSH-Zugang zu meinem Hosting-Paket?"
- "Kann ich Node.js auf meinem Server installieren?"
- "Welches Paket benötige ich für Node.js?"

### Weitere Hilfe
- **Dokumentation im Projekt:**
  - `EMAIL_SETUP_ANLEITUNG.md` - Allgemeine Setup-Anleitung
  - `backend/README.md` - Backend-Dokumentation
  - `EMAIL_SCHNELL_REFERENZ.md` - Schnell-Referenz

---

## Schnell-Checkliste

- [ ] Hosting-Typ prüfen (Shared/VPS?)
- [ ] SSH-Zugang testen
- [ ] Entscheidung: Upgrade, PHP-Alternative, oder Node.js installieren?
- [ ] Bei VPS: Node.js installieren (siehe Anleitung)
- [ ] Dependencies installieren: `npm install`
- [ ] Config erstellen und ausfüllen
- [ ] Testen: `node email-sender.js`
- [ ] Dashboard überprüfen → Backend-Status sollte grün sein ✅
