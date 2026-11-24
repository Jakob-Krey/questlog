import type { User } from 'firebase/auth';
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { finishRedirectSignIn, signIn, signOut } from '../lib/firebase';
import { watchCalendarSettings } from '../lib/gcal';
import { useActiveTimer, useAuth, useOnline } from '../lib/hooks';
import type { ActiveTimer } from '../lib/types';
import Loading from './Loading';
import Notices from './Notices';
import TimerBar from './TimerBar';

export type Page = 'uebersicht' | 'sitzungen' | 'auswertung' | 'reflexion' | 'quest' | 'einstellungen';

const NAV: { page: Page; href: string; label: string }[] = [
  { page: 'uebersicht', href: '/', label: 'Übersicht' },
  { page: 'sitzungen', href: '/sitzungen', label: 'Sitzungen' },
  { page: 'auswertung', href: '/auswertung', label: 'Auswertung' },
  { page: 'reflexion', href: '/reflexion', label: 'Reflexion' },
];

export interface PageProps {
  uid: string;
  timer: ActiveTimer | null;
}

interface Props {
  page: Page;
  children: (props: PageProps) => ComponentChildren;
}

export default function Shell({ page, children }: Props) {
  const user = useAuth();
  if (user === undefined) return <Loading center />;
  if (user === null) return <Login />;
  return <SignedIn user={user} page={page} children={children} />;
}

function Login() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    finishRedirectSignIn().catch((e) => {
      console.error(e);
      const code = (e as { code?: string }).code ?? 'unbekannt';
      setError(`Anmeldung hat nicht geklappt (${code}). Bitte erneut versuchen.`);
    });
  }, []);
  return (
    <main class="login">
      <h1>Questlog</h1>
      <p class="muted">Zeit für deine großen Ziele erfassen.</p>
      <button
        class="primary"
        onClick={() =>
          signIn().catch((e) => {
            console.error(e);
            setError('Anmeldung hat nicht geklappt. Bitte erneut versuchen.');
          })
        }
      >
        Mit Google anmelden
      </button>
      {error && <p class="error">{error}</p>}
    </main>
  );
}

function SignedIn({ user, page, children }: { user: User } & Props) {
  // Kalender-Einstellungen live halten: Klick-Handler brauchen sie synchron.
  useEffect(() => watchCalendarSettings(user.uid), [user.uid]);
  const timer = useActiveTimer(user.uid);
  const online = useOnline();
  return (
    <>
      <AppHeader page={page} online={online} email={user.email ?? ''} />
      {timer && <TimerBar uid={user.uid} timer={timer} />}
      <main>{timer === undefined ? <Loading /> : children({ uid: user.uid, timer })}</main>
      <Notices />
    </>
  );
}

export function AppHeader({ page, online, email }: { page: Page; online: boolean; email: string }) {
  // Detailseite einer Quest gehört zur Übersicht.
  const current = page === 'quest' ? 'uebersicht' : page;
  return (
    <header class="top">
      <div class="top-inner">
        <a href="/" class="brand">
          Questlog
        </a>
        <nav class="mainnav" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <a href={n.href} class={n.page === current ? 'active' : ''} aria-current={n.page === page ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        {!online && (
          <span class="offline-pill" role="status">
            Offline<span class="pill-detail"> – wird synchronisiert</span>
          </span>
        )}
        <a href="/einstellungen" class={`settings-link${page === 'einstellungen' ? ' active' : ''}`}>
          Einstellungen
        </a>
        <button class="link signout" onClick={() => signOut()} title={email}>
          Abmelden
        </button>
      </div>
    </header>
  );
}
