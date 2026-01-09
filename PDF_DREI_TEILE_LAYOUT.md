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
- Fußzeile mit Firmendaten und Bankverbindung
- Bleibt stabil am Boden auf allen Seiten
- Wächst bei mehr Inhalt nach oben

## Implementierte Regeln

### Regel 1: Kopf wächst nach unten
✅ Die Artikeltabelle kann beliebig viele Zeilen aufnehmen und wächst dabei nach unten.

### Regel 2: Körper folgt dem Kopf
✅ Der Summenbereich (Körper) wird immer direkt nach der Artikeltabelle positioniert, mit einem festen Abstand von 5mm.

### Regel 3: Fuß bleibt am Boden
✅ Der Fuß wird auf allen Seiten an derselben Position vom Seitenende (50mm) gerendert.

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

**`renderItemsTableWithFooter(doc, x, y, width, height, documentData, footerY)`**
- Rendert die Artikeltabelle mit Kollisionserkennung für den Fuß
- Prüft vor jeder Zeile, ob genug Platz bis zum Fuß vorhanden ist
- Fügt bei Bedarf eine neue Seite ein und setzt die Tabelle fort
- Gibt die End-Y-Position zurück für die Positionierung der Summen

### Geänderte Funktionen

**`renderPDFDocument(...)`**
- Berechnet die Fußposition zu Beginn
- Rendert Items-Tabelle und Totals separat mit spezieller Logik
- Positioniert Totals dynamisch nach der Tabelle
- Rendert den Fuß auf allen Seiten an derselben Position

### Konstanten

```javascript
const PDF_MARGIN = 10; // Seitenrand in mm
const FOOTER_MARGIN_FROM_BOTTOM = 50; // Abstand des Fußes vom Seitenende
const minSpacingBeforeFooter = 10; // Mindestabstand vor dem Fuß
const spacing = 5; // Abstand zwischen Tabelle und Summen
```

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
- Mehrzeilige Artikelbeschreibungen werden derzeit nicht unterstützt (jeder Artikel = 1 Zeile).
