# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Questlog: persönliches Zeittracking (Quests mit Timer) als PWA. Freigegebene Akzeptanzkriterien und Datenmodell: @docs/konzept.md

## Harte Regeln

- Alle Daten liegen unter `users/{uid}/…`; Security Rules erlauben nur dem eingeloggten Nutzer Zugriff auf seine eigene uid. Keine Collections außerhalb dieses Pfads anlegen.
- Es läuft immer nur **ein** Timer: Zustand ausschließlich im Dokument `users/{uid}/state/activeTimer`. Start/Stopp per `writeBatch` (funktioniert offline), nicht per Transaktion.
- Timer-Sitzungen bekommen die ID `t_<startedAt-Millis>` (idempotent bei Stopp von mehreren Geräten).
- Quests und Meilensteine haben bewusst **kein Enddatum**.
- Todoist **jetzt nicht** einbauen (kommt später über Cloud Functions). Das Feld `todoistLabel` bleibt optional und ungenutzt.
- Rein statischer Build (kein SSR, keine Astro-Server-Endpunkte). Spark-Plan: keine Cloud Functions.
- Firebase-Config nur über `PUBLIC_FIREBASE_*`-Variablen aus `.env`, nie hart im Code.

## Changelog

- Nach jeder abgeschlossenen Aufgabe einen Eintrag in CHANGELOG.md anhängen, nur per Bash (cat >> CHANGELOG.md <<'EOF' ... EOF). Die Datei nie komplett lesen oder neu schreiben.
- Format: "## YYYY-MM-DD HH:MM – Kurztitel", darunter 2–4 Stichpunkte: was geändert wurde, welche Dateien, bei Entscheidungen kurz das Warum.
- Jeder Eintrag endet mit "Offen:" und listet den aktuellen Gesamtstand aller offenen technischen Punkte. Erledigtes aus früheren Einträgen fällt dort weg.
- Beim Start einer neuen Sitzung oder nach /clear nur die letzten Einträge lesen (tail -30 CHANGELOG.md), um den Stand zu kennen.
- Keine TODO.md anlegen.

## Aufgaben für mich (Todoist)

- Wenn ich selbst etwas erledigen muss (z. B. Secrets anlegen, Rollen vergeben, Kunden etwas fragen), schlage mir die Aufgaben am Ende als kurze Liste vor: Titel, kurze Beschreibung, ggf. Fälligkeit.
- Erst nach meiner ausdrücklichen Freigabe in Todoist im Projekt "Questlog" anlegen. Ohne Freigabe nichts eintragen.
- Bereits erledigte Aufgaben, die du in Todoist findest, nur nach Rückfrage abhaken.
