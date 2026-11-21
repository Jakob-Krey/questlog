import { useEffect, useState } from 'preact/hooks';

/**
 * Ladehinweis, der erst nach einer kurzen Verzögerung erscheint.
 * So flackern bei schnellem (Cache-)Laden keine „Lädt …“-Zeilen nacheinander auf.
 */
export default function Loading({ center = false }: { center?: boolean }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <p class={`muted loading${center ? ' center' : ''}`} role="status">
      Lädt …
    </p>
  );
}
