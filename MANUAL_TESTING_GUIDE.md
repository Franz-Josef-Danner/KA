# Manueller Test-Leitfaden für PDF Drei-Teile-Layout

## Vorbereitung

1. Starten Sie die Anwendung und melden Sie sich als Admin an
2. Stellen Sie sicher, dass Sie Firmendaten in den Einstellungen konfiguriert haben
3. Gehen Sie zu "Aufträge" oder "Rechnungen"

## Test-Szenarien

### Test 1: Wenige Artikel (Einzelseite)

**Ziel:** Überprüfen, dass bei wenigen Artikeln alles auf einer Seite passt und der Fuß am Boden bleibt.

**Schritte:**
1. Erstellen Sie einen neuen Auftrag/Rechnung mit 5-8 Artikeln
2. Generieren Sie das PDF
3. Öffnen Sie das PDF

**Erwartetes Ergebnis:**
- [ ] Alle Inhalte auf einer Seite
- [ ] Artikeltabelle komplett sichtbar
- [ ] Summenbereich direkt unter der Artikeltabelle
- [ ] Fußzeile am unteren Rand der Seite (ca. 50mm vom Seitenende)
- [ ] Mindestens 10mm Abstand zwischen Summen und Fußzeile

### Test 2: Mittlere Anzahl Artikel (Grenzfall)

**Ziel:** Überprüfen, dass bei Artikeln, die fast bis zum Fuß reichen, die Kollisionserkennung korrekt funktioniert.

**Schritte:**
1. Erstellen Sie einen Auftrag/Rechnung mit 15-20 Artikeln
2. Generieren Sie das PDF
3. Öffnen Sie das PDF

**Erwartetes Ergebnis:**
- [ ] Wenn alle Artikel auf Seite 1 passen: Summen sind auf Seite 1, Fuß am Boden
- [ ] Wenn Artikel 16-20 den Fuß berühren würden: Diese Artikel springen auf Seite 2
- [ ] Auf Seite 2: Tabellen-Header wird wiederholt
- [ ] Summenbereich auf der letzten Seite mit Artikeln
- [ ] Fußzeile auf jeder Seite am selben Abstand vom Seitenende

### Test 3: Viele Artikel (Mehrere Seiten)

**Ziel:** Überprüfen, dass bei vielen Artikeln die Tabelle korrekt auf mehrere Seiten verteilt wird.

**Schritte:**
1. Erstellen Sie einen Auftrag/Rechnung mit 30+ Artikeln
2. Generieren Sie das PDF
3. Öffnen Sie das PDF und überprüfen Sie alle Seiten

**Erwartetes Ergebnis:**
- [ ] Artikel sind auf mehrere Seiten verteilt
- [ ] Auf jeder Seite (außer der ersten) wird der Tabellen-Header wiederholt
- [ ] Artikel behalten ihre Reihenfolge (Artikel 1, 2, 3, ..., 30)
- [ ] Auf jeder Seite ist die Fußzeile am selben Abstand vom Seitenende
- [ ] Letzter Artikel hat mindestens 10mm Abstand zum Fuß
- [ ] Summenbereich ist auf der letzten Seite nach allen Artikeln
- [ ] Summenbereich hat Abstand zur Fußzeile

### Test 4: Aufträge vs Rechnungen

**Ziel:** Überprüfen, dass beide Dokumenttypen korrekt funktionieren.

**Schritte:**
1. Erstellen Sie einen Auftrag mit 25 Artikeln
2. Generieren Sie das Auftrags-PDF
3. Erstellen Sie eine Rechnung mit 25 Artikeln
4. Generieren Sie das Rechnungs-PDF
5. Vergleichen Sie beide PDFs

**Erwartetes Ergebnis:**
- [ ] Beide PDFs haben dasselbe Layout-Verhalten
- [ ] Rechnung zeigt zusätzliche Zahlungsinformationen im Fuß (wenn konfiguriert)
- [ ] Rechnung zeigt QR-Code im Fuß (wenn IBAN konfiguriert)
- [ ] Artikeltabelle verhält sich bei beiden gleich
- [ ] Summenbereich ist bei beiden korrekt positioniert

### Test 5: Rabatt-Berechnung

**Ziel:** Überprüfen, dass Rabatte die Summen-Höhe korrekt beeinflussen.

**Schritte:**
1. Erstellen Sie einen Auftrag mit 20 Artikeln und 15% Rabatt
2. Generieren Sie das PDF
3. Überprüfen Sie den Summenbereich

**Erwartetes Ergebnis:**
- [ ] Summenbereich zeigt: Zwischensumme, Rabatt (mit %), Gesamtbetrag
- [ ] Summenbereich ist höher als ohne Rabatt (3 Zeilen statt 1)
- [ ] Summenbereich hat immer noch genug Abstand zum Fuß
- [ ] Bei vielen Artikeln: Summen können auf neue Seite springen wenn nötig

## Visuelle Überprüfung

Für jeden Test, überprüfen Sie visuell:

- [ ] **Kopf-Bereich:**
  - Logo und Firmendaten korrekt positioniert
  - Kundendaten in Box sichtbar
  - Dokumentnummer und Datum vorhanden
  - Artikeltabelle mit Header

- [ ] **Körper-Bereich:**
  - Summen in grauer Box
  - Rechts ausgerichtet
  - Alle Beträge korrekt formatiert (€)
  - Bei Rabatt: Grüner Text für Rabatt-Zeile

- [ ] **Fuß-Bereich:**
  - Trennlinie oberhalb der Fußzeile
  - Bei Rechnung: Zahlungsinformationen und ggf. QR-Code
  - Fußzeilen-Text zentriert
  - Seitennummer in rechter unterer Ecke

## Rand-Überprüfung

- [ ] Kein Inhalt ist außerhalb des 10mm Seitenrands
- [ ] Texte sind nicht abgeschnitten
- [ ] Tabelle reicht nicht über den rechten Rand hinaus
- [ ] Fußzeile ist vollständig sichtbar

## Fehlerfall-Tests

### Test 6: Keine Artikel

**Schritte:**
1. Erstellen Sie einen Auftrag ohne Artikel
2. Generieren Sie das PDF

**Erwartetes Ergebnis:**
- [ ] PDF wird generiert ohne Fehler
- [ ] Leere Artikeltabelle oder "Keine Artikel" Meldung
- [ ] Summe zeigt 0,00 €
- [ ] Fuß ist trotzdem am Boden

### Test 7: Ein einzelner Artikel

**Schritte:**
1. Erstellen Sie einen Auftrag mit nur 1 Artikel
2. Generieren Sie das PDF

**Erwartetes Ergebnis:**
- [ ] PDF wird korrekt generiert
- [ ] Tabelle zeigt 1 Zeile
- [ ] Summen direkt unter der Tabelle
- [ ] Fuß am Boden mit großem Abstand zu den Summen

## Dokumentation der Testergebnisse

Für jeden Test, notieren Sie:
- ✅ Bestanden / ❌ Fehlgeschlagen
- Bei Fehlschlag: Screenshot und Beschreibung des Problems
- Browser/PDF-Viewer verwendet
- Datum des Tests

## Bekannte Einschränkungen

Diese Aspekte sind **nicht** Teil der aktuellen Implementierung:
- Mehrzeilige Artikelbeschreibungen (jeder Artikel = 1 Zeile)
- Dynamische Anpassung der Tabellen-Spaltenbreiten basierend auf Inhalt
- Artikel-Bilder in der Tabelle

Bei Fragen oder Problemen, siehe: `PDF_DREI_TEILE_LAYOUT.md`
