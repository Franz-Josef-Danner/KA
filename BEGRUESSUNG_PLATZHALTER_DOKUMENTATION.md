# {{Begrüßung}} Platzhalter Dokumentation

## Übersicht

Der neue Platzhalter `{{Begrüßung}}` wurde zur Kampagnen-Seite hinzugefügt. Dieser Platzhalter generiert automatisch eine personalisierte Anrede basierend auf dem Geschlecht des Empfängers.

## Funktionsweise

Der Platzhalter prüft die Spalte "Geschlecht" in der Firmenliste und generiert entsprechend eine passende Anrede:

### Bedingungen

1. **Kein Geschlecht ausgewählt** (leer oder undefined)
   - Mit Firma: `Liebes {{Firma}}-Team`
   - Ohne Firma: `Sehr geehrte Damen und Herren`
   - Beispiel: "Liebes Acme GmbH-Team"

2. **Geschlecht = "Mann"**
   - Mit Nachname: `Sehr geehrter Herr {{Nachname}}`
   - Ohne Nachname, mit Firma: `Liebes {{Firma}}-Team`
   - Ohne Nachname und Firma: `Sehr geehrte Damen und Herren`
   - Beispiel: "Sehr geehrter Herr Schmidt"

3. **Geschlecht = "Frau"**
   - Mit Nachname: `Sehr geehrte Frau {{Nachname}}`
   - Ohne Nachname, mit Firma: `Liebes {{Firma}}-Team`
   - Ohne Nachname und Firma: `Sehr geehrte Damen und Herren`
   - Beispiel: "Sehr geehrte Frau Müller"

### Fallback-Logik

Der Platzhalter verwendet eine intelligente Fallback-Logik, um auch bei unvollständigen Daten sinnvolle Anreden zu generieren:
- Wenn Geschlecht und Nachname vorhanden: Persönliche Anrede
- Wenn Firma vorhanden, aber Nachname fehlt: Team-Anrede
- Als letzter Fallback: "Sehr geehrte Damen und Herren"

## Verwendung

### In der E-Mail-Nachricht

Verwenden Sie einfach `{{Begrüßung}}` in Ihrer Kampagnen-Nachricht:

```
{{Begrüßung}},

vielen Dank für Ihr Interesse an unseren Dienstleistungen.
Wir freuen uns, Ihnen unser Angebot unterbreiten zu dürfen.

Mit freundlichen Grüßen
Ihr Team
```

### Beispiel-Ausgaben

Für eine Firma mit folgenden Daten:
- Firma: "Tech Solutions GmbH"
- Nachname: "Schmidt"
- Geschlecht: "Mann"

Wird die Nachricht zu:
```
Sehr geehrter Herr Schmidt,

vielen Dank für Ihr Interesse an unseren Dienstleistungen.
Wir freuen uns, Ihnen unser Angebot unterbreiten zu dürfen.

Mit freundlichen Grüßen
Ihr Team
```

Für eine Firma ohne Geschlechtsangabe:
- Firma: "Design Studio AG"
- Geschlecht: (leer)

Wird die Nachricht zu:
```
Liebes Design Studio AG-Team,

vielen Dank für Ihr Interesse an unseren Dienstleistungen.
Wir freuen uns, Ihnen unser Angebot unterbreiten zu dürfen.

Mit freundlichen Grüßen
Ihr Team
```

## Technische Details

### Implementierung

Der Platzhalter wurde in zwei Funktionen implementiert:

1. **kampagnen-render.js**: `generateGreeting()` und `replaceTemplateVariables()`
   - Für die Live-Vorschau der E-Mails

2. **kampagnen-events.js**: `generateGreeting()` und `applyVariableSubstitution()`
   - Für den tatsächlichen E-Mail-Versand

### Priorität

Der `{{Begrüßung}}` Platzhalter wird **vor** allen anderen Platzhaltern ersetzt. Dies stellt sicher, dass verschachtelte Platzhalter wie `{{Firma}}` und `{{Nachname}}` innerhalb der generierten Begrüßung korrekt ersetzt werden.

## Hinweise

- Der Platzhalter ist case-sensitive: Verwenden Sie genau `{{Begrüßung}}`
- Die Geschlechts-Optionen sind: "Mann", "Frau" oder leer
- Bei leerer oder fehlender Geschlechtsangabe wird automatisch die Team-Anrede verwendet
- Der Platzhalter kann in Betreff und Nachrichtentext verwendet werden

## Tests

Die Implementierung wurde mit folgenden Testfällen validiert:
- ✓ Keine Geschlechtsauswahl → "Liebes {{Firma}}-Team"
- ✓ Geschlecht = "Mann" → "Sehr geehrter Herr {{Nachname}}"
- ✓ Geschlecht = "Frau" → "Sehr geehrte Frau {{Nachname}}"
- ✓ Kombination mit anderen Platzhaltern
- ✓ Edge Case: Keine Firma → "Sehr geehrte Damen und Herren"
- ✓ Edge Case: Mann ohne Nachname, mit Firma → "Liebes {{Firma}}-Team"
- ✓ Edge Case: Mann ohne Nachname und Firma → "Sehr geehrte Damen und Herren"
- ✓ Edge Case: Frau ohne Nachname, mit Firma → "Liebes {{Firma}}-Team"
- ✓ Edge Case: Frau ohne Nachname und Firma → "Sehr geehrte Damen und Herren"
- ✓ Edge Case: Alle Felder leer → "Sehr geehrte Damen und Herren"
