# E-Mail Diagnose-System Dokumentation

## Problem

**Situation:** Backend zeigt "bereit", E-Mails werden als "erfolgreich versendet" bestätigt, aber E-Mails kommen nie an - und Sie bekommen keine Informationen warum.

**Lösung:** Umfassendes Diagnose-System mit vollständiger SMTP-Protokollierung.

---

## Was wurde implementiert

### 1. Vollständige SMTP-Protokollierung

Das System zeigt jetzt **jeden Schritt** der E-Mail-Versendung:

```
📧 Attempting to send email:
   From: office@beispiel.de
   To: kunde@beispiel.de
   Subject: Neue Rechnung erstellt
   SMTP Host: smtp.beispiel.de:587
   Secure: STARTTLS

🔌 Connecting to SMTP server...
✅ Connected to smtp.beispiel.de:587
Server: 220 smtp.beispiel.de ESMTP

Client: EHLO localhost
Server: 250-smtp.beispiel.de
Server: 250-STARTTLS
Server: 250-AUTH LOGIN PLAIN
Server: 250 HELP

🔒 Starting TLS encryption...
Client: STARTTLS
Server: 220 Ready to start TLS
✅ TLS encryption enabled

🔑 Authenticating...
Client: AUTH LOGIN
Server: 334 VXNlcm5hbWU6
[Username sent]
Server: 334 UGFzc3dvcmQ6
[Password sent]
Server: 235 Authentication successful
✅ Authentication successful

📤 Sending email...
Client: MAIL FROM: <office@beispiel.de>
Server: 250 OK
Client: RCPT TO: <kunde@beispiel.de>
Server: 250 OK
Client: DATA
Server: 354 Start mail input
[Email content]
Client: .
Server: 250 Message accepted
✅ Email sent successfully!
```

---

## Häufige Fehler und deren Diagnose

### 1. Falsches Passwort

**Symptom:**
```
❌ Password authentication failed: 535 Authentication failed
```

**SMTP Log:**
```
🔌 Connecting to SMTP server...
✅ Connected to smtp.beispiel.de:587
🔒 Starting TLS encryption...
✅ TLS encryption enabled
🔑 Authenticating...
Client: AUTH LOGIN
Server: 334 VXNlcm5hbWU6
[Username OK]
Server: 334 UGFzc3dvcmQ6
[Password sent]
Server: 535 5.7.8 Authentication failed
❌ Password authentication failed
```

**Lösung:**
1. Öffnen Sie `backend/config.json`
2. Überprüfen Sie das Passwort
3. **Bei Gmail:** Verwenden Sie ein App-Passwort (nicht Ihr Google-Passwort)
4. **Bei 2FA:** Erstellen Sie ein App-spezifisches Passwort

---

### 2. Falscher SMTP Host

**Symptom:**
```
❌ Could not connect to SMTP server smtp.falsch.de:587 - Connection refused (111)
```

**SMTP Log:**
```
📧 Attempting to send email...
🔌 Connecting to SMTP server...
❌ Connection failed: Connection refused (111)
Details:
  host: smtp.falsch.de
  port: 587
  errno: 111
  errstr: Connection refused
```

**Lösung:**
1. Öffnen Sie `backend/config.json`
2. Überprüfen Sie `smtp.host`
3. Beispiele:
   - Gmail: `smtp.gmail.com`
   - Outlook: `smtp-mail.outlook.com`
   - World4You: `smtp.world4you.com`
   - 1&1: `smtp.1und1.de`

---

### 3. Falscher SMTP Port

**Symptom:**
```
❌ Could not connect to SMTP server smtp.beispiel.de:465 - Connection timed out (110)
```

**SMTP Log:**
```
📧 Attempting to send email...
   SMTP Host: smtp.beispiel.de:465
   Secure: Yes (SSL/TLS)
🔌 Connecting to SMTP server...
❌ Connection failed: Connection timed out (110)
```

**Lösung:**
1. Öffnen Sie `backend/config.json`
2. Versuchen Sie Port 587 statt 465:
```json
{
  "smtp": {
    "host": "smtp.beispiel.de",
    "port": 587,
    "secure": false
  }
}
```

**Port-Übersicht:**
- **Port 587:** STARTTLS (empfohlen)
- **Port 465:** SSL/TLS (veraltet, oft blockiert)
- **Port 25:** Unverschlüsselt (nicht empfohlen)

---

### 4. Ungültige Empfänger-Adresse

