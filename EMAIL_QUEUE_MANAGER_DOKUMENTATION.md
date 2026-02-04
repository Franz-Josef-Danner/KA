# E-Mail-Warteschlangen-Verwaltung

## Übersicht

Das KA System verfügt über eine integrierte E-Mail-Warteschlangen-Verwaltung im Dashboard, die es ermöglicht, ausstehende E-Mails zu überprüfen und einzeln zu genehmigen oder abzulehnen, bevor sie versendet werden.

## Problem und Lösung

**Problem:** Das automatische E-Mail-System funktioniert nicht, wenn man es nicht explizit ausführt. Es fehlte die Möglichkeit, ausstehende E-Mails zu sehen und zu kontrollieren.

**Lösung:** Eine E-Mail-Warteschlangen-Verwaltung auf dem Dashboard, die:
- Alle ausstehenden E-Mails beim Laden anzeigt
- Jede E-Mail einzeln genehmigen oder ablehnen lässt
- Genehmigte E-Mails mit einem Klick versendet

## Funktionen

### Automatische Anzeige beim Dashboard-Laden

Wenn Sie das Dashboard öffnen, sehen Sie sofort die E-Mail-Warteschlange mit:
- Anzahl wartender E-Mails (z.B. "3 wartend")
- Anzahl genehmigter E-Mails (z.B. "1 genehmigt")
- Detaillierte Liste aller E-Mails

### E-Mail-Informationen

Jede E-Mail in der Warteschlange zeigt:
- **Typ**: Kontaktanfrage, Neuer Auftrag, Neue Rechnung, etc.
- **Betreff**: Der E-Mail-Betreff
- **Zeitstempel**: Wann die E-Mail erstellt wurde
- **Empfänger**: An welche E-Mail-Adresse gesendet wird
- **Vorschau**: Die ersten Zeilen des E-Mail-Inhalts

### Aktionen pro E-Mail

Für jede E-Mail stehen drei Schaltflächen zur Verfügung:

1. **✓ Genehmigen**
   - Markiert die E-Mail als bereit zum Versenden
   - E-Mail bekommt grünen Hintergrund
   - Badge "✓ Genehmigt" wird angezeigt
   - Button ändert sich zu "✕ Zurückziehen"

2. **✕ Ablehnen** (oder "Zurückziehen" bei genehmigten E-Mails)
   - Entfernt die E-Mail aus der Warteschlange
   - Bestätigungsdialog vor dem Löschen
   - E-Mail wird nicht versendet

3. **👁 Vorschau**
   - Öffnet ein Modal mit dem vollständigen E-Mail-Inhalt
   - Zeigt Typ, Empfänger, Betreff, Zeitstempel
   - Zeigt den kompletten E-Mail-Text

### Versenden genehmigter E-Mails

Sobald mindestens eine E-Mail genehmigt ist:
1. Erscheint der Button "📤 X E-Mail senden" (X = Anzahl)
2. Klick öffnet Bestätigungsdialog
3. Nach Bestätigung werden alle genehmigten E-Mails versendet
4. Erfolgsmeldung wird angezeigt
5. E-Mails werden als "gesendet" markiert

## Verwendung

### Schritt 1: Dashboard öffnen
Melden Sie sich im KA System an und öffnen Sie das Dashboard.

### Schritt 2: E-Mail-Warteschlange prüfen
Die E-Mail-Warteschlange wird automatisch oben auf der Seite angezeigt (vor den Statistiken).

### Schritt 3: E-Mails überprüfen
Für jede E-Mail:
1. Lesen Sie die Vorschau
2. Klicken Sie bei Bedarf auf "👁 Vorschau" für Details
3. Entscheiden Sie: Genehmigen oder Ablehnen

### Schritt 4: E-Mails genehmigen
Klicken Sie auf "✓ Genehmigen" für jede E-Mail, die versendet werden soll.

### Schritt 5: Versenden
1. Klicken Sie auf "📤 X E-Mail senden"
2. Bestätigen Sie im Dialog
3. E-Mails werden versendet

## E-Mail-Typen

Die Warteschlange unterstützt folgende E-Mail-Typen:

### Kontaktanfrage
- Nachrichten aus dem Kontaktformular
- Zeigt Absender, E-Mail, Betreff und Nachricht

### Neuer Kunde
- Benachrichtigung bei Statusänderung zu "Kunde"
- Zeigt Firmenname, Ansprechpartner, E-Mail, Telefon

### Neuer Auftrag
- Benachrichtigung bei Erstellung eines Auftrags
- Zeigt Auftragsnummer, Kunde, Gesamtsumme, Artikel

### Neue Rechnung
- Benachrichtigung bei Erstellung einer Rechnung
- Zeigt Rechnungsnummer, Kunde, Gesamtsumme, Fälligkeitsdatum

### Zahlungseingang
- Benachrichtigung bei Zahlungseingang
- Zeigt Rechnungsnummer, Kunde, Betrag, Zahlungsdatum

## Status-Übersicht

E-Mails können folgende Status haben:

| Status | Beschreibung | Anzeige |
|--------|-------------|---------|
| **pending** | Wartet auf Genehmigung | Weißer Hintergrund, "✓ Genehmigen" Button |
| **approved** | Genehmigt, bereit zum Versenden | Grüner Hintergrund, "✓ Genehmigt" Badge |
| **sent** | Erfolgreich versendet | Wird nicht mehr angezeigt |
| **failed** | Versand fehlgeschlagen | Rotes Banner (separates System) |

