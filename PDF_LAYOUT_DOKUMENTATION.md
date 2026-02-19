# PDF-Layout - Vollständige Dokumentation

## Übersicht

Diese Dokumentation beschreibt das komplette PDF-Layout-System für Rechnungen und Aufträge, einschließlich der Drei-Teile-Architektur, dynamischer Spaltenbreiten, Textumbruch und professionellem Design.

---

## Drei-Teile-Layout-Architektur

Das PDF-Layout folgt einer Drei-Teile-Struktur, die flexibel auf verschiedene Inhaltsmengen reagiert:

### 1. Kopf (Header)
- Alle Firmen- und Kundendaten
- Artikeltabelle mit Kopfzeile
- **Wächst nach unten**, wenn mehr Artikel hinzugefügt werden

### 2. Körper (Body)
- Summenbereich (Totals)
- Liegt immer unter dem Kopf
- Weicht nach unten aus, wenn der Kopf wächst
- Wächst nach unten bei mehr Inhalt

### 3. Fuß (Footer)
- **Fuß**: Hauptbereich mit Firmendaten und Bankverbindung
- **Zehen**: Fußzeilentext (footerTextOrder/footerTextInvoice)
- Bleibt stabil am Boden auf allen Seiten
- **Wächst nach oben, wenn der Fußzeilentext (Zehen) länger wird**
- Die Fußzeile passt sich dynamisch an die Textlänge an

### Implementierte Regeln

#### Regel 1: Kopf wächst nach unten
✅ Die Artikeltabelle kann beliebig viele Zeilen aufnehmen und wächst dabei nach unten.

#### Regel 2: Körper folgt dem Kopf
✅ Der Summenbereich (Körper) wird immer direkt nach der Artikeltabelle positioniert, mit einem festen Abstand von 5mm.

#### Regel 3: Fuß bleibt am Boden und wächst nach oben
✅ Der Fuß wird auf allen Seiten am Boden positioniert.
✅ Die Fußzeilenhöhe wird dynamisch basierend auf dem Inhalt berechnet.
✅ **Der Fußzeilentext ("Zehen") kann wachsen, und die Fußzeile wächst dann nach oben.**
✅ Der Fuß weicht nach oben aus, wenn die Zehen (Fußzeilentext) wachsen.

#### Regel 4: Kollisionserkennung
✅ Wenn eine Artikelzeile den Fuß berühren würde (weniger als 10mm Abstand), wird automatisch eine neue Seite eingefügt.
✅ Die Artikeltabelle wird auf der neuen Seite mit Header fortgesetzt.
✅ Alle Artikel werden in derselben Reihenfolge aufgelistet.

#### Regel 5: Mehrseitige Dokumente
✅ Auf jeder Seite gilt dasselbe Prinzip:
- Kopf (Artikeltabelle mit Header) wächst von oben
- Fuß bleibt am Boden
- Körper (Summen) wird nach allen Artikeln, aber vor dem Fuß positioniert

### Beispiel-Szenarien

#### Szenario 1: Wenige Artikel (1 Seite)
```
┌─────────────────┐
│ Header          │
│ Artikel 1-5     │
│                 │
│ Summen          │
├─────────────────┤
│ Fuß             │
└─────────────────┘
```

