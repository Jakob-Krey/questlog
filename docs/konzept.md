# Questlog – Konzept (freigegeben 2026-11-21)

Persönliches Zeittracking als Web-App/PWA für Mac und Handy. Quests sind SMART-Ziele mit Meilensteinen, bewusst ohne Enddaten. Pro Quest wird Zeit gemessen; zusätzlich gibt es freie Timer ohne Quest.

## Akzeptanzkriterien

**Login**
- Anmeldung nur per Google. Ohne Login nur der Anmelde-Screen.
- Jeder Google-Nutzer darf sich anmelden, sieht und schreibt aber ausschließlich eigene Daten (Security Rules, Pfad `users/{uid}`).

**Quests**
- Name, SMART-Ziel (Text), Wochenstunden-Soll, Status aktiv / pausiert / archiviert. Kein Enddatum.
- Anlegen, bearbeiten, pausieren, archivieren. Archivierte Quests verschwinden aus der Übersicht, ihre Zeiten bleiben in der Auswertung.
- Meilensteine pro Quest: anlegen, umsortieren, abhaken, löschen – ohne Enddatum.

**Timer**
- Es läuft immer nur ein Timer. Ein neuer Start beendet den laufenden automatisch (als Sitzung gespeichert).
- Timer für eine Quest oder frei mit eigenem Titel.
- Laufender Timer ist live auf allen Geräten sichtbar und von jedem Gerät stoppbar.
- Stopp speichert eine Sitzung (Start, Ende, optionale Notiz).
- Sitzungen nachträglich bearbeiten, löschen, manuell eintragen.
- Vergessener Timer wird nach 8 Stunden gekappt (beim nächsten Öffnen der App; Spark-Plan hat keine Cloud Functions). Ende = Start + 8 h.

**Übersicht & Auswertung**
- Übersicht: aktive Quests als Karten mit Fortschrittsbalken (Ist-Stunden dieser Woche vs. Wochen-Soll) und Start-Button.
- Auswertung: Zeit pro Quest für Woche / Monat / Quartal; freie Timer gesammelt als „Ohne Quest“.

**Wochenreflexion**
- Pro Quest und Kalenderwoche ein kurzer Text, daneben Ist- vs. Soll-Stunden. Erneutes Speichern überschreibt.

**PWA**
- Installierbar auf Mac (Safari „Zum Dock hinzufügen“) und Handy (Home-Bildschirm). Rein statischer Astro-Build.

**Nicht im Umfang**
- Todoist-Anbindung (kommt später über Cloud Functions).
- Done-Logbuch.

## Datenmodell (Firestore)

```
users/{uid}
├─ quests/{questId}
│    name, goal, weeklyHours, status: "active"|"paused"|"archived",
│    milestones: [{ id, text, done, order }],
│    todoistLabel? (optional, erst später genutzt), createdAt, updatedAt
├─ sessions/{sessionId}
│    questId | null, title, start, end, note?, autoStopped
├─ reflections/{questId}_{isoWeek}     z. B. abc123_2026-W47
│    questId, isoWeek, text, updatedAt
└─ state/activeTimer                    (genau ein Dokument oder keins)
     questId | null, title, startedAt
```

- `state/activeTimer` erzwingt „nur ein Timer“; alle Geräte hören per `onSnapshot` darauf.
- Timer-Sitzungen haben die ID `t_<startedAt-Millis>`, damit gleichzeitiges Stoppen/Kappen von zwei Geräten keine Duplikate erzeugt.
- Auswertung wird im Client aus den Sitzungen berechnet.

## Technik

- Astro (statisch) + Preact-Inseln, als PWA installierbar
- Firebase: Firestore (europe-west3), Auth (Google), Hosting
- Projekt-ID: `questlog-85f26`
- Config als `PUBLIC_FIREBASE_*` in `.env` (gitignored)
- Deploy per GitHub Actions: Push auf `main` = Live-Deploy inkl. Firestore Rules/Indexes, Pull Request = Vorschau-URL
