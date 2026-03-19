# Plan: Story-Development-Modul – Design & Requirements

## TL;DR
Entwicklung eines umfangreichen **Story-Development-Systems** für Drehbuch-Planung & Script-Management. Das Modul besteht aus 4 gekoppelten Bereichen (Story-Liste, Kartei mit Frames, Script-Editor, Charakterverwaltung). **Aktuell: Design-Phase – keine Implementierung**. Ziel: Alle technischen & UI-Anforderungen definieren, bevor Coding beginnt.

---

## Phase 1: DESIGN & REQUIREMENTS (Aktuell)

### 1. Datenmodell – Story-Schema definieren

**Hauptfrage: Wie sieht die Story-JSON aus?**

Basierend auf der Systemdokumentation und dem Planung-Muster müssen folgende Strukturen definiert werden:

#### 1.1 Story-Projekt (Hauptdaten)
```
Felder:
- Story_ID (eindeutig, Auto-inkrement oder UUID)
- Projektname (string, required)
- Kurzbeschreibung (text)
- Kunden (array oder comma-separated list)
- Erstellungsdatum (ISO 8601)
- Änderungsdatum (ISO 8601)
- Status (geplant/in-entwicklung/abgeschlossen)
```

#### 1.2 Szene (innerhalb einer Story)
```
Felder:
- Szenen_ID (unique within Story)
- Position (number, für Sortierung)
- AktID (foreign key zu Akt, null = keine Akt-Zugehörigkeit)
- Tageszeit (optional, z.B. "Morgen", "Nacht")
- Location (optional, string)
- InnenAussen (optional, enum: "Innen" / "Außen" / null)
- Beschreibung (text, Action/Regieanweisung im Kartei-Modus)
- Format (enum: "Action" / "Dialogue" / "Parenthetical" / "Character" / "Transition" / etc.)
  → im Kartei-Modus immer "Action", im Script frei änderbar
- Markierungen (array of Markierungs-IDs)
```

#### 1.3 Akt/Frame
```
Felder:
- Akt_ID (unique within Story)
- Name (optional, string – z.B. "Akt 1", "Prologue")
- SzenenIDs (array von Szenen_IDs gehörig zu diesem Akt)
- Position (number, für Akt-Sortierung)
```

#### 1.4 Charakter
```
Felder:
- Charakter_ID (unique within Story)
- Name (string, required – vollständiger Name)
- SkriptReferenz (string, required – Kurzform für Dialoge im Script)
- Beschreibung (text, optional)
- Alter (string, optional – z.B. "28 Jahre")
- Aussehen (text, optional)
- WantsAndNeeds (text, optional – dramaturgischer Zweck)
```

#### 1.5 Markierung (im Script)
```
Felder:
- Markierungs_ID (unique within Story)
- TextStartIndex (number, Position im Script)
- TextEndIndex (number, Länge)
- Kategorie (enum: "Requisit", "Bühnenbild", "Make-up", "Kostüm", "Technik", "Effekte", "Custom")
- Name (string – kurzer Name des Elements)
- Beschreibung (text, optional – längere Beschreibung)
```

#### 1.6 Dateistruktur (wie Planung)
```
/data/story-projects.json
[
  {
    "Story_ID": "story_001",
    "Projektname": "Beispiel-Story",
    ...  // alle Felder
  },
  ...
]
```

---

### 2. Kritische Sync-Logik – Regeln definieren

**Zentrale Regel: Struktur ↔ bidirektional, Formatierung ← nur Script**

#### 2.1 Kartei aktiv:
- ✏️ Kartentext ist editierbar
- 🔒 Script ist gesperrt (read-only)
- 🃏 Kartei kann ändern:
  - Szenenposition (Karten verschieben)
  - Akt-Zugehörigkeit (Karten in/aus Frames ziehen)
  - Szeninhalt (Text)
  - Szenen hinzufügen/löschen
- 📤 Diese Änderungen wirken sich auf Script-Struktur aus
- ✅ Format bleibt auf "Action" fixiert in Kartei-Ansicht

#### 2.2 Script aktiv:
- ✏️ Script ist editierbar
- 🔒 Kartei ist gesperrt (read-only)
- 🃏 Script kann ändern:
  - Szenenposition
  - Akt-Zugehörigkeit
  - Format pro Zeile (Action → Dialogue → Parenthetical etc.)
  - Szeninhalt (Text)
  - Szenen hinzufügen/löschen
- 📤 Diese Änderungen wirken sich auf Kartei aus (aber Kartei zeigt Format nicht)
- ✅ **Formatierung ist die Quelle der Wahrheit für Script-Ansicht**

