# Test-Dateien Anleitung

## Übersicht

Dieses Repository enthält Test-Dateien für SMTP-Konfiguration und E-Mail-Versand. Diese Anleitung erklärt, wie Sie die Test-Dateien verwenden.

## Verfügbare Test-Dateien

### 1. test-smtp-connection.php

**Zweck:** Schneller Verbindungstest zum SMTP-Server (OHNE Authentifizierung)

**Was es testet:**
- ✅ Verbindung zum SMTP-Server
- ✅ Server-Erreichbarkeit
- ✅ Server-Greeting (Willkommensnachricht)
- ❌ KEINE Authentifizierung
- ❌ KEINE E-Mail wird versendet

**Verwendung:**
```bash
1. Stellen Sie sicher, dass backend/config.json existiert und korrekt konfiguriert ist
2. Laden Sie test-smtp-connection.php zu Ihrem Webserver hoch (Root-Verzeichnis)
3. Öffnen Sie im Browser: https://ihre-domain.at/test-smtp-connection.php
4. Überprüfen Sie das Ergebnis:
   ✅ "CONNECTION SUCCESSFUL" → Server ist erreichbar
   ❌ "CONNECTION FAILED" → Überprüfen Sie Host/Port/Firewall
5. LÖSCHEN Sie die Datei nach dem Test (Sicherheit!)
```

**Erwartetes Ergebnis (Erfolg):**
```
🔌 SMTP Connection Test

Configuration:
SMTP Host: smtp.world4you.com
SMTP Port: 587

Test Results:
🔌 Testing connection to smtp.world4you.com:587...

✅ CONNECTION SUCCESSFUL

Connected to: smtp.world4you.com:587
Time elapsed: 45.23ms

Server greeting:
220 mx12lb.world4you.com ESMTP Exim 4.97.1 ...

✅ Server is responding correctly (220 OK)

Result:
• SMTP server is reachable
• Server accepts connections
• Ready for email sending
```

### 2. test-mail.php

**Zweck:** Vollständiger E-Mail-Versand-Test (MIT Authentifizierung)

**Was es testet:**
- ✅ Verbindung zum SMTP-Server
- ✅ Authentifizierung (Login)
- ✅ TLS/STARTTLS Verschlüsselung
- ✅ Tatsächlicher E-Mail-Versand
- ✅ Vollständige SMTP-Konversation wird angezeigt

**Verwendung:**
```bash
1. Öffnen Sie test-mail.php in einem Texteditor
2. Ändern Sie Zeile 12 und tragen Sie IHRE E-Mail-Adresse ein:
   $testRecipient = 'ihre-email@gmail.com';
3. Speichern Sie die Datei
4. Laden Sie test-mail.php zu Ihrem Webserver hoch
5. Öffnen Sie im Browser: https://ihre-domain.at/test-mail.php
6. Warten Sie auf das Ergebnis (vollständige SMTP-Konversation wird angezeigt)
7. Überprüfen Sie Ihr E-Mail-Postfach
8. LÖSCHEN Sie die Datei nach dem Test (Sicherheit!)
```

**Erwartetes Ergebnis (Erfolg):**
```
🧪 World4You SMTP Test
Empfänger: ihre-email@gmail.com
Konfiguration: smtp.world4you.com:587

Test wird ausgeführt...

📧 Attempting to send email:
   From: office@franzjosef-danner.at
   To: ihre-email@gmail.com
   Subject: World4You SMTP Test - 2026-02-05 22:01:12
   SMTP Host: smtp.world4you.com:587
   Secure: STARTTLS

🔌 Connecting to SMTP server...
✅ Connected to smtp.world4you.com:587
Server: 220 mx12lb.world4you.com ESMTP...

[... vollständige SMTP-Konversation ...]

✅ TEST ERFOLGREICH!
Die E-Mail wurde versendet!
```

## Debugging-Dateien

### backend/smtp-debug.log

**Was ist das?**
- Automatisch erstellte Log-Datei für SMTP-Operationen
- Wird von `backend/smtp-phpmailer.php` erstellt
- Enthält detaillierte Informationen über jeden E-Mail-Versand

**Wo finde ich es?**
- Pfad: `backend/smtp-debug.log`
- Wird automatisch erstellt beim ersten E-Mail-Versand
- Log-Rotation bei > 10MB (alte Logs → smtp-debug.log.old)

**Was wird geloggt?**
- Zeitstempel jedes Versands
- SMTP-Konfiguration
- Erfolg/Fehler-Status
- Vollständige Log-Ausgabe

**Verwendung:**
```bash
# Log anzeigen
cat backend/smtp-debug.log

# Neueste Einträge
tail -n 50 backend/smtp-debug.log

# Log löschen (bei Bedarf)
rm backend/smtp-debug.log
```

## Schritt-für-Schritt Fehlerdiagnose

### Schritt 1: Konfiguration überprüfen

```bash
# Existiert die Konfigurationsdatei?
ls -la backend/config.json

# Falls nicht, erstellen:
cp backend/config.example.json backend/config.json
# Dann bearbeiten und SMTP-Zugangsdaten eintragen
```

### Schritt 2: Verbindung testen

```bash
# 1. test-smtp-connection.php hochladen
# 2. Im Browser öffnen
# 3. Ergebnis prüfen:

✅ CONNECTION SUCCESSFUL → Weiter zu Schritt 3
❌ CONNECTION FAILED → SMTP Host/Port/Firewall überprüfen
```

