# Backend Configuration

Dieses Verzeichnis enthält die Backend-Konfiguration und PHP-basierte E-Mail-Funktionen für das KA System.

## Einrichtung

### Konfiguration erstellen

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

## PHP E-Mail-Funktionen

Das Backend enthält PHP-basierte SMTP-Funktionen für den E-Mail-Versand:

- **smtp-inline.php**: SMTP-Versand ohne externe Prozesse (World4You-kompatibel)
- **smtp-phpmailer.php**: SMTP-Versand mit PHPMailer-Bibliothek
- **PHPMailer/**: PHPMailer-Bibliothek für erweiterte E-Mail-Funktionen

Diese Funktionen werden von den API-Endpunkten verwendet und erfordern keine manuelle Konfiguration.

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
- Stellen Sie sicher, dass die Datei im `backend/` Verzeichnis liegt

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
