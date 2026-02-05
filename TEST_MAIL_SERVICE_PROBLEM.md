# Test-Mail-Service Problem

## Problem

**Symptom:** "Das Dashboard meldet dass das Backend bereit ist, aber gesendete Mails kommen nie an."

**Ursache:** Sie verwenden einen Test-/Entwicklungs-E-Mail-Service (z.B. Mailtrap, Ethereal Email, MailHog) statt einem echten SMTP-Server.

---

## Was sind Test-E-Mail-Services?

Test-E-Mail-Services sind Entwicklungs-Tools, die E-Mails **abfangen** statt sie zuzustellen:

### Häufige Test-Services:

| Service | SMTP Host | Zweck |
|---------|-----------|-------|
| **Mailtrap** | smtp.mailtrap.io | Entwicklungs-/Test-E-Mails |
| **Ethereal Email** | smtp.ethereal.email | Temporäre Test-E-Mails |
| **MailHog** | localhost:1025 | Lokaler E-Mail-Test |
| **MailCatcher** | localhost:1025 | Lokaler E-Mail-Test |
| **Papercut** | localhost:25 | Windows E-Mail-Test |

### Was passiert mit Test-Services:

```
Ihre App → Test-Service → 🛑 E-Mail wird gespeichert, NICHT versendet
                        ↓
                   Web-Interface zum Ansehen (nur Sie!)
                   
                   ❌ Empfänger erhält NIE die E-Mail
```

---

## Wie Sie das erkennen

### 1. Dashboard-Warnung

Wenn Sie einen Test-Service verwenden, zeigt das Dashboard jetzt:

```
⚠️ TEST-MODUS AKTIV
E-Mails werden NICHT zugestellt!

Sie verwenden derzeit: Mailtrap
Mailtrap ist ein Entwicklungs-Tool, das E-Mails abfängt 
und NICHT an die Empfänger zustellt.
```

### 2. In der Konfiguration prüfen

Öffnen Sie `backend/config.json` und prüfen Sie `smtp.host`:

**Test-Service (❌ E-Mails kommen nicht an):**
```json
{
  "smtp": {
    "host": "smtp.mailtrap.io",  ← Test-Service!
    "port": 2525
  }
}
```

**Produktiv-Service (✅ E-Mails werden zugestellt):**
```json
{
  "smtp": {
    "host": "smtp.gmail.com",  ← Echter SMTP-Server
    "port": 587
  }
}
```

---

## Lösung: Auf echten SMTP-Server wechseln

### Schritt 1: Wählen Sie einen E-Mail-Provider

#### Option A: Gmail
```json
{
  "email": "ihre.email@gmail.com",
  "password": "ihr_app_passwort",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false
  }
}
```
**Wichtig:** Gmail benötigt ein [App-Passwort](https://support.google.com/accounts/answer/185833)

#### Option B: Outlook/Hotmail
```json
{
  "email": "ihre.email@outlook.com",
  "password": "ihr_passwort",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp-mail.outlook.com",
    "port": 587,
    "secure": false
  }
}
```

#### Option C: World4You
```json
{
  "email": "ihre.email@ihre-domain.at",
  "password": "ihr_passwort",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.world4you.com",
    "port": 587,
    "secure": false
  }
}
```

#### Option D: 1&1 / IONOS
```json
{
  "email": "ihre.email@ihre-domain.de",
  "password": "ihr_passwort",
  "fromName": "KA System",
  "smtp": {
    "host": "smtp.1und1.de",
    "port": 587,
    "secure": false
  }
}
```

### Schritt 2: Konfiguration ändern

1. Öffnen Sie `backend/config.json`
2. Ändern Sie `smtp.host` auf den echten SMTP-Server
3. Ändern Sie `email` und `password` auf echte Zugangsdaten
4. Speichern Sie die Datei

### Schritt 3: Dashboard neu laden

1. Öffnen Sie das Dashboard
2. Die Test-Modus-Warnung sollte verschwinden
3. Status sollte "✅ Backend ist bereit" zeigen

### Schritt 4: Testen

```bash
php backend/php-email-sender.php
```

Oder senden Sie eine Test-E-Mail über das Dashboard.

---

## Wann Test-Services verwenden?

Test-Services sind **nur** für Entwicklung/Debugging geeignet:

### ✅ Test-Services verwenden für:
- Entwicklung neuer E-Mail-Funktionen
- Testen von E-Mail-Templates
- Debugging ohne echte E-Mails zu versenden
- Lokale Entwicklung ohne Internet

### ❌ Test-Services NICHT verwenden für:
- Produktion
- Echte Kunden-E-Mails
- Benachrichtigungen
- Jegliche E-Mails, die ankommen sollen

---

## Häufige Fragen

### Q: Warum zeigt das Dashboard "bereit" bei Test-Service?

A: Das Backend IST technisch bereit - es kann E-Mails senden. Aber sie werden vom Test-Service abgefangen. Das Dashboard zeigt jetzt eine **Warnung**, dass Sie im Test-Modus sind.

### Q: Kann ich Test- und Produktiv-Service gleichzeitig nutzen?

A: Nein, Sie müssen zwischen Test und Produktion wechseln. Für Entwicklung:
1. Nutzen Sie Test-Service lokal
2. Wechseln Sie zu echtem SMTP für Produktion

### Q: Wie sehe ich die abgefangenen Test-E-Mails?

A: Jeder Test-Service hat ein Web-Interface:
- **Mailtrap:** https://mailtrap.io/inboxes
- **Ethereal:** Link wird bei Account-Erstellung angezeigt
- **MailHog:** http://localhost:8025
- **MailCatcher:** http://localhost:1080

### Q: Ist ein Test-Service kostenlos?

A: Meist ja (mit Limits):
- **Mailtrap:** Kostenlos bis 500 E-Mails/Monat
- **Ethereal:** Kostenlos, temporäre Accounts
- **MailHog/MailCatcher:** Kostenlos, selbst gehostet

### Q: Welcher echte E-Mail-Service ist am besten?

A: Empfehlungen:
- **Gmail:** Einfach, kostenlos (bis 500/Tag), App-Passwort nötig
- **Hosting-Provider:** Oft inklusive (World4You, 1&1, etc.)
- **SendGrid/Mailgun:** Professionell, hohe Limits, API-Option

---

## Zusammenfassung

**Problem:**
```
Test-Service → E-Mails werden abgefangen → Kommen nie an
```

**Lösung:**
```
Echter SMTP → E-Mails werden zugestellt → Kommen an! ✅
```

**Schritte:**
1. ✅ Prüfen Sie `backend/config.json`
2. ✅ Ändern Sie `smtp.host` auf echten Server
3. ✅ Ändern Sie Zugangsdaten
4. ✅ Speichern und neu laden
5. ✅ E-Mails funktionieren!

**Dashboard zeigt Ihnen:**
- ⚠️ Warnung bei Test-Service
- ✅ Grün bei echtem SMTP

---

## Weitere Hilfe

- **EMAIL_SETUP_ANLEITUNG.md** - Vollständige Setup-Anleitung
- **BACKEND_BEREIT_ABER_KEINE_MAILS.md** - Allgemeine Troubleshooting
- **EMAIL_SCHNELL_REFERENZ.md** - Schnell-Referenz
- **WORLD4YOU_INSTALLATION.md** - World4You-spezifisch