#### Szenario 2: Viele Artikel (2+ Seiten)
```
Seite 1:              Seite 2:              Seite 3:
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Header          │  │ Tabelle Header  │  │ Tabelle Header  │
│ Artikel 1-20    │  │ Artikel 21-40   │  │ Artikel 41-45   │
│                 │  │                 │  │                 │
│                 │  │                 │  │ Summen          │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Fuß             │  │ Fuß             │  │ Fuß             │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Technische Funktionen

**`calculateFooterHeight(doc, x, y, width, companySettings, documentType, documentData, paymentQRCode)`**
- Berechnet die tatsächliche Höhe der Fußzeile basierend auf dem Inhalt
- Berücksichtigt Bankverbindungsinformationen, QR-Code und Fußzeilentext
- Ermöglicht dynamisches Wachstum der Fußzeile nach oben

**`renderItemsTableWithFooter(doc, x, y, width, height, documentData, footerY)`**
- Rendert die Artikeltabelle mit Kollisionserkennung für den Fuß
- Prüft vor jeder Zeile, ob genug Platz bis zum Fuß vorhanden ist
- Fügt bei Bedarf eine neue Seite ein und setzt die Tabelle fort
- Gibt die End-Y-Position zurück für die Positionierung der Summen

---

## Dynamische Spaltenbreiten und Textumbruch

### Konzept: Volle Breitennutzung

Die Tabelle nutzt **immer die volle verfügbare Breite**:
- **Alle Spalten außer Beschreibung**: Breite basiert auf tatsächlichem Inhalt (Position, Menge, Einheit, Einzelpreis, Gesamtpreis)
- **Beschreibungsspalte**: Füllt **immer** den verbleibenden Platz aus, um die Tabelle auf volle Breite zu bringen
- Keine künstlichen Beschränkungen für feste Spalten - sie sind exakt so breit wie ihr Inhalt

### Dynamische Anpassung der Beschreibungsspalte

- Wenn andere Spalten wenig Platz brauchen: Beschreibung wird breiter (mehr Platz für Text)
- Wenn andere Spalten viel Platz brauchen: Beschreibung wird schmaler
- Wenn Beschreibung zu schmal wird: Text wird automatisch auf mehrere Zeilen umgebrochen
- Die Zeilenhöhe passt sich dynamisch an die Anzahl der Textzeilen an
- Andere Spalten bleiben vertikal zentriert in der Zeile
- Zeilenabstand: 4mm pro Zeile

### Vorteile

- ✅ Tabelle nutzt **immer die volle verfügbare Breite**
- ✅ Professionelles, ausgeglichenes Erscheinungsbild
- ✅ Keine abgeschnittenen Texte in Beschreibungen
- ✅ Präzise Spaltenbreiten für Zahlen und kurze Texte
- ✅ Maximale Flexibilität für Beschreibungen

### Technische Funktionen

**`calculateColumnWidths(doc, items, tableWidth)`**
- Misst die tatsächliche Breite aller Zelleninhalte (außer Beschreibung)
- Verwendet `doc.getTextWidth()` für präzise Messungen
- Position, Menge, Einheit, Einzelpreis, Gesamtpreis erhalten die minimale Breite für ihren Inhalt
- Beschreibungsspalte füllt immer die verbleibende Breite aus

**`calculateRowHeight(doc, beschreibung, beschreibungWidth, baseRowHeight)`**
- Berechnet benötigte Zeilenhöhe für umgebrochenen Text
- Teilt Text mit `doc.splitTextToSize()` auf
- Bei einer Zeile: Rückgabe der Basis-Zeilenhöhe
- Bei mehreren Zeilen: Berechnet Höhe basierend auf Anzahl der Zeilen + Padding

### Konstanten

```javascript
const CELL_PADDING = 4;          // Padding für Zellen in mm
const TEXT_LINE_HEIGHT = 4;      // Höhe pro Textzeile in mm
const ROW_TOP_PADDING = 4;       // Oberes Padding für mehrzeilige Zeilen
const ROW_BOTTOM_PADDING = 2;    // Unteres Padding für mehrzeilige Zeilen
```

---

## Dynamischer Summenbereich (Totals)

### Problem und Lösung

**Problem:** Der Summenbereich war zu schmal für große Beträge.

**Lösung:** Dynamische Breite basierend auf tatsächlichem Inhalt.

### Dynamische Breitenberechnung

1. **Inhaltsmessung**
   - Misst alle Labels (Nettobetrag, MwSt., Gesamtbetrag)
   - Misst alle Werte (formatierte Währungsbeträge)
   - Berücksichtigt verschiedene Schriftgrößen und -gewichte

2. **Intelligente Breitenauswahl**
   ```javascript
   const calculatedWidth = maxLabelWidth + labelValueGap + maxValueWidth + horizontalPadding;
   const actualWidth = Math.max(calculatedWidth, width, minWidth);
   ```
   - Verwendet das Maximum von:
     - Dynamisch berechneter Breite basierend auf Inhalt
     - Template-vorgegebener Breite
     - Mindestbreite (55mm)

3. **Rechtsbündige Positionierung**
   ```javascript
   const adjustedX = Math.max(leftMargin, Math.min(x, pageWidth - rightMargin - actualWidth));
   ```
   - Hält die Summen-Box rechtsbündig
   - Verhindert Überlauf über den rechten Seitenrand
   - Verhindert negative Positionierung über den linken Seitenrand
   - Passt X-Position an, wenn Breite zunimmt

### Testfälle

| Wertebereich | Beispiel | Erwartetes Verhalten |
|--------------|----------|----------------------|
| < 1.000 EUR | 500,00 € | Verwendet Mindestbreite (~55mm) |
| 1.000 - 10.000 EUR | 5.000,00 € | Leicht breiter für Tausendertrennzeichen |
| 10.000 - 100.000 EUR | 50.000,00 € | Erweitert sich für 5-stellige Beträge |
| 100.000 - 1.000.000 EUR | 250.000,00 € | Erweitert sich für 6-stellige Beträge |
| > 1.000.000 EUR | 1.000.000,00 € | Maximale Erweiterung für sehr große Beträge |

---

## Professionelles Design

### Header-Bereich

- **Logo**: Links positioniert (150x70 px)
- **Firmendaten**: Rechts ausgerichtet für bessere Balance
  - Firmenname (14pt, fett, rechts ausgerichtet)
  - Adresse (9pt, grau, rechts ausgerichtet)
  - Kontaktdaten (8pt, grau, rechts ausgerichtet)

### Dokumentinformationen

- **Dokumentenkopf**: Größerer Titel (24pt) mit modernerer Typografie
  - Verbesserte Abstände zwischen Elementen
  - Klarere Metadaten-Darstellung (Nummer, Datum)
- **Kundeninformation**: Boxed-Design mit feinem Rahmen
  - Subtile Umrandung (grau, 0.3mm)
  - Klare Hierarchie mit fettem Firmennamen
  - Bessere Lesbarkeit durch optimierte Zeilenabstände

### Artikeltabelle

- **Moderner Tabellenkopf**: Dunkler Hintergrund (RGB: 60,60,60) mit weißer Schrift
- **Alternierende Zeilen**: Hellere Hintergrundfarbe (RGB: 248,248,248)
- **Feine Trennlinien**: Zwischen Zeilen (grau, 0.1mm)
- **Erhöhte Zeilenhöhe**: 8mm für bessere Lesbarkeit (vorher 7mm)
- **Rahmen**: Dunkle untere Umrandung (0.5mm) für klaren Abschluss

### Summenbereich

- **Boxed-Design**: Hintergrund mit feinem Rahmen
  - Hellgrauer Hintergrund (RGB: 248,248,248)
- **Trennlinie**: Zwischen MwSt. und Gesamtbetrag
- **Größerer Gesamtbetrag**: 12pt fett für bessere Sichtbarkeit
- **Bessere Beschriftungen**: "Nettobetrag" statt "Netto"

### Fußzeile

- **Feine obere Trennlinie**: Grau, 0.3mm
- **Optimierte Abstände**: Kleinere Zeilenabstände (3.5mm) für kompakteres Design
- **Hellere Schriftfarbe**: RGB: 100,100,100 für subtileren Look

### Farbschema

- **Primärtext**: RGB: 30-40,30-40,30-40 (dunkles Grau statt Schwarz)
- **Sekundärtext**: RGB: 80,80,80 (mittelgrau)
- **Subtiler Text**: RGB: 100,100,100 (hellgrau)
- **Tabellenheader**: RGB: 60,60,60 (dunkelgrau)
- **Rahmen**: RGB: 220-230,220-230,220-230 (sehr hellgrau)

### Typografie

- **Dokumenttitel**: 24pt
- **Firmenname**: 14pt
- **Haupttext**: 9-10pt
- **Fußzeile**: 8pt
- **Konsistente Schriftgrößen** für bessere visuelle Hierarchie

---

## Layout-Koordinaten

### Standard-Template-Positionen (in Pixel, umgerechnet zu mm)

```javascript
{
  elements: [
    // Header: Logo links, Firmendaten rechts
    { id: 'logo', x: 20, y: 20, width: 150, height: 70 },
    { id: 'company-name', x: 380, y: 20, width: 158, height: 25 },
    { id: 'company-address', x: 380, y: 50, width: 158, height: 50 },
    { id: 'company-contact', x: 380, y: 105, width: 158, height: 40 },
    
    // Dokumentkopf und Kunde nebeneinander
    { id: 'document-header', x: 20, y: 160, width: 260, height: 50 },
    { id: 'customer-info', x: 320, y: 160, width: 218, height: 90 },
    
    // Artikeltabelle mit mehr Platz
    { id: 'items-table', x: 20, y: 270, width: 518, height: 350 },
    
    // Summen rechts ausgerichtet
    { id: 'totals', x: 380, y: 630, width: 158, height: 80 }
  ]
}
```

### Wichtige Konstanten

```javascript
const PDF_MARGIN = 10; // Seitenrand in mm
const PAGE_NUMBER_MARGIN_FROM_BOTTOM = 5; // Abstand der Seitennummer vom Seitenende
const TOTALS_FOOTER_SPACING_MM = 6; // Mindestabstand zwischen Summen und Fuß
const minSpacingBeforeFooter = 10; // Mindestabstand vor dem Fuß für Artikeltabelle
const spacing = 5; // Abstand zwischen Tabelle und Summen
```

**Hinweis:** Die Fußzeilenhöhe wird dynamisch berechnet und ist nicht mehr fest auf 50mm gesetzt.

---

## Verwendung

Das neue Layout wird automatisch verwendet, wenn PDFs mit dem Parameter `useStandardTemplate = true` generiert werden:

```javascript
const pdf = await generatePDF('invoice', documentData, false, null, true);
```

Dies ist bereits in `kundenbereich-render.js` für Kundenaufträge und Rechnungen implementiert.

---

## Testing

### Testszenarien

#### Test 1: Wenige Artikel (1 Seite)
- Generiere ein PDF mit 5-10 Artikeln
- **Erwartung**: Alles auf einer Seite, Fuß am Boden

#### Test 2: Viele Artikel (2+ Seiten)
- Generiere ein PDF mit 30+ Artikeln
- **Erwartung**: Mehrere Seiten, Tabelle wird fortgesetzt, Fuß auf jeder Seite

#### Test 3: Grenzfall-Kollision
- Generiere ein PDF mit genau so vielen Artikeln, dass der letzte fast den Fuß berührt
- **Erwartung**: Letzter Artikel springt auf neue Seite wenn < 10mm Abstand

#### Test 4: Kurze Beschreibungen
- Artikel mit kurzen Beschreibungen wie "Beratung" oder "Entwicklung"
- **Erwartung**: Breite Beschreibungsspalte, Standard-Zeilenhöhe

#### Test 5: Lange Beschreibungen
- Artikel mit sehr langen Beschreibungen (100+ Zeichen)
- **Erwartung**: Text wird umgebrochen, Zeilenhöhe erhöht sich

#### Test 6: Große Beträge
- Beträge über 100.000 EUR
- **Erwartung**: Summenbereich erweitert sich automatisch

---

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

### Rückwärtskompatibilität
- ✅ Funktioniert mit bestehenden Layouts
- ✅ Keine Änderungen an anderen Modulen erforderlich
- ✅ Erhält alle bisherigen Features (QR-Code, Rabatte, etc.)

---

## Bekannte Einschränkungen

- Die Höhe des Summenbereichs wird auf 25mm geschätzt. Bei sehr langen Rabatt-Texten könnte eine Anpassung nötig sein.

---

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

Um Zeilenhöhe oder Padding zu ändern, editieren Sie die Konstanten:
```javascript
const CELL_PADDING = 4;          // Zellen-Padding in mm
const TEXT_LINE_HEIGHT = 4;      // Zeilenhöhe in mm
const ROW_TOP_PADDING = 4;       // Oberes Padding
const ROW_BOTTOM_PADDING = 2;    // Unteres Padding
```

### Anpassung der Summenbereich-Parameter

```javascript
const minWidth = 55;             // Mindestbreite in mm
const horizontalPadding = 10;    // Gesamtes horizontales Padding (5mm pro Seite)
const labelValueGap = 5;         // Abstand zwischen Label und Wert
```

---

## Vorteile des Systems

1. ✅ **Professioneller Eindruck**: Modernes, sauberes Design
2. ✅ **Bessere Lesbarkeit**: Optimierte Schriftgrößen und Abstände
3. ✅ **Klarere Struktur**: Logische Gruppierung von Informationen
4. ✅ **Visuell ausgewogen**: Bessere Balance zwischen Links und Rechts
5. ✅ **Konsistente Gestaltung**: Einheitliches Farbschema und Typografie
6. ✅ **Moderne Ästhetik**: Subtile Rahmen, Schattierungen
7. ✅ **Flexible Anpassung**: Dynamische Breiten und Höhen
8. ✅ **Keine abgeschnittenen Inhalte**: Automatischer Textumbruch
9. ✅ **Mehrseitenunterstützung**: Intelligente Seitenumbrüche
10. ✅ **Wartbar**: Klare Konstanten und gut dokumentierter Code

---

## Zusammenfassung

Das PDF-Layout-System bietet:

1. **Drei-Teile-Architektur** mit intelligentem Wachstumsverhalten
2. **Dynamische Spaltenbreiten** basierend auf tatsächlichem Inhalt
3. **Automatischer Textumbruch** in der Beschreibungsspalte
4. **Dynamischer Summenbereich** der sich an große Beträge anpasst
5. **Professionelles Design** mit modernem Erscheinungsbild
6. **Mehrseitenunterstützung** mit Kollisionserkennung
7. **Vollständige Kompatibilität** mit bestehenden Features
8. **Wartbarer Code** mit klaren Konstanten und Funktionen

Die Lösung ist produktionsreif und kann sofort eingesetzt werden.
