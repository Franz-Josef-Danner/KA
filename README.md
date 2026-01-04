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
   - E-Mail: `demo@example.com`
   - Passwort: `demo123`
3. Nach dem Login gelangen Sie zum Dashboard mit folgenden Bereichen:
   - **Firmenliste**: Verwaltung von Firmenkontakten (vollständig implementiert)
   - **Artikellisten**: Artikellisten-Verwaltung (Platzhalter)
   - **Aufträge**: Auftrags-Verwaltung (Platzhalter)
   - **Rechnungen**: Rechnungs-Verwaltung (Platzhalter)
   - **Kampagnen**: Kampagnen-Verwaltung (Platzhalter)
4. Die Anwendung verwendet ES6-Module (type="module")
5. Alle Daten werden im LocalStorage des Browsers gespeichert
6. Sessions sind 24 Stunden gültig

## Funktionen

### Authentifizierung & Navigation
- ✅ Login-System mit E-Mail und Passwort
- ✅ Session-Management (24 Stunden Gültigkeit)
- ✅ Automatische Weiterleitung zu Login bei unautorisierten Zugriffen
- ✅ Einheitliches Navigationsmenü auf allen Seiten
- ✅ Logout-Funktionalität mit Bestätigung

### Firmenliste (vollständig implementiert)
- ✅ Zeilen hinzufügen/löschen
- ✅ Inline-Bearbeitung
- ✅ CSV-Import/Export
- ✅ Duplikatserkennung mit Highlighting
- ✅ Suchfunktion
- ✅ Automatische Link-Formatierung für E-Mails und Websites
- ✅ Rückgängig/Wiederholen mit bis zu 100 Schritten (Strg+Z / Strg+Y)
- ✅ Statusvalidierung: Verhindert Statusänderung von "Kunde" zu einem anderen Status, wenn noch aktive Aufträge oder unbezahlte Rechnungen existieren

### Weitere Module (Platzhalter)
- 🚧 Artikellisten
- 🚧 Aufträge
- 🚧 Rechnungen
- 🚧 Kampagnen

## Technologie

- Vanilla JavaScript (ES6-Module)
- LocalStorage für Datenpersistenz
- Keine externen Abhängigkeiten
