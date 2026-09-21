import React from 'react';
import UnitInput from './UnitInput';

/**
 * quantity — if provided, value/onChange are treated as SI and converted automatically.
 *            If omitted, behaves as before (raw value pass-through).
 */
const InputField = ({ label, value, onChange, unit, quantity }) => {
  const inputEl = quantity ? (
    <UnitInput
      valueSI={value}
      quantity={quantity}
      onChange={(siVal) => onChange({ target: { value: siVal } })}
      style={{ width: 'auto', minWidth: '60px', maxWidth: '1000px' }}
    />
  ) : (
    <input
      type="number"
      value={value}
      onChange={onChange}
      style={{ width: 'auto', minWidth: '60px', maxWidth: '1000px' }}
    />
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <label style={{ color: 'black', width: '300px' }}>
        {label} {unit}:
      </label>
      {inputEl}
    </div>
  );
};

export default InputField;