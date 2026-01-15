# PDF Drei-Teile-Layout Implementierung

## Übersicht

Die PDF-Generierung wurde angepasst, um die Anforderungen der Drei-Teile-Struktur zu erfüllen:

### 1. Kopf (Header)
- Alle Firmen- und Kundendaten
- Artikeltabelle
- Wächst nach unten, wenn mehr Artikel hinzugefügt werden

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

## Implementierte Regeln

### Regel 1: Kopf wächst nach unten
✅ Die Artikeltabelle kann beliebig viele Zeilen aufnehmen und wächst dabei nach unten.

### Regel 2: Körper folgt dem Kopf
✅ Der Summenbereich (Körper) wird immer direkt nach der Artikeltabelle positioniert, mit einem festen Abstand von 5mm.

### Regel 3: Fuß bleibt am Boden und wächst nach oben
✅ Der Fuß wird auf allen Seiten am Boden positioniert.
✅ Die Fußzeilenhöhe wird dynamisch basierend auf dem Inhalt berechnet.
✅ **Der Fußzeilentext ("Zehen") kann wachsen, und die Fußzeile wächst dann nach oben.**
✅ Der Fuß weicht nach oben aus, wenn die Zehen (Fußzeilentext) wachsen.

### Regel 4: Kollisionserkennung
✅ Wenn eine Artikelzeile den Fuß berühren würde (weniger als 10mm Abstand), wird automatisch eine neue Seite eingefügt.
✅ Die Artikeltabelle wird auf der neuen Seite mit Header fortgesetzt.
✅ Alle Artikel werden in derselben Reihenfolge aufgelistet.

### Regel 5: Mehrseitige Dokumente
✅ Auf jeder Seite gilt dasselbe Prinzip:
- Kopf (Artikeltabelle mit Header) wächst von oben
- Fuß bleibt am Boden
- Körper (Summen) wird nach allen Artikeln, aber vor dem Fuß positioniert

## Technische Änderungen

### Neue Funktionen

**`calculateFooterHeight(doc, x, y, width, companySettings, documentType, documentData, paymentQRCode)`**
- Berechnet die tatsächliche Höhe der Fußzeile basierend auf dem Inhalt
- Berücksichtigt Bankverbindungsinformationen, QR-Code und Fußzeilentext
- Ermöglicht dynamisches Wachstum der Fußzeile nach oben

**`renderItemsTableWithFooter(doc, x, y, width, height, documentData, footerY)`**
- Rendert die Artikeltabelle mit Kollisionserkennung für den Fuß
- Prüft vor jeder Zeile, ob genug Platz bis zum Fuß vorhanden ist
- Fügt bei Bedarf eine neue Seite ein und setzt die Tabelle fort
- Gibt die End-Y-Position zurück für die Positionierung der Summen

### Geänderte Funktionen

**`renderPDFDocument(...)`**
- Berechnet die Fußzeilenhöhe dynamisch zu Beginn
- Positioniert die Fußzeile vom Seitenende aus, wachsend nach oben basierend auf der tatsächlichen Höhe
- Rendert Items-Tabelle und Totals separat mit spezieller Logik
- Positioniert Totals dynamisch nach der Tabelle
- Rendert den Fuß auf allen Seiten an der dynamisch berechneten Position

### Konstanten

```javascript
const PDF_MARGIN = 10; // Seitenrand in mm
const PAGE_NUMBER_MARGIN_FROM_BOTTOM = 5; // Abstand der Seitennummer vom Seitenende
const TOTALS_FOOTER_SPACING_MM = 6; // Mindestabstand zwischen Summen und Fuß
const minSpacingBeforeFooter = 10; // Mindestabstand vor dem Fuß für Artikeltabelle
const spacing = 5; // Abstand zwischen Tabelle und Summen
```

**Hinweis:** Die Fußzeilenhöhe wird dynamisch berechnet und ist nicht mehr fest auf 50mm gesetzt.

## Fußzeilen-Wachstum (Fuß und Zehen)

Die Fußzeile besteht konzeptuell aus zwei Teilen:

### Fuß (Hauptbereich)
- Bankverbindungsinformationen (bei Rechnungen)
- QR-Code für Zahlungen (bei Rechnungen mit IBAN)
- Feste Strukturelemente

### Zehen (Fußzeilentext)
- Konfigurierbarer Text (`footerTextOrder` für Aufträge, `footerTextInvoice` für Rechnungen)
- Kann beliebig lang sein und wird automatisch umbrochen
- Wächst nach oben, wenn mehr Text hinzugefügt wird

### Dynamisches Verhalten
1. Die Gesamthöhe der Fußzeile wird vor dem Rendern berechnet
2. Die Fußzeile wird vom Seitenende aus positioniert (5mm über der Seitennummer)
3. Bei längerem Fußzeilentext wächst die Fußzeile nach oben
4. Der Rest des Dokuments (Kopf und Körper) passt sich automatisch an

