# E-Mail-Versand einrichten - Schritt für Schritt

## Problem: E-Mails kommen nicht an

Wenn Sie E-Mails im Dashboard genehmigen und eine Bestätigung erhalten, aber die E-Mails nie ankommen, liegt das daran, dass der **Backend E-Mail-Sender** noch nicht konfiguriert ist.

## Warum ist das notwendig?

Der Browser (Frontend) kann aus Sicherheitsgründen keine E-Mails direkt versenden. Deshalb benötigen Sie:

1. **Node.js** - Eine JavaScript-Laufzeitumgebung auf dem Server
2. **Backend-Konfiguration** - Ihre E-Mail-Zugangsdaten
3. **Nodemailer** - Eine Bibliothek zum E-Mail-Versand

## Schritt-für-Schritt-Anleitung

### Schritt 1: Node.js installieren

**Prüfen Sie, ob Node.js bereits installiert ist:**

```bash
node --version
```

Wenn Sie eine Versionsnummer sehen (z.B. `v18.17.0`), ist Node.js installiert. ✅

**Falls nicht installiert:**

- **Windows/Mac**: Laden Sie Node.js von https://nodejs.org/ herunter
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install nodejs npm
  ```
- **Linux (CentOS/RHEL)**:
  ```bash
  sudo yum install nodejs npm
  ```

### Schritt 2: Backend-Abhängigkeiten installieren

```bash
cd /pfad/zu/KA/backend
npm install
```

Dies installiert `nodemailer`, das für den E-Mail-Versand benötigt wird.

### Schritt 3: E-Mail-Konfiguration erstellen

**3.1. Kopieren Sie die Beispiel-Konfiguration:**

```bash
cd /pfad/zu/KA/backend
cp config.example.json config.json
```

**3.2. Bearbeiten Sie config.json mit Ihren Zugangsdaten:**

```json
{
  "email": "ihre@email-adresse.de",
  "password": "IHR_EMAIL_PASSWORT",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.ihr-provider.de",
    "port": 587,
    "secure": false
  }
}
```

**Wichtige Hinweise:**
- `port: 587` mit `secure: false` = STARTTLS
- `port: 465` mit `secure: true` = SSL/TLS
- **GMX/Web.de**: Verwenden Sie port 587, secure: false
- **Gmail**: Benötigt App-Passwort (nicht normales Passwort!)
- **World4You**: Siehe Beispiel unten

### Schritt 4: Testen Sie die Konfiguration

```bash
cd /pfad/zu/KA/backend
node email-sender.js
```

**Erwartete Ausgabe bei erfolgreicher Konfiguration:**

```
🚀 Starting email queue processor...
⏰ Time: 05.02.2026, 10:30:00
📭 Queue is empty. Nothing to send.
✨ Done!
```

**Bei Fehlern:**
- `Configuration file not found` → Erstellen Sie config.json (Schritt 3)
- `Invalid login` → Überprüfen Sie E-Mail und Passwort
- `ECONNREFUSED` → Überprüfen Sie SMTP-Host und Port

### Schritt 5: E-Mails aus dem Dashboard senden

Jetzt können Sie E-Mails aus dem Dashboard senden:

1. Öffnen Sie das Dashboard im Browser
2. Genehmigen Sie E-Mails (✓ Genehmigen)
3. Klicken Sie auf "📤 X E-Mail senden"
4. Das System ruft automatisch das Backend auf

**Bei Fehlermeldungen im Browser:**
- Lesen Sie die Anweisungen in der Fehlermeldung
- Überprüfen Sie die Backend-Konfiguration
- Führen Sie ggf. manuell aus: `node email-sender.js`

## Beispiel-Konfigurationen

### World4You (franzjosef-danner.at)

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

Alternative (SSL):
```json
{
  "smtp": {
    "host": "smtp.franzjosef-danner.at",
    "port": 465,
    "secure": true
  }
}
```

### Gmail

```json
{
  "email": "ihre@gmail.com",
  "password": "APP_PASSWORT_HIER",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  }
}
```

**Wichtig für Gmail:**
1. Gehen Sie zu https://myaccount.google.com/security
2. Aktivieren Sie 2-Faktor-Authentifizierung
3. Erstellen Sie ein "App-Passwort"
4. Verwenden Sie dieses App-Passwort in der config.json

### GMX

```json
{
  "email": "ihre@gmx.de",
  "password": "IHR_PASSWORT",
  "fromName": "KA System",
  "smtp": {
    "host": "mail.gmx.net",
    "port": 587,
    "secure": false
  }
}
```

### Web.de

```json
{
  "email": "ihre@web.de",
  "password": "IHR_PASSWORT",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.web.de",
    "port": 587,
    "secure": false
  }
}
```

### Outlook/Hotmail

```json
{
  "email": "ihre@outlook.com",
  "password": "IHR_PASSWORT",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp-mail.outlook.com",
    "port": 587,
    "secure": false
  }
}
```

## Häufige Fehler und Lösungen

### "Invalid login" oder "Authentication failed"

**Lösung:**
- Überprüfen Sie E-Mail-Adresse und Passwort
- Bei Gmail: Verwenden Sie App-Passwort (nicht normales Passwort)
- Bei manchen Providern: Aktivieren Sie SMTP-Zugriff in den Einstellungen

### "ECONNREFUSED" oder "Connection refused"

**Lösung:**
- Überprüfen Sie den SMTP-Host (z.B. smtp.gmail.com)
- Versuchen Sie verschiedene Ports (587, 465, 25)
- Prüfen Sie Firewall-Einstellungen

### "ETIMEDOUT" oder "Timeout"

**Lösung:**
- Ihre Firewall blockiert möglicherweise den Port
- Ihr Provider blockiert möglicherweise SMTP (bei manchen Webhostern)
- Versuchen Sie einen anderen Port

### "Backend nicht konfiguriert"

**Lösung:**
- Erstellen Sie backend/config.json (siehe Schritt 3)
- Stellen Sie sicher, dass die Datei gültig ist (JSON-Format)

### "Backend-Abhängigkeiten fehlen"

**Lösung:**
```bash
cd backend
npm install
```

### "Node.js nicht verfügbar"

**Lösung:**
- Installieren Sie Node.js (siehe Schritt 1)
- Stellen Sie sicher, dass `node` im PATH ist

## Automatischer Versand (Optional)

Wenn Sie möchten, dass E-Mails automatisch alle paar Minuten versendet werden:

### Cronjob einrichten (Linux/Mac)

```bash
crontab -e
```

Fügen Sie hinzu (alle 5 Minuten):
```bash
*/5 * * * * cd /absoluter/pfad/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1
```

### Task Scheduler (Windows)

1. Öffnen Sie "Aufgabenplanung"
2. Erstellen Sie eine neue Aufgabe
3. Trigger: Alle 5 Minuten
4. Aktion: `node.exe` mit Argument `C:\pfad\zu\KA\backend\email-sender.js`

## Hilfe und Support

**Weitere Dokumentation:**
- `backend/README.md` - Ausführliche Backend-Dokumentation
- `backend/CRONJOB_SETUP.md` - Cronjob-Einrichtung
- `EMAIL_CONFIGURATION.md` - E-Mail-Konfiguration
- `EMAIL_QUEUE_MANAGER_DOKUMENTATION.md` - Warteschlangen-Verwaltung

**Bei Problemen:**
1. Testen Sie manuell: `cd backend && node email-sender.js`
2. Prüfen Sie die Ausgabe auf Fehlermeldungen
3. Überprüfen Sie backend/config.json
4. Versuchen Sie andere Port-Einstellungen

## Sicherheitshinweise

⚠️ **WICHTIG:**
- Fügen Sie `backend/config.json` NIEMALS zu Git hinzu!
- Die Datei ist bereits in `.gitignore` eingetragen
- Verwenden Sie starke Passwörter
- Aktivieren Sie 2-Faktor-Authentifizierung wo möglich
- Beschränken Sie Zugriff auf das backend/ Verzeichnis

## Schnell-Checkliste

- [ ] Node.js installiert? (`node --version`)
- [ ] Dependencies installiert? (`cd backend && npm install`)
- [ ] config.json erstellt und ausgefüllt?
- [ ] Manueller Test erfolgreich? (`node email-sender.js`)
- [ ] E-Mail-Versand aus Dashboard funktioniert?

Wenn alle Punkte ✅ sind, sollten E-Mails erfolgreich versendet werden!

---

## ⚡ Schnell-Referenz

### 3-Schritte-Setup (Zusammenfassung)

```bash
# 1. Config erstellen
cd backend
cp config.example.json config.json

