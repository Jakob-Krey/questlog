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

- Nach jeder abgeschlossenen Änderung oder am Ende einer Aufgabe einen Eintrag in CHANGELOG.md anhängen.
- Format: "## YYYY-MM-DD HH:MM – Kurztitel", darunter 2–4 Stichpunkte: was geändert wurde, welche Dateien, offene Punkte.
- Die Datei NIE lesen oder komplett neu schreiben, sondern nur per Bash anhängen, z. B. mit cat >> CHANGELOG.md <<'EOF' ... EOF.
- Kurz und sachlich halten, keine Code-Ausschnitte.
