
import React from 'react';
import UnitInput from './UnitInput';

/**
 * quantityMap — optional object mapping each key to a UNIT_LABELS quantity
 *               (e.g. { temperature: 'temperature', massFlow: 'massFlow' }).
 *               Keys without a mapping are treated as dimensionless (no conversion).
 */
const Input_bilan = ({ input, handleChange, currentLanguage = 'fr', translations, quantityMap = {} }) => {
  const t = (key) => {
    if (!translations) return key;
    return translations[currentLanguage]?.[key] || translations['fr']?.[key] || key;
  };

  return (
    <div>
      {Object.entries(input).map(([key, value]) => {
        const quantity = quantityMap[key];
        return (
          <div
            key={key}
            style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}
          >
            <label style={{ flex: '1', marginRight: '10px', textAlign: 'right', fontWeight: 'bold' }}>
              {t(key)}:
            </label>
            {quantity ? (
              <UnitInput
                valueSI={value}
                quantity={quantity}
                onChange={(siVal) => handleChange(key, Number(siVal))}
                showUnit
                style={{ flex: '0 0 100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            ) : (
              <input
                type="number"
                value={value}
                onChange={(e) => handleChange(key, Number(e.target.value))}
                style={{ flex: '0 0 100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Input_bilan;