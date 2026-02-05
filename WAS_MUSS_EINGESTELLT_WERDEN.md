# E-Mail Backend Konfiguration - Was muss eingestellt werden?

## Problem
**"Ich sende eine Mail, bekomme die Bestätigung dass die Mail erfolgreich gesendet wurde, aber die Mail kommt nie an."**

## Ursache
Das System zeigt Ihnen eine Bestätigung, dass die E-Mail **in die Warteschlange eingereiht** wurde. ABER: Die E-Mail wird nur dann tatsächlich versendet, wenn das Backend korrekt konfiguriert ist.

## Was Sie jetzt auf dem Dashboard sehen

Wenn Sie das Dashboard öffnen, sehen Sie jetzt oben ein **Backend-Status-Widget**, das Ihnen genau zeigt, was noch fehlt:

### Status-Anzeige

```
┌─────────────────────────────────────────────────────┐
│ 📧 E-Mail Backend Status         [🔄 Aktualisieren] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ❌ Backend ist NICHT konfiguriert                  │
│  E-Mails werden nur in die Warteschlange           │
│  eingereiht, können aber nicht versendet werden.   │
│                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐    │
│  │ ❌       │ ✅       │ ❌       │ 📬       │    │
│  │ Konfi-   │ Node.js  │ Node-    │ Warte-   │    │
│  │ guration │ v24.13.0 │ mailer   │ schlange │    │
│  │ Fehlt    │          │ Fehlt    │ 0 wartend│    │
│  └──────────┴──────────┴──────────┴──────────┘    │
│                                                     │
│  ⚠️ Probleme                                        │
│  ┌─────────────────────────────────────────────┐  │
│  │ Backend-Konfiguration fehlt (config.json)   │  │
│  │ 💡 Erstellen Sie backend/config.json mit    │  │
│  │    Ihren SMTP-Zugangsdaten                  │  │
│  └─────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────┐  │
│  │ Nodemailer ist nicht installiert            │  │
│  │ 💡 Führen Sie aus: cd backend && npm install│  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  📋 Backend-Einrichtung erforderlich                │
│  Um E-Mails zu versenden, muss das Backend         │
│  konfiguriert werden:                               │
│                                                     │
│  Schritt 1: Konfigurationsdatei erstellen          │
│  cd backend && cp config.example.json config.json  │
│  Erstellen Sie config.json aus der Vorlage         │
│                                                     │
│  Schritt 2: SMTP-Zugangsdaten eintragen            │
│  Bearbeiten Sie backend/config.json und tragen Sie │
│  Ihre E-Mail-Zugangsdaten ein                      │
│  Felder: email, password, smtp.host, smtp.port     │
│                                                     │
│  Schritt 3: Dependencies installieren               │
│  cd backend && npm install                          │
│  Installieren Sie die erforderlichen Node.js-Pakete│
│                                                     │
│  Schritt 4: Testen                                  │
│  cd backend && node email-sender.js                 │
│  Testen Sie die Konfiguration                       │
│                                                     │
│  📚 Dokumentation:                                  │
│  • EMAIL_SETUP_ANLEITUNG.md - Vollständige Setup-  │
│    Anleitung                                        │
│  • EMAIL_SCHNELL_REFERENZ.md - Schnell-Referenz    │
│  • backend/README.md - Backend-Dokumentation        │
└─────────────────────────────────────────────────────┘
```

## Was Sie tun müssen

### Schritt 1: Konfigurationsdatei erstellen

```bash
cd backend
cp config.example.json config.json
```

### Schritt 2: SMTP-Zugangsdaten eintragen

Öffnen Sie `backend/config.json` und tragen Sie Ihre Daten ein:

```json
{
  "email": "ihre-email@example.com",
  "password": "IHR_EMAIL_PASSWORT",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.ihr-provider.de",
    "port": 587,
    "secure": false
  }
}
```

**Wichtige SMTP-Einstellungen:**

