import type { User } from 'firebase/auth';
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { signIn, signOut } from '../lib/firebase';
import { useActiveTimer, useAuth } from '../lib/hooks';
import type { ActiveTimer } from '../lib/types';
import TimerBar from './TimerBar';

export type Page = 'uebersicht' | 'sitzungen' | 'auswertung' | 'reflexion' | 'quest';

const NAV: { page: Page; href: string; label: string }[] = [
  { page: 'uebersicht', href: '/', label: 'Quests' },
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
  if (user === undefined) return <p class="muted center">Lädt …</p>;
  if (user === null) return <Login />;
  return <SignedIn user={user} page={page} children={children} />;
}

function Login() {
  const [error, setError] = useState<string | null>(null);
  return (
    <main class="login">
      <h1>Questlog</h1>
      <p class="muted">Zeit für deine Ziele erfassen.</p>
      <button class="primary" onClick={() => signIn().catch((e) => setError(String(e?.message ?? e)))}>
        Mit Google anmelden
      </button>
      {error && <p class="error">{error}</p>}
    </main>
  );
}

function SignedIn({ user, page, children }: { user: User } & Props) {
  const timer = useActiveTimer(user.uid);
  return (
    <>
      <header class="top">
        <a href="/" class="brand">
          Questlog
        </a>
        <nav>
          {NAV.map((n) => (
            <a href={n.href} class={n.page === page ? 'active' : ''}>
              {n.label}
            </a>
          ))}
        </nav>
        <button class="link" onClick={() => signOut()} title={user.email ?? ''}>
          Abmelden
        </button>
      </header>
      {timer !== undefined && <TimerBar uid={user.uid} timer={timer} />}
      <main>{timer === undefined ? <p class="muted">Lädt …</p> : children({ uid: user.uid, timer })}</main>
    </>
  );
}
