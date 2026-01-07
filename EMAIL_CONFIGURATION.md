# E-Mail-Funktionalität Dokumentation

## Übersicht

Das KA System verfügt nun über eine E-Mail-Funktionalität, mit der automatisch E-Mails versendet werden können. Da es sich um eine Client-seitige Anwendung handelt, werden E-Mails in eine Warteschlange gestellt und können dann über ein Backend-System verarbeitet werden.

## Benötigte Informationen für die E-Mail-Konfiguration

Um die E-Mail-Funktionalität einzurichten, benötigen Sie folgende Informationen:

### 1. SMTP-Server-Informationen

#### SMTP-Host
- Der Hostname Ihres E-Mail-Anbieters
- **Beispiele:**
  - Gmail: `smtp.gmail.com`
  - Outlook/Office365: `smtp.office365.com`
  - Yahoo: `smtp.mail.yahoo.com`
  - 1&1: `smtp.1und1.de`
  - Strato: `smtp.strato.de`
  - Eigener Server: `mail.ihre-domain.de`

#### SMTP-Port
- Der Port für die SMTP-Verbindung
- **Standard-Ports:**
  - Port 587: STARTTLS (empfohlen)
  - Port 465: SSL/TLS
  - Port 25: Unverschlüsselt (nicht empfohlen)

#### Verschlüsselung
- SSL verwenden: Aktivieren für Port 465
- STARTTLS verwenden: Deaktivieren für Port 587

### 2. Authentifizierungs-Informationen

#### SMTP-Benutzername
- Meist Ihre vollständige E-Mail-Adresse
- Bei einigen Anbietern nur der Teil vor dem @

#### SMTP-Passwort
- Ihr E-Mail-Passwort oder ein App-spezifisches Passwort

**Wichtig für Gmail-Nutzer:**
- Gmail erfordert ein App-Passwort, nicht Ihr normales Passwort
- So erstellen Sie ein App-Passwort:
  1. Gehen Sie zu Ihrem Google-Konto
  2. Wählen Sie "Sicherheit"
  3. Unter "Bei Google anmelden" wählen Sie "App-Passwörter"
  4. Wählen Sie "Mail" und Ihr Gerät
  5. Generieren Sie ein Passwort
  6. Verwenden Sie dieses 16-stellige Passwort in der Konfiguration

### 3. Absender-Informationen

#### Absender-Name
- Der Name, der als Absender angezeigt wird
- Beispiel: "Ihre Firma GmbH" oder "Kundenservice"

#### Absender-E-Mail
- Die E-Mail-Adresse, von der E-Mails gesendet werden
- Beispiel: `noreply@ihre-firma.de` oder `info@ihre-firma.de`

#### Antwort-E-Mail (optional)
- E-Mail-Adresse, an die Antworten gesendet werden sollen
- Beispiel: `kontakt@ihre-firma.de`

## Einrichtung

### Schritt 1: Einstellungen öffnen
1. Melden Sie sich mit Admin-Rechten an
2. Navigieren Sie zu "Einstellungen" im Menü

### Schritt 2: E-Mail-Konfiguration
1. Scrollen Sie zum Abschnitt "E-Mail-Konfiguration"
2. Aktivieren Sie "E-Mail-Versand aktivieren"
3. Füllen Sie alle erforderlichen Felder aus:
   - SMTP-Host
   - SMTP-Port
   - SMTP-Benutzername
   - SMTP-Passwort
   - Absender-E-Mail

### Schritt 3: Test-E-Mail senden
1. Geben Sie eine Test-E-Mail-Adresse ein
2. Klicken Sie auf "Test-E-Mail senden"
3. Die E-Mail wird zur Warteschlange hinzugefügt

### Schritt 4: Einstellungen speichern
1. Klicken Sie auf "E-Mail-Einstellungen speichern"
2. Ihre Konfiguration wird gespeichert

## E-Mail-Warteschlange