# 2. Config bearbeiten (mit Ihren Zugangsdaten)
nano config.json  # oder mit einem Editor Ihrer Wahl

# 3. Dependencies installieren
npm install
```

### Testen

```bash
cd backend
node email-sender.js
```

**Erwartete Ausgabe bei Erfolg:**
```
🚀 Starting email queue processor...
⏰ Time: ...
📭 Queue is empty. Nothing to send.
✨ Done!
```

### E-Mails senden

1. Dashboard öffnen
2. E-Mails genehmigen (✓ Genehmigen)
3. "📤 E-Mail senden" klicken
4. Fertig! E-Mail wird versendet

### Häufigste Fehler-Codes

| Code | Bedeutung | Lösung |
|------|-----------|--------|
| 535 | Authentication failed | Passwort prüfen |
| 550 | Sender rejected | FROM-Adresse muss existierende Mailbox sein |
| 554 | Connection refused | Host/Port falsch |
| 454 | TLS not available | Port ändern (587 für STARTTLS) |

### SMTP-Ports

- **Port 587** + `secure: false` = STARTTLS (✅ empfohlen)
- **Port 465** + `secure: true` = SSL/TLS

### Sicherheit

- ✅ config.json ist in .gitignore
- ✅ Wird NICHT zu Git hinzugefügt
- ⚠️ Verwenden Sie starke Passwörter
- ⚠️ Bei Gmail: Verwenden Sie App-Passwort

### Weitere Hilfe

- **EMAIL_SENDING_DIAGNOSTIC_GUIDE.md** - Umfassende Fehlerdiagnose
- **EMAIL_PROBLEM_ERKLAERUNG.md** - Problem-Erklärung mit Diagrammen
- **WORLD4YOU_INSTALLATION.md** - Spezifisch für World4You Hosting
- **backend/README.md** - Backend-Details
