# Dashboard Charts - Implementierung

## Übersicht

Die Dashboard-Charts zeigen zwei graphische Trends für das aktuelle Jahr:

1. **Tatsächliche Entwicklung**: Zeigt den Anstieg der Einnahmen (bezahlte Rechnungen) und Ausgaben (bezahlte Ausgaben) über das Jahr
2. **Prognose-Entwicklung**: Zeigt eine durchschnittliche Projektion für Einnahmen und Ausgaben mit Einbindung der offenen Rechnungen und Ausgaben

## Features

### Chart 1: Tatsächliche Entwicklung
- Zeigt kumulative (aufaddierte) Einnahmen aus bezahlten Rechnungen pro Monat
- Zeigt kumulative Ausgaben aus bezahlten Ausgaben pro Monat
- Verwendet das Zahlungsdatum (wenn verfügbar) oder Rechnungsdatum
- Daten werden nur für das aktuelle Jahr angezeigt

### Chart 2: Prognose-Entwicklung
- Zeigt die gleichen tatsächlichen Daten bis zum aktuellen Monat
- Projiziert zukünftige Einnahmen basierend auf offenen Rechnungen
- Projiziert zukünftige Ausgaben basierend auf offenen Ausgaben
- Offene Beträge werden gleichmäßig auf die verbleibenden Monate verteilt
- Zukünftige Monate werden mit gestrichelten Linien dargestellt

## Technische Details

### Dateien
- `dashboard.html` - Dashboard-Seite mit Chart-Containern und JavaScript
- `api/load-dashboard-charts.php` - API-Endpoint für Chart-Daten
- `css/styles.css` - Styling für Chart-Bereiche

### Abhängigkeiten
- **Chart.js 4.4.1** - JavaScript-Bibliothek für Charts
  - Wird von CDN geladen: `https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`
  - Kann auch lokal heruntergeladen werden für Offline-Betrieb

### API-Endpoint

**GET** `/api/load-dashboard-charts.php`

Liefert monatliche Daten für das aktuelle Jahr:

```json
{
  "success": true,
  "data": {
    "year": "2026",
    "currentMonth": 1,
    "labels": ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    "actual": {
      "revenue": [5000, 13000, 16000, ...],
      "expenses": [1200, 2000, 3500, ...]
    },
    "projected": {
      "revenue": [5000, 16545.45, 17090.91, ...],
      "expenses": [1200, 4000, 4500, ...]
    }
  }
}
```

### Datenberechnung

#### Einnahmen (Actual)
- Summiert alle bezahlten Rechnungen (`Bezahlt === 'bezahlt'`)
- Verwendet `Zahlungsdatum` (wenn verfügbar), sonst `Rechnungsdatum`
- Berechnet Gesamtsumme aus `items` Array oder `Gesamtsumme` Feld
- Berücksichtigt Rabatt-Prozentsätze

#### Ausgaben (Actual)
- Summiert alle bezahlten Ausgaben (`Status === 'bezahlt'`)
- Verwendet `Datum` Feld
- Liest `Betrag` Feld

#### Projektion
- Tatsächliche Werte bis zum aktuellen Monat
- Offene Rechnungen und Ausgaben werden auf verbleibende Monate verteilt
- Gleichmäßige Verteilung: `Gesamtbetrag / verbleibende Monate`

## Styling

Die Charts passen sich dem bestehenden Dashboard-Design an:

- Einnahmen: Lila/Blau (#667eea)
- Ausgaben: Pink/Rot (#f5576c)
- Responsive Design mit `aspectRatio: 2.5`
- Hover-Effekte auf Chart-Containern
- Deutsche Währungsformatierung (€)

## Installation

Die Charts werden automatisch auf der Dashboard-Seite geladen. Keine zusätzliche Konfiguration erforderlich.

### Offline-Betrieb

Für Offline-Betrieb oder wenn CDN nicht verfügbar:

1. Chart.js herunterladen:
```bash
curl -o js/libs/chart.umd.min.js https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js
```

2. In `dashboard.html` die CDN-URL ersetzen:
```html
<script src="js/libs/chart.umd.min.js"></script>
```

## Testing

Eine Test-Seite ohne Authentifizierung ist verfügbar unter:
- `test-charts.html` - Zeigt Charts mit Beispieldaten

## Browser-Kompatibilität

- Chrome/Edge: ✓
- Firefox: ✓
- Safari: ✓
- IE11: ✗ (nicht unterstützt)

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- Export der Charts als Bild (PNG/PDF)
- Auswahl verschiedener Zeiträume (Quartal, Halbjahr)
- Detailansicht beim Klick auf einen Monat
- Vergleich mit Vorjahr
- Weitere Chart-Typen (Balken, Kreisdiagramme)