- **World4You**: 
  - Host: `smtp.franzjosef-danner.at`
  - Port: `587`, secure: `false`

- **Gmail**:
  - Host: `smtp.gmail.com`
  - Port: `587`, secure: `false`
  - **WICHTIG**: Verwenden Sie ein App-Passwort, nicht Ihr normales Passwort!

- **GMX/Web.de**:
  - Host: `mail.gmx.net` oder `smtp.web.de`
  - Port: `587`, secure: `false`

- **Outlook/Hotmail**:
  - Host: `smtp-mail.outlook.com`
  - Port: `587`, secure: `false`

### Schritt 3: Dependencies installieren

```bash
cd backend
npm install
```

### Schritt 4: Testen

```bash
cd backend
node email-sender.js
```

Erwartete Ausgabe wenn alles funktioniert:
```
🚀 Starting email queue processor...
⏰ Time: 5.2.2026, 14:30:00
📭 Queue is empty. Nothing to send.
✨ Done!
```

## Nach der Konfiguration

Wenn Sie das Dashboard neu laden, sollten Sie sehen:

```
┌─────────────────────────────────────────────────────┐
│ 📧 E-Mail Backend Status         [🔄 Aktualisieren] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✅ Backend ist bereit                              │
│  E-Mails können versendet werden.                  │
│                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐    │
│  │ ✅       │ ✅       │ ✅       │ 📭       │    │
│  │ Konfi-   │ Node.js  │ Node-    │ Warte-   │    │
│  │ guration │ v24.13.0 │ mailer   │ schlange │    │
│  │ Vorhanden│          │ Install. │ 0 wartend│    │
│  └──────────┴──────────┴──────────┴──────────┘    │
└─────────────────────────────────────────────────────┘
```

## Jetzt funktioniert der E-Mail-Versand

Wenn Sie jetzt E-Mails senden:

1. ✅ E-Mails werden genehmigt
2. ✅ Sie klicken auf "E-Mail senden"
3. ✅ Das Backend sendet die E-Mails via SMTP
4. ✅ **Die E-Mails kommen an!**

## Häufige Fehler

### "Invalid login" oder "Authentication failed"
**Problem**: E-Mail-Adresse oder Passwort ist falsch  
**Lösung**: 
- Überprüfen Sie die Zugangsdaten in `backend/config.json`
- Bei Gmail: Verwenden Sie ein App-Passwort
- Bei manchen Providern: Aktivieren Sie SMTP-Zugriff

### "ECONNREFUSED" oder "Connection refused"
**Problem**: SMTP-Server oder Port ist falsch  
**Lösung**: 
- Überprüfen Sie den SMTP-Host
- Versuchen Sie verschiedene Ports (587, 465, 25)
- Prüfen Sie Firewall-Einstellungen

### "ETIMEDOUT" oder "Timeout"
**Problem**: Firewall blockiert den Port  
**Lösung**: 
- Ihre Firewall blockiert möglicherweise den Port
- Ihr Provider blockiert möglicherweise SMTP
- Versuchen Sie einen anderen Port

## Weitere Hilfe

Detaillierte Anleitungen finden Sie in:
- **EMAIL_SETUP_ANLEITUNG.md** - Vollständige Schritt-für-Schritt-Anleitung
- **EMAIL_SCHNELL_REFERENZ.md** - Kurz-Referenz für schnelle Einrichtung
- **EMAIL_PROBLEM_ERKLAERUNG.md** - Detaillierte Problem-Erklärung
- **backend/README.md** - Backend-spezifische Dokumentation

## Zusammenfassung

**Vorher**: ❌ E-Mail wird nur in Warteschlange eingereiht, Bestätigung angezeigt, aber nie versendet

**Jetzt mit Backend-Konfiguration**: ✅ E-Mail wird via SMTP tatsächlich versendet und kommt an!

Das Status-Widget auf dem Dashboard zeigt Ihnen immer genau, was noch fehlt und wie Sie es einrichten können.
