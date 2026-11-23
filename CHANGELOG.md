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

## 2026-11-21 18:10 – Mit GitHub verbunden
- Remote origin = github.com/Jakob-Krey/questlog, erster Commit e3edb00 auf main gepusht.
- Offen: Secrets FIREBASE_SERVICE_ACCOUNT_QUESTLOG_85F26 und FIREBASE_ENV fehlen noch, daher schlägt der erste Deploy-Lauf fehl (es wird nichts deployt).

## 2026-11-21 18:32 – Changelog-Regel überarbeitet, Todoist-Regel ergänzt
- CLAUDE.md: Abschnitt "Changelog" ersetzt (Einträge enden mit "Offen:" als Gesamtstand, Sitzungsstart per tail -30, keine TODO.md). Warum: Stand soll ohne Lesen der ganzen Datei erkennbar sein.
- CLAUDE.md: neuer Abschnitt "Aufgaben für mich (Todoist)": Aufgaben nur vorschlagen, erst nach Freigabe im Projekt "Questlog" anlegen.
- Todoist-Zugriff per MCP geprüft: funktioniert, ein Projekt "Questlog" gibt es dort aber noch nicht.
- Offen: GitHub-Secrets FIREBASE_SERVICE_ACCOUNT_QUESTLOG_85F26 und FIREBASE_ENV fehlen (Deploy schlägt fehl); Dienstkonto braucht Rollen für Rules/Indexes; Vorschau-Domains für Google-Login nicht freigegeben; Änderungen an firebase.json und neue Skills/skills-lock.json nicht committet; Todoist-Projekt "Questlog" fehlt.

## 2026-11-21 18:35 – Todoist-Projekt "Questlog" angelegt
- Leeres persönliches Projekt "Questlog" in Todoist angelegt; keine Aufgaben eingetragen (nur Projekt freigegeben).
- Keine Projektdateien geändert.
- Offen: GitHub-Secrets FIREBASE_SERVICE_ACCOUNT_QUESTLOG_85F26 und FIREBASE_ENV fehlen (Deploy schlägt fehl); Dienstkonto braucht Rollen für Rules/Indexes; Vorschau-Domains für Google-Login nicht freigegeben; Änderungen an firebase.json und neue Skills/skills-lock.json nicht committet.

## 2026-11-21 18:39 – Live-Fehler auth/invalid-api-key behoben
- Ursache: Der Live-Deploy von e3edb00 lief, bevor das Secret FIREBASE_ENV angelegt war, deshalb war apiKey im Bundle leer. Workflow (.env aus Secret) und Variablennamen PUBLIC_FIREBASE_* in .env, env.d.ts und firebase.ts waren korrekt.
- .github/workflows (merge + pull-request): neue Schritte prüfen vor dem Build, ob alle 6 Variablen gesetzt sind, und nach dem Build, ob der API-Key im Bundle steckt. Warum: Ein leeres Secret ließ den Build bisher still durchlaufen. Es werden keine Werte ausgegeben.
- Commit 586a9d5 auf main, Run 44931085634 komplett erfolgreich; Live-Bundle enthält den API-Key jetzt.
- Offen: Vorschau-Domains für Google-Login nicht freigegeben; Google-Login live noch nicht manuell getestet; gh CLI lokal nicht installiert (Run-Status nur über die öffentliche API); Änderungen an CLAUDE.md, firebase.json und neue Skills/skills-lock.json nicht committet.

## 2026-11-21 18:46 – gh CLI eingerichtet und Deploy-Log geprüft
- gh 2.105.0 ist installiert und als Jakob-Krey angemeldet; die Secrets FIREBASE_ENV und FIREBASE_SERVICE_ACCOUNT_QUESTLOG_85F26 sind vorhanden.
- Im Log von Run 44931085634 bestätigt: "Firebase-Config vollständig: 6/6" und "API-Key im Build enthalten: ja".
- Keine Projektdateien geändert.
- Offen: Vorschau-Domains für Google-Login nicht freigegeben; Google-Login live noch nicht manuell getestet; Änderungen an CLAUDE.md, firebase.json und neue Skills/skills-lock.json nicht committet.

