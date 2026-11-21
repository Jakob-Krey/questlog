import { periodLabel, shiftPeriod, type PeriodKind } from '../lib/time';

interface Props {
  kind: PeriodKind;
  refDate: Date;
  onChange: (d: Date) => void;
}

export default function PeriodNav({ kind, refDate, onChange }: Props) {
  return (
    <div class="row periodnav">
      <button class="icon" title="Zurück" onClick={() => onChange(shiftPeriod(kind, refDate, -1))}>
        ←
      </button>
      <strong>{periodLabel(kind, refDate)}</strong>
      <button class="icon" title="Weiter" onClick={() => onChange(shiftPeriod(kind, refDate, 1))}>
        →
      </button>
      <button class="link" onClick={() => onChange(new Date())}>
        Heute
      </button>
    </div>
  );
}
