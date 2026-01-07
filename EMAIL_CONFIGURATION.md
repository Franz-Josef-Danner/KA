# E-Mail-Benachrichtigungen

## Übersicht

Das KA System verfügt über eine E-Mail-Benachrichtigungsfunktion, die automatische Benachrichtigungen für wichtige Ereignisse senden kann.

## Architektur

**Die Server-Verbindung (IMAP/SMTP) wird vom Backend verwaltet.**

- Frontend: Nur Test-E-Mail-Adresse und Benachrichtigungspräferenzen
- Backend: Sichere Verwaltung von E-Mail-Server-Zugangsdaten (IMAP/SMTP)
- Benachrichtigungen werden in einer Warteschlange gespeichert

## Einrichtung

### 1. E-Mail-Benachrichtigungen öffnen

1. Melden Sie sich als Administrator an
2. Öffnen Sie **Einstellungen** im Navigationsmenü
3. Scrollen Sie zum Abschnitt **E-Mail-Benachrichtigungen**

### 2. Benachrichtigungen aktivieren und konfigurieren

Aktivieren Sie die Checkbox "E-Mail-Benachrichtigungen aktivieren" und konfigurieren Sie folgende Optionen:

- **Test-E-Mail-Adresse** (optional): Adresse für Testzwecke (z.B. scener@gmx.net). Wenn ausgefüllt, werden alle Benachrichtigungen an diese Adresse gesendet statt an die im Backend konfigurierte E-Mail-Adresse.

### 3. Benachrichtigungstypen auswählen

Wählen Sie, für welche Ereignisse Sie Benachrichtigungen erhalten möchten:

- ✅ **Neue Kunden**: Benachrichtigung bei Statusänderung zu "Kunde"
- ✅ **Neue Aufträge**: Benachrichtigung bei Erstellung neuer Aufträge
- ✅ **Neue Rechnungen**: Benachrichtigung bei Erstellung neuer Rechnungen
- ✅ **Zahlungseingänge**: Benachrichtigung bei Zahlungseingang

### 4. Speichern

Klicken Sie auf **Speichern**, um die Konfiguration zu übernehmen.

## Backend-Konfiguration

Die E-Mail-Server-Verbindung wird vom Backend verwaltet. Der Backend-Administrator muss folgende Daten konfigurieren:

- **E-Mail-Adresse**: z.B. office@franzjosef-danner.at
- **Passwort**: E-Mail-Passwort
- **IMAP-Server**: z.B. imap.franzjosef-danner.at
- **IMAP-Port**: Standard 993 für SSL
- **SMTP-Server**: z.B. smtp.franzjosef-danner.at
- **SMTP-Port**: Standard 587 für STARTTLS, 465 für SSL
- **SSL/TLS**: Empfohlen aktiviert

Diese Daten werden sicher im Backend gespeichert und sind nicht im Browser sichtbar.

## Funktionsweise

### Test-E-Mail-Modus

Wenn eine **Test-E-Mail-Adresse** konfiguriert ist, werden alle E-Mail-Benachrichtigungen an diese Adresse gesendet, unabhängig vom Ereignis. Dies ist besonders nützlich für:

- Entwicklung und Testing
- Qualitätssicherung vor Produktivbetrieb
- Demo-Zwecke

Die Test-E-Mail-Adresse überschreibt die im Backend konfigurierte Standard-E-Mail-Adresse für alle Benachrichtigungen.

### Frontend-Backend-Architektur

Das System ist in Frontend und Backend aufgeteilt:

**Frontend (Browser):**
1. Benachrichtigungen werden in einer **Warteschlange** gespeichert
2. Die Warteschlange befindet sich im LocalStorage des Browsers
3. Jede Benachrichtigung enthält:
   - Ereignistyp (z.B. neuer Kunde)
   - Relevante Daten (Firmenname, E-Mail, etc.)
   - Empfänger-E-Mail-Adresse (Test-E-Mail wenn konfiguriert, sonst null)
   - Zeitstempel
   - Status (pending)

**Backend (Server):**
- Verarbeitet die Warteschlange
- Verwaltet E-Mail-Server-Zugangsdaten sicher
- Versendet E-Mails über SMTP
- Nutzt Test-E-Mail falls angegeben, sonst Standard-E-Mail

### Integrierte Ereignisse

Die folgenden Ereignisse lösen automatisch Benachrichtigungen aus:

#### 1. Neuer Kunde
Wird ausgelöst, wenn der Status einer Firma auf "Kunde" geändert wird:
```javascript
// In js/modules/state.js
notifyNewCustomer({
  firma: firmenName,
  ansprechpartner: row.Ansprechpartner,
  email: row['E-mail'],
  telefon: row.Telefon
});
```

#### 2. Neuer Auftrag
Integration für neue Aufträge vorbereitet:
```javascript
import { notifyNewOrder } from './js/modules/email-notifications.js';
notifyNewOrder({
  orderId: 'AUF-2024-001',
  customerName: 'Beispiel GmbH',
  total: 1500.00,
  items: [...]
});
```

#### 3. Neue Rechnung
Integration für neue Rechnungen vorbereitet:
```javascript
import { notifyNewInvoice } from './js/modules/email-notifications.js';
notifyNewInvoice({
  invoiceId: 'RE-2024-001',
  customerName: 'Beispiel GmbH',
  total: 1500.00,
  dueDate: '2024-02-15'
});
```

