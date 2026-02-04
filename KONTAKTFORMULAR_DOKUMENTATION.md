# Kontaktformular-Dokumentation

## Übersicht

Das KA System verfügt über ein integriertes Kontaktformular, mit dem Benutzer Nachrichten an die im System konfigurierte E-Mail-Adresse senden können. Diese Funktion ist vergleichbar mit einem Website-Kontaktformular und nutzt das bestehende E-Mail-Benachrichtigungssystem.

## Funktionsweise

### 1. Zugriff auf das Kontaktformular

1. Melden Sie sich im KA System an
2. Klicken Sie im Navigationsmenü auf **"Kontakt"**
3. Das Kontaktformular wird angezeigt

### 2. Nachricht senden

Füllen Sie das Formular aus:

- **Name** (Pflichtfeld): Ihr Name (mindestens 2 Zeichen)
- **E-Mail-Adresse** (Pflichtfeld): Ihre E-Mail-Adresse für Rückfragen
- **Betreff** (Pflichtfeld): Betreff der Nachricht (mindestens 3 Zeichen)
- **Nachricht** (Pflichtfeld): Ihre Nachricht (mindestens 10 Zeichen)

Klicken Sie auf **"Nachricht senden"**

### 3. Was passiert nach dem Absenden?

Die Nachricht wird in die E-Mail-Warteschlange eingereiht. Es gibt zwei Szenarien:

#### Szenario A: Backend ist konfiguriert (automatischer Versand)
1. Die Nachricht wird in die Warteschlange eingereiht
2. Das Backend-System verarbeitet die Warteschlange automatisch
3. Die E-Mail wird über SMTP versendet
4. Sie erhalten eine Bestätigung im System

#### Szenario B: Backend noch nicht konfiguriert (manueller Versand)
1. Die Nachricht wird in die Warteschlange eingereiht
2. Ein Administrator muss den Versand manuell über das Backend auslösen
3. Die E-Mail wird dann versendet

## E-Mail-Format

Die versendete E-Mail enthält folgende Informationen:

```
Betreff: Kontaktanfrage: [Betreff aus dem Formular]

Von: [Name]
E-Mail: [E-Mail-Adresse]
Betreff: [Betreff]
Zeitstempel: [Datum und Uhrzeit]

Nachricht:
[Nachrichtentext]

---
Diese Nachricht wurde über das Kontaktformular im KA System gesendet.
```

## Backend-Integration

### E-Mail-Warteschlange

Kontaktformular-Nachrichten werden als `contactMessage`-Typ in der E-Mail-Warteschlange gespeichert:

```json
{
  "id": "contactMessage_1234567890_abc123",
  "type": "contactMessage",
  "data": {
    "senderName": "Max Mustermann",
    "senderEmail": "max@example.com",
    "subject": "Anfrage zu Produkt XY",
    "message": "Ich hätte gerne weitere Informationen...",
    "timestamp": "2024-02-04T10:30:00.000Z"
  },
  "recipientEmail": "test@example.com",
  "timestamp": "2024-02-04T10:30:00.000Z",
  "status": "pending",
  "retryCount": 0
}
```

### Backend-Verarbeitung

Das Backend-Script `backend/email-sender.js` verarbeitet die Warteschlange automatisch:

```bash
# Einmalig ausführen
node backend/email-sender.js

# Als Cronjob (alle 5 Minuten)
*/5 * * * * cd /path/to/KA/backend && node email-sender.js >> /var/log/ka-email.log 2>&1
```

### API-Endpunkt (Optional)

Es gibt auch einen API-Endpunkt für die direkte Backend-Integration:

**Endpunkt**: `POST /api/send-contact-message.php`

**Request Body**:
```json
{
  "senderName": "Max Mustermann",
  "senderEmail": "max@example.com",
  "subject": "Anfrage zu Produkt XY",
  "message": "Ich hätte gerne weitere Informationen...",
  "recipientEmail": "test@example.com"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "notificationId": "contactMessage_1234567890_abc123",
  "message": "Contact message queued successfully"
}
```

**Response (Error)**:
```json
{
  "error": "Missing required fields"
}
```

## E-Mail-Konfiguration aktivieren

Damit das Kontaktformular funktioniert, müssen E-Mail-Benachrichtigungen aktiviert sein:

1. Öffnen Sie **Einstellungen** im Navigationsmenü
2. Scrollen Sie zum Abschnitt **E-Mail-Benachrichtigungen**
3. Aktivieren Sie die Checkbox "E-Mail-Benachrichtigungen aktivieren"
4. Optional: Geben Sie eine Test-E-Mail-Adresse ein (für Testzwecke)
5. Klicken Sie auf **Speichern**

