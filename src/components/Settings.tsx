import { useEffect, useState } from 'preact/hooks';
import {
  CalendarError,
  disableCalendarSync,
  enableCalendarSync,
  loadGis,
  requestCalendarToken,
  syncCalendar,
  useCalendarSettings,
  watchCalendarBacklog,
} from '../lib/gcal';
import { useLive } from '../lib/hooks';
import { notify, reportError } from '../lib/notify';
import Loading from './Loading';
import Shell, { type PageProps } from './Shell';

export default function SettingsPage() {
  return <Shell page="einstellungen">{(p) => <Settings {...p} />}</Shell>;
}

const message = (e: unknown) => (e instanceof CalendarError ? e.message : 'Bitte erneut versuchen.');

function Settings({ uid }: PageProps) {
  const settings = useCalendarSettings(uid);
  const backlog = useLive<number>((cb) => watchCalendarBacklog(uid, cb), [uid]);
  const [busy, setBusy] = useState(false);

  // Google-Bibliothek vorab laden, damit das Popup im Klick sofort aufgeht.
  useEffect(() => void loadGis().catch(() => {}), []);

  if (!settings) return <Loading />;

  const toggle = (on: boolean) => {
    setBusy(true);
    const done = on ? enableCalendarSync(uid) : disableCalendarSync(uid);
    done
      .then(() => notify({ kind: 'info', text: on ? 'Kalender-Sync ist an.' : 'Kalender-Sync ist aus.' }))
      .catch((e) => {
        console.error(e);
        if (e instanceof CalendarError || on) notify({ kind: 'error', text: `Kalender-Sync: ${message(e)}` });
        else reportError('Ausschalten', e);
      })
      .finally(() => setBusy(false));
  };

  const syncNow = () => {
    setBusy(true);
    // Token synchron im Klick anfordern, sonst blockiert der Browser das Popup.
    requestCalendarToken()
      .then((t) => syncCalendar(uid, t))
      .then((r) =>
        notify({
          kind: r.failed ? 'error' : 'info',
          text: r.failed ? `${r.synced} übertragen, ${r.failed} fehlgeschlagen.` : `${r.synced} übertragen.`,
        }),
      )
      .catch((e) => notify({ kind: 'error', text: `Kalender: ${message(e)}` }))
      .finally(() => setBusy(false));
  };

  return (
    <>
      <h1>Einstellungen</h1>
      <section class="panel stack">
        <h2>Google Kalender</h2>
        <label class="switch-row">
          <input
            type="checkbox"
            role="switch"
            checked={settings.enabled}
            disabled={busy}
            onChange={(e) => toggle(e.currentTarget.checked)}
          />
          Kalender-Sync
        </label>
        <p class="muted">
          Jede Sitzung wird als Termin „Questlog – Quest“ im eigenen Kalender „Questlog“ eingetragen. Questlog hat
          nur auf diesen Kalender Zugriff, nicht auf deine anderen.
        </p>
        {settings.enabled && (
          <p class="row">
            <span>
              {backlog === undefined
                ? 'Prüfe offene Einträge …'
                : backlog === 0
                  ? 'Alles übertragen.'
                  : `${backlog} ${backlog === 1 ? 'Eintrag wartet' : 'Einträge warten'} auf Übertragung.`}
            </span>
            {!!backlog && (
              <button onClick={syncNow} disabled={busy}>
                Jetzt übertragen
              </button>
            )}
          </p>
        )}
      </section>
    </>
  );
}
