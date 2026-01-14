# Firmenliste und Artikellisten im Webspace speichern - Implementierungsdokumentation

## Übersicht

Die Firmenliste und Artikellisten werden jetzt im Webspace (Server) statt im Browser-LocalStorage gespeichert. Dies ermöglicht:
- ✅ Zentrale Datenspeicherung auf dem Server
- ✅ Zugriff von mehreren Geräten/Browsern
- ✅ Automatische Datensicherung auf dem Server
- ✅ Automatische Migration von bestehenden LocalStorage-Daten
- ✅ Artikellisten referenzieren die Firmenliste via Firmen_ID

## Änderungen

### 1. API-Endpunkte (PHP)

Neue Dateien im Verzeichnis `api/`:

**Firmenliste:**
- **`api/save-firmenliste.php`**: Speichert die Firmenliste als JSON-Datei
  - Empfängt POST-Anfragen mit JSON-Daten
  - Speichert Daten in `data/firmenliste.json`
  - Erstellt automatisch Backups (`data/firmenliste.backup.json`)

- **`api/load-firmenliste.php`**: Lädt die Firmenliste vom Server
  - Empfängt GET-Anfragen
  - Gibt JSON-Daten zurück
  - Gibt leeres Array zurück, wenn keine Daten vorhanden

**Artikellisten:**
- **`api/save-artikellisten.php`**: Speichert die Artikellisten als JSON-Datei
  - Empfängt POST-Anfragen mit JSON-Daten (Objekt mit Firmen_ID als Keys)
  - Speichert Daten in `data/artikellisten.json`
  - Erstellt automatisch Backups (`data/artikellisten.backup.json`)

- **`api/load-artikellisten.php`**: Lädt die Artikellisten vom Server
  - Empfängt GET-Anfragen
  - Gibt JSON-Daten zurück (Objekt mit Firmen_ID als Keys)
  - Gibt leeres Objekt zurück, wenn keine Daten vorhanden

### 2. Datenspeicherung

Neues Verzeichnis `data/`:

- Enthält die JSON-Dateien mit den Firmen- und Artikellistendaten
- Geschützt durch `.htaccess` (kein direkter Zugriff)
- Dateien werden NICHT in Git eingecheckt (siehe `.gitignore`)
- Artikellisten referenzieren Firmenliste via `Firmen_ID`

Gespeicherte Dateien:
- `firmenliste.json` - Firmenliste (Array von Firmen-Objekten)
- `firmenliste.backup.json` - Backup der Firmenliste
- `artikellisten.json` - Artikellisten (Objekt mit Firmen_ID als Keys)
- `artikellisten.backup.json` - Backup der Artikellisten

### 3. Frontend-Änderungen

**`js/modules/state.js`**:
- Neue Funktionen für API-Kommunikation
- Automatische Migration von LocalStorage zu Server
- Fallback auf LocalStorage bei Serverproblemen
- LocalStorage dient als Cache

**`js/modules/artikellisten-state.js`**:
- Neue Funktionen für API-Kommunikation
- Automatische Migration von LocalStorage zu Server
- Fallback auf LocalStorage bei Serverproblemen
- LocalStorage dient als Cache
- Alle Funktionen sind jetzt async

**`js/artikellisten-app.js`**:
- Async/await für Artikellisten-Funktionen

**`js/artikelliste-detail-app.js`**:
- Async/await für Artikellisten-Funktionen
- Angepasste Speichern-Meldung ("im Webspace")

**`js/modules/events.js`**:
- Async/await für Speichern-Funktion
- Angepasste Fehlermeldungen

**`js/modules/render.js`**:
- Async/await für Speichern-Aufrufe

**`js/app.js`**:
- Initialisierung mit asynchronem Laden der Daten

## Deployment-Anleitung

### Voraussetzungen

- PHP 7.0 oder höher
- Webserver mit `.htaccess`-Unterstützung (Apache)
- Schreibrechte für das `data/`-Verzeichnis

### Schritte

1. **Dateien hochladen**:
   - Alle Projektdateien auf den Webserver hochladen
   - Sicherstellen, dass die Verzeichnisstruktur erhalten bleibt

2. **Berechtigungen setzen**:
   ```bash
   chmod 755 api/
   chmod 755 data/
   chmod 644 api/*.php
   chmod 644 api/.htaccess
   chmod 644 data/.htaccess
   ```

3. **Schreibrechte für Datenverzeichnis**:
   ```bash
   chmod 775 data/
   ```
   
   Oder für mehr Sicherheit (wenn der Webserver-Benutzer bekannt ist):
   ```bash
   chown www-data:www-data data/
   chmod 770 data/
   ```

4. **Testen der API**:
   ```bash
   # Load-Endpunkt testen
   curl https://ihre-domain.de/api/load-firmenliste.php
   
   # Sollte zurückgeben: {"success":true,"data":[],"message":"No data found, returning empty array"}
   ```

5. **Anwendung öffnen**:
   - Öffnen Sie `https://ihre-domain.de/index.html`
   - Melden Sie sich an
   - Gehen Sie zur Firmenliste
   - Bei bestehendem LocalStorage-Daten: Diese werden automatisch migriert