## Technische Details

### Integration

Die E-Mail-Warteschlangen-Verwaltung ist in das Dashboard integriert:

**Datei**: `dashboard.html`
- Enthält Container für die Warteschlange
- Initialisiert den Queue Manager

**Modul**: `js/modules/email-queue-manager.js`
- Verwaltet die Warteschlangen-UI
- Handhabt Approve/Reject/Preview
- Sendet genehmigte E-Mails

### Datenspeicherung

E-Mails werden in `localStorage` gespeichert:
- Schlüssel: `ka_email_queue`
- Format: JSON-Array von Benachrichtigungsobjekten

Beispiel-Struktur:
```json
{
  "id": "contactMessage_1234567890_abc123",
  "type": "contactMessage",
  "data": {
    "senderName": "Max Mustermann",
    "senderEmail": "max@example.com",
    "subject": "Produktanfrage",
    "message": "Ich hätte gerne...",
    "timestamp": "2024-02-04T10:00:00.000Z"
  },
  "recipientEmail": "test@example.com",
  "timestamp": "2024-02-04T10:00:00.000Z",
  "status": "pending",
  "retryCount": 0
}
```

### Auto-Refresh

Die Warteschlange aktualisiert sich automatisch:
- Intervall: 10 Sekunden
- Manueller Refresh: "🔄 Aktualisieren" Button

### Backend-Integration

Die Verwaltung arbeitet mit dem bestehenden Backend:

**Versenden**:
1. Genehmigte E-Mails werden als "sent" markiert
2. In echter Implementierung: Backend-API-Aufruf
3. Backend-Script `backend/email-sender.js` verarbeitet Queue

**Cronjob** (optional):
```bash
*/5 * * * * cd /path/to/KA/backend && node email-sender.js
```

## Vorteile

✅ **Volle Kontrolle**: Kein automatischer Versand ohne Genehmigung  
✅ **Transparenz**: Alle E-Mails vor dem Versand überprüfbar  
✅ **Flexibilität**: Einzelne E-Mails können abgelehnt werden  
✅ **Übersichtlich**: Klare Anzeige von wartenden und genehmigten E-Mails  
✅ **Sicher**: Bestätigungsdialoge verhindern versehentliches Senden  
✅ **Benutzerfreundlich**: Intuitive Bedienung mit klaren Symbolen  

## Fehlerbehebung

### E-Mail-Warteschlange wird nicht angezeigt

**Mögliche Ursachen:**
1. E-Mail-Benachrichtigungen sind nicht aktiviert
2. Keine ausstehenden E-Mails in der Warteschlange

**Lösung:**
- Prüfen Sie die Einstellungen → E-Mail-Benachrichtigungen
- Aktivieren Sie E-Mail-Benachrichtigungen
- Erstellen Sie eine Test-E-Mail (z.B. über Kontaktformular)

### E-Mails werden nicht versendet

**Mögliche Ursachen:**
1. Backend ist nicht konfiguriert
2. SMTP-Einstellungen sind fehlerhaft

**Lösung:**
- Prüfen Sie die Backend-Konfiguration (`backend/config.json`)
- Stellen Sie sicher, dass das Backend läuft
- Prüfen Sie die Backend-Logs

### Genehmigung funktioniert nicht

**Lösung:**
- Aktualisieren Sie die Seite (F5)
- Prüfen Sie die Browser-Konsole auf Fehler
- Löschen Sie den Browser-Cache

## Unterschied zum alten System

| Aspekt | Alt | Neu |
|--------|-----|-----|
| **Versand** | Automatisch oder manuelles Script | Manuelle Genehmigung erforderlich |
| **Kontrolle** | Keine Vorschau möglich | Einzelne Genehmigung pro E-Mail |
| **Übersicht** | Keine Anzeige wartender E-Mails | Dashboard zeigt alle E-Mails |
| **Flexibilität** | Alle oder keine | Individuelle Auswahl |
| **Transparenz** | Gering | Hoch (Vorschau, Details) |

## Best Practices

1. **Regelmäßig prüfen**: Schauen Sie täglich auf das Dashboard
2. **Vorschau nutzen**: Prüfen Sie E-Mails vor Genehmigung
3. **Zeitnah handeln**: Genehmigen oder lehnen Sie E-Mails zeitnah ab
4. **Test-Modus**: Nutzen Sie Test-E-Mail-Adresse für Tests
5. **Dokumentation**: Notieren Sie abgelehnte E-Mails bei Bedarf

## Zukünftige Erweiterungen

Mögliche zukünftige Features:
- Massen-Genehmigung (alle auf einmal genehmigen)
- Filter nach E-Mail-Typ
- Suchfunktion in der Warteschlange
- E-Mail-Bearbeitung vor dem Versand
- Zeitgesteuerter Versand
- E-Mail-Historie/Archiv

## Siehe auch

- [EMAIL_CONFIGURATION.md](EMAIL_CONFIGURATION.md) - E-Mail-Konfiguration
- [KONTAKTFORMULAR_DOKUMENTATION.md](KONTAKTFORMULAR_DOKUMENTATION.md) - Kontaktformular
- [backend/README.md](backend/README.md) - Backend-Setup
