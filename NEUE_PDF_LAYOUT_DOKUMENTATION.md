# Neues Professionelles PDF-Layout

## Übersicht der Änderungen

Das PDF-Layout wurde vollständig neu gestaltet, um ein sauberes, modernes und professionelles Erscheinungsbild zu erreichen.

**Wichtiger Hinweis:** Die Elementbreiten wurden angepasst, um sicherzustellen, dass alle Inhalte innerhalb der Seitenränder (10mm auf jeder Seite) bleiben und nicht über den rechten Rand hinausragen. A4-Format hat eine Breite von 210mm, bei 10mm Seitenrand auf beiden Seiten bleiben 190mm nutzbarer Platz.

## Hauptverbesserungen

### 1. **Header-Bereich**
- **Logo**: Links positioniert (150x70 px)
- **Firmendaten**: Rechts ausgerichtet für bessere Balance
  - Firmenname (14pt, fett, rechts ausgerichtet)
  - Adresse (9pt, grau, rechts ausgerichtet)
  - Kontaktdaten (8pt, grau, rechts ausgerichtet)

### 2. **Dokumentinformationen**
- **Dokumentenkopf**: Größerer Titel (24pt) mit modernerer Typografie
  - Verbesserte Abstände zwischen Elementen
  - Klarere Metadaten-Darstellung (Nummer, Datum)
- **Kundeninformation**: Boxed-Design mit feinem Rahmen
  - Subtile Umrandung (grau, 0.3mm)
  - Klare Hierarchie mit fettem Firmennamen
  - Bessere Lesbarkeit durch optimierte Zeilenabstände

### 3. **Artikeltabelle**
- **Moderner Tabellenkopf**: Dunkler Hintergrund (RGB: 60,60,60) mit weißer Schrift
- **Verbesserte Spaltenbreiten**: Optimiert für bessere Lesbarkeit
  - Position: 8%
  - Beschreibung: 38% (erhöht für mehr Platz)
  - Menge: 10%
  - Einheit: 10%
  - Einzelpreis: 17%
  - Gesamt: 17%
- **Alternierende Zeilen**: Hellere Hintergrundfarbe (RGB: 248,248,248)
- **Feine Trennlinien**: Zwischen Zeilen (grau, 0.1mm)
- **Erhöhte Zeilenhöhe**: 8mm für bessere Lesbarkeit (vorher 7mm)
- **Rahmen**: Dunkle untere Umrandung (0.5mm) für klaren Abschluss

### 4. **Summenbereich**
- **Boxed-Design**: Hintergrund mit feinem Rahmen
  - Hellgrauer Hintergrund (RGB: 248,248,248)
- **Trennlinie**: Zwischen MwSt. und Gesamtbetrag
- **Größerer Gesamtbetrag**: 12pt fett für bessere Sichtbarkeit
- **Bessere Beschriftungen**: "Nettobetrag" statt "Netto"

### 5. **Fußzeile**
- **Feine obere Trennlinie**: Grau, 0.3mm
- **Optimierte Abstände**: Kleinere Zeilenabstände (3.5mm) für kompakteres Design
- **Hellere Schriftfarbe**: RGB: 100,100,100 für subtileren Look

## Technische Verbesserungen

### Text-Ausrichtung
- Neue Unterstützung für `textAlign`-Parameter in Rendering-Funktionen
- Ermöglicht linke, zentrierte und rechte Ausrichtung
- Automatische Berechnung der X-Position basierend auf Ausrichtung

### Farbschema
- **Primärtext**: RGB: 30-40,30-40,30-40 (dunkles Grau statt Schwarz)
- **Sekundärtext**: RGB: 80,80,80 (mittelgrau)
- **Subtiler Text**: RGB: 100,100,100 (hellgrau)
- **Tabellenheader**: RGB: 60,60,60 (dunkelgrau)
- **Rahmen**: RGB: 220-230,220-230,220-230 (sehr hellgrau)

### Typografie
- **Dokumenttitel**: 24pt (erhöht von 20pt)
- **Firmenname**: 14pt (reduziert von 16pt für Balance)
- **Haupttext**: 9-10pt
- **Fußzeile**: 8pt
- **Konsistente Schriftgrößen** für bessere visuelle Hierarchie

### Abstände und Proportionen
- **Zeilenhöhen**: Optimiert für bessere Lesbarkeit
  - Tabelle: 8mm (vorher 7mm)
  - Text: 4-6mm je nach Kontext
- **Padding**: Konsistente Innenabstände in Boxen (3-5mm)
- **Margins**: Verbesserte äußere Abstände zwischen Sektionen

## Layout-Koordinaten

### Neue Standard-Template-Positionen (in Pixel, umgerechnet zu mm):
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

## Vorteile des neuen Layouts

1. ✅ **Professioneller Eindruck**: Modernes, sauberes Design
2. ✅ **Bessere Lesbarkeit**: Optimierte Schriftgrößen und Abstände
3. ✅ **Klarere Struktur**: Logische Gruppierung von Informationen
4. ✅ **Visuell ausgewogen**: Bessere Balance zwischen Links und Rechts
5. ✅ **Konsistente Gestaltung**: Einheitliches Farbschema und Typografie
6. ✅ **Moderne Ästhetik**: Subtile Rahmen, abgerundete Ecken, Schattierungen

## Verwendung

Das neue Layout wird automatisch verwendet, wenn PDFs mit dem Parameter `useStandardTemplate = true` generiert werden:

```javascript
const pdf = await generatePDF('invoice', documentData, false, null, true);
```

Dies ist bereits in `kundenbereich-render.js` für Kundenaufträge und Rechnungen implementiert.
