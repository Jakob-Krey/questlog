---
name: Questlog
description: Persönliches Zeittracking für große Ziele – ruhig wie ein Feldnotizbuch.
colors:
  waldgruen: "#2f5d50"
  waldgruen-hell: "#e4eeea"
  papier: "#f7f6f3"
  blatt: "#ffffff"
  tinte: "#1d1d1f"
  bleistift: "#6b6b70"
  linie: "#e3e1dc"
  signalrot: "#b3261e"
  erledigt-gruen: "#2f7d4f"
  waldgruen-nacht: "#6fb39f"
  waldgruen-hell-nacht: "#24332e"
  papier-nacht: "#17171a"
  blatt-nacht: "#212125"
  tinte-nacht: "#ececef"
  bleistift-nacht: "#9a9aa2"
  linie-nacht: "#34343a"
  signalrot-nacht: "#f08b84"
  erledigt-gruen-nacht: "#7fcf9c"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 700
  clock:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    fontFeature: "tnum"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
rounded:
  md: "8px"
  lg: "12px"
  pill: "99px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
components:
  button-default:
    backgroundColor: "{colors.blatt}"
    textColor: "{colors.tinte}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary:
    backgroundColor: "{colors.waldgruen}"
    textColor: "{colors.blatt}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-danger:
    backgroundColor: "{colors.signalrot}"
    textColor: "{colors.blatt}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-link:
    textColor: "{colors.waldgruen}"
    padding: "4px 6px"
  input:
    backgroundColor: "{colors.blatt}"
    textColor: "{colors.tinte}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  card:
    backgroundColor: "{colors.blatt}"
    rounded: "{rounded.lg}"
    padding: "16px"
  nav-link:
    textColor: "{colors.bleistift}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  nav-link-active:
    backgroundColor: "{colors.waldgruen-hell}"
    textColor: "{colors.tinte}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  badge:
    backgroundColor: "{colors.waldgruen-hell}"
    textColor: "{colors.bleistift}"
    rounded: "{rounded.pill}"
    padding: "1px 7px"
  progress:
    backgroundColor: "{colors.waldgruen-hell}"
    rounded: "{rounded.pill}"
    height: "8px"
---

# Design System: Questlog

## Overview

**Creative North Star: "Das Feldnotizbuch"**

Questlog sieht aus wie ein gut geführtes Feldnotizbuch für lange Vorhaben: warmes Papier, dunkle Tinte, feine Linien und eine einzige Farbe für das, was zählt. Die Oberfläche ist Werkzeug, nicht Bühne. Sie tritt zurück, damit Zahlen, Ziele und der laufende Timer klar lesbar bleiben – am Mac wie am Handy.

Die Stimmung ist ruhig und zurückhaltend. Dekoration gibt es nicht; Farbe erscheint nur dort, wo sie etwas bedeutet: Fortschritt gegen das Wochen-Soll, der aktive Navigationspunkt, der laufende Timer, der eine Haupt-Button eines Bereichs. Die Dichte ist mittel: großzügig genug für Touch, kompakt genug, dass die Wochenübersicht ohne Scrollen erfassbar ist.

Komponenten sind schlicht und präzise: dünne 1px-Linien, sanft gerundete Ecken, wenig Gewicht. Hell- und Dunkelmodus sind gleichwertig und folgen dem System.

**Key Characteristics:**
- Warmes Papier-Off-White als Grund, reines Weiß für Blätter (Karten, Panels, Eingaben).
- Genau eine Akzentfarbe: Waldgrün.
- Systemschrift, Zahlen mit fester Ziffernbreite.
- Flach: Trennung über Linie und Ton, nicht über Schatten.
- Vollwertiger Dunkelmodus über `prefers-color-scheme`.

## Colors

Eine erdige, fast monochrome Palette aus Papier, Tinte und Bleistift mit Waldgrün als einziger Stimme.

