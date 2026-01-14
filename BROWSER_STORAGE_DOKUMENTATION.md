# Browser-Speicher Dokumentation

Diese Dokumentation erklärt, welche Daten im lokalen Browser-Speicher (LocalStorage) gespeichert werden und welche Daten auf dem Server gespeichert werden.

## Übersicht: Lokale vs. Server-Speicherung

### Daten auf dem Server (via PHP-API)
Die folgenden Daten werden primär auf dem Server gespeichert, mit automatischem Fallback auf LocalStorage bei Serverproblemen:

1. **Firmenliste** (`firmen_tabelle_v1`)
   - Alle Firmenkontakte und deren Details
   - Automatische Migration von LocalStorage zum Server
   - Bei Serverproblemen wird automatisch LocalStorage als Fallback verwendet

2. **Aufträge** (`auftraege_tabelle_v1`)
   - Alle Auftrags-Datensätze
   - Server-First-Strategie mit LocalStorage-Fallback

3. **Rechnungen** (`rechnungen_tabelle_v1`)
   - Alle Rechnungs-Datensätze
   - Server-First-Strategie mit LocalStorage-Fallback

4. **Artikellisten** (`artikellisten_v1`)
   - Alle Artikellisten und deren Inhalte
   - Server-First-Strategie mit LocalStorage-Fallback

5. **Kundenkonten** (`ka_customer_accounts`)
   - Zugangsdaten für Kundenbereiche
   - Server-First-Strategie mit LocalStorage-Fallback

6. **Firmeneinstellungen** (`ka_company_settings`)
   - Firmendaten und Einstellungen
   - Daten: Firmenname, Adresse, E-Mail, Telefon, Logo (Base64), Fußzeilen-Texte, Bankverbindung
   - Server-First-Strategie mit LocalStorage-Fallback
   - Zweck: Anzeige auf PDFs und in der Anwendung

7. **PDF-Layout-Vorlagen** (`ka_pdf_layout_template`, `ka_document_layout`)
   - PDF-Layout-Konfiguration und Grid-basierter Layout-Editor-Status
   - Daten: Positionierung und Formatierung von PDF-Elementen, Raster-Dimensionen, Box-Positionen
   - Server-First-Strategie mit LocalStorage-Fallback
   - Zweck: Anpassung des PDF-Layouts für Aufträge und Rechnungen

### Daten im lokalen Browser-Speicher (LocalStorage)

Die folgenden Daten werden **ausschließlich** im LocalStorage des Browsers gespeichert:

#### 1. Authentifizierung & Benutzerverwaltung

- **`ka_auth_session`**
  - **Inhalt**: Aktuelle Benutzersitzung
  - **Daten**: E-Mail, Benutzer-ID, Session-Token, Ablaufzeit, Benutzerrolle
  - **Gültigkeit**: 24 Stunden
  - **Zweck**: Session-Management und Authentifizierung

- **`ka_users`**
  - **Inhalt**: Registrierte Benutzerkonten (Admin-Accounts)
  - **Daten**: E-Mail, gehashtes Passwort, Benutzer-ID, Rolle
  - **Zweck**: Verwaltung von Admin-Benutzerkonten

#### 2. E-Mail-Konfiguration & Benachrichtigungen

- **`ka_email_config`**
  - **Inhalt**: E-Mail-Konfiguration und Benachrichtigungseinstellungen
  - **Daten**:
    - Aktivierungsstatus (enabled/disabled)
    - Test-E-Mail-Adresse
    - Benachrichtigungseinstellungen:
      - Neue Kunden
      - Neue Aufträge
      - Neue Rechnungen
      - Zahlungseingänge
  - **Zweck**: Steuerung der E-Mail-Benachrichtigungen
  - **Hinweis**: Tatsächlicher E-Mail-Versand erfordert Backend-Integration

- **`ka_email_queue`**
  - **Inhalt**: Warteschlange ausstehender E-Mail-Benachrichtigungen
  - **Daten**: Array von E-Mail-Objekten mit Typ, Empfänger, Betreff, Inhalt
  - **Zweck**: Speicherung von E-Mails bis zur Backend-Integration
  - **Hinweis**: Frontend-only - E-Mails werden gespeichert, aber noch nicht versendet

## Datensicherheit

### Was wird gespeichert?
- ✅ Geschäftsdaten (Firmen, Aufträge, Rechnungen, Artikel)
- ✅ Benutzer-Sessions und Authentifizierung
- ✅ Firmeneinstellungen und Logo
- ✅ Layout-Konfigurationen
- ✅ E-Mail-Einstellungen

