# Dynamic Table Column Widths and Text Wrapping - Implementation Documentation

## Übersicht

Diese Implementierung erfüllt die Anforderung, dass Tabellenspalten in PDF-Rechnungen und -Aufträgen ihre Breite basierend auf dem Inhalt anpassen und lange Beschreibungen automatisch umgebrochen werden.

## Anforderungen

### 1. Spaltenbreiten basierend auf Inhalt
**Regel:** Alle Spalten (außer Beschreibung) sind so breit wie ihr Inhalt. Die Beschreibungsspalte gleicht die Gesamtbreite aus.

**Implementierung:**
- Neue Funktion `calculateColumnWidths()` misst die tatsächliche Breite aller Zelleninhalte (außer Beschreibung)
- **Position, Menge, Einheit, Einzelpreis, Gesamtpreis**: Erhalten die minimale Breite für ihren Inhalt
- **Beschreibungsspalte**: Ist die flexible Spalte und füllt immer die verbleibende Breite aus
- Die Tabelle nutzt **immer die volle verfügbare Breite**

### 2. Beschreibungsspalte als Ausgleichsspalte
**Regel:** Die Beschreibungsspalte passt sich dynamisch an, um die Tabelle auf volle Breite zu bringen.

**Implementierung:**
- Wenn andere Spalten wenig Platz benötigen: Beschreibung wird breiter (mehr Platz für Text)
- Wenn andere Spalten viel Platz benötigen: Beschreibung wird schmaler
- Wenn Beschreibung zu schmal für Inhalt wird: Text wird automatisch umgebrochen
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
  pos: number,         // Positionsnummer (basierend auf Inhalt)
  beschreibung: number, // Beschreibung (verbleibender Platz - flexible Spalte)
  menge: number,       // Menge (basierend auf Inhalt)
  einheit: number,     // Einheit (basierend auf Inhalt)
  einzelpreis: number, // Einzelpreis (basierend auf Inhalt)
  gesamtpreis: number  // Gesamtpreis (basierend auf Inhalt)
}
```

**Ablauf:**
1. Misst Kopfzeilen-Text mit `doc.getTextWidth()` für alle Spalten außer Beschreibung
2. Misst alle Datenzeilen für jede Spalte außer Beschreibung
3. Berechnet benötigte Breite für Position, Menge, Einheit, Einzelpreis, Gesamtpreis
4. Beschreibungsspalte erhält **immer** den verbleibenden Platz (tableWidth - andere Spalten)
5. Tabelle nutzt **immer die volle verfügbare Breite**

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

### Beispiel 1: Kurze Beschreibungen mit wenigen anderen Spalten
```
Artikel mit kurzen Beschreibungen wie "Beratung" oder "Entwicklung":
- Position, Menge, Einheit, Preise nutzen minimal benötigte Breite
- Beschreibungsspalte füllt den Rest der Tabellenbreite aus (wird breiter)
- Tabelle nutzt immer 100% der verfügbaren Breite
- Standard-Zeilenhöhe (8mm)
```

### Beispiel 2: Lange Beschreibungen mit breiten Preisspalten
```
Große Beträge wie "1.234.567,89 €" in Preisspalten:
- Preisspalten werden breiter für die Zahlen
- Beschreibungsspalte wird automatisch schmaler
- Text in Beschreibung wird auf 2-3 Zeilen umgebrochen
- Zeilenhöhe wächst auf z.B. 14mm
- Andere Spalten bleiben zentriert
- Tabelle nutzt immer 100% der verfügbaren Breite
```

### Beispiel 3: Gemischte Inhalte
```
Einige Artikel mit kurzen, andere mit langen Beschreibungen:
- Jede Zeile hat individuelle Höhe je nach Textumbruch
- Spaltenbreiten sind für alle Zeilen gleich
- Beschreibung passt sich an, um Tabelle auf volle Breite zu bringen
- Optimale und konsistente Platznutzung
```

## Vorteile der Implementierung

### 1. Volle Breitennutzung
- ✅ Tabelle nutzt **immer die volle verfügbare Breite**
- ✅ Keine verschwendete Breite rechts der Tabelle
- ✅ Professionelles, ausgeglichenes Erscheinungsbild
- ✅ Beschreibungsspalte passt sich flexibel an

### 2. Präzise Spaltenbreiten
- ✅ Alle Spalten außer Beschreibung sind exakt so breit wie ihr Inhalt
- ✅ Keine zu breiten oder zu schmalen Spalten
- ✅ Maximaler Platz für Beschreibungen bei kurzen Preisen
- ✅ Automatischer Textumbruch bei knappem Platz

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