#### 4. Zahlungseingang
Integration für Zahlungseingänge vorbereitet:
```javascript
import { notifyPaymentReceived } from './js/modules/email-notifications.js';
notifyPaymentReceived({
  invoiceId: 'RE-2024-001',
  customerName: 'Beispiel GmbH',
  amount: 1500.00,
  paymentDate: '2024-02-10'
});
```

## Warteschlange anzeigen

Die E-Mail-Warteschlange kann über die Browser-Konsole abgerufen werden:

```javascript
import { getPendingNotifications } from './js/modules/email-config.js';
const pending = getPendingNotifications();
console.log(pending);
```

## Backend-Integration (Zukünftig)

Für eine vollständige E-Mail-Funktionalität wird eine Backend-Integration benötigt:

### Empfohlene Architektur:

1. **Backend-Server** (Node.js, PHP, Python, etc.)
   - Empfängt Benachrichtigungsanfragen vom Frontend
   - Speichert E-Mail-Konfiguration sicher (verschlüsselt)
   - Versendet E-Mails über SMTP

2. **API-Endpunkte**:
   - `POST /api/notifications/send` - E-Mail versenden
   - `GET /api/notifications/queue` - Warteschlange abrufen
   - `POST /api/config/email` - E-Mail-Konfiguration speichern
   - `GET /api/config/email` - E-Mail-Konfiguration abrufen

3. **Sicherheit**:
   - HTTPS für alle API-Aufrufe
   - Authentifizierung (JWT/Session-Token)
   - Verschlüsselte Speicherung der E-Mail-Zugangsdaten
   - Rate-Limiting für E-Mail-Versand

### Beispiel Node.js Backend (Konzept):

```javascript
const nodemailer = require('nodemailer');

// E-Mail versenden
app.post('/api/notifications/send', async (req, res) => {
  const { type, data } = req.body;
  const config = await getEmailConfig(); // Aus sicherer Datenbank
  
  const transporter = nodemailer.createTransport({
    host: config.smtpServer,
    port: config.smtpPort,
    secure: config.useSSL,
    auth: {
      user: config.email,
      pass: config.password // Verschlüsselt gespeichert
    }
  });
  
  await transporter.sendMail({
    from: config.email,
    to: config.email,
    subject: getNotificationSubject(type, data),
    text: getNotificationTemplate(type, data)
  });
  
  res.json({ success: true });
});
```

## Fehlerbehebung

### E-Mails werden nicht versendet
- **Normal**: Die aktuelle Version speichert nur Benachrichtigungen, versendet sie aber nicht
- **Lösung**: Backend-Integration erforderlich

### Konfiguration wird nicht gespeichert
- Browser-LocalStorage prüfen (F12 → Application → Local Storage)
- Browser-Cache leeren und erneut versuchen

### Benachrichtigungen fehlen in der Warteschlange
- Browser-Konsole auf JavaScript-Fehler prüfen
- E-Mail-Konfiguration muss aktiviert sein
- Benachrichtigungstyp muss aktiviert sein

## Datenschutz

- E-Mail-Zugangsdaten werden lokal im Browser gespeichert
- Keine Daten werden an externe Server gesendet (aktuell)
- Bei Backend-Integration: Datenschutzrichtlinien beachten
- DSGVO-konform: Nutzer über Datenspeicherung informieren

## Beispiel-Konfiguration

### World4You (Österreich)
- **IMAP-Server**: imap.world4you.com
- **IMAP-Port**: 993
- **SMTP-Server**: smtp.world4you.com
- **SMTP-Port**: 587
- **SSL/TLS**: Aktiviert

### Gmail
- **IMAP-Server**: imap.gmail.com
- **IMAP-Port**: 993
- **SMTP-Server**: smtp.gmail.com
- **SMTP-Port**: 587
- **SSL/TLS**: Aktiviert
- **Hinweis**: App-Passwort erforderlich (nicht reguläres Passwort)

### Outlook/Office365
- **IMAP-Server**: outlook.office365.com
- **IMAP-Port**: 993
- **SMTP-Server**: smtp.office365.com
- **SMTP-Port**: 587
- **SSL/TLS**: Aktiviert

## API-Referenz

### Funktionen

#### `getEmailConfig()`
Ruft die aktuelle E-Mail-Konfiguration ab.

#### `saveEmailConfig(config)`
Speichert eine neue E-Mail-Konfiguration.

#### `validateEmailConfig(config)`
Validiert eine E-Mail-Konfiguration.

#### `isEmailConfigured()`
Prüft, ob E-Mail ordnungsgemäß konfiguriert ist.

#### `queueEmailNotification(type, data)`
Fügt eine Benachrichtigung zur Warteschlange hinzu.

#### `getPendingNotifications()`
Ruft alle ausstehenden Benachrichtigungen ab.

#### `clearEmailQueue()`
Leert die Benachrichtigungswarteschlange.

#### `notifyNewCustomer(customerData)`
Löst Benachrichtigung für neuen Kunden aus.

#### `notifyNewOrder(orderData)`
Löst Benachrichtigung für neuen Auftrag aus.

#### `notifyNewInvoice(invoiceData)`
Löst Benachrichtigung für neue Rechnung aus.

#### `notifyPaymentReceived(paymentData)`
Löst Benachrichtigung für Zahlungseingang aus.
