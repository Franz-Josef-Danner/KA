# Überfällige Rechnungen - Prozess und Bedingungen

## Übersicht

Dieses Dokument beschreibt, was passiert, wenn eine Rechnung überfällig ist, welche Prozesse automatisch ausgelöst werden und unter welchen Bedingungen diese Prozesse in Kraft treten.

## Inhaltsverzeichnis

1. [Was ist eine überfällige Rechnung?](#was-ist-eine-überfällige-rechnung)
2. [Automatische Überprüfung](#automatische-überprüfung)
3. [Ausgelöste Prozesse](#ausgelöste-prozesse)
4. [Bedingungen für Prozessauslösung](#bedingungen-für-prozessauslösung)
5. [Benachrichtigungsablauf](#benachrichtigungsablauf)
6. [Konfiguration](#konfiguration)
7. [Technische Details](#technische-details)

---

## Was ist eine überfällige Rechnung?

Eine Rechnung gilt als **überfällig**, wenn:

1. **Bezahlstatus**: Die Rechnung ist noch **unbezahlt** (`Bezahlt = "unbezahlt"`)
2. **Fälligkeitsdatum überschritten**: Das Fälligkeitsdatum (Rechnungsdatum + Zahlungsziel in Tagen) liegt in der Vergangenheit
3. **Keine vorherige Mahnung**: Für diese Rechnung wurde noch keine Mahnungsbenachrichtigung versendet

### Berechnung des Fälligkeitsdatums

```
Fälligkeitsdatum = Rechnungsdatum + Zahlungsziel (in Tagen)

Beispiel:
- Rechnungsdatum: 01.01.2024
- Zahlungsziel: 30 Tage
- Fälligkeitsdatum: 31.01.2024
- Überfällig ab: 01.02.2024
```

### Zahlungsziel-Quelle

Das Zahlungsziel wird aus folgenden Quellen ermittelt (in dieser Reihenfolge):

1. **Artikelliste**: Wenn der Rechnung eine Artikelliste zugeordnet ist, wird deren `Zahlungsziel` verwendet
2. **Standard-Zahlungsziel**: Falls keine Artikelliste vorhanden ist, wird der Standard von **30 Tagen** verwendet

---

## Automatische Überprüfung

### Wann wird geprüft?

Die Überprüfung auf überfällige Rechnungen erfolgt automatisch, wenn:

- Ein Benutzer das **Dashboard** (`dashboard.html`) besucht
- Seit der letzten Überprüfung **mindestens 24 Stunden** vergangen sind

### Ablauf der Überprüfung

```
┌─────────────────────────────────────────┐
│  Benutzer öffnet Dashboard              │
└────────────────┬────────────────────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Letzte Prüfung      │     NEIN
        │ > 24h her?          ├──────────→ Ende (keine Prüfung)
        └────────┬────────────┘
                 │ JA
                 ↓
        ┌────────────────────┐
        │ Alle Rechnungen    │
        │ durchsuchen        │
        └────────┬────────────┘
                 │
                 ↓
        ┌────────────────────────────────────┐
        │ Für jede Rechnung prüfen:          │
        │ 1. Ist sie unbezahlt?              │
        │ 2. Ist Fälligkeitsdatum erreicht?  │
        │ 3. Wurde noch nicht gemahnt?       │
        └────────┬───────────────────────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Überfällige         │
        │ Rechnung gefunden?  │
        └────────┬────────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ Mahnungsbenach-    │
        │ richtigung         │
        │ auslösen           │
        └────────────────────┘
```

---

## Ausgelöste Prozesse

Wenn eine überfällige Rechnung erkannt wird, werden folgende Prozesse **automatisch** ausgelöst:

### 1. E-Mail-Benachrichtigung erstellen

Eine Mahnungsbenachrichtigung wird erstellt mit folgenden Informationen:

- **Rechnungsnummer**: Die ID der überfälligen Rechnung
- **Kundenname**: Name des Kunden/Firma
- **Kunden-E-Mail**: E-Mail-Adresse für den Versand
- **Gesamtsumme**: Offener Betrag der Rechnung
- **Fälligkeitsdatum**: Das ursprüngliche Zahlungsziel
- **Tage überfällig**: Anzahl der Tage seit Fälligkeit

### 2. In E-Mail-Warteschlange einreihen

Die Benachrichtigung wird **automatisch** in die E-Mail-Warteschlange (`ka_email_queue`) eingereiht:

- ✅ **KEINE** Bestätigungsabfrage beim Einreihen
- ✅ Benachrichtigung wartet auf manuelle Genehmigung im Email Queue Manager
- ✅ Admin kann E-Mail vor dem Versand prüfen, bearbeiten oder ablehnen

### 3. Rechnung als "gemahnt" markieren

Die Rechnung wird intern als "gemahnt" markiert (`ka_overdue_notified_invoices`):

- ✅ Verhindert mehrfache Mahnungen für dieselbe Rechnung
- ✅ Liste wird in LocalStorage gespeichert
- ✅ Kann bei Bedarf zurückgesetzt werden (z.B. für erneute Mahnung)

### 4. Zeitstempel der Überprüfung aktualisieren

Nach Abschluss der Überprüfung wird der Zeitstempel aktualisiert (`ka_overdue_check_last_run`):

- ✅ Verhindert zu häufige Überprüfungen
- ✅ Stellt sicher, dass nur einmal pro Tag geprüft wird

---

## Bedingungen für Prozessauslösung

### Pflichtbedingungen

Damit der Prozess für eine Rechnung ausgelöst wird, müssen **ALLE** folgenden Bedingungen erfüllt sein:

#### 1. Rechnung ist unbezahlt

```javascript
Bedingung: invoice.Bezahlt === "unbezahlt"
```

- ✅ Rechnung mit Status "unbezahlt"
- ❌ Rechnung mit Status "bezahlt"

#### 2. Fälligkeitsdatum ist überschritten

```javascript
Heute > (Rechnungsdatum + Zahlungsziel)
```

- ✅ Fälligkeitsdatum liegt in der Vergangenheit
- ❌ Fälligkeitsdatum liegt in der Zukunft oder ist heute

#### 3. Rechnung wurde noch nicht gemahnt

```javascript
!notifiedInvoices.has(invoiceId)
```

- ✅ Rechnungs-ID ist NICHT in der Liste der gemahnten Rechnungen
- ❌ Rechnungs-ID ist bereits in der Liste

#### 4. Kunde hat E-Mail-Adresse

```javascript
invoice.Firmen_Email !== '' && invoice.Firmen_Email !== null
```

- ✅ Gültige E-Mail-Adresse ist hinterlegt
- ❌ Keine E-Mail-Adresse vorhanden

#### 5. E-Mail-System ist konfiguriert

```javascript
isEmailConfigured() === true
```

- ✅ E-Mail-Einstellungen sind in den Einstellungen aktiviert
- ❌ E-Mail-System ist deaktiviert

#### 6. Benachrichtigungstyp ist aktiviert

```javascript
emailConfig.notificationSettings.invoiceOverdue === true
```

- ✅ "Rechnung überfällig" ist in den Einstellungen aktiviert
- ❌ Benachrichtigungstyp ist deaktiviert

### Übersicht der Bedingungen

| Bedingung | Pflicht | Wenn nicht erfüllt |
|-----------|---------|-------------------|
| Rechnung unbezahlt | ✅ Ja | Überspringen |
| Fälligkeitsdatum überschritten | ✅ Ja | Überspringen |
| Noch nicht gemahnt | ✅ Ja | Überspringen |
| E-Mail-Adresse vorhanden | ✅ Ja | Fehler im Console Log |
| E-Mail-System konfiguriert | ✅ Ja | Keine Aktion |
| Benachrichtigungstyp aktiviert | ✅ Ja | Keine Aktion |

---

## Benachrichtigungsablauf

### Schritt-für-Schritt Ablauf

#### Phase 1: Automatische Erkennung

```
1. Dashboard-Besuch
   └─> Prüfung auf überfällige Rechnungen (alle 24h)
       └─> Rechnung RE-001 ist überfällig (5 Tage)
           └─> Automatisch in E-Mail-Warteschlange einreihen
```

#### Phase 2: Manuelle Überprüfung

```
2. Admin öffnet Email Queue Manager (im Dashboard)
   └─> Sieht neue Mahnung für RE-001
       └─> Kann Vorschau der E-Mail ansehen
           ├─> Option 1: "Genehmigen" → Weiter zu Phase 3
           └─> Option 2: "Ablehnen" → E-Mail wird gelöscht
```

#### Phase 3: E-Mail-Versand

```
3. Admin genehmigt E-Mail
   └─> Backend sendet E-Mail via SMTP
       ├─> Erfolg: E-Mail als "versendet" markieren
       └─> Fehler: Status "fehlgeschlagen", erneuter Versuch möglich
```

### Beispiel einer Mahnungs-E-Mail

```
Von: office@franzjosef-danner.at
An: kunde@beispiel.de
Betreff: Rechnung überfällig: RE-001

Rechnung überfällig

Rechnungsnummer: RE-001
Kunde: Beispiel GmbH
Gesamtsumme: 1.250,00 €
Fälligkeitsdatum: 15.01.2024
Tage überfällig: 5
Zeitstempel: 20.01.2024, 10:30:15
```

---

## Konfiguration

### E-Mail-Benachrichtigungen aktivieren

1. Öffnen Sie **Einstellungen** im Navigationsmenü
2. Scrollen Sie zu **"E-Mail-Konfiguration"**
3. Aktivieren Sie die Checkbox **"E-Mail-Benachrichtigungen aktivieren"**
4. Aktivieren Sie unter **"Benachrichtigungstypen"** die Option **"Rechnung überfällig"**
5. Klicken Sie auf **"Speichern"**

### SMTP-Einstellungen konfigurieren

Damit E-Mails versendet werden können, müssen SMTP-Einstellungen konfiguriert sein:

1. In **Einstellungen** die SMTP-Konfiguration ausfüllen:
   - SMTP Host (z.B. `smtp.example.com`)
   - SMTP Port (z.B. `587`)
   - SMTP Benutzername
   - SMTP Passwort
   - Absender E-Mail-Adresse

2. Speichern und Verbindung testen

### Zahlungsziele anpassen

Zahlungsziele können in **Artikellisten** definiert werden:

1. Öffnen Sie **Artikellisten**
2. Bearbeiten Sie eine Artikelliste
3. Setzen Sie das Feld **"Zahlungsziel"** auf die gewünschte Anzahl von Tagen (z.B. `14`, `30`, `60`)
4. Speichern

**Standard**: Wenn keine Artikelliste zugeordnet ist, wird 30 Tage verwendet.

---

## Technische Details

### Verwendete Module

| Modul | Datei | Funktion |
|-------|-------|----------|
| Overdue Checker | `js/modules/overdue-invoice-checker.js` | Hauptlogik für Überprüfung |
| Email Notifications | `js/modules/email-notifications.js` | E-Mail-Benachrichtigungen |
| Email Config | `js/modules/email-config.js` | E-Mail-Konfiguration |
| Rechnungen State | `js/modules/rechnungen-state.js` | Rechnungsdaten |
| Invoice Helpers | `js/utils/invoice-helpers.js` | Berechnungen |

### LocalStorage-Schlüssel

| Schlüssel | Zweck | Datentyp |
|-----------|-------|----------|
| `ka_overdue_check_last_run` | Zeitstempel der letzten Überprüfung | ISO 8601 String |
| `ka_overdue_notified_invoices` | Liste der bereits gemahnten Rechnungen | Array von Rechnungs-IDs |
| `ka_email_queue` | E-Mail-Warteschlange | Array von E-Mail-Objekten |

### API-Funktionen

#### checkOverdueInvoices(force)

Führt die Überprüfung auf überfällige Rechnungen durch.

```javascript
import { checkOverdueInvoices } from './js/modules/overdue-invoice-checker.js';

// Normale Prüfung (respektiert 24h-Intervall)
const count = checkOverdueInvoices();
console.log(`${count} überfällige Rechnungen gefunden`);

// Erzwungene Prüfung (ignoriert Intervall)
const count = checkOverdueInvoices(true);
```

**Parameter:**
- `force` (boolean, optional): Wenn `true`, wird die Prüfung auch durchgeführt, wenn noch keine 24h vergangen sind

**Rückgabewert:**
- Anzahl der neu erkannten überfälligen Rechnungen (number)

#### clearInvoiceFromNotified(invoiceId)

Entfernt eine Rechnung aus der Liste der gemahnten Rechnungen (z.B. wenn eine Rechnung bezahlt wurde).

```javascript
import { clearInvoiceFromNotified } from './js/modules/overdue-invoice-checker.js';

// Rechnung aus Mahnliste entfernen
clearInvoiceFromNotified('RE-001');
```

**Verwendung:**
- Wird automatisch aufgerufen, wenn eine Rechnung als "bezahlt" markiert wird
- Ermöglicht erneute Mahnung, falls die Rechnung wieder auf "unbezahlt" gesetzt wird

#### clearNotifiedInvoices()

Löscht die gesamte Liste der gemahnten Rechnungen.

```javascript
import { clearNotifiedInvoices } from './js/modules/overdue-invoice-checker.js';

// Alle Mahnungen zurücksetzen (z.B. für Testing)
clearNotifiedInvoices();
```

**Achtung:** Nur für Testing oder manuelle Zurücksetzung verwenden!

#### resetLastCheckTime()

Setzt den Zeitstempel der letzten Überprüfung zurück.

```javascript
import { resetLastCheckTime } from './js/modules/overdue-invoice-checker.js';

// Zeitstempel zurücksetzen (ermöglicht sofortige erneute Prüfung)
resetLastCheckTime();
```

**Verwendung:** Für Testing oder wenn eine sofortige Prüfung gewünscht ist.

---

## Workflow-Diagramme

### Gesamtprozess

```
┌─────────────────────────────────────────────────────────────────┐
│                    ÜBERFÄLLIGE RECHNUNG                          │
│                                                                  │
│  Benutzer besucht Dashboard                                     │
│    ↓                                                             │
│  System prüft auf überfällige Rechnungen (einmal pro Tag)      │
│    ↓                                                             │
│  Unbezahlte Rechnungen mit überschrittenem Fälligkeitsdatum    │
│    finden                                                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
                  ┌──────────────────────┐
                  │ Alle Bedingungen      │
                  │ erfüllt?             │
                  └──────────┬───────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
               [JA]                  [NEIN]
                  │                     │
                  ↓                     ↓
        ┌─────────────────┐    ┌──────────────┐
        │ Automatisch      │    │ Überspringen │
        │ E-Mail in        │    └──────────────┘
        │ Warteschlange    │
        │ einreihen        │
        └─────────┬────────┘
                  │
                  ↓
        ┌─────────────────┐
        │ Rechnung als     │
        │ "gemahnt"        │
        │ markieren        │
        └─────────┬────────┘
                  │
                  ↓
        ┌─────────────────────────────┐
        │ Admin überprüft             │
        │ im Email Queue Manager      │
        └──────────┬──────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    [Genehmigen]         [Ablehnen]
        │                     │
        ↓                     ↓
┌───────────────┐    ┌──────────────┐
│ E-Mail        │    │ E-Mail       │
│ versenden     │    │ löschen      │
└───────────────┘    └──────────────┘
```

### Bedingungsprüfung Detail

```
┌──────────────────────────┐
│ Rechnung prüfen          │
└────────────┬─────────────┘
             │
             ↓
   ┌─────────────────────┐      NEIN
   │ Bezahlt =           ├───────────→ Überspringen
   │ "unbezahlt"?        │
   └─────────┬───────────┘
             │ JA
             ↓
   ┌─────────────────────┐      NEIN
   │ Fälligkeitsdatum    ├───────────→ Überspringen
   │ überschritten?      │
   └─────────┬───────────┘
             │ JA
             ↓
   ┌─────────────────────┐      JA
   │ Bereits gemahnt?    ├───────────→ Überspringen
   └─────────┬───────────┘
             │ NEIN
             ↓
   ┌─────────────────────┐      NEIN
   │ E-Mail-Adresse      ├───────────→ Fehler loggen,
   │ vorhanden?          │              Überspringen
   └─────────┬───────────┘
             │ JA
             ↓
   ┌─────────────────────┐      NEIN
   │ E-Mail-System       ├───────────→ Überspringen
   │ aktiviert?          │
   └─────────┬───────────┘
             │ JA
             ↓
   ┌─────────────────────┐      NEIN
   │ Benachrichtigungstyp├───────────→ Überspringen
   │ aktiviert?          │
   └─────────┬───────────┘
             │ JA
             ↓
   ┌─────────────────────┐
   │ MAHNUNG AUSLÖSEN    │
   └─────────────────────┘
```

---

## Fehlerbehebung

### Problem: Keine Mahnungen werden ausgelöst

**Mögliche Ursachen:**

1. **E-Mail-System deaktiviert**
   - Lösung: In Einstellungen → E-Mail-Konfiguration aktivieren

2. **Benachrichtigungstyp "Rechnung überfällig" deaktiviert**
   - Lösung: In Einstellungen → Benachrichtigungstypen → "Rechnung überfällig" aktivieren

3. **Keine E-Mail-Adresse beim Kunden hinterlegt**
   - Lösung: In Firmenliste → E-Mail-Adresse hinzufügen

4. **Letzte Prüfung weniger als 24h her**
   - Lösung: 24 Stunden warten oder manuell zurücksetzen (siehe Testing)

5. **Rechnung bereits gemahnt**
   - Lösung: Falls erneute Mahnung gewünscht, siehe "Mahnliste zurücksetzen"

### Problem: E-Mails werden nicht versendet

**Mögliche Ursachen:**

1. **SMTP nicht konfiguriert**
   - Lösung: SMTP-Einstellungen in Einstellungen konfigurieren
   - Siehe: [EMAIL_CONFIGURATION.md](EMAIL_CONFIGURATION.md)

2. **Backend nicht erreichbar**
   - Lösung: PHP-Backend und API überprüfen
   - Siehe: [PHP_EMAIL_SYSTEM_DOKUMENTATION.md](PHP_EMAIL_SYSTEM_DOKUMENTATION.md)

3. **World4You Hosting**
   - Lösung: Inline SMTP-Versand aktivieren
   - Siehe: [WORLD4YOU_INLINE_FIX.md](WORLD4YOU_INLINE_FIX.md)

### Problem: Doppelte Mahnungen

**Ursache:** Liste der gemahnten Rechnungen wurde gelöscht oder zurückgesetzt

**Lösung:**
- Normale Funktion: System verhindert automatisch Duplikate
- Falls doch aufgetreten: Browser-Cache leeren und neu laden

---

## Testing und Debugging

### Manuelle Prüfung erzwingen

In der Browser-Konsole:

```javascript
// Letzte Prüfung zurücksetzen
localStorage.removeItem('ka_overdue_check_last_run');

// Dashboard neu laden - Prüfung wird sofort ausgeführt
location.reload();
```

### Mahnliste zurücksetzen

In der Browser-Konsole:

```javascript
// Alle Mahnungen zurücksetzen
localStorage.removeItem('ka_overdue_notified_invoices');

// Jetzt können Rechnungen erneut gemahnt werden
```

### Überprüfung testen

```javascript
// Import Modul in Browser-Konsole (auf Dashboard-Seite)
const checker = await import('./js/modules/overdue-invoice-checker.js');

// Erzwungene Prüfung
const count = checker.checkOverdueInvoices(true);
console.log(`${count} überfällige Rechnungen gefunden`);

// Status überprüfen
const lastRun = localStorage.getItem('ka_overdue_check_last_run');
console.log('Letzte Prüfung:', new Date(lastRun).toLocaleString('de-DE'));

const notified = JSON.parse(localStorage.getItem('ka_overdue_notified_invoices') || '[]');
console.log('Gemahnte Rechnungen:', notified);
```

### E-Mail-Warteschlange überprüfen

```javascript
// Warteschlange ansehen
const queue = JSON.parse(localStorage.getItem('ka_email_queue') || '[]');
console.log('E-Mail-Warteschlange:', queue);

// Nur überfällige Rechnungen anzeigen
const overdueEmails = queue.filter(e => e.type === 'invoiceOverdue');
console.log('Mahnungen in Warteschlange:', overdueEmails);
```

---

## Best Practices

### Empfohlener Workflow

1. **Regelmäßige Dashboard-Besuche**
   - Mindestens einmal täglich Dashboard aufrufen
   - System prüft automatisch auf überfällige Rechnungen

2. **Email Queue Manager überwachen**
   - Neue Mahnungen zeitnah prüfen
   - E-Mails vor Versand auf Korrektheit überprüfen

3. **Zahlungsziele klar definieren**
   - Einheitliche Zahlungsziele in Artikellisten festlegen
   - Standard: 30 Tage für Standardkunden

4. **Kundendaten pflegen**
   - E-Mail-Adressen aktuell halten
   - Fehlende E-Mail-Adressen ergänzen

### Mahnstufen-Konzept (optional)

Das System unterstützt aktuell **eine automatische Mahnstufe**. Für mehrstufige Mahnprozesse:

**Erste Mahnung:** Automatisch via System
**Zweite Mahnung:** Manuelle E-Mail nach 7-14 Tagen
**Dritte Mahnung:** Persönlicher Kontakt oder Inkasso

---

## Zusammenfassung

### Was passiert bei einer überfälligen Rechnung?

1. ✅ **Automatische Erkennung** beim Dashboard-Besuch (alle 24h)
2. ✅ **E-Mail-Benachrichtigung** wird automatisch erstellt
3. ✅ **In Warteschlange** eingereiht (ohne Bestätigung)
4. ✅ **Manuelle Genehmigung** durch Admin erforderlich
5. ✅ **SMTP-Versand** nach Genehmigung
6. ✅ **Duplikatschutz** verhindert mehrfache Mahnungen

### Wichtige Bedingungen

- ✅ Rechnung muss **unbezahlt** sein
- ✅ Fälligkeitsdatum muss **überschritten** sein
- ✅ Rechnung darf **noch nicht gemahnt** worden sein
- ✅ Kunde muss **E-Mail-Adresse** haben
- ✅ E-Mail-System muss **aktiviert** sein
- ✅ Benachrichtigungstyp muss **aktiviert** sein

### Keine Bestätigung erforderlich

Im Gegensatz zu anderen Benachrichtigungen (neue Rechnung, neuer Auftrag, etc.) werden Mahnungen für überfällige Rechnungen **OHNE Bestätigungsdialog** automatisch in die Warteschlange eingereiht. Der Admin hat dann im Email Queue Manager die Kontrolle über den tatsächlichen Versand.

---

## Weiterführende Dokumentation

- 📖 [EMAIL_CONFIGURATION.md](EMAIL_CONFIGURATION.md) - E-Mail-System einrichten
- 📖 [EMAIL_QUEUE_MANAGER_DOKUMENTATION.md](EMAIL_QUEUE_MANAGER_DOKUMENTATION.md) - Warteschlangen-Manager verwenden
- 📖 [NOTIFICATION_FLOW_DIAGRAM.md](NOTIFICATION_FLOW_DIAGRAM.md) - Benachrichtigungs-Workflow
- 📖 [NOTIFICATION_CHANGES_SUMMARY.md](NOTIFICATION_CHANGES_SUMMARY.md) - Änderungen am Benachrichtigungssystem
- 📖 [PHP_EMAIL_SYSTEM_DOKUMENTATION.md](PHP_EMAIL_SYSTEM_DOKUMENTATION.md) - Backend-Technische Details
- 📖 [EMAIL_DIAGNOSTICS_DOKUMENTATION.md](EMAIL_DIAGNOSTICS_DOKUMENTATION.md) - Fehlerdiagnose

---

**Version:** 1.0  
**Stand:** Februar 2024  
**Autor:** KA System Documentation
