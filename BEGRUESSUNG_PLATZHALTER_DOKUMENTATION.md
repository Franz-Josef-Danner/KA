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
   - Mit Persönlich-Checkbox aktiviert und Vorname: `Lieber {{Vorname}}`
   - Mit Nachname (Persönlich-Checkbox nicht aktiviert): `Sehr geehrter Herr {{Nachname}}`
   - Ohne Nachname, mit Firma: `Liebes {{Firma}}-Team`
   - Ohne Nachname und Firma: `Sehr geehrte Damen und Herren`
   - Beispiele: 
     - "Lieber Max" (mit Persönlich-Checkbox)
     - "Sehr geehrter Herr Schmidt" (ohne Persönlich-Checkbox)

3. **Geschlecht = "Frau"**
   - Mit Persönlich-Checkbox aktiviert und Vorname: `Liebe {{Vorname}}`
   - Mit Nachname (Persönlich-Checkbox nicht aktiviert): `Sehr geehrte Frau {{Nachname}}`
   - Ohne Nachname, mit Firma: `Liebes {{Firma}}-Team`
   - Ohne Nachname und Firma: `Sehr geehrte Damen und Herren`
   - Beispiele:
     - "Liebe Anna" (mit Persönlich-Checkbox)
     - "Sehr geehrte Frau Müller" (ohne Persönlich-Checkbox)

### Fallback-Logik

Der Platzhalter verwendet eine intelligente Fallback-Logik, um auch bei unvollständigen Daten sinnvolle Anreden zu generieren:
- Wenn Geschlecht und Persönlich-Checkbox aktiv und Vorname vorhanden: Persönliche Anrede mit Vorname
- Wenn Geschlecht und Nachname vorhanden (Persönlich-Checkbox nicht aktiv): Formelle Anrede mit Nachname
- Wenn Firma vorhanden, aber Nachname/Vorname fehlt: Team-Anrede
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
- Vorname: "Max"
- Nachname: "Schmidt"
- Geschlecht: "Mann"
- Persönlich: Nicht aktiviert

Wird die Nachricht zu:
```
Sehr geehrter Herr Schmidt,

vielen Dank für Ihr Interesse an unseren Dienstleistungen.
Wir freuen uns, Ihnen unser Angebot unterbreiten zu dürfen.

Mit freundlichen Grüßen
Ihr Team
```

Für dieselbe Firma mit aktivierter Persönlich-Checkbox:
- Firma: "Tech Solutions GmbH"
- Vorname: "Max"
- Nachname: "Schmidt"
- Geschlecht: "Mann"
- Persönlich: Aktiviert

Wird die Nachricht zu:
```
Lieber Max,

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
- Die Persönlich-Checkbox muss aktiviert sein, um die persönliche Anrede mit Vornamen zu verwenden
- Bei leerer oder fehlender Geschlechtsangabe wird automatisch die Team-Anrede verwendet
- Der Platzhalter kann in Betreff und Nachrichtentext verwendet werden

## Tests

Die Implementierung wurde mit folgenden Testfällen validiert:
- ✓ Keine Geschlechtsauswahl → "Liebes {{Firma}}-Team"
- ✓ Geschlecht = "Mann", Persönlich aktiviert mit Vorname → "Lieber {{Vorname}}"
- ✓ Geschlecht = "Mann", Persönlich nicht aktiviert → "Sehr geehrter Herr {{Nachname}}"
- ✓ Geschlecht = "Frau", Persönlich aktiviert mit Vorname → "Liebe {{Vorname}}"
- ✓ Geschlecht = "Frau", Persönlich nicht aktiviert → "Sehr geehrte Frau {{Nachname}}"
- ✓ Kombination mit anderen Platzhaltern
- ✓ Edge Case: Keine Firma → "Sehr geehrte Damen und Herren"
- ✓ Edge Case: Mann mit Persönlich aktiviert, aber kein Vorname → Fallback zu "Sehr geehrter Herr {{Nachname}}"
- ✓ Edge Case: Frau mit Persönlich aktiviert, aber kein Vorname → Fallback zu "Sehr geehrte Frau {{Nachname}}"
- ✓ Edge Case: Mann ohne Nachname, mit Firma → "Liebes {{Firma}}-Team"
- ✓ Edge Case: Mann ohne Nachname und Firma → "Sehr geehrte Damen und Herren"
- ✓ Edge Case: Frau ohne Nachname, mit Firma → "Liebes {{Firma}}-Team"
- ✓ Edge Case: Frau ohne Nachname und Firma → "Sehr geehrte Damen und Herren"
- ✓ Edge Case: Alle Felder leer → "Sehr geehrte Damen und Herren"
