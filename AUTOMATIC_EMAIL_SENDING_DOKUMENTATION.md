# Automatisches E-Mail-Versenden mit PDF-Anhängen

## Überblick

Diese Funktion ermöglicht das automatische Versenden von E-Mails an Kunden beim Erstellen oder Umwandeln von Aufträgen und Rechnungen. Die E-Mails enthalten das entsprechende Dokument als PDF-Anhang.

## Funktionen

### 1. Automatische E-Mail bei neuer Rechnung
- Beim Erstellen einer neuen Rechnung wird automatisch eine E-Mail-Benachrichtigung erstellt
- Die E-Mail enthält:
  - Professioneller Betreff: "Rechnung [Rechnungs-ID] - [Firmenname]"
  - Höflichen Text mit Rechnungsdetails
  - PDF-Anhang der Rechnung
  - Firmen-Kontaktdaten (E-Mail, Telefon)

### 2. Automatische E-Mail bei neuem Auftrag
- Beim Erstellen eines neuen Auftrags wird automatisch eine E-Mail-Benachrichtigung erstellt
- Die E-Mail enthält:
  - Professioneller Betreff: "Auftragsbestätigung [Auftrags-ID] - [Firmenname]"
  - Dankestext mit Auftragsdetails
  - PDF-Anhang des Auftrags
  - Firmen-Kontaktdaten

### 3. Automatische E-Mail bei Umwandlung Auftrag → Rechnung
- Beim Umwandeln eines Auftrags in eine Rechnung wird automatisch eine E-Mail erstellt
- Die E-Mail enthält die neu erstellte Rechnung als PDF-Anhang
- Der Auftrag wird als "abgeschlossen" markiert

## E-Mail-Empfänger

Das System priorisiert die E-Mail-Empfänger in folgender Reihenfolge:

1. **Kunden-E-Mail (Standard)**: Wenn das Feld `Firmen_Email` beim Kunden ausgefüllt ist und Test-Modus deaktiviert ist
2. **Test-E-Mail**: Wenn in den Einstellungen eine Test-E-Mail konfiguriert ist
3. **Backend-Standard**: Wenn keine der obigen Optionen verfügbar ist

## Verwendung

### Schritt 1: E-Mail-System aktivieren

1. Gehen Sie zu **Einstellungen** → **E-Mail-Konfiguration**
2. Aktivieren Sie die Option **"E-Mail-Benachrichtigungen aktiviert"**
3. Aktivieren Sie die gewünschten Benachrichtigungstypen:
   - ☑ Neue Aufträge
   - ☑ Neue Rechnungen

### Schritt 2: Kunden-E-Mail-Adresse eintragen

1. Gehen Sie zu **Firmenliste**
2. Öffnen Sie den gewünschten Kunden
3. Tragen Sie die E-Mail-Adresse im Feld **"Firmen_Email"** ein
4. Speichern Sie die Änderungen

### Schritt 3: Auftrag oder Rechnung erstellen

1. **Neue Rechnung**:
   - Klicken Sie auf "Neue Rechnung"
   - Füllen Sie alle Felder aus (wichtig: Firma auswählen)
   - Klicken Sie auf "Speichern"
   - Eine E-Mail-Benachrichtigung wird automatisch in die Warteschlange eingereiht

2. **Neuer Auftrag**:
   - Klicken Sie auf "Neuer Auftrag"
   - Füllen Sie alle Felder aus (wichtig: Firma auswählen)
   - Klicken Sie auf "Speichern"
   - Eine E-Mail-Benachrichtigung wird automatisch in die Warteschlange eingereiht

3. **Auftrag in Rechnung umwandeln**:
   - Öffnen Sie einen bestehenden Auftrag
   - Klicken Sie auf "In Rechnung umwandeln"
   - Bestätigen Sie die Umwandlung
   - Die neue Rechnung wird erstellt und eine E-Mail-Benachrichtigung wird in die Warteschlange eingereiht

### Schritt 4: E-Mails genehmigen und versenden

1. Nach dem Erstellen eines Dokuments erscheint eine Benachrichtigung
2. Die E-Mail wird in die Warteschlange eingereiht
3. Gehen Sie zur E-Mail-Warteschlange (in den Einstellungen oder über das Dashboard)
4. Überprüfen Sie die E-Mail-Vorschau
5. Klicken Sie auf "Genehmigen" für die E-Mails, die Sie versenden möchten
6. Klicken Sie auf "Genehmigte E-Mails senden"
7. Das System versendet die E-Mails über SMTP mit PDF-Anhängen

## Test-Modus

Für Tests können Sie eine Test-E-Mail-Adresse konfigurieren:

1. Gehen Sie zu **Einstellungen** → **E-Mail-Konfiguration**
2. Tragen Sie Ihre Test-E-Mail-Adresse ein (z.B. ihre.email@example.com)
3. Alle E-Mails werden an diese Adresse gesendet, nicht an die Kunden
4. So können Sie die Funktion testen, ohne echte E-Mails an Kunden zu senden