### Primary
- **Waldgrün** (#2f5d50; nachts #6fb39f): Der eine Akzent. Gefüllte Haupt-Buttons, Fortschrittsbalken, Balken in der Auswertung, Links, Fokusring, aktive Segmente, der Ring um die Karte mit laufendem Timer.
- **Waldgrün hell** (#e4eeea; nachts #24332e): Getönte Fläche des Akzents. Hintergrund der Timer-Leiste während ein Timer läuft, aktiver Navigationspunkt, Spur des Fortschrittsbalkens, Badges.

### Neutral
- **Papier** (#f7f6f3; nachts #17171a): Seitenhintergrund und ruhende Timer-Leiste. Auch `theme-color` und Manifest-Hintergrund.
- **Blatt** (#ffffff; nachts #212125): Karten, Panels, Kopfzeile, Eingabefelder, Standard-Buttons.
- **Tinte** (#1d1d1f; nachts #ececef): Fließtext, Titel, aktive Navigation.
- **Bleistift** (#6b6b70; nachts #9a9aa2): Sekundärtext – Feldbeschriftungen, Meta-Zeilen, SMART-Ziel in Karten, inaktive Navigation, erledigte Meilensteine.
- **Linie** (#e3e1dc; nachts #34343a): Alle 1px-Rahmen und Trennlinien.

### Status
- **Signalrot** (#b3261e; nachts #f08b84): Stopp-Button, pulsierender Aufnahmepunkt, Löschen, Fehlertexte.
- **Erledigt-Grün** (#2f7d4f; nachts #7fcf9c): Nur für erfülltes Wochen-Soll in der Reflexion.

### Named Rules
**The One Voice Rule.** Waldgrün ist die einzige Akzentfarbe. Pro Bereich ist höchstens ein Button gefüllt; alles andere bleibt Papier, Tinte und Linie.

**The No Gold Rule.** Gold gehört nicht zur Oberfläche. Das Gold im App-Icon (Uhrzeiger) ist kein UI-Token; die in `global.css` definierte, ungenutzte Variable `--gold` wird nicht verwendet.

**The Red Means Stop Rule.** Signalrot steht ausschließlich für Stoppen, Löschen und Fehler – nie für Hervorhebung.

## Typography

**Body Font:** Systemschrift (-apple-system / BlinkMacSystemFont / Segoe UI / system-ui, sans-serif)

**Character:** Eine einzige, native Schriftfamilie. Sie fühlt sich auf Mac und iPhone wie ein Teil des Systems an und hält das Werkzeug unauffällig; Hierarchie entsteht über Größe und Gewicht, nicht über Schriftwechsel.

### Hierarchy
- **Headline** (700, 1.6rem): Seitentitel (`h1`), eine pro Seite.
- **Title** (700, 1.1rem): Abschnittsüberschriften (`h2`) und Quest-Namen auf Karten.
- **Clock** (600, 1.2rem, tabellarische Ziffern): Laufzeit des Timers.
- **Body** (400, 16px, Zeilenhöhe 1.5): Fließtext, Listen, Formulare.
- **Label** (400, 0.9rem, Bleistift): Feldbeschriftungen über Eingaben; SMART-Ziel auf Karten (max. drei Zeilen, dann abgeschnitten).
- **Meta** (400, 0.85rem, Bleistift): Ist/Soll-Zeile und Meilensteinzähler auf Karten.

### Named Rules
**The Tabular Numbers Rule.** Jede Dauer, Uhrzeit und Stundenzahl steht in tabellarischen Ziffern (`font-variant-numeric: tabular-nums`) und in Tabellen rechtsbündig, damit Zahlen beim Ticken und untereinander nicht springen.

## Layout

Eine einzelne, zentrierte Spalte mit maximal 880px Breite und 16px Innenabstand. Darüber liegen die Kopfzeile (Marke und horizontale Navigation, bei Platzmangel horizontal scrollbar) und die klebende Timer-Leiste, die beim Scrollen oben bleibt. Safe-Area-Abstände (`env(safe-area-inset-*)`) sind oben und unten berücksichtigt, damit die installierte PWA unter Notch und Home-Indikator sauber sitzt.

Quest-Karten liegen in einem automatisch umbrechenden Raster (Spalten mindestens 240px, 12px Abstand). Abstände folgen einer kleinen Skala aus 4 / 8 / 12 / 16px; Panels haben 16px Innen- und Außenabstand.

Unterhalb von 560px Breite nimmt das Eingabefeld der Timer-Leiste die volle Breite ein und die Balkenspalte der Auswertung wird ausgeblendet.

## Elevation & Depth

Das System ist flach. Flächen trennen sich ausschließlich über den Tonunterschied zwischen Papier und Blatt und über 1px-Linien. Die einzige Ausnahme ist ein zusätzlicher 1px-Ring in Waldgrün um die Karte, deren Timer gerade läuft – ein Zustandssignal, kein Schatten. Das ist der dokumentierte Ist-Zustand, kein Verbot: Tiefe darf künftig hinzukommen, wenn eine Aufgabe sie begründet.

### Shadow Vocabulary
- **Laufend-Ring** (`box-shadow: 0 0 0 1px var(--accent)`): Verdoppelt den Waldgrün-Rahmen der Karte mit laufendem Timer.

## Shapes

Sanft gerundete Rechtecke. Bedienelemente (Buttons, Eingaben, Navigationspunkte, Segment-Schalter) haben 8px Radius, Behälter (Karten, Panels) 12px. Fortschrittsbalken, Auswertungsbalken und Badges sind vollständig abgerundete Pillen (99px). Der Aufnahmepunkt im Timer ist ein Kreis. Rahmen sind immer 1px in Linie; Kanten werden nie durch Farbe allein gezogen.

## Components

### Buttons
Schlicht und präzise; nur die wichtigste Aktion trägt Farbe.
- **Shape:** sanft gerundet (8px), Polsterung 8px × 14px, kein Umbruch im Text.
- **Standard:** Blatt-Fläche, 1px Linie, Tinte.
- **Primary:** Waldgrün gefüllt, weißer Text, Gewicht 600. Nur die eine Hauptaktion eines Bereichs („Quest anlegen“, „Start“ auf der Detailseite). Karten-Buttons sind Standard.
- **Danger:** Signalrot gefüllt, Gewicht 600, Text in `--warn-text` (hell: Weiß, dunkel: fast Schwarz #2a0b09 für Kontrast auf dem hellen Nacht-Rot). Für „Stopp“ und Löschen.
- **Hover:** Standard-Buttons bekommen einen Bleistift-Rahmen, Link-Buttons eine Unterstreichung.
- **Touch:** Bei grobem Zeiger (Touch) mindestens 44px hoch.
- **Link:** ohne Rahmen und Fläche, Waldgrün, kleinere Polsterung (4px × 6px). Für „Abbrechen“ und Nebenaktionen.
- **Icon:** wie Standard, schmale Polsterung (6px × 8px), mit gezeichneten SVG-Icons (24er-Raster, Strich 2px, runde Enden) statt Unicode-Pfeilen; immer mit `aria-label`.
- **Focus:** 2px Waldgrün-Kontur mit 2px Abstand (gilt für alle Bedienelemente).
- **Disabled:** 50 % Deckkraft, normaler Cursor.

### Chips (Badges)
- **Style:** kleine Pille (0.75rem), Waldgrün-hell als Fläche, Bleistift als Text, steht neben Titeln (z. B. Status „pausiert“).

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Blatt auf Papier.
- **Shadow Strategy:** keine; siehe Elevation & Depth.
- **Border:** 1px Linie; bei laufendem Timer Waldgrün plus Laufend-Ring.
- **Internal Padding:** 16px, Inhalte im Abstand von 8px gestapelt; der Start-Button sitzt unten links.
- **Panel:** gleiche Form wie Karte, als Formular- oder Aufklappbereich (`details`) mit fetter Zusammenfassung.

### Inputs / Fields
- **Style:** volle Breite, Blatt-Fläche, 1px Linie, 8px Radius, Polsterung 8px × 10px. Beschriftung als Bleistift-Label darüber, 4px Abstand.
- **Focus:** 2px Waldgrün-Kontur mit 2px Abstand.
- **Checkbox:** 18px, Akzentfarbe Waldgrün; erledigte Meilensteine werden durchgestrichen und in Bleistift gesetzt.

### Navigation
- **Style:** horizontale Textlinks in der Kopfzeile, Bleistift, 8px Radius, Polsterung 6px × 10px.
- **Active:** Tinte, Gewicht 600, Waldgrün-hell hinterlegt.
- **Mobile (unter 560px):** Die Navigation wird zur festen Tab-Leiste am unteren Rand (Blatt-Fläche, 1px Linie oben, vier gleich breite Ziele à mindestens 48px, Safe-Area berücksichtigt). Kopfzeile oben zeigt dann nur Marke, ggf. Offline-Hinweis und „Abmelden“.
- **Segment-Schalter** (Woche / Monat / Quartal): gerahmte Gruppe mit 8px Radius; aktives Segment Waldgrün gefüllt.

### Timer-Leiste (Signature Component)
Erscheint nur, solange ein Timer läuft, und klebt dann oben unter der Kopfzeile auf jeder Seite. Fläche Waldgrün-hell, links ein pulsierender Signalrot-Punkt (10px, 1.6s; bei reduzierter Bewegung statisch), Quest-Titel und Laufzeit in Clock-Typografie, rechts Notizfeld und Danger-Button „Stopp“. Auf dem Handy rutschen Notiz und Stopp in eine eigene volle Zeile. Ohne laufenden Timer gibt es keine Leiste – gestartet wird an der Quest.

### Quest-Karte (Signature Component)
Name (Title, max. zwei Zeilen), SMART-Ziel einzeilig in Bleistift, dann der Zahlenanker: Ist-Stunden groß (600, 1.35rem, tabellarisch) „von“ Soll, rechts die Prozentzahl. Der Fortschrittsbalken endet bei 100 %, die Prozentzahl zählt darüber hinaus (ab 100 % in Erledigt-Grün, „Soll erfüllt“). Darunter der Stand gegen den gleichmäßigen Wochenplan („Im Plan“ / „1:59 h hinter Plan“) und der nächste offene Meilenstein. Aktion unten links: Standard-Button „Start“, bzw. „Wechseln“, wenn schon ein anderer Timer läuft; auf der laufenden Karte Danger-Button „Stopp“ mit Punkt und „läuft“. Karten sind nach Rückstand sortiert (gespeicherte Zeit, damit nichts während der Arbeit springt).

### Wochenkopf
Seitentitel „Diese Woche“, darunter in Bleistift „KW 47 · 16.11.–22.11.2026 · noch 3 Tage“; rechts die Wochensumme aller aktiven Quests im selben Zahlenanker-Stil wie auf den Karten.

### Meldungen (Toasts)
Unten mittig, über der Tab-Leiste: dunkle Tinte-Fläche mit Papier-Text, 12px Radius, weicher Schatten (`0 6px 24px rgb(0 0 0 / 0.18)`). Bestätigungen mit unterstrichener Aktion „Rückgängig“ (8s), Fehler in Signalrot mit Lösungshinweis (10s). Ersetzt jedes `alert()`.

### Offline-Hinweis
Kleine gerahmte Pille in der Kopfzeile, nur wenn das Gerät offline ist: „Offline – wird synchronisiert“ (auf dem Handy nur „Offline“).

### Fortschrittsbalken
8px hohe Pille: Spur in Waldgrün-hell, Füllung in Waldgrün, Breitenänderung animiert über 0.4s. Zeigt Ist-Stunden dieser Woche gegen das Wochen-Soll.

## Do's and Don'ts

### Do:
- **Do** Waldgrün als einzige Akzentfarbe verwenden und pro Bereich höchstens einen Button füllen.
- **Do** Flächen über Papier/Blatt-Ton und 1px Linie trennen.
- **Do** alle Zeiten und Stunden in tabellarischen Ziffern setzen, in Tabellen rechtsbündig.
- **Do** Bedienelemente mit 8px und Behälter mit 12px Radius runden; Balken und Badges als Pille.
- **Do** jede neue Farbe als Variable mit Hell- und Dunkelwert in `:root` anlegen.
- **Do** Bewegung bei `prefers-reduced-motion: reduce` abschalten.
- **Do** Fehler und Bestätigungen als Meldung unten zeigen – mit Ursache und nächstem Schritt, bei Timer-Aktionen mit „Rückgängig“.

### Don't:
- **Don't** Gold oder eine andere zweite Akzentfarbe in die Oberfläche einbauen.
- **Don't** Signalrot für Hervorhebung nutzen; es bedeutet nur Stopp, Löschen oder Fehler.
- **Don't** Farbwerte direkt in Komponenten schreiben statt über die Variablen in `global.css`.
- **Don't** `alert()` verwenden oder Unicode-Zeichen (← ↑ ✕) als Icons einsetzen.
- **Don't** eine zweite Schriftfamilie einführen.
