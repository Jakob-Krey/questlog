# Questlog – Konzept (freigegeben 2026-11-21, geändert 2026-11-21: freier Timer entfällt; 2026-11-23: Timer pausierbar; 2026-11-24: Google-Kalender-Sync; 2026-11-26: kein Plan-Hinweis auf den Karten, Quest-Seite, kein Wechseln, Unterschritte)

Persönliches Zeittracking als Web-App/PWA für Mac und Handy. Quests sind SMART-Ziele mit Meilensteinen, bewusst ohne Enddaten. Zeit wird ausschließlich pro Quest gemessen; freie Timer ohne Quest gibt es nicht (mehr).

## Akzeptanzkriterien

**Login**
- Anmeldung nur per Google. Ohne Login nur der Anmelde-Screen.
- Jeder Google-Nutzer darf sich anmelden, sieht und schreibt aber ausschließlich eigene Daten (Security Rules, Pfad `users/{uid}`).

**Quests**
- Name, SMART-Ziel (Text), Wochenstunden-Soll, Status aktiv / pausiert / archiviert. Kein Enddatum.
- Anlegen, bearbeiten, pausieren, archivieren. Archivierte Quests verschwinden aus der Übersicht, ihre Zeiten bleiben in der Auswertung.
- Meilensteine pro Quest: anlegen, umsortieren, abhaken, löschen – ohne Enddatum. Meilensteine sind unabhängig voneinander (keine Nummerierung). Jeder Meilenstein kann Schritte haben (eine Ebene): eine nummerierte Reihenfolge 1, 2, 3 … zum Erreichen des Meilensteins, überall von unten nach oben angezeigt (Schritt 1 ganz unten, der Meilenstein als Ziel ganz oben); anlegen, umsortieren, abhaken, löschen (Entscheidung 2026-11-26).

**Timer**
- Es läuft immer nur ein Timer. Solange er läuft oder pausiert ist, lassen sich andere Quests nicht starten; gewechselt wird nur per Stopp und neuem Start (Entscheidung 2026-11-26, ersetzt das automatische Wechseln).
- Timer nur für Quests. Kein freier Timer (Entscheidung 2026-11-21); ältere freie Sitzungen bleiben erhalten.
- Laufender Timer ist live auf allen Geräten sichtbar und von jedem Gerät stoppbar.
- Stopp speichert eine Sitzung (Start, Ende, optionale Notiz).
- Timer lässt sich pausieren und fortsetzen (Entscheidung 2026-11-23). Es bleibt eine Sitzung; ihre Pausen werden darin vermerkt und zählen nirgends als Arbeitszeit. Pausiert läuft die Uhr nicht und es wird nichts gekappt; die 8 h zählen nur Arbeitszeit.
- Sitzungen nachträglich bearbeiten, löschen, manuell eintragen (neue Sitzungen immer mit Quest).
- Vergessener Timer wird nach 8 Stunden gekappt (beim nächsten Öffnen der App; Spark-Plan hat keine Cloud Functions). Ende = Start + 8 h.

**Übersicht & Auswertung**
- Übersicht: nur die aktiven Quests als Karten mit Fortschrittsbalken (Ist-Stunden dieser Woche vs. Wochen-Soll; Balken endet bei 100 %, die Prozentzahl zählt darüber hinaus) und Start-/Pause-/Stopp-Button, dazu „Neue Quest“. Klick auf eine Karte oder auf Start öffnet die Quest-Seite (Start startet zugleich die Zeit). Die Karten zeigen keine Meilensteine.
- Quest-Seite: ablenkungsfrei ohne Navigation und Timer-Leiste, Ziel, Wochenstand (Ist, Soll, noch übrig) mit Fortschrittsbalken, Meilensteine (fett) mit ihren Schritten (immer untereinander) und ggf. laufende Uhr mit Notiz, Pause und Stopp. Meilensteine und Schritte lassen sich dort abhaken, auch während der Timer läuft; sonst nichts bearbeitbar. Läuft die Quest nicht, gibt es dort Start und „Bearbeiten“ (eigene Seite für Quest-Daten und Meilensteine). Kein Wochenkopf, keine Gesamtsumme, kein Reflexions-Hinweis, kein Hinweis zum Stand gegen den Wochenplan (Entscheidung 2026-11-26).
- Auswertung: Zeit pro Quest für Woche / Monat / Quartal; ältere freie Sitzungen erscheinen, falls vorhanden, gesammelt als „Ohne Quest“.