**Wichtig**: Entfernen Sie die Test-E-Mail-Adresse, wenn Sie mit dem Echtbetrieb beginnen!

## E-Mail-Vorlagen

### Auftragsbestätigung

```
Betreff: Auftragsbestätigung AU-20240101-001 - [Firmenname]

Sehr geehrte Damen und Herren,

vielen Dank für Ihren Auftrag!

Anbei erhalten Sie die Bestätigung Ihres Auftrags als PDF-Dokument.

Auftragsnummer: AU-20240101-001
Anzahl Artikel: 5
Gesamtsumme: 1250.00 €

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
[Firmenname]
E-Mail: [Firmen-E-Mail]
Tel: [Firmen-Telefon]

Anhang: Auftrag_AU-20240101-001.pdf
```

### Rechnung

```
Betreff: Rechnung RE-20240101-001 - [Firmenname]

Sehr geehrte Damen und Herren,

anbei erhalten Sie Ihre Rechnung als PDF-Dokument.

Rechnungsnummer: RE-20240101-001
Gesamtsumme: 1250.00 €

Bitte überweisen Sie den Betrag auf das in der Rechnung angegebene Konto.

Bei Fragen zur Rechnung stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
[Firmenname]
E-Mail: [Firmen-E-Mail]
Tel: [Firmen-Telefon]

Anhang: Rechnung_RE-20240101-001.pdf
```

## Technische Details

### PDF-Generierung
- Die PDFs werden mit jsPDF im Browser generiert
- Die PDFs verwenden das konfigurierte Layout-Template
- QR-Codes für Zahlungen werden automatisch eingefügt (bei Rechnungen)
- Die PDFs enthalten alle Artikelpositionen und Berechnungen

### PDF-Übertragung
- PDFs werden als Base64-String kodiert
- Die kodierten PDFs werden in der E-Mail-Warteschlange gespeichert
- Beim Versenden werden sie vom Backend dekodiert und als Anhänge hinzugefügt

### Backend (PHP + PHPMailer)
- PHPMailer wird für den SMTP-Versand verwendet
- Unterstützt verschiedene SMTP-Server (World4You getestet)
- Automatische Base64-Dekodierung der PDF-Anhänge
- Fehlerbehandlung und Logging

## Fehlerbehebung

### E-Mail wird nicht versendet

1. **Prüfen Sie die E-Mail-Konfiguration**:
   - Sind E-Mail-Benachrichtigungen aktiviert?
   - Ist der Benachrichtigungstyp aktiviert (Neue Rechnungen / Neue Aufträge)?
   - Ist die Backend-Konfiguration korrekt (`backend/config.json`)?

2. **Prüfen Sie die Kunden-E-Mail**:
   - Ist das Feld `Firmen_Email` beim Kunden ausgefüllt?
   - Ist die E-Mail-Adresse gültig?

3. **Prüfen Sie die Warteschlange**:
   - Erscheint die E-Mail in der Warteschlange?
   - Ist sie als "pending" oder "approved" markiert?

4. **Backend-Logs prüfen**:
   - Überprüfen Sie `backend/smtp-debug.log` für detaillierte SMTP-Logs
   - Suchen Sie nach Fehlermeldungen

### PDF-Anhang fehlt

1. **Browser-Konsole prüfen**:
   - Öffnen Sie die Browser-Entwicklertools (F12)
   - Suchen Sie nach Fehlern bei der PDF-Generierung

2. **jsPDF-Bibliothek**:
   - Stellen Sie sicher, dass die jsPDF-Bibliothek vom CDN geladen wird
   - Internetverbindung erforderlich!

### E-Mail geht an falsche Adresse

1. **Test-Modus deaktivieren**:
   - Entfernen Sie die Test-E-Mail-Adresse in den Einstellungen
   - Nur so werden E-Mails an Kunden gesendet

2. **Kunden-E-Mail prüfen**:
   - Vergewissern Sie sich, dass die richtige E-Mail-Adresse im Feld `Firmen_Email` steht

## Sicherheitshinweise

1. **Keine sensiblen Daten im Frontend speichern**: Die E-Mail-Warteschlange wird im LocalStorage gespeichert. Sensible Zugangsdaten werden nur im Backend (`config.json`) gespeichert.

2. **SMTP-Verschlüsselung**: Nutzen Sie STARTTLS (Port 587) für sichere Übertragung.

3. **Datenschutz**: Informieren Sie Ihre Kunden, dass Sie E-Mails mit Dokumenten versenden (DSGVO).

## Weiterführende Dokumentation

- `EMAIL_CONFIGURATION.md` - Grundlegende E-Mail-Konfiguration
- `EMAIL_SETUP_ANLEITUNG.md` - SMTP-Setup-Anleitung
- `EMAIL_QUEUE_MANAGER_DOKUMENTATION.md` - Warteschlangen-Verwaltung
- `MANUAL_TESTING_GUIDE.md` - Manuelles Testen der E-Mail-Funktion
