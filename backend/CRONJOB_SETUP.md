# Cronjob Einrichtung für E-Mail-Versand

Diese Anleitung zeigt, wie Sie einen Cronjob einrichten, um automatisch E-Mails aus der Warteschlange zu versenden.

## Schnellstart

### 1. Backend einrichten

```bash
cd /pfad/zu/KA/backend
chmod +x setup.sh
./setup.sh
```

Das Setup-Skript:
- Installiert Node.js Dependencies (nodemailer)
- Erstellt `config.json` aus der Vorlage
- Erstellt leere `email-queue.json`

### 2. Konfiguration anpassen

Bearbeiten Sie `backend/config.json`:

```bash
nano backend/config.json
```

Fügen Sie Ihre E-Mail-Zugangsdaten ein:

```json
{
  "email": "office@franzjosef-danner.at",
  "password": "IHR_PASSWORT_HIER",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.franzjosef-danner.at",
    "port": 587,
    "secure": false
  }
}
```

**Für World4You:**
- Host: `smtp.franzjosef-danner.at` (oder `smtp.world4you.com`)
- Port: `587` (STARTTLS) oder `465` (SSL)
- Secure: `false` für Port 587, `true` für Port 465

### 3. Manuell testen

```bash
cd /pfad/zu/KA/backend
node email-sender.js
```

Wenn keine Fehler auftreten, ist die Konfiguration korrekt.

### 4. Cronjob einrichten

Öffnen Sie die Crontab:

```bash
crontab -e
```

Fügen Sie eine dieser Zeilen hinzu:

```bash
# Alle 5 Minuten (empfohlen für aktive Nutzung)
*/5 * * * * cd /ABSOLUTER/PFAD/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1

# Alle 15 Minuten (weniger Last)
*/15 * * * * cd /ABSOLUTER/PFAD/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1

# Stündlich zur vollen Stunde
0 * * * * cd /ABSOLUTER/PFAD/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1

# Nur während Geschäftszeiten (Mo-Fr, 8-18 Uhr, alle 15 Min)
*/15 8-18 * * 1-5 cd /ABSOLUTER/PFAD/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1
```

**WICHTIG:**
- Ersetzen Sie `/ABSOLUTER/PFAD/zu/KA` mit Ihrem tatsächlichen Pfad
- Verwenden Sie `pwd` im KA-Verzeichnis, um den absoluten Pfad zu erhalten

### 5. Log-Datei vorbereiten

```bash
# Log-Datei erstellen
sudo touch /var/log/ka-email.log

# Schreibrechte geben
sudo chmod 666 /var/log/ka-email.log

# Oder für Ihren Benutzer
sudo chown $(whoami):$(whoami) /var/log/ka-email.log
```

### 6. Cronjob überprüfen

```bash
# Aktive Cronjobs anzeigen
crontab -l

# Logs in Echtzeit verfolgen
tail -f /var/log/ka-email.log
```

## Cronjob-Syntax Erklärung

```
* * * * * Befehl
│ │ │ │ │
│ │ │ │ └─── Wochentag (0-7, 0 und 7 = Sonntag)
│ │ │ └───── Monat (1-12)
│ │ └─────── Tag (1-31)
│ └───────── Stunde (0-23)
└─────────── Minute (0-59)
```

### Beispiele

```bash
# Jede Minute
* * * * * befehl

# Alle 5 Minuten
*/5 * * * * befehl

# Alle 30 Minuten
*/30 * * * * befehl

# Jede Stunde zur vollen Stunde
0 * * * * befehl

# Jeden Tag um 9:00 Uhr
0 9 * * * befehl

# Jeden Montag um 9:00 Uhr
0 9 * * 1 befehl

# Werktags (Mo-Fr) um 9:00 Uhr
0 9 * * 1-5 befehl

# Alle 15 Minuten zwischen 8 und 18 Uhr
*/15 8-18 * * * befehl

# Erste Minute jeder Stunde zwischen 8 und 18 Uhr
0 8-18 * * * befehl
```

## Warteschlangen-Synchronisation

### Problem

Die E-Mail-Warteschlange ist im Browser (localStorage) gespeichert. Der Cronjob benötigt Zugriff auf diese Daten.

### Lösung 1: Manueller Export (Einfach)

1. Öffnen Sie die KA-Anwendung im Browser
2. Öffnen Sie die Konsole (F12)
3. Führen Sie aus:

```javascript
// Warteschlange exportieren und herunterladen
const queue = JSON.parse(localStorage.getItem('ka_email_queue') || '[]');
const blob = new Blob([JSON.stringify(queue, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'email-queue.json';
a.click();
URL.revokeObjectURL(url);
console.log('✅ Warteschlange exportiert');
```

4. Kopieren Sie die heruntergeladene `email-queue.json` nach `/pfad/zu/KA/backend/`

### Lösung 2: Automatischer Export (via PHP/Server)

Wenn Ihre Anwendung auf einem Webserver läuft, erstellen Sie ein Export-Skript:

**export-queue.php:**

```php
<?php
// Nur von localhost erlauben
if ($_SERVER['REMOTE_ADDR'] !== '127.0.0.1') {
    http_response_code(403);
    exit('Forbidden');
}

// Queue aus POST-Daten lesen
$queue = json_decode(file_get_contents('php://input'), true);

// In Datei speichern
$file = __DIR__ . '/backend/email-queue.json';
file_put_contents($file, json_encode($queue, JSON_PRETTY_PRINT));

echo json_encode(['success' => true]);
?>
```

**JavaScript im Frontend (in auftraege-ui.js oder ähnlich):**