## 2026-11-21 18:50 – Offene Nutzer-Aufgaben geschlossen
- Laut Nutzer ist der Google-Login live erledigt; die Freigabe der Vorschau-Domains entfällt bewusst.
- Todoist-Projekt "Questlog" ist leer, die beiden Aufgaben waren dort nie angelegt. Keine Projektdateien geändert.
- Offen: Änderungen an CLAUDE.md, firebase.json und neue Skills/skills-lock.json nicht committet; Google-Login in PR-Vorschauen funktioniert ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-21 18:53 – PRODUCT.md per /impeccable init angelegt
- Neue Datei PRODUCT.md: Nutzer (nur Jakob), Zweck (Zeit gegen große Projektziele, keine Mini-To-dos), Positionierung gegenüber Toggl/Clockify, Funktionen, Begriffe, Produktprinzipien.
- Grundlage waren docs/konzept.md und Jakobs Antworten im Interview. Keine visuellen Festlegungen; DESIGN.md gibt es weiterhin nicht.
- Offen: Änderungen an CLAUDE.md, firebase.json, PRODUCT.md, neue Skills (inkl. impeccable) und skills-lock.json nicht committet; Live-Modus von impeccable nicht eingerichtet; DESIGN.md fehlt (/impeccable document); Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-21 18:58 – DESIGN.md per /impeccable document angelegt
- Neue Dateien DESIGN.md und .impeccable/design.json (Sidecar für das Live-Panel). Sie halten den Ist-Look aus global.css fest: Leitbild „Das Feldnotizbuch“, ruhig und zurückhaltend, Waldgrün als einziger Akzent, flach mit 1px-Linien, Systemschrift.
- Entscheidungen von Jakob: kein Gold in der Oberfläche (No Gold Rule); flach ist der Ist-Zustand, aber kein Verbot. Am Code wurde nichts geändert.
- Offen: Ungenutzte Variable --gold in global.css und Gold im App-Icon noch vorhanden; Änderungen an CLAUDE.md, firebase.json, PRODUCT.md, DESIGN.md, .impeccable/design.json, neue Skills (inkl. impeccable) und skills-lock.json nicht committet; Live-Modus von impeccable nicht eingerichtet; Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-21 19:03 – Design-Critique der Quest-Übersicht
- /impeccable critique für src/pages/index.astro (Overview.tsx) mit getrenntem Design-Review und Detektor-Lauf: 20/40 (akzeptabel), 2× P1, 3× P2. Snapshot unter .impeccable/critique/.
- P1: Auf dem Handy ist die Reflexion im Menü abgeschnitten und die Touch-Ziele sind kleiner als 44 px. Ein Quest-Wechsel beendet die laufende Sitzung ohne Rückmeldung. Am Code wurde nichts geändert.
- Einschränkung: Das Konto hat keine Quests, live war nur der Leerzustand zu sehen. Der Detektor fand 0 Treffer, das ist aber nur eine Untergrenze (TSX nur per Textsuche, Live-URL ohne Login). Das Browser-Overlay wurde wegen Mixed Content blockiert.
- Offen: Critique-Befunde (adapt, harden/clarify, layout, typeset/quieter, onboard) nicht umgesetzt; ungenutzte Variable --gold und Gold im App-Icon noch vorhanden; Änderungen an CLAUDE.md, firebase.json, PRODUCT.md, DESIGN.md, .impeccable/ (design.json, critique), neue Skills (inkl. impeccable) und skills-lock.json nicht committet; Live-Modus von impeccable nicht eingerichtet; Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-21 19:05 – Entscheidungen zur Critique
- Umfang: alle 5 Prioritätsprobleme und danach ein Feinschliff (polish). Reihenfolge: zuerst die Handy-Bedienung.
- Mehrarbeit: Der Balken bleibt bei 100 % stehen, die Prozentzahl zählt über 100 % weiter.
- Der freie Timer fällt ganz weg, Timer gibt es nur noch für Quests. Das ändert das freigegebene Konzept, docs/konzept.md und PRODUCT.md müssen bei der Umsetzung angepasst werden.
- Offen: Critique-Befunde nicht umgesetzt (adapt, harden/clarify, layout, typeset/quieter, onboard, polish); freien Timer entfernen inkl. Konzept-Anpassung; ungenutzte Variable --gold und Gold im App-Icon noch vorhanden; Änderungen an CLAUDE.md, firebase.json, PRODUCT.md, DESIGN.md, .impeccable/, neue Skills und skills-lock.json nicht committet; Live-Modus von impeccable nicht eingerichtet; Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-21 19:14 – Critique-Befunde umgesetzt (Übersicht, Handy, Wechsel, Fehler, freier Timer entfernt)
- Übersicht neu als Wochenansicht: Wochenkopf mit KW, Resttagen und Summe; Karten mit Ist/Soll als Zahlenanker, Prozent über 100 %, Stand gegen den Plan, nächster Meilenstein; sortiert nach Rückstand. Fr–So Einstieg zur Reflexion. Leerzustand mit Erklärung und offenem Formular. Dateien: Overview.tsx, lib/stats.ts, lib/time.ts.
- Handy: Navigation als Tab-Leiste unten, Touch-Ziele mindestens 44 px. Wechseln/Stopp mit Meldung „gespeichert · Rückgängig“ (neu: lib/notify.ts, lib/timerActions.ts, db.restoreTimer, Notices.tsx). Alle alert() ersetzt, verzögerter Ladezustand (Loading.tsx), Offline-Hinweis, SVG-Icons (Icon.tsx). Danger-Buttons haben im Dunkelmodus jetzt genug Kontrast. Doppelpunkt im Wochenlabel behoben. Shell.tsx, TimerBar.tsx, QuestDetail.tsx, Sessions.tsx, Reflection.tsx, Stats.tsx, PeriodNav.tsx, global.css.
- Freier Timer entfernt, wie von Jakob entschieden. Neue Sitzungen brauchen immer eine Quest, alte freie Sitzungen bleiben als „Ohne Quest“ bearbeitbar und sichtbar. docs/konzept.md, PRODUCT.md, DESIGN.md und .impeccable/design.json angepasst. Tests: tests/unit/stats.test.ts neu (16 grün), astro check und Build fehlerfrei, Detektor ohne Befund.
- Offen: Nicht committet und nicht deployt. Im echten Login nicht getestet, nur mit Beispieldaten auf einer temporären Vorschauseite (inzwischen gelöscht), nur Dunkelmodus. Löschen von Meilensteinen und Sitzungen nutzt weiter confirm(). Gold im App-Icon noch vorhanden. Erneute Critique steht aus. Änderungen an CLAUDE.md, firebase.json und .impeccable/, neue Skills und skills-lock.json nicht committet. Live-Modus von impeccable nicht eingerichtet. Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-21 19:42 – Neue Übersicht live
- Commit 25ae98b auf main gepusht. Run 44936921626 war in allen Schritten erfolgreich (Tests, Rules-Tests, Config-Prüfungen, Rules/Indexes, Hosting live).
- Im Commit: App-Code, Tests, docs/konzept.md, PRODUCT.md, DESIGN.md, .impeccable/design.json, CLAUDE.md, CHANGELOG.md. Nicht im Commit: firebase.json (reine Umformatierung, nicht von Claude), .impeccable/config.local.json und hook.cache.json, neue Skills/Agents-Ordner, skills-lock.json.
- Offen: Neue Übersicht im echten Login testen (Hell- und Dunkelmodus, Handy); Service Worker liefert eventuell noch die alte Version, dann einmal neu laden; Löschen nutzt weiter confirm(); Gold im App-Icon noch vorhanden; erneute Critique steht aus; Nicht-Commit-Dateien siehe oben; Live-Modus von impeccable nicht eingerichtet; Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-21 20:20 – Übersicht entschlackt, Cache-Problem der Tab-Leiste behoben
- Übersicht zeigt nur noch die Quest-Karten und „+ Neue Quest“. Entfernt wurden Wochenkopf (KW, Datum, Resttage, Summe, Prozent) und der Reflexions-Hinweis, wie von Jakob gewünscht. Dateien: Overview.tsx, global.css, DESIGN.md, docs/konzept.md.
- Ursache „Navigation oben statt unten“ auf Sitzungen/Auswertung/Reflexion: Firebase Hosting lieferte die HTML-Seiten mit max-age=3600 aus, das Handy nutzte noch die alten Seiten mit altem CSS. Der Code selbst war korrekt, live im 390-px-Rahmen gemessen. Fix: firebase.json setzt no-cache für HTML, public/sw.js hat jetzt die Cache-Version v2.
- Offen: Auf dem Handy einmal neu laden bzw. die PWA neu starten; Löschen nutzt weiter confirm(); Gold im App-Icon noch vorhanden; erneute Critique steht aus; .impeccable/config.local.json und hook.cache.json, neue Skills/Agents-Ordner und skills-lock.json nicht committet; Live-Modus von impeccable nicht eingerichtet; Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-23 09:40 – Timer pausierbar, Handy-Login vorbereitet
- Pause/Fortsetzen in Timer-Leiste, Quest-Karte und Quest-Detail. Pause speichert den Abschnitt als eigene Sitzung (ID t_<startedAt>), state/activeTimer bekommt pausedAt und priorMs. Warum: Auswertung und 8-h-Kappung bleiben unverändert korrekt, keine Pausenzeit in den Sitzungen. Dateien: lib/db.ts, lib/types.ts, lib/stats.ts (timerElapsed, withRunningTimer), lib/timerActions.ts, lib/hooks.ts, TimerBar.tsx, Overview.tsx, QuestDetail.tsx, Stats.tsx, Reflection.tsx, global.css, docs/konzept.md, public/sw.js (Cache v3), 3 neue Unit-Tests (19 grün).
- Handy-Login: Ursache ist authDomain questlog-85f26.firebaseapp.com ≠ App-Domain questlog-85f26.web.app; in der Home-Bildschirm-App (Redirect) blockiert Safari den Speicher der fremden Domain, das Ergebnis geht verloren. Der Anmelde-Screen holt jetzt getRedirectResult ab und zeigt den Fehlercode (Shell.tsx, lib/firebase.ts).
- Offen: authDomain auf questlog-85f26.web.app umstellen (.env und Secret FIREBASE_ENV), erst nachdem Jakob die Weiterleitungs-URI im OAuth-Client eingetragen hat; Änderungen nicht committet und nicht deployt; Pause im echten Login nicht getestet; Löschen nutzt weiter confirm(); Gold im App-Icon noch vorhanden; erneute Critique steht aus; .impeccable/config.local.json und hook.cache.json, neue Skills/Agents-Ordner und skills-lock.json nicht committet; Live-Modus von impeccable nicht eingerichtet; Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-23 09:45 – Pause-Funktion live, Todos angelegt
- Commit 1299591 auf main gepusht, Run 45140412888 erfolgreich (Hosting live).
- Todoist-Projekt „Questlog“: „Weiterleitungs-URI für Google-Login eintragen“ (heute) und „Handy-Login testen“ angelegt, mit Freigabe von Jakob.
- Offen: authDomain auf questlog-85f26.web.app umstellen (.env und Secret FIREBASE_ENV), erst nachdem Jakob die Weiterleitungs-URI eingetragen hat; Pause im echten Login nicht getestet; Löschen nutzt weiter confirm(); Gold im App-Icon noch vorhanden; erneute Critique steht aus; .impeccable/config.local.json und hook.cache.json, neue Skills/Agents-Ordner und skills-lock.json nicht committet; Live-Modus von impeccable nicht eingerichtet; Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).

