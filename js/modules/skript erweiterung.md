Story-Development-Modul – Aktueller Systemstand
1. Einstiegsebene: Story-Liste

Das Modul beginnt mit einer Listenansicht aller Story-Projekte.

Pro Eintrag enthält die Liste:

Projektname

mögliche Kunden

Kurzbeschreibung

Interaktion:

Doppelklick öffnet das jeweilige Projekt

2. Projektbereich

Innerhalb eines Projekts gibt es die Hauptbereiche:

Grundstruktur

Script

Details

Charaktere

Zusätzlich kann im Projektbereich das Feld für die Kurzbeschreibung des Projekts bearbeitet werden.

3. Grundstruktur – Karteiansicht
3.1 Grundprinzip

Die Grundstruktur basiert auf einem Karteikarten-System.

Jede Karteikarte repräsentiert eine Szene

Die Karten sind in einer Reihenfolge organisiert

Die Reihenfolge ist frei veränderbar

Karten können umplatziert werden

3.2 Inhalt der Karteikarten

Beim Klick auf eine Karte öffnet sich rechts ein Detailbereich.

Dort können folgende Inhalte gepflegt werden:

Tageszeit (optional)

Szenen-Location (optional)

Innen / Außen (optional)

Szenenbeschreibung als reiner Text

Wichtig:

In der Karteiansicht gibt es keine freie Drehbuchformatierung

Die Kartenlogik arbeitet immer mit der einfachsten Standardformatierung

Diese Standardformatierung entspricht im Script der Formatklasse:

Action

Regieanweisung

Das bedeutet:
Der Text aus den Karteikarten wird im Script grundsätzlich als Action / Regieanweisung interpretiert.

3.3 Karte hinzufügen

Am oberen Rand der Arbeitsfläche gibt es einen Button zum Hinzufügen einer neuen Karte.

Ablauf:

Klick auf den Button startet den Platzierungsmodus

Es wird noch keine Karte direkt eingefügt

Beim Bewegen der Maus im Arbeitsbereich erscheint ein Platzhalter

Die bestehenden Karten weichen diesem Platzhalter aus

Erst beim Klick wird die Karte an der gewählten Position eingefügt

3.4 Karte löschen

Jede Karte besitzt ein X zum Löschen.

Ablauf:

Klick auf X

Sicherheitsabfrage

Erst nach Bestätigung wird die Karte gelöscht

Die Löschung wirkt sich direkt auf die Script-Struktur aus.

4. Frame-System / Akte
4.1 Bedeutung

Frames dienen zur Zusammenfassung mehrerer Szenen zu einem Akt.

Ein Frame repräsentiert einen Akt

Alle enthaltenen Karten gehören zu diesem Akt

4.2 Frame erstellen

Neben dem Button zum Hinzufügen einer Karte gibt es einen Button zum Hinzufügen eines Frames.

Logik:

Der Button wird erst wirksam, wenn mindestens zwei Karten markiert sind

Die markierten Karten werden dann einem gemeinsamen Frame zugewiesen

4.3 Karten in Frames verschieben

Karten können per Klick-and-Drag verschoben werden.

Verhalten:

Beim Ziehen erscheint ein Platzhalter

Umliegende Karten passen sich dem Platzhalter an

Beim Loslassen wird die Karte final gesetzt

Wird eine Karte in einen Frame gezogen:

die Karten im Frame weichen dem Platzhalter aus

der Frame passt seine Größe automatisch an

die neue Karte wird Teil dieses Frames

Wird eine neue Karte in einen Frame gesetzt:

gilt dieselbe Logik

der Frame wächst automatisch mit

Wird eine Karte außerhalb eines Frames platziert:

wird sie damit effektiv aus dem Frame entfernt

Das ist die definierte Logik zum Entfernen einer Szene aus einem Akt.

5. Script-Bereich
5.1 Grundprinzip

Das Projekt enthält einen Script-Editor mit automatischer Drehbuchformatierung.

Eigenschaften:

editierbarer Textbereich

automatische Formatierungslogik

Formatwechsel per Tabulator-Zyklus

Ausrichtung an international üblichem Drehbuchstandard

5.2 Formatierungslogik zwischen Karten und Script
In der Karteiansicht:

Formatierungen können nicht geändert werden

Jeder bestehende Text behält die vorhandene Formatierung

Wird Text ergänzt, übernimmt er die bereits vorhandene Formatierung

Wird eine neue Zeile eingefügt, erhält diese automatisch die Standardformatierung:
Action / Regieanweisung

In der Scriptansicht:

kann jeglicher Text frei in die für das Drehbuch notwendige Formatklasse umformatiert werden

die Scriptansicht ist die führende Instanz für Formatierungsentscheidungen

Das bedeutet konkret:

Karteikarten liefern Standardtext in Action-/Regieanweisungs-Format

Script kann diesen Text in jede notwendige Drehbuchform überführen

Kartei übernimmt diese Formatierungsinformation nur

die Kartei selbst ändert keine Formatierungen aktiv

6. Aktiv-Steuerung zwischen Kartei und Script
6.1 Steuerbutton „Aktiv“

Der Steuerbutton heißt „Aktiv“ und existiert in beiden Ansichten:

Kartei-Ansicht

Script-Ansicht

6.2 Gegenseitige Exklusivität

Der Status ist immer gegensätzlich:

Ist Kartei aktiv, ist Script inaktiv

Ist Script aktiv, ist Kartei inaktiv

Beide Buttons sind klickbar, aber nie gleichzeitig aktiv.

6.3 Bedeutungslogik
Wenn Kartei aktiv ist:

Karteikarten sind bearbeitbar

Script ist gesperrt

