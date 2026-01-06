# PDF Layout Template Editor - Dokumentation

## Übersicht

Diese Funktion ermöglicht es Benutzern, individuelle PDF-Layouts für Aufträge und Rechnungen im Einstellungsbereich zu erstellen. Die generierten PDFs werden im Kundenbereich angezeigt.

## Funktionen

### 1. Layout-Editor (Einstellungen)

Der Layout-Editor befindet sich auf der Seite **Einstellungen** unter dem Abschnitt "PDF Layout-Vorlage für Aufträge und Rechnungen".

#### Verfügbare Elemente:
- **Firmenlogo**: Zeigt das hochgeladene Firmenlogo an
- **Firmenname**: Zeigt den Firmennamen an
- **Firmenadresse**: Zeigt die Firmenadresse an
- **Kontaktdaten**: Zeigt E-Mail und Telefonnummer an
- **Kundeninformationen**: Zeigt Kundendaten (Firma, Ansprechpartner)
- **Dokumentkopf**: Zeigt Dokumenttitel und ID/Datum
- **Artikeltabelle**: Zeigt die Liste der Artikel/Positionen
- **Summen**: Zeigt die Gesamtsumme an
- **Fußzeile**: Zeigt Fußzeileninformationen an

#### Bedienung:
1. **Element hinzufügen**: Klicken Sie auf ein Element in der Palette "Verfügbare Elemente" oder ziehen Sie es per Drag & Drop auf die A4-Vorlage
2. **Element verschieben**: Klicken und ziehen Sie ein Element auf der Vorlage
3. **Element größe ändern**: Verwenden Sie den Resize-Handle (Kreis unten rechts) am Element
4. **Element entfernen**: Klicken Sie auf das X-Symbol oben rechts am Element
5. **Layout zurücksetzen**: Klicken Sie auf "Layout zurücksetzen", um die Standardvorlage wiederherzustellen

### 2. PDF-Generierung (Kundenbereich)

Im Kundenbereich können Kunden ihre Aufträge und Rechnungen als PDF anzeigen.

#### Verwendung:
1. Navigieren Sie zu "Kundenbereich" (als Kunde) oder "Kundenbereiche" > "Portal einsehen" (als Admin)
2. Klicken Sie bei einem Auftrag oder einer Rechnung auf "PDF anzeigen"
3. Das PDF wird basierend auf der konfigurierten Layout-Vorlage generiert und in einem neuen Fenster geöffnet

## Technische Details

### Module

#### js/modules/pdf-layout-editor.js
Verwaltet den visuellen Layout-Editor:
- Drag & Drop-Funktionalität
- Positionierung und Größenanpassung von Elementen
- Speicherung der Layout-Konfiguration in localStorage

#### js/modules/pdf-generator.js
Generiert PDF-Dokumente:
- Verwendet jsPDF-Bibliothek (über CDN geladen)
- Rendert Elemente basierend auf der Layout-Vorlage
- Unterstützt Aufträge und Rechnungen

#### js/modules/settings.js (erweitert)
- Neue Funktionen zum Laden/Speichern der PDF-Layout-Vorlage
- Default-Layout-Template

### Datenspeicherung

Die Layout-Konfiguration wird in localStorage gespeichert unter dem Schlüssel `ka_pdf_layout_template`:

```javascript
{
  elements: [
    {
      id: 'logo',
      type: 'logo',
      x: 20,      // Position in mm (relativ zu 600px Basis)
      y: 20,
      width: 120,
      height: 60
    },
    // ... weitere Elemente
  ]
}
```

### PDF-Generierung

Die PDF-Generierung erfolgt in folgenden Schritten:
1. jsPDF-Bibliothek wird bei Bedarf von CDN geladen
2. Layout-Template wird aus localStorage geladen
3. Firmendaten und Dokumentdaten werden abgerufen
4. Jedes Element wird entsprechend seiner Position und Größe gerendert
5. PDF wird in neuem Fenster geöffnet

## CSS-Klassen

Neue CSS-Klassen für den Layout-Editor:
- `.layout-editor-container`: Container für den Editor
- `.layout-canvas`: A4-Leinwand für Element-Positionierung
- `.element-palette`: Palette mit verfügbaren Elementen
- `.canvas-element`: Draggable Elemente auf der Leinwand
- `.palette-item`: Elemente in der Palette

## Browser-Kompatibilität

- Moderne Browser (Chrome, Firefox, Edge, Safari)
- Benötigt localStorage-Unterstützung
- Benötigt ES6-Module-Unterstützung

## Spacing-Optimierung (Content-basierte Höhen)

Die PDF-Generierung verwendet **inhaltbasierte Höhen** anstelle der konfigurierten Box-Höhen aus dem Layout-Editor:

### Problem (vorher)
- Elemente wie Dokumentkopf, Artikeltabelle und Fußzeile verwendeten die im Editor konfigurierte Box-Höhe
- Dies führte zu sehr großen Abständen zwischen Elementen, selbst wenn der Inhalt klein war
- Beispiel: Eine Artikeltabelle mit 3 Zeilen hatte eine Box-Höhe von 300px (~106mm), aber der tatsächliche Inhalt war nur ~29mm hoch

### Lösung (jetzt)
- **Alle Elemente** geben ihre tatsächliche Inhaltshöhe zurück:
  - `renderDocumentHeader`: Berechnet die Höhe basierend auf vorhandenen Inhalten (Titel + ID/Datum)
  - `renderItemsTable`: Berechnet die Höhe basierend auf Anzahl der Artikel (Header + Zeilen)
  - `renderFooter`: Berechnet die Höhe basierend auf Anzahl der Textzeilen
  - `renderTotals`: Berechnet die Höhe basierend auf Inhalt (Netto + MwSt + Gesamt)
  
- **Automatische Positionsanpassung**:
  - Die Funktion `adjustElementPosition` prüft, ob Elemente sich überschneiden würden
  - Überlappende Elemente werden automatisch mit einem Mindestabstand von 3mm neu positioniert
  - Dies gilt für alle dynamischen Elemente: company-name, company-address, company-contact, customer-info, document-header, items-table, totals, footer

### Beispiel
```javascript
// Artikeltabelle mit 3 Artikeln
Konfigurierte Box-Höhe: 300px (105.8mm)
Tatsächliche Inhaltshöhe: 29mm (Header 8mm + 3 Zeilen × 7mm)
Platzersparnis: 76.8mm

// Ergebnis: Viel kompaktere PDFs mit optimalen Abständen!
```

## Zukünftige Erweiterungen

Mögliche Verbesserungen:
- Export/Import von Layout-Templates
- Mehrere Template-Varianten (z.B. unterschiedliche für Aufträge und Rechnungen)
- Vorschau-Funktion mit Beispieldaten
- Zusätzliche Formatierungsoptionen (Schriftgröße, Farben, etc.)
- PDF-Download-Funktion (zusätzlich zur Anzeige)
- Unterstützung für mehrere Seiten bei langen Artikeltabellen
