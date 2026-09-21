import { useUnit } from '../context/UnitContext';
import { toSI, fromSI, label } from '../utils/units';

/**
 * A number input that displays values in the active unit system and stores them in SI.
 *
 * Props:
 *   valueSI   — the current value in SI units
 *   quantity  — key from UNIT_LABELS (e.g. 'massFlow', 'temperature', 'pressure')
 *   onChange  — called with the SI-converted value whenever the user types
 *   ...rest   — forwarded to <input> (style, className, disabled, etc.)
 */
const UnitInput = ({ valueSI, quantity, onChange, showUnit = false, ...rest }) => {
  const { unitSystem } = useUnit();
  const displayed = fromSI(valueSI, quantity, unitSystem);
  const unitLabel  = label(quantity, unitSystem);

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === '' || raw === '-') { onChange(raw); return; }
    const converted = toSI(raw, quantity, unitSystem);
    onChange(converted);
  };

  if (showUnit) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number"
          value={displayed ?? ''}
          onChange={handleChange}
          {...rest}
        />
        <span style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>
          {unitLabel}
        </span>
      </span>
    );
  }

  return (
    <input
      type="number"
      value={displayed ?? ''}
      onChange={handleChange}
      {...rest}
    />
  );
};

export default UnitInput;