### Sicherheitshinweise
- **Passwörter**: Werden gehasht (nicht reversibel) gespeichert
- **Session-Tokens**: Ablauf nach 24 Stunden
- **LocalStorage**: Daten sind nur im Browser zugänglich, nicht zwischen Geräten synchronisiert
- **Server-Daten**: Bei Verwendung der PHP-API werden Daten zusätzlich auf dem Server gesichert

## Datenlöschung

### LocalStorage leeren
Um alle lokalen Daten zu löschen:
1. Öffnen Sie die Browser-Entwicklertools (F12)
2. Gehen Sie zum Tab "Application" oder "Speicher"
3. Wählen Sie "Local Storage"
4. Löschen Sie einzelne Keys oder alle Daten

### Abmelden
Beim Abmelden wird nur die Session (`ka_auth_session`) gelöscht. Andere Daten bleiben erhalten.

## Datenportabilität

### Export
- Firmenliste: CSV-Export verfügbar
- Aufträge: CSV-Export und PDF-Export verfügbar
- Rechnungen: CSV-Export und PDF-Export verfügbar

### Import
- CSV-Import für Firmenliste verfügbar
- Intelligentes Spalten-Mapping beim Import

## Backup-Strategie

### Automatische Backups
- Bei Verwendung der Server-API werden automatisch Backups erstellt
- Vor jedem Speichervorgang wird ein Backup der vorherigen Daten angelegt

### Manuelle Backups
- Exportieren Sie regelmäßig Ihre Daten als CSV
- Sichern Sie die LocalStorage-Daten manuell über die Browser-Entwicklertools

## Troubleshooting

### Problem: Daten sind verschwunden
- **Ursache**: Browser-Cache gelöscht, LocalStorage manuell geleert
- **Lösung**: 
  - Prüfen Sie, ob Server-Backups verfügbar sind (bei Server-Speicherung)
  - Stellen Sie Daten aus CSV-Backups wieder her

### Problem: Daten werden nicht gespeichert
- **Ursache**: LocalStorage-Limit erreicht (ca. 5-10 MB je nach Browser)
- **Lösung**: Löschen Sie alte oder nicht benötigte Daten

### Problem: Daten sind auf anderem Gerät nicht verfügbar
- **Ursache**: LocalStorage ist gerätespezifisch
- **Lösung**: 
  - Verwenden Sie die Server-Speicherung (PHP-API)
  - Oder exportieren und importieren Sie Daten als CSV

## Migration von LocalStorage zu Server

Bei der ersten Verwendung der Server-API werden LocalStorage-Daten automatisch zum Server migriert:
1. System prüft, ob Daten im LocalStorage vorhanden sind
2. Falls ja, werden diese automatisch zum Server hochgeladen
3. Zukünftige Speichervorgänge erfolgen primär auf dem Server
4. LocalStorage dient als Fallback bei Serverproblemen

## Technische Details

### Storage-Keys Referenz
```javascript
// Authentifizierung (nur LocalStorage)
'ka_auth_session'        // Session-Daten
'ka_users'               // Admin-Benutzerkonten

// Kundenkonten (Server-First mit LocalStorage Fallback)
'ka_customer_accounts'   // Kundenkonten

// Geschäftsdaten (Server-First mit LocalStorage Fallback)
'firmen_tabelle_v1'      // Firmenliste
'auftraege_tabelle_v1'   // Aufträge
'rechnungen_tabelle_v1'  // Rechnungen
'artikellisten_v1'       // Artikellisten

// Firmeneinstellungen & PDF-Layout (Server-First mit LocalStorage Fallback)
'ka_company_settings'    // Firmeneinstellungen
'ka_pdf_layout_template' // PDF-Layout-Vorlage
'ka_document_layout'     // Layout-Editor-Status

// E-Mail-Konfiguration (nur LocalStorage)
'ka_email_config'        // E-Mail-Konfiguration
'ka_email_queue'         // E-Mail-Warteschlange
```

### Browser-Kompatibilität
- LocalStorage wird von allen modernen Browsern unterstützt
- Mindestanforderung: ES6-Module-Unterstützung
- Empfohlene Browser: Chrome, Firefox, Safari, Edge (neueste Versionen)

## Weitere Informationen

- **API-Dokumentation**: Siehe [api/README.md](api/README.md)
- **Server-Deployment**: Siehe [FIRMENLISTE_WEBSPACE_DOKUMENTATION.md](FIRMENLISTE_WEBSPACE_DOKUMENTATION.md)
- **E-Mail-Konfiguration**: Siehe [EMAIL_CONFIGURATION.md](EMAIL_CONFIGURATION.md)
