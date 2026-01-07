# Antwort: Was wird für die E-Mail-Funktion benötigt?

## Zusammenfassung

Die automatische E-Mail-Funktion wurde erfolgreich im KA System eingerichtet! 

## Was wurde implementiert?

### 1. E-Mail-Konfiguration in den Einstellungen
- Neue E-Mail-Konfigurationssektion in den Einstellungen hinzugefügt
- Vollständige SMTP-Konfiguration
- Test-E-Mail-Funktion zum Überprüfen der Konfiguration
- E-Mail-Warteschlange-Verwaltung

### 2. Automatische E-Mail-Benachrichtigungen
- **Kundenkonto-Erstellung**: Automatische Willkommens-E-Mail mit Login-Daten
- **Auftrags-Benachrichtigungen**: E-Mails bei neuen Aufträgen (vorbereitet)
- **Rechnungs-Benachrichtigungen**: E-Mails bei neuen Rechnungen (vorbereitet)

### 3. E-Mail-Vorlagen
Vordefinierte, professionelle E-Mail-Vorlagen in deutscher Sprache für:
- Willkommens-E-Mails für neue Kunden
- Auftragsbestätigungen
- Rechnungsbenachrichtigungen
- Test-E-Mails

## Benötigte Informationen von Ihnen

Um die E-Mail-Funktionalität zu nutzen, benötigen Sie folgende Informationen:

### 1. **SMTP-Server-Daten**

#### Option A: Gmail verwenden
```
SMTP-Host: smtp.gmail.com
SMTP-Port: 587
SSL verwenden: Nein (STARTTLS)
Benutzername: Ihre vollständige Gmail-Adresse
Passwort: App-Passwort (NICHT Ihr normales Gmail-Passwort!)
```

**Wichtig für Gmail**: Sie müssen ein App-Passwort erstellen:
1. Gehen Sie zu https://myaccount.google.com/security
2. Aktivieren Sie die 2-Faktor-Authentifizierung (falls noch nicht aktiviert)
3. Unter "Bei Google anmelden" → "App-Passwörter"
4. Wählen Sie "Mail" und generieren Sie ein Passwort
5. Verwenden Sie dieses 16-stellige Passwort im KA System

#### Option B: Outlook/Office365 verwenden
```
SMTP-Host: smtp.office365.com
SMTP-Port: 587
SSL verwenden: Nein (STARTTLS)
Benutzername: Ihre vollständige Office365-E-Mail-Adresse
Passwort: Ihr normales Office365-Passwort
```

#### Option C: Anderer E-Mail-Anbieter
Kontaktieren Sie Ihren E-Mail-Anbieter und fragen Sie nach:
- SMTP-Server-Adresse
- SMTP-Port (normalerweise 587 oder 465)
- Authentifizierungsdaten

### 2. **Absender-Informationen**

```
Absender-Name: Ihr Firmenname (z.B. "Musterfirma GmbH")
Absender-E-Mail: noreply@ihre-firma.de (oder info@ihre-firma.de)
Antwort-E-Mail: kontakt@ihre-firma.de (optional)
```

### 3. **Test-E-Mail-Adresse**

Eine E-Mail-Adresse zum Testen der Konfiguration (z.B. Ihre eigene E-Mail-Adresse)

## Schritt-für-Schritt-Anleitung

### Schritt 1: Einstellungen öffnen
1. Melden Sie sich als Admin an (demo@example.com / demo123)
2. Klicken Sie im Menü auf "Einstellungen"
3. Scrollen Sie zum Abschnitt "E-Mail-Konfiguration"

### Schritt 2: E-Mail-Versand aktivieren
1. Aktivieren Sie das Kontrollkästchen "E-Mail-Versand aktivieren"
2. Die SMTP-Einstellungsfelder werden angezeigt

### Schritt 3: SMTP-Einstellungen eingeben
1. **SMTP-Host**: Geben Sie den SMTP-Server ein (z.B. smtp.gmail.com)
2. **SMTP-Port**: Geben Sie den Port ein (587 oder 465)
3. **SSL verwenden**: Aktivieren Sie dies nur für Port 465
4. **SMTP-Benutzername**: Ihre E-Mail-Adresse oder Benutzername
5. **SMTP-Passwort**: Ihr Passwort (App-Passwort für Gmail!)

### Schritt 4: Absender-Einstellungen
1. **Absender-Name**: Ihr Firmenname
2. **Absender-E-Mail**: Die E-Mail-Adresse, von der E-Mails gesendet werden
3. **Antwort-E-Mail**: E-Mail-Adresse für Antworten (optional)

### Schritt 5: Testen
1. Geben Sie eine Test-E-Mail-Adresse ein
2. Klicken Sie auf "Test-E-Mail senden"
3. Die E-Mail wird zur Warteschlange hinzugefügt

### Schritt 6: Einstellungen speichern
1. Klicken Sie auf "E-Mail-Einstellungen speichern"
2. Ihre Konfiguration ist jetzt gespeichert

## Wie funktioniert die E-Mail-Warteschlange?

Da dies eine Client-seitige Anwendung ist, werden E-Mails nicht sofort versendet, sondern in eine Warteschlange gestellt. Sie haben folgende Optionen:

### 1. Warteschlange anzeigen
- Zeigt alle ausstehenden E-Mails an
- Status: pending, sent oder failed

### 2. Warteschlange exportieren
- Speichert alle E-Mails als JSON-Datei
- Diese Datei kann von einem Backend-System verarbeitet werden
- Format: Enthält alle E-Mail-Details (Empfänger, Betreff, Inhalt, etc.)

### 3. Warteschlange leeren
- Entfernt alle E-Mails aus der Warteschlange
- Vorsicht: Diese Aktion kann nicht rückgängig gemacht werden!

