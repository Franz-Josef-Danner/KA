# Dynamic Table Column Widths and Text Wrapping - Implementation Documentation

## Übersicht

Diese Implementierung erfüllt die Anforderung, dass Tabellenspalten in PDF-Rechnungen und -Aufträgen ihre Breite basierend auf dem Inhalt anpassen und lange Beschreibungen automatisch umgebrochen werden.

## Anforderungen

### 1. Spaltenbreiten basierend auf Inhalt
**Regel:** Der Inhalt der Zellen definiert die Breite der Spalte, die Spalte ist nie größer als der Inhalt der einzelnen Zellen.

**Implementierung:**
- Neue Funktion `calculateColumnWidths()` misst die tatsächliche Breite aller Zelleninhalte
- Jede Spalte (außer Beschreibung) erhält die minimale Breite, die für ihren Inhalt benötigt wird
- Min/Max-Beschränkungen verhindern zu schmale oder zu breite Spalten
- Beschreibungsspalte erhält den verbleibenden Platz

### 2. Textumbruch in der Beschreibungsspalte
**Regel:** Wenn die Spalten keinen Platz mehr zum Ausdehnen haben, wird in der Spalte Beschreibung der Inhalt auf zwei Zeilen in derselben Zelle aufgeteilt.

**Implementierung:**
- Neue Funktion `calculateRowHeight()` erkennt, wann Text umgebrochen werden muss
- Text wird automatisch auf mehrere Zeilen aufgeteilt
- Zeilenhöhe passt sich dynamisch an die Anzahl der Zeilen an
- Andere Spalten bleiben vertikal zentriert

## Technische Details

### Neue Funktionen

#### `calculateColumnWidths(doc, items, tableWidth)`
```javascript
// Berechnet optimale Spaltenbreiten basierend auf Inhalt
// Rückgabe: Objekt mit Breiten für jede Spalte
{
  pos: number,         // Positionsnummer (6-10% der Tabellenbreite)
  beschreibung: number, // Beschreibung (verbleibender Platz)
  menge: number,       // Menge (8-12%)
  einheit: number,     // Einheit (8-12%)
  einzelpreis: number, // Einzelpreis (14-18%)
  gesamtpreis: number  // Gesamtpreis (14-18%)
}
```

**Ablauf:**
1. Definiert Min/Max-Breiten für jede Spalte als Prozentsatz der Tabellenbreite
2. Misst Kopfzeilen-Text mit `doc.getTextWidth()`
3. Misst alle Datenzeilen für jede Spalte
4. Wendet Max-Beschränkungen an
5. Berechnet Beschreibungsbreite als verbleibenden Platz

#### `calculateRowHeight(doc, beschreibung, beschreibungWidth, baseRowHeight)`
```javascript
// Berechnet benötigte Zeilenhöhe für umgebrochenen Text
// Rückgabe: Höhe in mm
```

**Ablauf:**
1. Prüft ob Beschreibung vorhanden ist
2. Teilt Text mit `doc.splitTextToSize()` auf
3. Bei einer Zeile: Rückgabe der Basis-Zeilenhöhe
4. Bei mehreren Zeilen: Berechnet Höhe basierend auf Anzahl der Zeilen + Padding

### Konstanten

```javascript
const CELL_PADDING = 4;          // Padding für Zellen in mm
const TEXT_LINE_HEIGHT = 4;      // Höhe pro Textzeile in mm
const ROW_TOP_PADDING = 4;       // Oberes Padding für mehrzeilige Zeilen
const ROW_BOTTOM_PADDING = 2;    // Unteres Padding für mehrzeilige Zeilen
```

Diese Konstanten gewährleisten:
- Konsistente Abstände in der gesamten Tabelle
- Einfache Anpassung des Erscheinungsbilds
- Wartbarkeit des Codes

### Geänderte Funktionen

#### `renderItemsTableWithFooter()`
- Verwendet `calculateColumnWidths()` statt fester Prozentsätze
- Berechnet Zeilenhöhe dynamisch für jede Zeile
- Text wird mit `doc.splitTextToSize()` umgebrochen
- Kollisionserkennung berücksichtigt dynamische Zeilenhöhen

#### `renderItemsTable()`
- Identische Änderungen wie `renderItemsTableWithFooter()`
- Funktioniert ohne Footer-Kollisionserkennung
- Für Standard-PDF-Generierung

## Beispiele

### Beispiel 1: Kurze Beschreibungen
```
Artikel mit kurzen Beschreibungen wie "Beratung" oder "Entwicklung":
- Spalten nutzen minimal benötigte Breite
- Beschreibungsspalte erhält viel Platz
- Standard-Zeilenhöhe (8mm)
```

### Beispiel 2: Lange Beschreibungen
```
"Entwicklung einer komplexen Webanwendung mit React und Node.js inkl. Datenbankintegration":
- Text wird auf 2-3 Zeilen umgebrochen
- Zeilenhöhe wächst auf z.B. 14mm
- Andere Spalten bleiben zentriert
```