### Schritt 3: E-Mail-Versand testen

```bash
# 1. test-mail.php mit IHRER E-Mail-Adresse konfigurieren
# 2. Hochladen und im Browser öffnen
# 3. Ergebnis prüfen:

✅ TEST ERFOLGREICH → SMTP funktioniert!
❌ TEST FEHLGESCHLAGEN → Siehe Fehlermeldung und Logs
```

### Schritt 4: Logs überprüfen

```bash
# Falls Test fehlgeschlagen, Logs prüfen:
cat backend/smtp-debug.log

# Häufige Fehler:
# - "535 Authentication failed" → Passwort falsch
# - "550 Sender rejected" → FROM-Adresse keine existierende Mailbox
# - "Connection refused" → Host/Port falsch
```

## Häufige Fehler und Lösungen

### Fehler: "CONNECTION FAILED"

**Mögliche Ursachen:**
- SMTP Host falsch
- SMTP Port falsch
- Firewall blockiert Port
- Server nicht erreichbar

**Lösung:**
1. Überprüfen Sie `backend/config.json`:
   ```json
   "smtp": {
     "host": "smtp.world4you.com",
     "port": 587
   }
   ```
2. Versuchen Sie alternative Ports: 587 (STARTTLS) oder 465 (SSL)
3. Kontaktieren Sie Ihren Hosting-Provider

### Fehler: "535 Authentication failed"

**Mögliche Ursachen:**
- Falsches Passwort
- Falscher Benutzername

**Lösung:**
1. Überprüfen Sie Ihre SMTP-Zugangsdaten
2. Bei World4You: Mailbox-Passwort verwenden (nicht Kundenlogin!)
3. Passwort zurücksetzen falls nötig

### Fehler: "550 Sender rejected"

**Mögliche Ursachen:**
- FROM-Adresse ist keine existierende Mailbox (World4You Anforderung!)

**Lösung:**
1. Überprüfen Sie `backend/config.json`:
   ```json
   "email": "office@ihre-domain.at"
   ```
2. Stellen Sie sicher: Diese E-Mail-Adresse EXISTIERT als Mailbox
3. Bei World4You: Muss echte Mailbox sein, keine Weiterleitung/Alias

### Fehler: "454 TLS not available"

**Mögliche Ursachen:**
- Falscher Port (25 statt 587)

**Lösung:**
1. Ändern Sie Port zu 587 in `backend/config.json`
2. Stellen Sie sicher: `"secure": false` (STARTTLS automatisch)

## Sicherheitshinweise

⚠️ **WICHTIG:**

1. **Löschen Sie Test-Dateien nach dem Test!**
   - `test-smtp-connection.php` → LÖSCHEN
   - `test-mail.php` → LÖSCHEN
   - Diese Dateien sollten NICHT auf Produktionsservern bleiben

2. **Warum löschen?**
   - Zeigen SMTP-Konfiguration an
   - Können für Spam missbraucht werden
   - Sicherheitsrisiko

3. **Was ist sicher?**
   - ✅ `backend/config.json` (geschützt durch .htaccess)
   - ✅ `backend/smtp-debug.log` (geschützt durch .htaccess)
   - ✅ API-Dateien in `api/` (normale Nutzung)

## .gitignore Hinweise

Die Test-Dateien sind in `.gitignore` aufgelistet:
- `test-smtp-connection.php` - in .gitignore, aber im Repository als Template
- `test-mail.php` - in .gitignore, aber im Repository als Template

**Bedeutung:**
- Die Template-Versionen sind im Git-Repository
- Lokale Änderungen (z.B. E-Mail-Adresse eintragen) werden NICHT committet
- Somit bleiben persönliche Daten geschützt

## Support

Bei Problemen:

1. Überprüfen Sie alle Logs:
   - Browser-Ausgabe von test-smtp-connection.php
   - Browser-Ausgabe von test-mail.php
   - `backend/smtp-debug.log`

2. Dokumentation lesen:
   - `SMTP_TESTING_ANLEITUNG.md` - Detaillierte Fehlerdiagnose
   - `EMAIL_SETUP_ANLEITUNG.md` - Setup-Anleitung
   - `WORLD4YOU_INLINE_FIX.md` - World4You spezifische Hinweise

3. Häufige Probleme:
   - World4You: FROM-Adresse muss existierende Mailbox sein!
   - Port 587 für STARTTLS verwenden
   - Mailbox-Passwort, nicht Kundenlogin

## Zusammenfassung

✅ **test-smtp-connection.php** - Schneller Verbindungstest (empfohlen als erster Schritt)
✅ **test-mail.php** - Vollständiger E-Mail-Test (empfohlen nach erfolgreichem Verbindungstest)
✅ **backend/smtp-debug.log** - Persistente Logs (automatisch erstellt)

**Workflow:**
1. Konfiguration erstellen (`backend/config.json`)
2. Verbindung testen (`test-smtp-connection.php`)
3. E-Mail-Versand testen (`test-mail.php`)
4. Bei Fehlern: Logs prüfen (`backend/smtp-debug.log`)
5. Test-Dateien löschen (Sicherheit!)

**Danach:** Dashboard verwenden für produktiven E-Mail-Versand! 🎉