**Symptom:**
```
❌ RCPT TO failed: 550 Invalid recipient (Check: falsch@beispiel.de)
```

**SMTP Log:**
```
✅ Authentication successful
📤 Sending email...
Client: MAIL FROM: <office@beispiel.de>
Server: 250 OK
Client: RCPT TO: <falsch@beispiel.de>
Server: 550 5.1.1 Recipient address rejected: User unknown
❌ RCPT TO failed: 550 Invalid recipient (Check: falsch@beispiel.de)
```

**Lösung:**
1. Überprüfen Sie die Empfänger-E-Mail-Adresse
2. Stellen Sie sicher, dass die Adresse existiert
3. Prüfen Sie auf Tippfehler

---

### 5. Firewall blockiert SMTP

**Symptom:**
```
❌ Could not connect to SMTP server smtp.beispiel.de:587 - Connection timed out (110)
```

**SMTP Log:**
```
📧 Attempting to send email...
   SMTP Host: smtp.beispiel.de:587
🔌 Connecting to SMTP server...
[Wartet 30 Sekunden...]
❌ Connection failed: Connection timed out (110)
```

**Lösung:**
1. **Shared Hosting:** Kontaktieren Sie Ihren Hosting-Provider
   - Viele Shared-Hosting-Anbieter blockieren ausgehende SMTP-Verbindungen
   - Fragen Sie nach Freischaltung von Port 587
2. **VPS/Server:** Überprüfen Sie Firewall-Regeln
3. **Alternative:** Verwenden Sie den SMTP-Server Ihres Hosting-Providers

---

### 6. Gmail: Kein App-Passwort

**Symptom:**
```
❌ Password authentication failed: 535 5.7.8 Username and Password not accepted
```

**SMTP Log:**
```
🔑 Authenticating...
Client: AUTH LOGIN
[Credentials sent]
Server: 535 5.7.8 Username and Password not accepted. Learn more at...
❌ Password authentication failed (Check password or use app-specific password for Gmail)
```