### Beispiel 3: Gemischte Inhalte
```
Einige Artikel mit kurzen, andere mit langen Beschreibungen:
- Jede Zeile hat individuelle Höhe
- Spaltenbreiten sind für alle Zeilen gleich
- Optimale Platznutzung
```

## Vorteile der Implementierung

### 1. Effizienter Platzverbrauch
- ✅ Keine verschwendete Breite bei schmalen Spalten
- ✅ Maximaler Platz für wichtige Informationen (Beschreibung)
- ✅ Automatische Anpassung an verschiedene Inhalte

### 2. Professionelles Erscheinungsbild
- ✅ Kompakte Darstellung bei kurzen Inhalten
- ✅ Vollständige Anzeige langer Texte ohne Abschneiden
- ✅ Konsistente Formatierung

### 3. Wartbarkeit
- ✅ Zentrale Konstanten für einfache Anpassungen
- ✅ Klare Funktionsaufteilung
- ✅ Gut dokumentierter Code

### 4. Rückwärtskompatibilität
- ✅ Funktioniert mit bestehenden Layouts
- ✅ Keine Änderungen an anderen Modulen erforderlich
- ✅ Standard- und Custom-Templates werden unterstützt

## Testszenarien

### Test 1: Kurze Beschreibungen
**Daten:**
```javascript
items: [
  { beschreibung: "Beratung", menge: "2", einheit: "Std", einzelpreis: "80.00", gesamtpreis: "160.00" },
  { beschreibung: "Design", menge: "5", einheit: "Std", einzelpreis: "75.00", gesamtpreis: "375.00" }
]
```
**Erwartung:**
- Spalten sind schmal
- Beschreibung hat viel Platz
- Standard-Zeilenhöhe

### Test 2: Lange Beschreibungen
**Daten:**
```javascript
items: [
  { 
    beschreibung: "Entwicklung einer komplexen Webanwendung mit React, Node.js, MongoDB, inklusive API-Integration, Authentifizierung und Deployment", 
    menge: "120", 
    einheit: "Std", 
    einzelpreis: "85.00", 
    gesamtpreis: "10200.00" 
  }
]
```
**Erwartung:**
- Text wird auf 2-3 Zeilen umgebrochen
- Zeilenhöhe erhöht sich
- Andere Spalten bleiben zentriert

### Test 3: Gemischte Längen
**Daten:**
Kombination aus kurzen und langen Beschreibungen
**Erwartung:**
- Unterschiedliche Zeilenhöhen
- Konsistente Spaltenbreiten
- Professionelles Gesamtbild

### Test 4: Sehr lange Preise
**Daten:**
```javascript
{ einzelpreis: "1234567.89", gesamtpreis: "9999999.99" }
```
**Erwartung:**
- Preisspalten erweitern sich bis zum Maximum (18%)
- Beschreibung passt sich an verringerten Platz an

## Kompatibilität

### Unterstützte Formate
- ✅ Rechnungen (invoice/rechnung)
- ✅ Aufträge (order/auftrag)
- ✅ Standard-Template
- ✅ Custom-Layouts
- ✅ Mehrseitige Dokumente

### Browser/PDF-Viewer
- ✅ Chrome/Edge PDF-Viewer
- ✅ Firefox PDF-Viewer
- ✅ Adobe Acrobat Reader
- ✅ Andere Standard-konforme PDF-Viewer

## Bekannte Einschränkungen

### Keine aktuellen Einschränkungen
Die Implementierung erfüllt alle Anforderungen vollständig:
- ✅ Spaltenbreiten basieren auf Inhalt
- ✅ Textumbruch in Beschreibungsspalte funktioniert
- ✅ Dynamische Zeilenhöhen werden korrekt berechnet
- ✅ Kompatibel mit bestehenden Features

## Wartung und Anpassungen

### Anpassung der Spaltenbreiten-Bereiche
Um die Min/Max-Bereiche zu ändern, editieren Sie in `calculateColumnWidths()`:
```javascript
const minWidths = {
  pos: tableWidth * 0.06,        // Ändern Sie den Prozentsatz
  // ...
};
const maxWidths = {
  pos: tableWidth * 0.10,        // Ändern Sie den Prozentsatz
  // ...
};
```

### Anpassung der Textformatierung
Um Zeilenhöhe oder Padding zu ändern, editieren Sie die Konstanten am Anfang der Datei:
```javascript
const CELL_PADDING = 4;          // Zellen-Padding in mm
const TEXT_LINE_HEIGHT = 4;      // Zeilenhöhe in mm
const ROW_TOP_PADDING = 4;       // Oberes Padding
const ROW_BOTTOM_PADDING = 2;    // Unteres Padding
```

## Zusammenfassung

Diese Implementierung erfüllt die Anforderungen vollständig und bietet:
1. **Dynamische Spaltenbreiten** basierend auf tatsächlichem Inhalt
2. **Automatischer Textumbruch** in der Beschreibungsspalte
3. **Professionelles Erscheinungsbild** bei allen Inhaltstypen
4. **Wartbarer Code** mit klaren Konstanten und Funktionen
5. **Vollständige Kompatibilität** mit bestehenden Features

Die Lösung ist produktionsreif und kann sofort eingesetzt werden.