Da dies eine Client-seitige Anwendung ist, werden E-Mails nicht direkt versendet, sondern in eine Warteschlange gestellt. Die Warteschlange kann:

- **Angezeigt werden**: Zeigt alle ausstehenden E-Mails an
- **Exportiert werden**: Speichert die Warteschlange als JSON-Datei für die Backend-Verarbeitung
- **Geleert werden**: Entfernt alle E-Mails aus der Warteschlange

### Backend-Integration

Für den tatsächlichen E-Mail-Versand benötigen Sie ein Backend-System, das:
1. Die exportierte JSON-Datei liest
2. Die E-Mails über SMTP versendet
3. Den Status der E-Mails aktualisiert

## Automatische E-Mails

Das System kann automatisch E-Mails versenden bei:

1. **Kundenkonto-Erstellung**
   - Willkommens-E-Mail mit Login-Daten
   - Enthält Firmen-ID, E-Mail und generiertes Passwort

2. **Auftrags-Erstellung**
   - Benachrichtigung über neuen Auftrag
   - Enthält Auftragsnummer und Status

3. **Rechnungs-Erstellung**
   - Benachrichtigung über neue Rechnung
   - Enthält Rechnungsnummer, Betrag und Fälligkeitsdatum

## E-Mail-Vorlagen

Das System enthält vordefinierte E-Mail-Vorlagen für:
- Willkommens-E-Mail für neue Kunden
- Auftrags-Benachrichtigung
- Rechnungs-Benachrichtigung
- Test-E-Mail

Alle Vorlagen sind in deutscher Sprache und können bei Bedarf angepasst werden.

## Sicherheitshinweise

1. **Passwörter**: SMTP-Passwörter werden im LocalStorage gespeichert. In einer Produktionsumgebung sollten diese auf dem Backend gespeichert werden.

2. **App-Passwörter**: Verwenden Sie für Gmail und ähnliche Dienste App-Passwörter, keine normalen Passwörter.

3. **SSL/TLS**: Verwenden Sie immer verschlüsselte Verbindungen (Port 587 oder 465).

4. **Test zuerst**: Testen Sie die Konfiguration immer mit einer Test-E-Mail, bevor Sie sie produktiv nutzen.

## Häufige Probleme und Lösungen

### Problem: Test-E-Mail wird nicht versendet
- **Lösung**: Überprüfen Sie alle SMTP-Einstellungen
- Stellen Sie sicher, dass Sie das richtige Passwort verwenden (App-Passwort für Gmail)
- Überprüfen Sie, ob Ihr E-Mail-Anbieter SMTP-Zugriff erlaubt

### Problem: "Authentifizierung fehlgeschlagen"
- **Lösung**: 
  - Bei Gmail: Verwenden Sie ein App-Passwort
  - Überprüfen Sie Benutzername und Passwort
  - Stellen Sie sicher, dass SMTP-Zugriff aktiviert ist

### Problem: Port-Fehler
- **Lösung**: 
  - Verwenden Sie Port 587 mit STARTTLS (empfohlen)
  - Oder Port 465 mit SSL aktiviert
  - Überprüfen Sie Ihre Firewall-Einstellungen

## Empfohlene E-Mail-Anbieter für SMTP

### Gmail
- Host: `smtp.gmail.com`
- Port: 587 (STARTTLS) oder 465 (SSL)
- Erfordert: App-Passwort

### Outlook/Office365
- Host: `smtp.office365.com`
- Port: 587 (STARTTLS)
- Verwendet: Normale Anmeldedaten

### 1&1 / IONOS
- Host: `smtp.1und1.de` oder `smtp.ionos.de`
- Port: 587 oder 465
- Verwendet: Normale Anmeldedaten

### Strato
- Host: `smtp.strato.de`
- Port: 465 (SSL)
- Verwendet: Normale Anmeldedaten

## Kontakt und Support

Bei Fragen zur E-Mail-Konfiguration wenden Sie sich bitte an Ihren System-Administrator oder E-Mail-Anbieter.
