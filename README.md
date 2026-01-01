# Firmen-Kontakte Tabelle

Eine browserbasierte Anwendung zur Verwaltung von Firmenkontakten mit Import/Export-Funktionalität.

## Projekt-Struktur

Das Projekt wurde in eine modulare Struktur reorganisiert, um die Wartbarkeit zu verbessern:

```
KA/
├── css/
│   └── styles.css              # Alle CSS-Styles
├── js/
│   ├── app.js                  # Haupt-Einstiegspunkt der Anwendung
│   ├── modules/                # Kernmodule
│   │   ├── config.js           # Konfiguration (STORAGE_KEY, COLUMNS)
│   │   ├── state.js            # State-Verwaltung (Daten laden/speichern)
│   │   ├── render.js           # DOM-Rendering-Logik
│   │   ├── events.js           # Event-Handler für UI-Interaktionen
│   │   ├── modal.js            # Modal-Verwaltung
│   │   ├── duplicates.js       # Duplikatserkennung
│   │   └── search.js           # Such-Funktionalität
│   └── utils/                  # Hilfsfunktionen
│       ├── sanitize.js         # Text-Bereinigung und Escaping
│       ├── formatting.js       # Formatierung für Zellenanzeige
│       ├── helpers.js          # Allgemeine Hilfsfunktionen
│       └── csv.js              # CSV-Import/Export
└── tabelle.html                # HTML-Hauptdatei

```

## Module-Übersicht

### Kernmodule (`js/modules/`)

- **config.js**: Zentrale Konfiguration
  - Speicherschlüssel für LocalStorage
  - Spaltendefinitionen

- **state.js**: State-Management
  - Laden und Speichern von Daten
  - Verwaltung des Zeilen-Arrays
  - Erstellen leerer Zeilen

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

- **modal.js**: Modal-Verwaltung
  - Modal öffnen/schließen
  - Tastatur-Navigation (Tab-Trap, ESC)
  - Fokus-Management

- **duplicates.js**: Duplikatserkennung
  - Erkennen von doppelten Werten
  - Zeilen mit Duplikaten markieren

- **search.js**: Such-Funktionalität
  - Filtern von Zeilen nach Suchbegriff

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

1. Öffnen Sie `tabelle.html` in einem modernen Webbrowser
2. Die Anwendung verwendet ES6-Module (type="module")
3. Alle Daten werden im LocalStorage des Browsers gespeichert

## Funktionen

- ✅ Zeilen hinzufügen/löschen
- ✅ Inline-Bearbeitung
- ✅ CSV-Import/Export
- ✅ Duplikatserkennung mit Highlighting
- ✅ Suchfunktion
- ✅ Automatische Link-Formatierung für E-Mails und Websites
- ✅ Barrierefreie Modal-Dialoge

## Technologie

- Vanilla JavaScript (ES6-Module)
- LocalStorage für Datenpersistenz
- Keine externen Abhängigkeiten