```javascript
// Nach dem Speichern eines Auftrags/Rechnung
async function syncEmailQueue() {
  const queue = JSON.parse(localStorage.getItem('ka_email_queue') || '[]');
  
  try {
    await fetch('/export-queue.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queue)
    });
    console.log('✅ Queue synchronized');
  } catch (error) {
    console.error('❌ Queue sync failed:', error);
  }
}

// Nach notifyNewOrder() aufrufen
syncEmailQueue();
```

### Lösung 3: REST API (Professionell)

Erstellen Sie einen kleinen API-Server in `backend/`:

**api-server.js:**

```javascript
const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

// Queue abrufen
app.get('/api/queue', (req, res) => {
  const queue = JSON.parse(fs.readFileSync('email-queue.json', 'utf8'));
  res.json(queue);
});

// Queue hinzufügen/aktualisieren
app.post('/api/queue', (req, res) => {
  const queue = req.body;
  fs.writeFileSync('email-queue.json', JSON.stringify(queue, null, 2));
  res.json({ success: true });
});

// E-Mails versenden
app.post('/api/send', async (req, res) => {
  // email-sender.js Logik ausführen
  require('./email-sender.js');
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('API läuft auf http://localhost:3000');
});
```

Dann im Frontend:

```javascript
async function syncEmailQueue() {
  const queue = JSON.parse(localStorage.getItem('ka_email_queue') || '[]');
  await fetch('http://localhost:3000/api/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queue)
  });
}
```

## Überwachung und Wartung

### Logs überprüfen

```bash
# Letzte 20 Zeilen
tail -n 20 /var/log/ka-email.log

# Live-Überwachung
tail -f /var/log/ka-email.log

# Nur Fehler
grep "❌" /var/log/ka-email.log

# Nur Erfolge
grep "✅" /var/log/ka-email.log

# Anzahl versendeter E-Mails heute
grep "$(date +%Y-%m-%d)" /var/log/ka-email.log | grep "✅" | wc -l
```

### Log-Rotation

Damit die Log-Datei nicht zu groß wird:

**/etc/logrotate.d/ka-email:**

```
/var/log/ka-email.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

### Cronjob-Logs überprüfen

```bash
# System-Cron-Logs (Ubuntu/Debian)
grep CRON /var/log/syslog | tail -n 20

# System-Cron-Logs (CentOS/RHEL)
grep CRON /var/log/cron | tail -n 20
```

### Cronjob testen

```bash
# Cronjob manuell ausführen
cd /pfad/zu/KA/backend && node email-sender.js

# Mit gleicher Ausgabe wie Cronjob
cd /pfad/zu/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1

# Dann Log prüfen
tail /var/log/ka-email.log
```

## Fehlerbehebung

### Cronjob läuft nicht

1. **Cronjob-Service prüfen:**
   ```bash
   sudo systemctl status cron    # Ubuntu/Debian
   sudo systemctl status crond   # CentOS/RHEL
   ```

2. **Berechtigungen prüfen:**
   ```bash
   ls -la /pfad/zu/KA/backend/email-sender.js
   # Sollte lesbar sein
   ```

3. **Pfad prüfen:**
   ```bash
   which node  # Gibt den Node.js-Pfad aus
   ```
   
   Verwenden Sie den vollen Pfad im Cronjob:
   ```bash
   */5 * * * * cd /pfad/zu/KA/backend && /usr/bin/node email-sender.js >> /var/log/ka-email.log 2>&1
   ```

### Keine E-Mails werden versendet

1. **Warteschlange prüfen:**
   ```bash
   cat /pfad/zu/KA/backend/email-queue.json
   # Sollte Einträge mit status: "pending" enthalten
   ```

2. **Skript manuell ausführen:**
   ```bash
   cd /pfad/zu/KA/backend
   node email-sender.js
   # Fehler werden direkt angezeigt
   ```

3. **Konfiguration prüfen:**
   ```bash
   cat /pfad/zu/KA/backend/config.json
   # Passwort, Host, Port überprüfen
   ```

### "Permission denied" Fehler

```bash
# Schreibrechte für Log geben
sudo chmod 666 /var/log/ka-email.log

# Oder Besitzer ändern
sudo chown $(whoami):$(whoami) /var/log/ka-email.log
```

### E-Mail-Authentifizierung fehlgeschlagen

- Überprüfen Sie Benutzername und Passwort
- Bei World4You: Verwenden Sie das normale E-Mail-Passwort
- Testen Sie die Verbindung mit einem E-Mail-Client
- Prüfen Sie, ob 2FA aktiviert ist (dann App-Passwort nötig)

## Best Practices

1. **Häufigkeit:** Alle 5-15 Minuten ist für die meisten Anwendungsfälle ausreichend
2. **Geschäftszeiten:** Beschränken Sie den Cronjob auf Geschäftszeiten, wenn möglich
3. **Monitoring:** Richten Sie Alarme für fehlgeschlagene E-Mails ein
4. **Backup:** Sichern Sie regelmäßig die `email-queue.json`
5. **Logs:** Implementieren Sie Log-Rotation, um Speicherplatz zu sparen
6. **Testing:** Testen Sie den Cronjob immer manuell, bevor Sie ihn aktivieren

## Weitere Informationen

- Siehe `README.md` für detaillierte Backend-Dokumentation
- Siehe `EMAIL_CONFIGURATION.md` für E-Mail-Konfiguration
- Node.js Dokumentation: https://nodejs.org/
- Nodemailer Dokumentation: https://nodemailer.com/
- Crontab Generator: https://crontab.guru/
