# E-Mail-Versand - Schnell-Referenz

## ⚠️ Wichtigste Information

**E-Mails werden nur versendet, wenn das Backend konfiguriert ist!**

## ✅ 3-Schritte-Setup (Einmalig)

```bash
# Schritt 1: Config erstellen
cd backend
cp config.example.json config.json

# Schritt 2: Config bearbeiten (mit Ihren Zugangsdaten)
nano config.json  # oder mit einem Editor Ihrer Wahl

# Schritt 3: Dependencies installieren
npm install
```

## 📝 Config.json Beispiel

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

## 🧪 Testen

```bash
cd backend
node email-sender.js
```

**Erwartete Ausgabe:**
```
🚀 Starting email queue processor...
⏰ Time: ...
📭 Queue is empty. Nothing to send.
✨ Done!
```

## 📤 E-Mails senden

1. Dashboard öffnen
2. E-Mails genehmigen (✓ Genehmigen)
3. "📤 E-Mail senden" klicken
4. Fertig! E-Mail wird versendet

## ❌ Häufige Fehler

| Fehler | Bedeutung | Lösung |
|--------|-----------|--------|
| Backend nicht konfiguriert | config.json fehlt | Siehe Schritt 1-2 |
| Dependencies fehlen | npm install nicht ausgeführt | Siehe Schritt 3 |
| Node.js nicht verfügbar | Node.js nicht installiert | nodejs.org |
| SMTP-Server nicht gefunden | Falscher Host | Host in config.json prüfen |
| Ungültige Zugangsdaten | Falsches Passwort | Passwort prüfen |

## 📚 Dokumentation

- **EMAIL_SETUP_ANLEITUNG.md** - Vollständige Setup-Anleitung
- **EMAIL_PROBLEM_ERKLAERUNG.md** - Problem-Erklärung mit Diagrammen
- **backend/README.md** - Backend-Details

## 🆘 Hilfe

**Problem:** E-Mails kommen nicht an  
**Lösung:** Siehe EMAIL_PROBLEM_ERKLAERUNG.md

**Problem:** Fehler beim Senden  
**Lösung:** Lesen Sie die Fehlermeldung im Dashboard - sie enthält Anweisungen

**Problem:** Backend-Fehler  
**Lösung:** 
```bash
cd backend
node email-sender.js  # Zeigt genauen Fehler
```

## ⚙️ SMTP-Ports

- **Port 587** + `secure: false` = STARTTLS (empfohlen)
- **Port 465** + `secure: true` = SSL/TLS

## 🔐 Sicherheit

- ✅ config.json ist in .gitignore
- ✅ Wird NICHT zu Git hinzugefügt
- ⚠️ Verwenden Sie starke Passwörter
- ⚠️ Bei Gmail: Verwenden Sie App-Passwort

## 📞 Support

Bei Problemen:
1. Fehlermeldung lesen
2. Anweisungen in Fehlermeldung folgen
3. Dokumentation konsultieren
4. Manuell testen: `node email-sender.js`
