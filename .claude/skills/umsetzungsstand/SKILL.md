---
name: umsetzungsstand
description: Zeigt, welche Akzeptanzkriterien von Questlog bereits im Code umgesetzt sind und was als Nächstes ansteht. Nutzen, wenn nach dem Projektstand, Fortschritt oder nächsten Schritt gefragt wird.
---

Prüfe den aktuellen Stand von Questlog anhand der Akzeptanzkriterien in `docs/konzept.md` (Login, Quests, Timer, Übersicht & Auswertung, Wochenreflexion, PWA).

Vorgehen:

- Durchsuche das Repo (`src/`, `firestore.rules`, `firebase.json`, `.github/workflows/`) nach Belegen für jeden Bereich.
- Bewerte jeden Bereich als ✅ erledigt, 🟡 teilweise oder ⬜ offen und nenne die Datei(en), auf die sich die Bewertung stützt.
- Prüfe nebenbei die harten Regeln aus `CLAUDE.md` (nur `users/{uid}`, ein Timer über `state/activeTimer`, kein Todoist) und melde Verstöße.
- Schließe mit genau einem konkreten nächsten Schritt.

Antworte kurz als Tabelle plus eine Zeile „Nächster Schritt“. Ändere keinen Code.
