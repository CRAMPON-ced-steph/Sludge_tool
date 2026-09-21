import convert from 'convert-units';

export const UNIT_LABELS = {
  SI: {
    massFlow:    'kg/h',
    mass:        'kg',
    temperature: '°C',
    pressure:    'bar',
    volumeFlow:  'Nm³/h',
    energy:      'kW',
    specificHeat:'kJ/(kg·K)',
    enthalpy:    'kJ/kg',
    percentage:  '%',
  },
  US: {
    massFlow:    'lb/h',
    mass:        'lb',
    temperature: '°F',
    pressure:    'psi',
    volumeFlow:  'scfh',
    energy:      'BTU/h',
    specificHeat:'BTU/(lb·°F)',
    enthalpy:    'BTU/lb',
    percentage:  '%',
  }
};

export function toSI(value, quantity, unitSystem) {
  if (unitSystem === 'SI' || value === '' || value === null) return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  switch (quantity) {
    case 'massFlow':
    case 'mass':        return convert(num).from('lb').to('kg');
    case 'temperature': return convert(num).from('F').to('C');
    case 'pressure':    return convert(num).from('psi').to('bar');
    case 'volumeFlow':  return num / 35.3147; // scfh → Nm³/h
    case 'energy':      return num * 0.000293071;  // BTU/h → kW
    case 'enthalpy':    return num * 2.326;         // BTU/lb → kJ/kg
    default:            return num;
  }
}

export function fromSI(value, quantity, unitSystem) {
  if (unitSystem === 'SI' || value === null || value === undefined) return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  switch (quantity) {
    case 'massFlow':
    case 'mass':        return convert(num).from('kg').to('lb');
    case 'temperature': return convert(num).from('C').to('F');
    case 'pressure':    return convert(num).from('bar').to('psi');
    case 'volumeFlow':  return num * 35.3147; // Nm³/h → scfh
    case 'energy':      return num / 0.000293071;   // kW → BTU/h
    case 'enthalpy':    return num / 2.326;          // kJ/kg → BTU/lb
    default:            return num;
  }
}

export function label(quantity, unitSystem) {
  return UNIT_LABELS[unitSystem]?.[quantity] ?? '';
}