Wenn Script aktiv ist:

Script ist bearbeitbar

Karteikarten sind gesperrt

Damit ist eindeutig geregelt, welche Oberfläche aktuell die führende Bearbeitungsinstanz ist.

7. Synchronisation zwischen Kartei und Script
7.1 Einfluss der Kartei auf das Script

Wenn die Kartei aktiv ist, beeinflusst sie das Script in folgenden Punkten:

Szenenposition

Aktposition

Szenenzuweisung zu Akten

Entfernen einer Szene aus einem Akt

Szenen erstellen

Szenen löschen

Zusätzlich gilt:

der Karteninhalt wird im Script als Action / Regieanweisung übernommen

7.2 Einfluss des Scripts auf die Kartei

Im Script ist der Einfluss auf die Kartei in denselben Strukturpunkten rückwirkend wirksam:

Szenenposition

Aktposition

Szenenzuweisung zu Akten

Entfernen einer Szene aus Akten

Szenen erstellen

Szenen löschen

Zusätzlich gilt:

Formatierung entsteht im Script

diese Formatierung wird in der Kartei nur übernommen

die Kartei bearbeitet Formatierung nicht aktiv

Die Trennung ist klar:

Struktur geht in beide Richtungen

Formatierungshoheit liegt ausschließlich im Script

8. Markierungen im Script

In der Scriptansicht können Textbereiche markiert werden.

Für markierte Bereiche soll das rechte Einstellungsfenster folgende Funktionen bereitstellen:

Kommentar hinzufügen

Kategorie zuweisen

Beispielkategorien:

Requisit

Bühnenbild

Make-up

Kostüm

Technik

Effekte

Diese Zuordnungen dienen der späteren Auswertung.

9. Details-Bereich

Der Bereich Details dient als strukturierte Übersicht aller markierten und kategorisierten Elemente aus dem Script.

Aufbau:

Spalte 1: Name des markierten Textbereichs

Spalte 2: zusätzliche Beschreibung

Damit entsteht eine projektbezogene Liste relevanter inhaltlicher und produktioneller Elemente.

10. Charakter-Bereich

Das System wird um einen separaten Bereich „Charaktere“ erweitert.

Dieser Bereich dient der strukturierten Verwaltung aller Figuren der Geschichte.

10.1 Zweck

Hier werden sämtliche Charaktere des Projekts erfasst und beschrieben, damit sie für Story-Entwicklung, Script-Arbeit und spätere Produktionsvorbereitung zentral verfügbar sind.

10.2 Pflichtfelder

Jeder Charaktereintrag muss mindestens folgende Pflichtfelder enthalten:

Name
→ vollständiger Name der Figur

Skript-Referenz
→ Kurzversion des Namens, so wie die Figur im Script bei Dialogen bezeichnet wird

Diese Trennung ist fachlich notwendig.
Der volle Figurenname und die Dialogbezeichnung sind nicht automatisch identisch.

10.3 Weitere Felder

Zusätzlich soll jeder Charakter folgende Beschreibungsfelder enthalten:

allgemeine Beschreibung

wants and needs

Alter

Aussehen

10.4 Funktionslogik

Der Charakter-Bereich ist eine eigenständige Projektverwaltungsebene.
Er dient zunächst der Beschreibung und Ordnung der Figuren.

Die Skript-Referenz ist dabei das entscheidende Feld für die Verbindung zur Scriptlogik, weil Dialogbezeichnungen im Drehbuch auf dieser Kurzform basieren.

11. Zentrale Systemlogik

Das Modul besteht damit aus vier gekoppelten Projektbereichen:

A. Strukturebene

Karten

Reihenfolge

Frames / Akte

Story-Aufbau

B. Textebene

Script

Formatierung

Markierungen

Kategorisierung

C. Detailauswertung

extrahierte und kategorisierte Inhalte

zusätzliche Beschreibungen

D. Charakterverwaltung

Figurenübersicht

Figurenbeschreibung

Script-Referenz für Dialoglogik

12. Entscheidende Regel

Die wichtigste fachliche Trennung lautet:

Strukturänderungen können von Kartei und Script kommen

Formatierungsänderungen kommen ausschließlich aus dem Script

Karteikarten verwenden standardmäßig Action / Regieanweisung

Karteikarten übernehmen Script-Formatierungen nur passiv

Charakterdaten werden zentral im Charakter-Bereich gepflegt

Skript-Referenzen der Figuren definieren die Kurzschreibweise im Dialogsystem

13. Harte technische Realität

Das System ist mittlerweile kein Zusatzmodul mehr, sondern ein vollwertiges Story- und Script-Management-System mit:

Story-Übersicht

Kartenlogik

Aktlogik

bidirektionaler Struktursynchronisation

Script-Editor mit Formatierungshoheit

markierbaren Textbereichen

Detailauswertung

Charakterverwaltung

Der kritische Punkt ist inzwischen eindeutig:
Ohne sauberes Datenmodell wird das instabil.

Insbesondere müssen sauber definiert werden:

eindeutige IDs für Szenen, Frames und Charaktere

Verknüpfung zwischen Szenenstruktur und Scriptstruktur

Verknüpfung zwischen Script-Dialogbezeichnungen und Charakterdatensätzen

Prioritätsregeln für Synchronisation

saubere Trennung zwischen Struktur, Formatierung und Figurenverwaltung

Das ist der Stand, an dem man nicht weiter an der Oberfläche herumformulieren sollte, sondern die technische Systemlogik sauber festziehen muss.

Ich kann dir als Nächstes den gesamten Stand als kompaktes Entwicklerbriefing in sauberer Lastenheft-Struktur formulieren.