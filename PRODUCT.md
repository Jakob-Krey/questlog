# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Genau ein Nutzer: Jakob selbst. Questlog ist sein persönliches Werkzeug. Dass sich technisch jeder Google-Nutzer anmelden kann (mit strikt getrennten Daten), ist ein Nebeneffekt und kein Ziel; es gibt keine Zielgruppe darüber hinaus, kein Onboarding für Fremde und keine Vermarktung.

Job: umfangreiche, langfristige Vorhaben dokumentieren und verfolgen – wie viel Zeit fließt pro Woche tatsächlich in jedes große Ziel, und wie geht es voran.

## Product Purpose

Questlog misst Zeit gegen große Ziele („Quests“), nicht gegen Aufgaben. Eine Quest ist ein umfangreiches Projektziel mit SMART-Formulierung, Meilensteinen und einem Wochenstunden-Soll, zum Beispiel ein Studienabschnitt, ein Kundenprojekt in der Selbstständigkeit oder ein persönliches Großziel. Kleinteilige To-dos gehören ausdrücklich nicht hierher (dafür gibt es Todoist).

Erfolg heißt: Jakob sieht jede Woche ehrlich, ob seine Zeit zu seinen großen Zielen passt (Ist vs. Soll), und reflektiert das kurz pro Quest.

## Positioning

Gegenüber Toggl, Clockify & Co.:
- **Ziele statt Projekte:** Im Mittelpunkt stehen SMART-Ziele mit Meilensteinen und Wochen-Soll, nicht Abrechnung, Kunden-Reports oder Stundenzettel.
- **Ohne Deadlines:** Quests und Meilensteine haben bewusst kein Enddatum. Der Takt ist stetige Wochenzeit, nicht Termindruck.
- **Wöchentliche Reflexion als Kernritual:** pro Quest und Kalenderwoche ein kurzer Text neben Ist- und Soll-Stunden.
- **Schlank und eigene Daten:** kein Ballast, keine Abos, Daten im eigenen Firebase-Projekt.

## Operating Context

- Genutzt auf dem Mac (als installierte PWA im Dock) und auf dem Handy (Home-Bildschirm); der laufende Timer ist auf allen Geräten live sichtbar und überall stoppbar.
- Typischer Ablauf: Quest-Timer starten, arbeiten, stoppen (optional mit Notiz); vergessene Sitzungen nachtragen oder korrigieren; wöchentlich Auswertung ansehen und Reflexion schreiben.
- Todoist ist das separate Werkzeug für kleine Aufgaben; eine Anbindung (Label pro Quest) ist für später angedacht, aber nicht im Umfang.

## Capabilities and Constraints

- Login nur per Google; ohne Login nur der Anmelde-Screen.
- Quests: Name, SMART-Ziel (Text), Wochenstunden-Soll, Status aktiv / pausiert / archiviert. Archivierte Quests verschwinden aus der Übersicht, ihre Zeiten bleiben in der Auswertung.
- Meilensteine pro Quest: anlegen, umsortieren, abhaken, löschen.
- Timer: immer nur einer gleichzeitig, und nur für Quests (kein freier Timer – Zeit zählt nur, wenn sie auf ein großes Ziel einzahlt). Ein Wechsel speichert den laufenden Timer als Sitzung und lässt sich rückgängig machen. Vergessene Timer werden nach 8 Stunden gekappt.
- Sitzungen nachträglich bearbeiten, löschen, manuell eintragen.
- Auswertung: Zeit pro Quest für Woche / Monat / Quartal; ältere freie Sitzungen erscheinen, falls vorhanden, als „Ohne Quest“.
- Mehrarbeit über dem Wochen-Soll wird als Prozentzahl über 100 % gezeigt, ohne Wertung.
- Begriffe: Quest, Meilenstein, Sitzung, Timer, Wochen-Soll, Reflexion, „Ohne Quest“. Oberfläche durchgängig auf Deutsch.
- Technisch: rein statischer Build (Astro + Preact-Inseln), Firebase Spark-Plan (keine Cloud Functions), offline-fähig.
- Nicht im Umfang: Todoist-Anbindung, Done-Logbuch, Enddaten jeglicher Art.

## Brand Commitments

- Name: „Questlog“. Sprache: Deutsch.
- Keine weiteren verbindlichen Marken- oder Stilvorgaben.

## Evidence on Hand

Keine Testimonials, Kunden, Kennzahlen oder Pressematerial – und es soll auch keine geben (Ein-Personen-Werkzeug). Nichts dergleichen erfinden.

## Product Principles

1. **Große Ziele, nicht kleine Aufgaben.** Jede Funktion muss dem Verfolgen umfangreicher Vorhaben dienen; Kleinteiliges gehört nach Todoist.
2. **Stetigkeit statt Deadline.** Der Maßstab ist die Wochenzeit gegen das Soll, nie ein Enddatum oder Countdown.
3. **Ehrlicher Wochenblick.** Ist vs. Soll und die kurze Reflexion sind das Herzstück; sie müssen schnell erreichbar und unbeschönigt sein.
4. **Reibungsarm auf jedem Gerät.** Timer starten und stoppen muss am Mac wie am Handy in Sekunden gehen.
5. **Schlank bleiben.** Für einen einzigen Nutzer gebaut: keine Team-, Abrechnungs- oder Onboarding-Komplexität.
