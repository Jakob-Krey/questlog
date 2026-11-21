import { periodLabel, shiftPeriod, type PeriodKind } from '../lib/time';
import Icon from './Icon';

interface Props {
  kind: PeriodKind;
  refDate: Date;
  onChange: (d: Date) => void;
}

export default function PeriodNav({ kind, refDate, onChange }: Props) {
  return (
    <div class="row periodnav">
      <button class="icon" title="Zurück" aria-label="Vorheriger Zeitraum" onClick={() => onChange(shiftPeriod(kind, refDate, -1))}>
        <Icon name="chevron-left" />
      </button>
      <strong>{periodLabel(kind, refDate)}</strong>
      <button class="icon" title="Weiter" aria-label="Nächster Zeitraum" onClick={() => onChange(shiftPeriod(kind, refDate, 1))}>
        <Icon name="chevron-right" />
      </button>
      <button class="link" onClick={() => onChange(new Date())}>
        Heute
      </button>
    </div>
  );
}
