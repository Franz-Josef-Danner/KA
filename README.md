# KA System - Firmen-Kontakte Management

Eine browserbasierte Anwendung zur Verwaltung von Firmenkontakten, Artikellisten, Aufträgen, Rechnungen und Kampagnen mit Login-System und Import/Export-Funktionalität.

## Projekt-Struktur

Das Projekt wurde in eine modulare Struktur reorganisiert, um die Wartbarkeit zu verbessern:

```
KA/
├── css/
│   └── styles.css              # Alle CSS-Styles inkl. Login & Navigation
├── js/
│   ├── app.js                  # Haupt-Einstiegspunkt der Anwendung
│   ├── modules/                # Kernmodule
│   │   ├── auth.js             # Authentifizierung und Session-Management
│   │   ├── navigation.js       # Navigationsmenü-Komponente
│   │   ├── config.js           # Konfiguration (STORAGE_KEY, COLUMNS)
│   │   ├── state.js            # State-Verwaltung (Daten laden/speichern)
│   │   ├── render.js           # DOM-Rendering-Logik
│   │   ├── events.js           # Event-Handler für UI-Interaktionen
│   │   ├── duplicates.js       # Duplikatserkennung
│   │   ├── history.js          # Undo/Redo-Funktionalität
│   │   ├── ui.js               # UI-Aktualisierungen
│   │   └── search.js           # Such-Funktionalität
│   └── utils/                  # Hilfsfunktionen
│       ├── sanitize.js         # Text-Bereinigung und Escaping
│       ├── formatting.js       # Formatierung für Zellenanzeige
│       ├── helpers.js          # Allgemeine Hilfsfunktionen
│       └── csv.js              # CSV-Import/Export
├── index.html                  # Login-Seite
├── dashboard.html              # Hauptdashboard mit Übersicht
├── firmenliste.html            # Firmenkontakte-Tabelle
├── artikellisten.html          # Artikellisten-Verwaltung (Platzhalter)
├── auftraege.html              # Aufträge-Verwaltung (Platzhalter)
├── rechnungen.html             # Rechnungs-Verwaltung (Platzhalter)
└── kampagnen.html              # Kampagnen-Verwaltung (Platzhalter)

```

## Module-Übersicht

### Kernmodule (`js/modules/`)

- **auth.js**: Authentifizierung
  - Login/Logout-Funktionalität
  - Session-Management mit LocalStorage
  - Seitenschutz (requireAuth)
  - Demo-User: demo@example.com / demo123

- **navigation.js**: Navigationsmenü
  - Einheitliches Menü für alle Seiten
  - Aktuelle Seite hervorheben
  - Logout-Button

- **config.js**: Zentrale Konfiguration
  - Speicherschlüssel für LocalStorage
  - Spaltendefinitionen

- **state.js**: State-Management
  - Laden und Speichern von Daten
  - Verwaltung des Zeilen-Arrays
  - Erstellen leerer Zeilen
  - Rückgängig/Wiederholen-Funktionen

- **render.js**: Rendering
  - DOM-Manipulation
  - Tabellen-Rendering
  - Duplikat-Highlighting
  - Zelleneditor-Events

- **events.js**: Event-Handler
  - Button-Click-Handler
  - CSV-Import
  - Datenexport
  - Zeilen hinzufügen/löschen
  - Tastatur-Shortcuts für Rückgängig/Wiederholen

- **history.js**: Verlaufs-Verwaltung
  - Speichert bis zu 100 Zustände
  - Ermöglicht Rückgängig/Wiederholen
  - Verhindert rekursive History-Einträge

- **ui.js**: UI-Aktualisierungen
  - Aktualisiert Button-Zustände
  - Aktiviert/Deaktiviert Rückgängig/Wiederholen-Buttons

- **duplicates.js**: Duplikatserkennung
  - Erkennen von doppelten Werten
  - Zeilen mit Duplikaten markieren

- **search.js**: Such-Funktionalität
  - Filtern von Zeilen nach Suchbegriff

- **validation.js**: Geschäftslogik-Validierung
  - Prüfung auf aktive Aufträge für Firmen
  - Prüfung auf unbezahlte Rechnungen (Platzhalter für zukünftige Implementierung)
  - Validierung von Statusänderungen von "Kunde" zu anderen Status

### Hilfsfunktionen (`js/utils/`)

- **sanitize.js**: Sicherheit
  - Text-Bereinigung (Null-Bytes entfernen)
  - HTML-Escaping
  - Attribut-Escaping

- **formatting.js**: Anzeige
  - Zellenformatierung
  - E-Mail- und Website-Links

- **helpers.js**: Allgemein
  - Debounce-Funktion
  - Datei-Download