## Funktionsweise

### Speichern

1. Benutzer klickt auf "Speichern" oder ändert Daten
2. JavaScript sendet POST-Anfrage an `api/save-firmenliste.php`
3. PHP speichert Daten in `data/firmenliste.json`
4. Gleichzeitig wird LocalStorage als Cache aktualisiert
5. Bei Erfolg: Meldung "Gespeichert im Webspace."

### Laden

1. Anwendung wird geöffnet
2. JavaScript sendet GET-Anfrage an `api/load-firmenliste.php`
3. PHP liest Daten aus `data/firmenliste.json`
4. Daten werden zurückgegeben und angezeigt
5. LocalStorage wird als Cache aktualisiert

### Datenmigration

1. Beim ersten Laden prüft die Anwendung:
   - Gibt es Daten auf dem Server? → Server-Daten verwenden
   - Gibt es nur LocalStorage-Daten? → Zu Server migrieren
   - Keine Daten vorhanden? → Leere Tabelle anzeigen

2. Migration erfolgt automatisch und einmalig
3. Console-Log: "Migrating company list from localStorage to server..."
4. Bei Erfolg: "✓ Successfully migrated data to server"

## Fallback-Mechanismus

- Bei Serverproblemen (Offline, API nicht erreichbar):
  - LocalStorage wird automatisch als Fallback verwendet
  - Warnung in der Console
  - Daten bleiben lokal bis Server wieder verfügbar

## Sicherheit

- ✅ `.htaccess` verhindert direkten Zugriff auf JSON-Dateien
- ✅ PHP-Validierung der Eingabedaten
- ✅ Automatische Backups vor jedem Speichern
- ✅ JSON-Encoding mit UTF-8-Unterstützung
- ⚠️ **CORS-Konfiguration**: In den API-Dateien ist `Access-Control-Allow-Origin: *` gesetzt (erlaubt alle Domains)
  - **Für Produktion**: Ändern Sie dies zu Ihrer spezifischen Domain
  - **Beispiel**: `header('Access-Control-Allow-Origin: https://ihre-domain.de');`
- ⚠️ **Verzeichnisrechte**: 
  - Entwicklung: `chmod 755 data/` (für einfachen Zugriff)
  - Produktion: `chmod 750 data/` oder `chmod 700 data/` (restriktiver)
  - Owner auf Webserver-Benutzer setzen: `chown www-data:www-data data/`

### Produktions-Checkliste

Vor dem Deployment auf Produktion:

1. **CORS-Header anpassen**:
   ```php
   // In api/save-firmenliste.php und api/load-firmenliste.php
   header('Access-Control-Allow-Origin: https://ihre-domain.de');
   ```

2. **Verzeichnisrechte setzen**:
   ```bash
   chown -R www-data:www-data data/
   chmod 750 data/
   chmod 640 data/*.json
   ```

3. **HTTPS aktivieren**:
   - Stellen Sie sicher, dass Ihre Website über HTTPS läuft
   - Moderne Browser blockieren möglicherweise Mixed Content

4. **PHP-Fehlerprotokollierung**:
   - Prüfen Sie regelmäßig die PHP-Fehlerprotokolle
   - Implementieren Sie Monitoring für API-Fehler

5. **Backup-Strategie**:
   - Richten Sie automatische Backups der `data/` Verzeichnis ein
   - Speichern Sie Backups außerhalb des Webroot

## Backup

- Jedes Mal beim Speichern wird automatisch ein Backup erstellt
- Backup-Datei: `data/firmenliste.backup.json`
- Enthält den vorherigen Zustand der Daten

### Manuelles Backup

```bash
# Backup erstellen
cp data/firmenliste.json backups/firmenliste-$(date +%Y%m%d-%H%M%S).json

# Aus Backup wiederherstellen
cp backups/firmenliste-20260114-013000.json data/firmenliste.json
```

## Fehlerbehebung

### "Failed to save data to server"

- Prüfen Sie die Schreibrechte für `data/` Verzeichnis
- Prüfen Sie die PHP-Fehlerprotokolle
- Testen Sie die API direkt mit curl

### "Failed to load data from server"

- Prüfen Sie ob die API erreichbar ist
- Prüfen Sie die `.htaccess` Konfiguration
- Prüfen Sie die Browser-Console für Fehler

### Daten werden nicht angezeigt

- Öffnen Sie die Browser-Console (F12)
- Prüfen Sie auf JavaScript-Fehler
- Prüfen Sie ob die API antwortet

## Performance

- JSON-Dateien sind sehr performant für kleine bis mittlere Datenmengen
- Für > 10.000 Einträge empfohlen: Datenbank (MySQL, PostgreSQL)
- Aktuelles System: Optimiert für bis zu 1.000-2.000 Firmen

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- Versionierung der Daten
- Erweiterte Backup-Strategie
- Datenbank-Backend statt JSON-Dateien
- Mehrbenutzer-Unterstützung mit Zugriffskontrolle
- Audit-Log für Änderungen

## Support

Bei Problemen:
1. Browser-Console öffnen (F12)
2. Fehler notieren
3. API direkt testen (siehe oben)
4. PHP-Fehlerprotokoll prüfen
