# Backend Email Sender

Dieser Backend-Prozess verarbeitet E-Mail-Benachrichtigungen aus der Warteschlange und versendet sie via SMTP.

## Einrichtung

### 1. Node.js Installation

Stellen Sie sicher, dass Node.js installiert ist:

```bash
node --version  # Sollte v14 oder höher sein
npm --version
```

Falls nicht installiert, laden Sie Node.js von https://nodejs.org/ herunter.

### 2. Dependencies installieren

```bash
cd backend
npm install
```

Dies installiert `nodemailer`, das für den E-Mail-Versand benötigt wird.

### 3. Konfiguration erstellen

Erstellen Sie `config.json` basierend auf der Vorlage:

```bash
cp config.example.json config.json
```

Bearbeiten Sie `config.json` mit Ihren E-Mail-Zugangsdaten:

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

**WICHTIG:** 
- Fügen Sie `config.json` NICHT zu Git hinzu!
- Die Datei ist bereits in `.gitignore` eingetragen
- Port 587 = STARTTLS (secure: false)
- Port 465 = SSL (secure: true)

### 4. Warteschlange einrichten

Die E-Mail-Warteschlange wird in `email-queue.json` gespeichert. Sie müssen diese Datei manuell aus dem Browser-LocalStorage exportieren und hierher kopieren.

**Frontend-Funktion zum Export der Warteschlange:**

Öffnen Sie im Browser die Konsole (F12) und führen Sie aus:

```javascript
// Warteschlange exportieren
const queue = JSON.parse(localStorage.getItem('ka_email_queue') || '[]');
console.log(JSON.stringify(queue, null, 2));

// Als Datei herunterladen
const blob = new Blob([JSON.stringify(queue, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'email-queue.json';
a.click();
```

Kopieren Sie die heruntergeladene `email-queue.json` in das `backend/` Verzeichnis.

## Verwendung

### Manueller Test

```bash
cd backend
node email-sender.js
```

Das Skript:
1. Lädt die Konfiguration aus `config.json`
2. Lädt die Warteschlange aus `email-queue.json`
3. Versendet alle ausstehenden E-Mails
4. Aktualisiert den Status in der Warteschlange

### Als Cronjob einrichten

Der Cronjob sollte regelmäßig laufen, um neue E-Mails zu versenden.

**Cronjob bearbeiten:**

```bash
crontab -e
```

**Beispiele:**

```bash
# Jede 5 Minuten
*/5 * * * * cd /absoluter/pfad/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1

# Jede Stunde zur vollen Stunde
0 * * * * cd /absoluter/pfad/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1

# Jeden Tag um 9:00 Uhr
0 9 * * * cd /absoluter/pfad/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1

# Alle 15 Minuten während der Geschäftszeiten (Mo-Fr, 8-18 Uhr)
*/15 8-18 * * 1-5 cd /absoluter/pfad/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1
```

**Wichtig:**
- Verwenden Sie den **absoluten Pfad** zu Ihrem KA-Verzeichnis
- Logs werden nach `/var/log/ka-email.log` geschrieben
- Erstellen Sie das Log-Verzeichnis vorher: `sudo touch /var/log/ka-email.log && sudo chmod 666 /var/log/ka-email.log`

### Logs überprüfen

```bash
# Letzte Log-Einträge anzeigen
tail -f /var/log/ka-email.log

# Nur Fehler anzeigen
grep "❌" /var/log/ka-email.log

# Erfolgreiche Sendungen zählen
grep "✅" /var/log/ka-email.log | wc -l
```

## Workflow

### 1. Frontend → Warteschlange

Wenn ein Benutzer im Frontend eine Benachrichtigung auslöst:
- Frontend speichert sie in `localStorage` (Browser)
- Status: `pending`

### 2. Export aus Browser

Regelmäßig (oder automatisch via API):
- Warteschlange aus `localStorage` exportieren
- Als `email-queue.json` im `backend/` Verzeichnis speichern

### 3. Backend → E-Mail-Versand

Cronjob führt `email-sender.js` aus:
- Lädt `email-queue.json`
- Versendet alle `pending` E-Mails
- Markiert sie als `sent` oder `failed`
- Speichert aktualisierte Warteschlange

### 4. Synchronisation (optional)

Um den Status zurück ins Frontend zu synchronisieren:
- Kopieren Sie die aktualisierte `email-queue.json` zurück
- Importieren Sie sie im Browser über die Konsole:

```javascript
// Im Browser (F12 Konsole)
fetch('/backend/email-queue.json')
  .then(r => r.json())
  .then(queue => {
    localStorage.setItem('ka_email_queue', JSON.stringify(queue));
    console.log('✅ Warteschlange synchronisiert');
  });
```

## Automatisierung (Empfohlen)

Für eine vollständige Automatisierung benötigen Sie:

### Option A: Datei-basierte Synchronisation

Erstellen Sie ein Sync-Skript, das regelmäßig läuft:

```bash
#!/bin/bash
# sync-email-queue.sh

BACKEND_DIR="/pfad/zu/KA/backend"
FRONTEND_DIR="/pfad/zu/webserver/public"

# Export aus Frontend (via API oder direkter DB-Zugriff)
# ... Ihre Logik hier ...

# E-Mails versenden
cd "$BACKEND_DIR"
node email-sender.js

# Status zurück ins Frontend
cp "$BACKEND_DIR/email-queue.json" "$FRONTEND_DIR/backend/"
```

### Option B: REST API (Professionell)

Erstellen Sie einen Express.js Server:

```javascript
const express = require('express');
const app = express();

// Warteschlange abrufen
app.get('/api/email-queue', (req, res) => {
  const queue = loadQueue();
  res.json(queue);
});

// Neue E-Mail hinzufügen
app.post('/api/email-queue', (req, res) => {
  const notification = req.body;
  const queue = loadQueue();
  queue.push(notification);
  saveQueue(queue);
  res.json({ success: true });
});

// E-Mails versenden
app.post('/api/email-send', async (req, res) => {
  await processQueue();
  res.json({ success: true });
});

app.listen(3000);
```

## Fehlerbehebung

### "Error: Invalid login"

- Überprüfen Sie E-Mail und Passwort in `config.json`
- Bei Gmail: Erstellen Sie ein App-Passwort
- Bei World4You: Verwenden Sie das normale Passwort

### "ECONNREFUSED"

- Überprüfen Sie SMTP-Host und Port
- Firewall-Einstellungen prüfen
- Port 587 (STARTTLS) oder 465 (SSL)

### "Configuration file not found"

- Erstellen Sie `config.json` aus `config.example.json`
- Verwenden Sie absolute Pfade im Cronjob

### Keine E-Mails werden versendet

- Prüfen Sie ob `email-queue.json` existiert
- Prüfen Sie ob Einträge status `pending` haben
- Führen Sie das Skript manuell aus, um Fehler zu sehen

## Sicherheit

- ✅ `config.json` ist in `.gitignore`
- ✅ Passwörter werden nicht im Code gespeichert
- ✅ Verwenden Sie HTTPS für API-Aufrufe (falls zutreffend)
- ✅ Beschränken Sie Zugriff auf `backend/` Verzeichnis
- ⚠️ Verwenden Sie starke Passwörter
- ⚠️ Aktivieren Sie 2FA wo möglich

## World4You Spezifisch

Für World4You E-Mail-Hosting:

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

**Alternative (SSL):**

```json
{
  "smtp": {
    "host": "smtp.franzjosef-danner.at",
    "port": 465,
    "secure": true
  }
}
```

Testen Sie beide Konfigurationen, falls eine nicht funktioniert.