- **csv.js**: CSV-Verarbeitung
  - CSV-Export
  - CSV-Import mit intelligentem Spalten-Mapping
  - Robuste Parsing-Logik

## Verwendung

Die Anwendung kann direkt im Browser geöffnet werden:

1. Öffnen Sie `index.html` in einem modernen Webbrowser
2. Melden Sie sich mit den Demo-Zugangsdaten an:
   - **Admin-Zugang:**
     - E-Mail: `demo@example.com`
     - Passwort: `demo123`
3. Nach dem Login gelangen Sie zum Dashboard mit folgenden Bereichen:
   - **Firmenliste**: Verwaltung von Firmenkontakten (vollständig implementiert)
   - **Artikellisten**: Artikellisten-Verwaltung (Platzhalter)
   - **Aufträge**: Auftrags-Verwaltung (Platzhalter)
   - **Rechnungen**: Rechnungs-Verwaltung (Platzhalter)
   - **Kampagnen**: Kampagnen-Verwaltung (Platzhalter)
   - **Kundenbereiche**: Verwaltung von Kundenzugängen (NEU)
   - **Einstellungen**: Verwaltung der Firmendaten und Logo (NEU)
4. Die Anwendung verwendet ES6-Module (type="module")
5. **Datenspeicherung**:
   - **Firmenliste**: Wird im Webspace (Server) gespeichert via PHP-API
   - **Andere Daten**: Werden im LocalStorage des Browsers gespeichert
   - Automatische Migration von LocalStorage zu Server bei Firmenliste
6. Sessions sind 24 Stunden gültig

### Kundenbereiche einrichten

1. Öffnen Sie die **Firmenliste**
2. Ändern Sie den Status einer Firma zu "Kunde"
3. Die Firma erhält automatisch:
   - Eine Firmen-ID (Format: F-00001)
   - Ein Kundenkonto mit der hinterlegten E-Mail
   - Ein generiertes Passwort (wird in einem Pop-up angezeigt)
4. **Wichtig:** Notieren Sie sich das angezeigte Passwort und teilen Sie es dem Kunden mit
5. Der Kunde kann sich nun mit seiner E-Mail und dem Passwort anmelden
6. Im **Kundenbereich** sieht der Kunde:
   - Alle seine Aufträge (schreibgeschützt)
   - Alle seine Rechnungen (schreibgeschützt)
7. Admins können in **Kundenbereiche** alle Kunden verwalten und deren Portale einsehen

### Kunden-Zugangsdaten finden und verwalten

**Wo finde ich die Zugangsdaten für den Login einer Kundenfirma?**

1. Öffnen Sie **Kundenbereiche** im Navigationsmenü
2. Suchen Sie den gewünschten Kunden in der Liste
3. Klicken Sie auf den Button **"Zugangsdaten"** in der Zeile des Kunden
4. Es öffnet sich ein Dialog mit folgenden Informationen:
   - E-Mail-Adresse (Login)
   - Erstellungsdatum des Kontos
   - Datum der letzten Aktualisierung
5. **Passwort zurücksetzen:** 
   - Klicken Sie auf **"Passwort zurücksetzen"**
   - Ein neues Passwort wird automatisch generiert
   - Das neue Passwort wird im Dialog angezeigt
   - Kopieren Sie das Passwort mit dem **"Kopieren"**-Button
   - Teilen Sie das neue Passwort dem Kunden mit

**Hinweise:**
- Passwörter werden aus Sicherheitsgründen verschlüsselt gespeichert und können nicht angezeigt werden
- Bei der Erstellung eines neuen Kundenkontos wird das Passwort einmalig in einem Pop-up angezeigt
- Wenn Sie das Passwort nicht notiert haben, können Sie es jederzeit über die Funktion "Passwort zurücksetzen" neu generieren
- Das alte Passwort wird beim Zurücksetzen ungültig

### Firmendaten einrichten

1. Öffnen Sie die **Einstellungen** über das Navigationsmenü
2. Geben Sie Ihre Firmendaten ein:
   - Firmenname (Pflichtfeld)
   - Adresse
   - E-Mail-Adresse
   - Telefonnummer
3. Optional: Laden Sie ein Firmenlogo hoch (max. 2 MB, unterstützte Formate: PNG, JPG, SVG)
4. Klicken Sie auf **Speichern**, um die Änderungen zu übernehmen
5. Mit **Zurücksetzen** können Sie alle Änderungen verwerfen und die zuletzt gespeicherten Daten wiederherstellen

## Funktionen