## 2026-11-23 10:05 – Pause bleibt eine Sitzung
- Auf Jakobs Wunsch umgebaut: Pausieren beendet keine Sitzung mehr. state/activeTimer hat pausedAt und pauses: [{start, end}]; beim Stopp entsteht eine Sitzung mit ihren Pausen. Arbeitszeit = Ende − Start − Pausen, in Auswertung, Übersicht, Reflexion, Sitzungsliste und Quest-Detail (time.ts: pausedMsIn, workedMs, clampPauses; stats.ts: totalsByQuest zieht Pausen anteilig ab).
- 8-h-Kappung zählt nur Arbeitszeit (autoStopEnd mit Pausensumme). Pausen bleiben beim Bearbeiten einer Sitzung erhalten, soweit sie noch in Start–Ende liegen. Stopp während der Pause beendet die Sitzung zum Pausenbeginn.
- Dateien: lib/db.ts, lib/time.ts, lib/stats.ts, lib/types.ts, lib/hooks.ts, Sessions.tsx, QuestDetail.tsx, docs/konzept.md, public/sw.js (Cache v4), Tests (21 grün).
- Offen: authDomain auf questlog-85f26.web.app umstellen (.env und Secret FIREBASE_ENV), erst nachdem Jakob die Weiterleitungs-URI eingetragen hat; Pause im echten Login nicht getestet; Sitzungen, die mit Pausen länger als einen Tag vor Zeitraumbeginn starten, fehlen in der Abfrage (watchSessionsInRange holt ab from − 1 Tag); Löschen nutzt weiter confirm(); Gold im App-Icon noch vorhanden; erneute Critique steht aus; .impeccable/config.local.json und hook.cache.json, neue Skills/Agents-Ordner und skills-lock.json nicht committet; Live-Modus von impeccable nicht eingerichtet; Google-Login in PR-Vorschauen geht ohne Domain-Freigabe nicht (bewusst so entschieden).
