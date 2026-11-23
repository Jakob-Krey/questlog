# Questlog – Konzept (freigegeben 2026-11-21, geändert 2026-11-21: freier Timer entfällt; 2026-11-23: Timer pausierbar)

Persönliches Zeittracking als Web-App/PWA für Mac und Handy. Quests sind SMART-Ziele mit Meilensteinen, bewusst ohne Enddaten. Zeit wird ausschließlich pro Quest gemessen; freie Timer ohne Quest gibt es nicht (mehr).

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
- Timer nur für Quests. Kein freier Timer (Entscheidung 2026-11-21); ältere freie Sitzungen bleiben erhalten.
- Laufender Timer ist live auf allen Geräten sichtbar und von jedem Gerät stoppbar.
- Stopp speichert eine Sitzung (Start, Ende, optionale Notiz).
- Timer lässt sich pausieren und fortsetzen (Entscheidung 2026-11-23). Pause speichert den Abschnitt bis dahin als eigene Sitzung, die Pausenzeit zählt nirgends mit. Die Timer-Uhr zeigt die Summe aller Abschnitte. Pausiert wird nichts gekappt.
- Sitzungen nachträglich bearbeiten, löschen, manuell eintragen (neue Sitzungen immer mit Quest).
- Vergessener Timer wird nach 8 Stunden gekappt (beim nächsten Öffnen der App; Spark-Plan hat keine Cloud Functions). Ende = Start + 8 h.

**Übersicht & Auswertung**
- Übersicht: nur die aktiven Quests als Karten mit Fortschrittsbalken (Ist-Stunden dieser Woche vs. Wochen-Soll; Balken endet bei 100 %, die Prozentzahl zählt darüber hinaus), Stand gegen den Wochenplan und Start-/Wechseln-/Stopp-Button, dazu „Neue Quest“. Kein Wochenkopf, keine Gesamtsumme, kein Reflexions-Hinweis.
- Auswertung: Zeit pro Quest für Woche / Monat / Quartal; ältere freie Sitzungen erscheinen, falls vorhanden, gesammelt als „Ohne Quest“.

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
│    questId | null (null nur bei alten freien Sitzungen), title, start, end, note?, autoStopped
├─ reflections/{questId}_{isoWeek}     z. B. abc123_2026-W47
│    questId, isoWeek, text, updatedAt
└─ state/activeTimer                    (genau ein Dokument oder keins)
     questId | null, title, startedAt (Beginn des aktuellen Abschnitts),
     pausedAt | null, priorMs (Zeit früherer Abschnitte)
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