### Authentifizierung & Navigation
- ✅ Login-System mit E-Mail und Passwort
- ✅ Session-Management (24 Stunden Gültigkeit)
- ✅ Automatische Weiterleitung zu Login bei unautorisierten Zugriffen
- ✅ Einheitliches Navigationsmenü auf allen Seiten
- ✅ Logout-Funktionalität mit Bestätigung
- ✅ Rollenbasierte Authentifizierung (Admin / Kunde)
- ✅ Separate Kundenbereiche mit eingeschränktem Zugriff

### Firmenliste (vollständig implementiert)
- ✅ Zeilen hinzufügen/löschen
- ✅ Inline-Bearbeitung
- ✅ CSV-Import/Export
- ✅ Duplikatserkennung mit Highlighting
- ✅ Suchfunktion
- ✅ Automatische Link-Formatierung für E-Mails und Websites
- ✅ Rückgängig/Wiederholen mit bis zu 100 Schritten (Strg+Z / Strg+Y)
- ✅ Statusvalidierung: Verhindert Statusänderung von "Kunde" zu einem anderen Status, wenn noch aktive Aufträge oder unbezahlte Rechnungen existieren
- ✅ **Server-seitige Speicherung**: Daten werden im Webspace via PHP-API gespeichert
- ✅ **Automatische Datenmigration**: LocalStorage-Daten werden automatisch zum Server migriert
- ✅ **Fallback-Mechanismus**: Bei Serverproblemen wird automatisch LocalStorage verwendet
- ✅ **Automatische Backups**: Vor jedem Speichern wird ein Backup erstellt

### Weitere Module (Platzhalter)
- 🚧 Artikellisten
- 🚧 Aufträge
- 🚧 Rechnungen
- 🚧 Kampagnen

### Kundenbereiche (NEU)
- ✅ Automatische Erstellung von Kundenkonten beim Statuswechsel zu "Kunde"
- ✅ Generierung sicherer Passwörter für Kundenzugänge
- ✅ Kundenportal mit schreibgeschützter Ansicht von Aufträgen und Rechnungen
- ✅ Admin-Übersicht aller Kunden mit Statistiken (Aufträge in Arbeit, unbezahlte Rechnungen, Gesamtsumme)
- ✅ Suchfunktion für Kunden
- ✅ PDF-Export für Aufträge und Rechnungen

### Einstellungen (NEU)
- ✅ Verwaltung der Firmendaten (Firmenname, Adresse, E-Mail, Telefon)
- ✅ Upload und Verwaltung des Firmenlogos
- ✅ Logo-Vorschau mit Entfernen-Funktion
- ✅ Formularvalidierung für E-Mail und Telefonnummer
- ✅ Datenpersistenz in LocalStorage
- ✅ Zurücksetzen-Funktion zum Verwerfen von Änderungen
- ✅ Erfolgs- und Fehlermeldungen
- ✅ Fußzeilen-Text für Aufträge und Rechnungen
- ✅ E-Mail-Konfiguration für automatische Benachrichtigungen

### E-Mail-Benachrichtigungen (NEU)
- ✅ Konfiguration von IMAP/SMTP-Einstellungen
- ✅ Automatische Benachrichtigungen für neue Kunden
- ✅ Benachrichtigungswarteschlange für spätere Backend-Integration
- ✅ Auswählbare Benachrichtigungstypen (Kunden, Aufträge, Rechnungen, Zahlungen)
- ⚠️ **Hinweis**: Frontend-only - E-Mails werden in Warteschlange gespeichert, Backend erforderlich zum Versenden
- 📖 Siehe [EMAIL_CONFIGURATION.md](EMAIL_CONFIGURATION.md) für Details

### PDF-Funktionalität (NEU)
- ✅ Automatische PDF-Generierung für Aufträge und Rechnungen
- ✅ Integration mit jsPDF-Bibliothek (via CDN)
- ✅ PDF-Anzeige im Kundenbereich für Aufträge und Rechnungen

## Technologie

- Vanilla JavaScript (ES6-Module)
- PHP 7.0+ für Server-API (Firmenliste)
- LocalStorage für Datenpersistenz (außer Firmenliste)
- jsPDF (via CDN) für PDF-Generierung
- Apache Webserver mit .htaccess-Unterstützung
- Keine Build-Tools erforderlich

## Anforderungen

- **Browser**: Moderner Browser mit ES6-Modulunterstützung
- **Server**: 
  - PHP 7.0 oder höher
  - Apache Webserver mit .htaccess
  - Schreibrechte für `data/` Verzeichnis
- **Empfohlen**: HTTPS für sichere Datenübertragung

## Deployment

Siehe [FIRMENLISTE_WEBSPACE_DOKUMENTATION.md](FIRMENLISTE_WEBSPACE_DOKUMENTATION.md) für detaillierte Deployment-Anleitung.