**Beispiel:**
- Kurzer Fußzeilentext: Fußzeile beginnt bei ca. Y=270mm
- Langer Fußzeilentext (5 Zeilen): Fußzeile beginnt bei ca. Y=252mm (wächst 18mm nach oben)

## Beispiel-Szenarien

### Szenario 1: Wenige Artikel (1 Seite)
- Header-Elemente (Logo, Firma, Kunde)
- Artikeltabelle mit 5 Zeilen
- Summenbereich
- Fußzeile am Boden

### Szenario 2: Viele Artikel (2+ Seiten)
- **Seite 1:**
  - Header-Elemente
  - Artikeltabelle (Zeilen 1-20)
  - Fußzeile am Boden
  
- **Seite 2:**
  - Artikeltabelle mit Header (Zeilen 21-40)
  - Fußzeile am Boden
  
- **Seite 3 (letzte Seite):**
  - Artikeltabelle mit Header (Zeilen 41-45)
  - Summenbereich
  - Fußzeile am Boden

## Verhalten bei Kollision

```
Seite 1:                          Seite 2:
┌─────────────────┐              ┌─────────────────┐
│ Header          │              │ Tabelle Header  │
│ Artikel 1-20    │              │ Artikel 21-30   │
│                 │              │                 │
│                 │              │ Summen          │
├─────────────────┤              ├─────────────────┤
│ Fuß             │              │ Fuß             │
└─────────────────┘              └─────────────────┘
```

Wenn Artikel 21 auf Seite 1 den Fuß berühren würde:
1. Neue Seite wird eingefügt
2. Tabellen-Header wird auf Seite 2 gerendert
3. Artikel 21 beginnt nach dem Header
4. Summen werden nach allen Artikeln auf der letzten Seite platziert

## Kompatibilität

✅ Rückwärtskompatibel mit bestehenden Layouts
✅ Funktioniert mit Standard-Template und Custom-Layouts
✅ Unterstützt sowohl Aufträge als auch Rechnungen
✅ Erhält alle bisherigen Features (QR-Code, Rabatte, etc.)

## Testing

Um die Implementierung zu testen:

1. Generiere ein PDF mit wenigen Artikeln (5-10)
   - Erwartung: Alles auf einer Seite, Fuß am Boden
   
2. Generiere ein PDF mit vielen Artikeln (30+)
   - Erwartung: Mehrere Seiten, Tabelle wird fortgesetzt, Fuß auf jeder Seite

3. Generiere ein PDF mit genau so vielen Artikeln, dass der letzte fast den Fuß berührt
   - Erwartung: Letzter Artikel springt auf neue Seite wenn < 10mm Abstand

## Bekannte Einschränkungen

- Die Höhe des Summenbereichs wird auf 25mm geschätzt. Bei sehr langen Rabatt-Texten könnte eine Anpassung nötig sein.

## Dynamische Spaltenbreiten und Textumbruch (Neu)

### Übersicht
Die Tabellenspalten passen sich nun automatisch an den Inhalt an, und lange Beschreibungen werden automatisch auf mehrere Zeilen umgebrochen.

### Regel 1: Spaltenbreiten basierend auf Inhalt
- Spaltenbreiten werden dynamisch berechnet basierend auf dem tatsächlichen Inhalt der Zellen
- **Jede Spalte** (einschließlich Beschreibung) erhält die minimale Breite, die benötigt wird, um ihren Inhalt anzuzeigen
- Keine künstlichen Beschränkungen - Spalten sind so breit wie ihr Inhalt
- Wenn alle Spalten gemeinsam in die Tabellenbreite passen, verwenden alle ihre natürliche Größe

### Regel 2: Textumbruch in der Beschreibungsspalte
- Nur wenn alle Spalten nicht in die Tabellenbreite passen, wird die Beschreibungsspalte komprimiert
- Die Beschreibungsspalte erhält dann den verbleibenden Platz nach allen anderen Spalten
- Wenn eine Beschreibung nicht in die Spaltenbreite passt, wird sie automatisch auf mehrere Zeilen umgebrochen
- Die Zeilenhöhe wird dynamisch angepasst, um allen Text anzuzeigen
- Andere Spalten bleiben vertikal zentriert in der Zeile
- Zeilenabstand: 4mm pro Zeile

### Vorteile
- ✅ Effizientere Nutzung des verfügbaren Platzes
- ✅ Keine abgeschnittenen Texte in Beschreibungen
- ✅ Schmale Spalten für kurze Inhalte (z.B. "1", "Stk")
- ✅ Maximaler Platz für Beschreibungen
- ✅ Professionelles Erscheinungsbild bei allen Inhaltstypen

### Technische Details
- Neue Funktion `calculateColumnWidths()`: Misst Inhaltsbreiten und berechnet optimale Spaltenbreiten
- Neue Funktion `calculateRowHeight()`: Berechnet benötigte Zeilenhöhe basierend auf umgebrochenem Text
- Beide Rendering-Funktionen (`renderItemsTable` und `renderItemsTableWithFooter`) verwenden diese Logik
