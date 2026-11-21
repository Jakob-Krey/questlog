# Changelog

## 2026-11-21 17:15 – Projekt-Setup und Changelog-Regel
- CLAUDE.md, docs/konzept.md, Skill /umsetzungsstand und Notification-Hook (.claude/settings.json) angelegt.
- CHANGELOG.md angelegt und Changelog-Regel in CLAUDE.md ergänzt.
- Offen: noch kein App-Code; nächster Schritt ist das Astro-Projekt plus Supabase-Tabelle quests.

## 2026-11-21 17:19 – Statuszeile eingerichtet (Test-Eintrag)
- Globale StatuszeBile in ~/.claude/settings.json mit Skript ~/.claude/statusline-command.sh eingerichtet.
- Anzeige: Ordner + Git-ranch, Modell, Kontext-Auslastung, Rate-Limits (5h/7d).
- Keine Projektdateien geändert; Eintrag dient zum Testen der Changelog-Regel.
## 2026-11-21 17:42 – Umstieg auf Firebase, Konzept freigegeben
- docs/konzept.md durch freigegebene Akzeptanzkriterien und Firestore-Datenmodell ersetzt (Questlog, Firebase statt Supabase).
- CLAUDE.md-Regeln und Skill /umsetzungsstand auf Firebase angepasst; Todoist und Done-Logbuch vorerst nicht im Umfang.
- Offen: Projektgerüst, Features, Deploy.

## 2026-11-21 18:05 – App-Grundgerüst mit allen Kernfunktionen
- Astro 7.3 (statisch, Preact-Inseln) mit Firebase Auth (Google) und Firestore inkl. Offline-Cache; Config über .env (PUBLIC_FIREBASE_*), .env.example angelegt.
- Seiten: Quests (Karten mit Wochenfortschritt, Meilensteine), Sitzungen (bearbeiten/nachtragen), Auswertung (Woche/Monat/Quartal), Wochenreflexion; globale Timer-Leiste mit Live-Sync, freiem Timer und Auto-Stopp nach 8 h.
- PWA: Manifest, Service Worker, Icons (scripts/icons.mjs); firestore.rules + firestore.indexes.json; Tests: 10 Unit-Tests (tests/unit), 5 Rules-Tests gegen Emulator (tests/rules).
- Hinweis: Astro 7.4 verlangt Node ≥ 22.22, lokal ist 22.18 installiert – daher auf 7.3.8 gepinnt.

## 2026-11-21 18:08 – Rules live, GitHub-Deploy vorbereitet
- Firestore Rules und Index für questlog-85f26 deployt (Zugriff nur auf eigene uid); Build auf build.format "file" umgestellt (kein Redirect /quest → /quest/).
- .github/workflows: Push auf main = Tests, Rules/Indexes, Hosting live; Pull Request = Tests und Vorschau-Kanal.
- Offen: GitHub-Repo anlegen, Secrets FIREBASE_SERVICE_ACCOUNT_QUESTLOG_85F26 und FIREBASE_ENV setzen, Dienstkonto braucht Rollen für Rules/Indexes; Google-Login auf Vorschau-URLs nur nach manueller Freigabe der Domain.