**Lösung:**
1. Gehen Sie zu [Google App-Passwords](https://myaccount.google.com/apppasswords)
2. Erstellen Sie ein neues App-Passwort
3. Verwenden Sie dieses App-Passwort in `backend/config.json`:
```json
{
  "email": "ihre.email@gmail.com",
  "password": "abcd efgh ijkl mnop",  ← App-Passwort (16 Zeichen)
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  }
}
```

---

## Diagnose-Werkzeuge

### 1. Manuelle Ausführung (Detaillierte Logs)

```bash
cd backend
php php-email-sender.php
```

**Zeigt:**
- Vollständige SMTP-Konversation
- Jeden Verbindungsschritt
- Authentifizierungsdetails
- Fehler mit Kontextinformationen

### 2. Dashboard (Visuelle Fehlerdarstellung)

1. Öffnen Sie das Dashboard
2. Genehmigen Sie eine E-Mail
3. Klicken Sie auf "📤 E-Mail senden"
4. Bei Fehler sehen Sie:
   - Detaillierte Fehlermeldung
   - SMTP-Logs
   - Troubleshooting-Anweisungen
   - Empfänger-Adresse

### 3. Backend-Status (Konfigurationsprüfung)

Das Dashboard zeigt auch:
- ✅/❌ Backend-Konfiguration
- ⚠️ Test-E-Mail-Service erkannt
- 💡 Fehlende Konfiguration

---

## Fehlerausgabe im Dashboard

### Erfolg:
```
✅ 1 E-Mail wurde erfolgreich versendet!

📋 Detaillierte Logs:
✅ office@kunde.de
📧 Attempting to send email...
🔌 Connecting to SMTP server...
✅ Connected to smtp.beispiel.de:587
🔒 Starting TLS encryption...
✅ TLS encryption enabled
🔑 Authenticating...
✅ Authentication successful
📤 Sending email...
✅ Email sent successfully!
```

### Fehler:
```
❌ E-Mails konnten nicht versendet werden

📋 Fehlerbehebung:
1. Öffnen Sie backend/config.json
2. Überprüfen Sie:
   • SMTP Host: Ist der Server richtig?
   • SMTP Port: 587 (STARTTLS) oder 465 (SSL)?
   • E-Mail: Ist die Absender-Adresse korrekt?
   • Passwort: Ist das Passwort richtig?
   • Bei Gmail: App-Passwort verwenden!
3. Test: php backend/php-email-sender.php

❌ An: kunde@beispiel.de - Password authentication failed

📋 Detaillierte SMTP Logs:

❌ An: kunde@beispiel.de
Betreff: Neue Rechnung erstellt
Fehler: Password authentication failed: 535 Authentication failed

SMTP Kommunikation:
📧 Attempting to send email:
   From: office@beispiel.de
   To: kunde@beispiel.de
   SMTP Host: smtp.beispiel.de:587
🔌 Connecting to SMTP server...
✅ Connected to smtp.beispiel.de:587
🔒 Starting TLS encryption...
✅ TLS encryption enabled
🔑 Authenticating...
Client: AUTH LOGIN
Server: 334 VXNlcm5hbWU6
[Username OK]
Server: 334 UGFzc3dvcmQ6
[Password sent]
Server: 535 5.7.8 Authentication failed
❌ Password authentication failed: 535 Authentication failed
```

---

## Konfigurationsbeispiele

### Gmail
```json
{
  "email": "ihre.email@gmail.com",
  "password": "abcd efgh ijkl mnop",  // App-Passwort!
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  }
}
```

### Outlook/Hotmail
```json
{
  "email": "ihre.email@outlook.com",
  "password": "IhrPasswort",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp-mail.outlook.com",
    "port": 587,
    "secure": false
  }
}
```

### World4You
```json
{
  "email": "ihre.email@ihre-domain.at",
  "password": "IhrPasswort",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.world4you.com",
    "port": 587,
    "secure": false
  }
}
```

### 1&1 / IONOS
```json
{
  "email": "ihre.email@ihre-domain.de",
  "password": "IhrPasswort",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.1und1.de",
    "port": 587,
    "secure": false
  }
}
```

---

## Troubleshooting-Workflow

1. **E-Mail wird nicht versendet**
   ```bash
   php backend/php-email-sender.php
   ```
   Sehen Sie die detaillierten Logs

2. **Verbindungsfehler**
   - Überprüfen Sie SMTP Host
   - Überprüfen Sie Port
   - Kontaktieren Sie Hosting-Provider

3. **Authentifizierungsfehler**
   - Überprüfen Sie E-Mail-Adresse
   - Überprüfen Sie Passwort
   - Bei Gmail: App-Passwort verwenden

4. **Empfänger-Fehler**
   - Überprüfen Sie Empfänger-E-Mail
   - Stellen Sie sicher, dass Adresse existiert

5. **Immer noch Probleme**
   - Schauen Sie sich die SMTP-Logs an
   - Notieren Sie die Fehlermeldung
   - Suchen Sie nach der Fehlermeldung online

---

## FAQ

### Warum sehe ich "✅ Erfolgreich versendet" aber E-Mail kommt nicht an?

**Alte Version:** Das System prüfte nur ob der PHP-Prozess lief, nicht ob SMTP funktionierte.

**Neue Version:** Das System prüft jetzt jeden SMTP-Schritt und zeigt detaillierte Fehler.

### Wo finde ich die vollständigen Logs?

1. **Im Dashboard:** Nach dem Senden werden Logs im Alert angezeigt
2. **CLI:** `php backend/php-email-sender.php`
3. **Dateien:** E-Mails in `backend/email-queue.json` haben `error` und `failedAt` Felder

### Was bedeutet "Connection refused"?

Der SMTP-Server ist nicht erreichbar:
- Falscher Hostname
- Falscher Port
- Server ist offline
- Firewall blockiert

### Was bedeutet "Authentication failed"?

Zugangsdaten sind falsch:
- Falsches Passwort
- Falsche E-Mail-Adresse
- Bei Gmail: Kein App-Passwort verwendet

### Kann ich Test-E-Mails verwenden (Mailtrap, etc.)?

Ja, aber beachten Sie:
- Test-Services fangen E-Mails ab
- E-Mails werden NICHT zugestellt
- Nur für Entwicklung/Tests
- Dashboard zeigt Warnung bei Test-Service

---

## Zusammenfassung

**Vorher:**
- ❌ Keine Fehlerinformationen
- ❌ "Erfolgreich" auch wenn fehlgeschlagen
- ❌ Keine Möglichkeit zu diagnostizieren

**Jetzt:**
- ✅ Vollständige SMTP-Logs
- ✅ Detaillierte Fehlermeldungen
- ✅ Schritt-für-Schritt Verbindungsprotokoll
- ✅ Troubleshooting-Anweisungen
- ✅ Empfänger-Adressen sichtbar
- ✅ Alle SMTP-Antworten protokolliert

**Sie sehen jetzt GENAU was passiert und warum E-Mails nicht ankommen!** 🎉