## Automatische E-Mails

### Wenn wird automatisch eine E-Mail versendet?

#### 1. Kundenkonto-Erstellung
Wenn Sie in der Firmenliste eine Firma auf Status "Kunde" setzen:
- Das System erstellt automatisch ein Kundenkonto
- Eine Willkommens-E-Mail wird zur Warteschlange hinzugefügt
- Die E-Mail enthält:
  - Firmen-ID
  - E-Mail-Adresse
  - Generiertes Passwort
  - Link zum Login

**Beispiel:**
1. Öffnen Sie die Firmenliste
2. Fügen Sie eine neue Firma hinzu
3. Geben Sie mindestens Firmenname und E-Mail-Adresse ein
4. Ändern Sie den Status auf "Kunde"
5. Speichern Sie → E-Mail wird automatisch zur Warteschlange hinzugefügt!

#### 2. Weitere automatische E-Mails (vorbereitet)
- Auftrags-Erstellung (kann aktiviert werden)
- Rechnungs-Erstellung (kann aktiviert werden)
- Zahlungserinnerungen (kann aktiviert werden)

## Backend-Integration (für tatsächlichen E-Mail-Versand)

Da dies eine Browser-Anwendung ist, werden E-Mails nur in die Warteschlange gestellt. Für den tatsächlichen Versand benötigen Sie:

### Option 1: Manueller Export und Versand
1. Exportieren Sie die E-Mail-Warteschlange als JSON
2. Verwenden Sie ein externes Tool oder Script zum Versenden
3. Python-Script, Node.js oder PHP können verwendet werden

### Option 2: Backend-Integration
1. Erstellen Sie einen Backend-Service (Node.js, Python, PHP)
2. Der Service liest die E-Mail-Warteschlange aus LocalStorage oder Export
3. Versendet E-Mails über SMTP
4. Aktualisiert den Status in der Warteschlange

### Beispiel Python-Script (Pseudocode)
```python
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# JSON-Datei laden
with open('email_queue.json', 'r') as f:
    emails = json.load(f)

# SMTP-Verbindung aufbauen
smtp = smtplib.SMTP('smtp.gmail.com', 587)
smtp.starttls()
smtp.login('ihre-email@gmail.com', 'ihr-app-passwort')

# E-Mails versenden
for email in emails:
    if email['status'] == 'pending':
        msg = MIMEMultipart('alternative')
        msg['Subject'] = email['subject']
        msg['From'] = email['from']['email']
        msg['To'] = ', '.join(email['to'])
        
        # Text und HTML-Teile hinzufügen
        msg.attach(MIMEText(email['text'], 'plain'))
        msg.attach(MIMEText(email['html'], 'html'))
        
        # Senden
        smtp.send_message(msg)
        print(f"E-Mail gesendet: {email['subject']}")

smtp.quit()
```

## Sicherheitshinweise

⚠️ **Wichtig:**

1. **SMTP-Passwörter**: Werden derzeit im Browser-LocalStorage gespeichert
   - Nur für Test- und Entwicklungszwecke geeignet
   - Für Produktion: Backend-Lösung verwenden

2. **Gmail-Nutzer**: Immer App-Passwörter verwenden, niemals das normale Passwort

3. **Verschlüsselung**: Verwenden Sie immer verschlüsselte Verbindungen (Port 587 oder 465)

4. **Test zuerst**: Testen Sie die Konfiguration immer mit einer Test-E-Mail

## Häufige Probleme und Lösungen

### "E-Mail wird nicht versendet"
- ✅ Überprüfen Sie alle SMTP-Einstellungen
- ✅ Bei Gmail: Verwenden Sie ein App-Passwort
- ✅ Überprüfen Sie, ob Ihr E-Mail-Anbieter SMTP-Zugriff erlaubt

### "Authentifizierung fehlgeschlagen"
- ✅ Gmail: App-Passwort verwenden
- ✅ Benutzername und Passwort überprüfen
- ✅ SMTP-Zugriff beim Anbieter aktivieren

### "Port-Fehler"
- ✅ Port 587 mit STARTTLS (empfohlen)
- ✅ Oder Port 465 mit SSL aktiviert
- ✅ Firewall-Einstellungen überprüfen

## Zusammenfassung: Was Sie von mir brauchen

Bitte geben Sie mir folgende Informationen, damit ich die E-Mail-Funktion für Sie konfigurieren kann:

1. ☐ **E-Mail-Anbieter** (Gmail, Outlook, anderer)
2. ☐ **SMTP-Host** (z.B. smtp.gmail.com)
3. ☐ **SMTP-Port** (z.B. 587)
4. ☐ **SMTP-Benutzername** (Ihre E-Mail-Adresse)
5. ☐ **SMTP-Passwort** (App-Passwort bei Gmail)
6. ☐ **Absender-Name** (Ihr Firmenname)
7. ☐ **Absender-E-Mail** (z.B. noreply@ihre-firma.de)
8. ☐ **Test-E-Mail-Adresse** (zum Testen)

## Nächste Schritte

1. Sammeln Sie die oben genannten Informationen
2. Folgen Sie der Schritt-für-Schritt-Anleitung
3. Testen Sie die Konfiguration mit einer Test-E-Mail
4. Erstellen Sie einen Test-Kunden und überprüfen Sie die Warteschlange
5. Entscheiden Sie, ob Sie manuell exportieren oder eine Backend-Integration wünschen

## Dokumentation

- Vollständige Anleitung: [EMAIL_CONFIGURATION.md](EMAIL_CONFIGURATION.md)
- Technische Details: README.md (Abschnitt "E-Mail-Funktionalität")

Bei Fragen stehe ich gerne zur Verfügung!