**Hinweis**: Das Backend verwaltet die SMTP-Konfiguration (Server, Port, Zugangsdaten).

## Validation

Das Formular führt folgende Validierungen durch:

- **Name**: Mindestens 2 Zeichen
- **E-Mail**: Gültiges E-Mail-Format (z.B. user@example.com)
- **Betreff**: Mindestens 3 Zeichen
- **Nachricht**: Mindestens 10 Zeichen

Bei Validierungsfehlern wird eine Fehlermeldung angezeigt.

## Sicherheit

- Alle Eingaben werden validiert und bereinigt
- E-Mail-Adressen werden mit `filter_var()` validiert
- HTML-Zeichen werden escaped (`htmlspecialchars`)
- Cross-Site Scripting (XSS) Schutz
- CSRF-Schutz durch Authentifizierung

## Fehlerbehebung

### Problem: "E-Mail-Benachrichtigungen sind nicht aktiviert"

**Lösung**: Aktivieren Sie E-Mail-Benachrichtigungen in den Einstellungen (siehe oben).

### Problem: Nachricht wird nicht versendet

**Mögliche Ursachen**:
1. Backend ist nicht konfiguriert oder läuft nicht
2. SMTP-Konfiguration ist fehlerhaft
3. Warteschlange wird nicht verarbeitet

**Lösung**: 
- Prüfen Sie die Backend-Logs
- Stellen Sie sicher, dass das Backend-Script läuft
- Überprüfen Sie die SMTP-Konfiguration in `backend/config.json`

### Problem: Formular kann nicht abgesendet werden

**Mögliche Ursachen**:
1. Validierungsfehler in den Formularfeldern
2. JavaScript-Fehler im Browser

**Lösung**:
- Überprüfen Sie alle Pflichtfelder
- Öffnen Sie die Browser-Konsole (F12) und prüfen Sie auf Fehler

## Warteschlange anzeigen

Die E-Mail-Warteschlange (inkl. Kontaktformular-Nachrichten) kann über die Browser-Konsole abgerufen werden:

```javascript
// Alle ausstehenden Benachrichtigungen anzeigen
const queue = localStorage.getItem('ka_email_queue');
console.log(JSON.parse(queue));

// Nur Kontaktformular-Nachrichten filtern
const queue = JSON.parse(localStorage.getItem('ka_email_queue') || '[]');
const contactMessages = queue.filter(item => item.type === 'contactMessage');
console.log(contactMessages);
```

## Unterschied zum Website-Kontaktformular

Das Kontaktformular im KA System funktioniert ähnlich wie ein Website-Kontaktformular, mit folgenden Unterschieden:

| Feature | Website-Kontaktformular | KA System Kontaktformular |
|---------|------------------------|---------------------------|
| **Authentifizierung** | Meist nicht erforderlich | Erforderlich (Login) |
| **Versand** | Sofortiger Versand via PHP | Warteschlange + Backend |
| **Integration** | Eigenständig | Teil des KA Systems |
| **Empfänger** | Fest konfiguriert | Konfigurierbar (Einstellungen) |
| **Tracking** | Optional | In Warteschlange protokolliert |

## Antwort auf die ursprüngliche Frage

**Frage**: "Auf der Webseite habe ich ein Formular, mit dem man Nachrichten an mich schreiben kann, wieso geht das nicht auch über dieses Rechnungssystem? oder geht es, ich muss halt aktiv den Sendevorgang auslösen?"

**Antwort**: 

Ja, es geht jetzt! Das Kontaktformular wurde in das KA System integriert. 

**Wie es funktioniert**:
1. Das Formular sendet Nachrichten in die E-Mail-Warteschlange
2. **Automatischer Versand**: Wenn das Backend konfiguriert und aktiv ist (z.B. als Cronjob), werden die Nachrichten automatisch versendet
3. **Manueller Versand**: Falls das Backend nicht läuft, können Sie den Versand manuell auslösen, indem Sie das Backend-Script ausführen: `node backend/email-sender.js`

Das System ist so konzipiert, dass es flexibel ist - es kann automatisch oder manuell funktionieren, je nach Ihrer Backend-Konfiguration.

## Siehe auch

- [EMAIL_CONFIGURATION.md](EMAIL_CONFIGURATION.md) - E-Mail-Konfiguration und Benachrichtigungen
- [backend/README.md](backend/README.md) - Backend-Setup und Konfiguration
- [backend/CRONJOB_SETUP.md](backend/CRONJOB_SETUP.md) - Cronjob-Einrichtung für automatischen Versand