#### 2.3 Datensynchronisation
- Wenn Kartei aktiv: Kartei-Änderungen → Script-Datenmodell aktualisieren
- Wenn Script aktiv: Script-Änderungen → Kartei-Datenmodell aktualisieren
- Beide müssen always in Sync sein (gemeinsam ein Datenmodell)
- UI-State kann unterschiedlich sein (aktive vs. inaktive Views)

---

### 3. Komponenten-Architektur (wie Planung/Auftraege)

Basierend auf bestehendem Muster werden folgende Module benötigt:

#### 3.1 Story-Module (haupt)
```
story.html (neue Seite)
js/story-app.js (Entry Point)
js/modules/story-state.js (State + API)
js/modules/story-render.js (Main Render)
js/modules/story-events.js (Event Handler)
js/modules/story-ui.js (UI Helpers)
js/modules/story-config.js (Konstanten & Spalten)
```

#### 3.2 Story-Liste-Submodul (Einstiegsebene)
```
js/modules/story-list-render.js (Listenansicht)
js/modules/story-list-events.js (Interaktionen)
```

#### 3.3 Kartei-Submodul (Karteiansicht + Frames)
```
js/modules/story-kartei-render.js (Kartei-UI)
js/modules/story-kartei-events.js (Drag & Drop, Placement)
js/modules/story-kartei-ui.js (Helper für Kartei)
```

#### 3.4 Script-Submodul
```
js/modules/story-script-render.js (Script-Editor)
js/modules/story-script-events.js (Formatwechsel, Markierungen)
js/modules/story-script-ui.js (Script-Helper)
```

#### 3.5 Charaktere-Submodul
```
js/modules/story-charakter-render.js (Charakterliste & Details)
js/modules/story-charakter-events.js (CRUD)
js/modules/story-charakter-ui.js (Helper)
```

#### 3.6 Details-Submodul
```
js/modules/story-details-render.js (Details-Bereich)
// Details werden aus Markierungen aggregiert (read-only)
```

#### 3.7 PHP API
```
api/load-stories.php (GET alle Stories)
api/save-stories.php (POST speichern)
api/load-story-detail.php (GET einzelne Story)
api/save-story-detail.php (POST einzelne Story speichern)
// oder über gemeinsame endpoints, falls Struktur simpel
```

---

### 4. UI-Designfragen (MÜSSEN GEKLÄRT WERDEN)

#### 4.1 Karteiansicht – visuelle Umsetzung?
- Grid-basiert (wie Kanban-Board)?
- Freiformat (Karten können überall platziert werden)?
- Scrollbar für viele Karten?
- Wie groß sind Kartei-Karten?
- Icon/Symbol für Akt-Zugehörigkeit auf Karten?

#### 4.2 Frame/Akt-Visuals
- Sind Akte Umrahmungen um Karten (Container)?
- Oder separate Bereiche?
- Können Akte kollabiert werden?
- Wie wird ein neuer Akt zugewiesen? (Drag in bestehenden Bereich oder Modal?)

#### 4.3 Script-Editor
- Welcher Editor-Type? (Custom TextArea oder Monaco/CodeMirror?)
- Wie wird Formatierung visualisiert? (farbliche Kennzeichnung? Links im Editor?)
- Wie wird Markierung gemacht? (Select-Text + Button? Context-Menu? Highlighting?)
- Wie sieht das "Formatwechsel per Tab" aus? UI-Feedback?

#### 4.4 Charaktere-Verwaltung
- Modalform oder inline-Bearbeitung?
- Tabelle oder Kartenliste?
- Wo steht die Charakterliste? (im Projekt-Tab oder separate Seite?)

#### 4.5 Aktiv-Button Aussehen
- Wo steht der "Aktiv"-Button?
- Toggle-Style oder Radio-Button zwischen Kartei & Script?
- Visual Feedback, dass ein Bereich gesperrt ist?

#### 4.6 Responsive Design
- Soll es auf Tablets funktionieren?
- Mobile-Unterstützung?
- Minimale Fensterbreite?

---

### 5. Offene technische Fragen

#### 5.1 Versionierung & History
- Sollen Story-Änderungen versioniert werden?
- Undo/Redo notwendig?
- Audit-Log der Änderungen?

#### 5.2 Kollaboration
- Ein Nutzer gleichzeitig an Story arbeitend?
- Oder mehrere Nutzer (Locking-Mechanismus?)?

#### 5.3 Export/Import
- PDF-Export des Scripts?
- Export als Standarddrehbuch-Format (.fountain)?
- Import von externen Scripts?

#### 5.4 Validierung
- Szenen mit leerer Beschreibung erlaubt?
- Charaktere mit gleichem Name erlaubt?
- Script-Formatvalidierung?

