import { dismiss, useNotices } from '../lib/notify';
import Icon from './Icon';

/** Meldungen unten auf dem Bildschirm: Bestätigungen mit Rückgängig, Fehler mit Lösungshinweis. */
export default function Notices() {
  const notices = useNotices();
  return (
    <div class="notices" role="status" aria-live="polite">
      {notices.map((n) => (
        <div key={n.id} class={`notice${n.kind === 'error' ? ' is-error' : ''}`} role={n.kind === 'error' ? 'alert' : undefined}>
          <span class="notice-text">{n.text}</span>
          {n.action && (
            <button
              class="notice-action"
              onClick={() => {
                dismiss(n.id);
                n.action!.run();
              }}
            >
              {n.action.label}
            </button>
          )}
          <button class="notice-close" aria-label="Meldung schließen" onClick={() => dismiss(n.id)}>
            <Icon name="x" />
          </button>
        </div>
      ))}
    </div>
  );
}