**Wochenreflexion**
- Pro Quest und Kalenderwoche ein kurzer Text, daneben Ist- vs. Soll-Stunden. Erneutes Speichern überschreibt.

**Google-Kalender-Sync** (Entscheidung 2026-11-24)
- Seite „Einstellungen“: Schalter Kalender-Sync an/aus (Standard aus) und Button „Jetzt übertragen“ für offene Sitzungen.
- Beim ersten Einschalten: Zustimmung bei Google (Scope `calendar.app.created`), eigener Kalender „Questlog“ (Europe/Berlin) wird angelegt, ID in Firestore. Wurde er in Google gelöscht, legt die App ihn neu an.
- Bei aktivem Sync erzeugt jede Sitzung einen Termin „Questlog – <Quest-Name>“ über die ganze Spanne Start–Ende; Notiz sowie Arbeits- und Pausenzeit stehen in der Beschreibung. Gilt für Stopp, Wechseln und manuell eingetragene Sitzungen.
- Gekappte Timer (8 h, ohne Klick) und fehlgeschlagene Übertragungen werden als „nicht im Kalender“ markiert und beim nächsten Stopp oder per Button nachgeholt. Die Sitzung in Firestore geht dabei nie verloren.
- Bearbeiten aktualisiert, Löschen und „Rückgängig“ entfernen den Termin. Ausstehende Löschungen werden ebenfalls nachgeholt.
- Keine Duplikate: Die Event-ID entsteht im Client und steht vor dem API-Aufruf an der Sitzung (Timer-Sitzungen: `qlt<startedAt-Millis>`).
- Access-Token nur im Speicher (Google Identity Services), angefordert direkt im Klick-Handler; nach der ersten Zustimmung ohne erneute Nachfrage.
- Sync aus: Es wird nichts in den Kalender geschrieben oder markiert; bestehende Termine bleiben. Alte Sitzungen werden nicht nachträglich übertragen.

**PWA**
- Installierbar auf Mac (Safari „Zum Dock hinzufügen“) und Handy (Home-Bildschirm). Rein statischer Astro-Build.

**Nicht im Umfang**
- Todoist-Anbindung (kommt später über Cloud Functions).
- Done-Logbuch.

## Datenmodell (Firestore)

```
users/{uid}
│    calendarSync: { enabled, calendarId | null }
├─ quests/{questId}
│    name, goal, weeklyHours, status: "active"|"paused"|"archived",
│    milestones: [{ id, text, done, order, steps: [{ id, text, done }] }],
│    todoistLabel? (optional, erst später genutzt), createdAt, updatedAt
├─ sessions/{sessionId}
│    questId | null (null nur bei alten freien Sitzungen), title, start, end, pauses: [{ start, end }], note?, autoStopped,
│    calendar?: { eventId, synced }   (fehlt = nie für den Sync vorgesehen; synced false = wird nachgeholt)
├─ calendarDeletes/{eventId}           ausstehende Löschungen im Google Kalender
│    createdAt
├─ reflections/{questId}_{isoWeek}     z. B. abc123_2026-W47
│    questId, isoWeek, text, updatedAt
└─ state/activeTimer                    (genau ein Dokument oder keins)
     questId | null, title, startedAt, pausedAt | null (laufende Pause),
     pauses: [{ start, end }] (abgeschlossene Pausen)
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