#### 5.5 Performance
- Max. Anzahl Szenen pro Story?
- Max. Charaktere?
- Max. Script-Länge?
- Pagination notwendig?

#### 5.6 Integrationen
- Sollen Stories mit Aufträgen verknüpft werden?
- Sollen Story-Charaktere in Personal-Liste auftauchen?
- Link zu Firmenliste?

---

### 6. Schritte BEFORE Implementierung

#### 6.1 Design-Fragen beantworten
[ ] UI-Mockups/Wireframes für alle 4 Bereiche erstellen
[ ] Kartei-Visualisierung final entscheiden (grid vs. freiformat)
[ ] Button-Platzierung & -Labels festlegen
[ ] Farbschema definieren (passt zu bestandenem Kaiserlich-Design?)

#### 6.2 Datenschema finalisieren
[ ] Story-JSON-Struktur mit allen Feldern definieren
[ ] Beispiel-Story-JSON erstellen (mindestens 3 Szenen, 2 Akte, 2 Charaktere)
[ ] Migrationslogik klären (falls spätere Schema-Änderungen)

#### 6.3 Sync-Logik präzisieren
[ ] Exakte Regel pro Aktion definieren (Szene verschieben, Format ändern, Charakter löschen, etc.)
[ ] Edge Cases dokumentieren (z.B. Szene aus Akt entfernen, während Akt nur 1 Szene hat)
[ ] Konfliktlösung definieren (falls Kartei & Script sich widersprechen)

#### 6.4 API-Endpunkte definieren
[ ] HTTP-Methoden + Pfade festlegen
[ ] Request/Response-Formate dokumentieren
[ ] Error-Handling Spezifikation

#### 6.5 Kunden-Anforderung abklären
[ ] Soll das Modul auch im Kundenbereich sichtbar sein?
[ ] Welche Rechte haben Kunden? (Nur Lesezugriff? Können sie neuen Charaktere vorschlagen?)

---

### 7. Implementierungs-Roadmap (NACH Design-Phase)

#### Phase 2: Grundgerüst
1. HTML & CSS (story.html)
2. story-state.js + API (CRUD-Operationen)
3. Story-Liste Render & Events (Doppelklick öffnet Projekt)

#### Phase 3: Kartei-Grundlogik
1. Kartei-Render (statische Karten)
2. Kartei-Events (Karten verschieben, Karte hinzufügen, Karte löschen)
3. Frames/Akte-System (visuelle Gruppierung)

#### Phase 4: Script-Editor
1. Script-Render (Text-Editor mit Formatierung)
2. Tab-Formatwechsel-Logik
3. Markierungen im Script

#### Phase 5: Charaktere + Details
1. Charakterverwaltung (CRUD)
2. Details-Bereich (aggregierte Übersicht)
3. Skript-Referenz-Verknüpfung

#### Phase 6: Synchronisation & Testing
1. Kartei ↔ Script bidirektionale Sync
2. Unit Tests für Sync-Logik
3. UI/UX-Testing

---

## Entscheidungen (bisherig)

1. ✅ **Datenstruktur**: Wie Planung/Auftraege (PHP API + data/story-projects.json)
2. ✅ **Architektur**: Folgt bestehendem Modul-Muster (app.js, state.js, render.js, etc.)
3. ⏳ **UI**: Noch zu designen (Kartei-Visualisierung TBD)
4. ⏳ **Scope**: MVP oder vollständig? (noch zu entscheiden)

---

## Blockers & Abhängigkeiten

- 🔴 **UI-Design MUSS fertig sein**, bevor Event-Handler geschrieben werden
- 🔴 **Sync-Logik MUSS dokumentiert sein**, bevor state.js geschrieben wird
- 🟡 **API-Endpunkte können parallel zur Story-Struktur definiert werden**
- 🟡 **Frontend-Module können parallel zu Backend entwickelt werden**

---

## Nächste Schritte

1. **Diese Design-Fragen beantworten** (s. Punkt 5 & 6)
2. **UI-Mockups erstellen** (Kartei, Script, Charaktere)
3. **Story-JSON-Beispiel** mit mindestens 3 Szenen erstellen
4. **Sync-Logik-Tabelle** mit allen Aktion-Szenarien erstellen
5. → Dann: go for Implementierung Phase 2


## Ergänzung aus Abstimmung
- Wunsch: Plan als echte Datei im Workspace ablegen, damit direkte Bearbeitung im Projekt möglich ist.
- Status: Geplant für den nächsten Schritt außerhalb dieses Plan-Modus.


## Freigabe
- Status: Vom Nutzer freigegeben für Übergang in den Umsetzungsmodus.
- Nächster konkreter Schritt: Plan in den Workspace schreiben (z. B. STORY_DEVELOPMENT_PLAN.md im Projekt-Root).

