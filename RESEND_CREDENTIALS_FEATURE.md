# Zugangsdaten per E-Mail senden - Feature-Dokumentation

## Überblick

Diese Funktion ermöglicht es Administratoren, Zugangsdaten für Kunden erneut per E-Mail zu versenden. Die Funktion wurde im Kundenbereich-Verwaltungssystem implementiert.

## Feature-Details

### Wo finde ich die Funktion?

1. Navigieren Sie zu **Kundenbereiche** im Hauptmenü
2. Suchen Sie den gewünschten Kunden in der Liste
3. Klicken Sie auf den Button **"Zugangsdaten"** in der Zeile des Kunden
4. Im geöffneten Modal-Dialog sehen Sie den neuen Button **"Zugang senden"**

### Funktionsweise

#### Was passiert beim Klick auf den Button?

1. **Bestätigungsdialog**: 
   - Erklärt dem Administrator, was passieren wird
   - Weist darauf hin, dass ein neues Passwort generiert wird
   - Zeigt an, was der Kunde in der E-Mail erhalten wird

2. **Passwort-Generierung**:
   - Da Passwörter aus Sicherheitsgründen verschlüsselt gespeichert sind, wird automatisch ein neues Passwort generiert
   - Das alte Passwort wird ungültig

3. **E-Mail-Versand**:
   - Eine E-Mail wird an die hinterlegte Kunden-E-Mail-Adresse gesendet
   - Die E-Mail enthält:
     - Benutzername (E-Mail-Adresse des Kunden)
     - Neues Passwort
     - Link zum Kundenbereich: https://www.franzjosef-danner.at/accounting/kundenbereiche.html

4. **Feedback**:
   - **Erfolg**: Bestätigungsmeldung und automatisches Schließen des Modal-Dialogs
   - **Fehler**: Fehlermeldung mit Anleitung zur manuellen Passwort-Weitergabe

### Technische Umsetzung

#### Datei: `js/modules/kundenbereiche-render.js`

**Neue UI-Elemente**:
- Button "Zugang senden" im Credentials-Modal
- Platzierung: Links im Modal, prominent positioniert

**Funktionen**:
- `resetCustomerPassword(firmenId)`: Generiert ein neues Passwort
- `sendCustomerWelcomeEmail({email, username, password, customerName})`: Versendet die E-Mail mit Zugangsdaten

**E-Mail-Template**: Bereits vorhanden in `js/modules/email-notifications.js`
- Template-Typ: `customerWelcome`
- Betreff: "Willkommen - Ihre Zugangsdaten zum Kundenbereich"

### Sicherheitsaspekte

1. **Passwort-Verschlüsselung**: Passwörter werden nie im Klartext gespeichert
2. **Neues Passwort bei jedem Versand**: Altes Passwort wird automatisch ungültig
3. **Bestätigungsdialog**: Administrator muss den Versand explizit bestätigen
4. **Fehlerbehandlung**: Bei E-Mail-Versand-Fehlern wird kein Passwort in Alert-Dialogen angezeigt

### Fehlerbehandlung

Die Funktion behandelt folgende Fehlerszenarien:

1. **Passwort-Generierung fehlgeschlagen**: 
   - Fehlermeldung
   - Button wird wieder aktiviert
   - Benutzer kann es erneut versuchen

2. **E-Mail-Versand fehlgeschlagen**:
   - Klare Fehlermeldung
   - Hinweis auf E-Mail-Konfiguration
   - Anleitung zur manuellen Passwort-Weitergabe
   - Button wird wieder aktiviert

3. **Unerwarteter Fehler**:
   - Allgemeine Fehlermeldung
   - Fehler wird in der Konsole geloggt
   - Button wird wieder aktiviert

### Benutzer-Erfahrung

**Während der Verarbeitung**:
- Button wird deaktiviert
- Text ändert sich zu "Sende E-Mail..."
- Verhindert Doppelklicks

**Nach erfolgreicher E-Mail**:
- Erfolgsbestätigung
- Modal schließt automatisch
- Kunde erhält E-Mail mit Zugangsdaten

**Bei Fehler**:
- Button wird wieder aktiviert
- Klare Anweisungen für nächste Schritte

## Verwendungsbeispiel

### Szenario: Kunde hat Passwort vergessen

1. Administrator öffnet **Kundenbereiche**
2. Sucht den Kunden (z.B. "Musterfirma GmbH")
3. Klickt auf **"Zugangsdaten"**
4. Klickt auf **"Zugang senden"**
5. Bestätigt den Dialog
6. System generiert neues Passwort und sendet E-Mail
7. Kunde erhält E-Mail mit neuen Zugangsdaten
8. Kunde kann sich mit dem neuen Passwort einloggen

## Code-Änderungen

**Geänderte Datei**: `js/modules/kundenbereiche-render.js`

**Änderungen**:
1. Neuer Button im Modal HTML (Zeile ~257)
2. Neuer Event-Handler für den Button (Zeile ~280-335)
3. Integration mit bestehenden Auth- und E-Mail-Funktionen

**Keine Änderungen erforderlich in**:
- E-Mail-Templates (bereits vorhanden)
- Backend-API (verwendet bestehende Endpunkte)
- Authentifizierungs-Logik (verwendet bestehende Funktionen)

## Abhängigkeiten

Diese Funktion nutzt folgende bestehende Module:
- `js/modules/auth.js`: `resetCustomerPassword()`, `getCustomerAccountByFirmenId()`
- `js/modules/email-notifications.js`: `sendCustomerWelcomeEmail()`
- Backend: `api/send-approved-emails-inline.php`

## E-Mail-Konfiguration

Voraussetzung für den E-Mail-Versand:
- SMTP-Konfiguration muss in den Einstellungen hinterlegt sein
- E-Mail-Adresse des Kunden muss vorhanden sein
- Backend-Verbindung muss funktionieren

Bei Problemen siehe:
- [EMAIL_SETUP_ANLEITUNG.md](EMAIL_SETUP_ANLEITUNG.md)
- [EMAIL_DIAGNOSTICS_DOKUMENTATION.md](EMAIL_DIAGNOSTICS_DOKUMENTATION.md)
