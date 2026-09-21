# TASK FILE — Pyrofluid Unit System Refactoring

**Instructions for Claude Code:** Read this file entirely before starting. Execute each phase in order. Do not proceed to the next phase until the current one is complete and confirmed working. After each phase, summarize what was done and wait for confirmation before continuing.

---

## CONTEXT

This is a React-based industrial sizing tool for fluidized bed incineration (Pyrofluid). All calculations are done in SI units. The goal is to:
1. Add a SI / US unit toggle that users can switch at any time
2. Decouple unit labels from variable names throughout the codebase
3. Use the `convert-units` library for all conversions

**Golden rule:** Internal calculations always stay in SI. Conversion happens only at input (US → SI before calc) and output (SI → US before display).

---

## PHASE 1 — Install dependency and create unit context

**Step 1.1 — Install convert-units**
```bash
npm install convert-units
```
Verify it installs without conflict.

**Step 1.2 — Create `/src/context/UnitContext.jsx`**

Create a React context that:
- Holds the active unit system: `'SI'` or `'US'`
- Exposes a toggle function
- Is accessible from any component via `useUnit()` hook

```jsx
import { createContext, useContext, useState } from 'react';

const UnitContext = createContext();

export function UnitProvider({ children }) {
  const [unitSystem, setUnitSystem] = useState('SI');
  const toggle = () => setUnitSystem(prev => prev === 'SI' ? 'US' : 'SI');
  return (
    <UnitContext.Provider value={{ unitSystem, toggle }}>
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  return useContext(UnitContext);
}
```

Wrap the root `<App />` with `<UnitProvider>` in `main.jsx` or `App.jsx`.

✅ **Phase 1 complete when:** `useUnit()` is importable from any component and returns `{ unitSystem, toggle }`.

---

## PHASE 2 — Create the unit label map and conversion helpers

**Step 2.1 — Create `/src/utils/units.js`**

```js
import convert from 'convert-units';

// Display labels for each physical quantity, per system
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

// Convert a value FROM the active unit system TO SI (for calculation input)
export function toSI(value, quantity, unitSystem) {
  if (unitSystem === 'SI' || value === '' || value === null) return value;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  switch (quantity) {
    case 'massFlow':
    case 'mass':        return convert(num).from('lb').to('kg');
    case 'temperature': return convert(num).from('F').to('C');
    case 'pressure':    return convert(num).from('psi').to('bar');
    case 'volumeFlow':  return num / 35.3147; // scfh → Nm³/h (approx)
    case 'energy':      return convert(num).from('BTU/h').to('W') / 1000; // → kW
    case 'enthalpy':    return convert(num).from('BTU/lb').to('kJ/kg');
    default:            return num;
  }
}

// Convert a value FROM SI TO the active unit system (for display output)
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
    case 'energy':      return convert(num * 1000).from('W').to('BTU/h'); // kW → BTU/h
    case 'enthalpy':    return convert(num).from('kJ/kg').to('BTU/lb');
    default:            return num;
  }
}

// Shorthand: get the label for a quantity in the active system
export function label(quantity, unitSystem) {
  return UNIT_LABELS[unitSystem]?.[quantity] ?? '';
}
```

✅ **Phase 2 complete when:** `toSI`, `fromSI`, and `label` are importable and return correct values for a few manual test cases (log them to console to verify).

---

## PHASE 3 — Add the SI/US toggle button to the UI

**Step 3.1 — Add toggle to the navigation/header component**

In the main header or navbar component:

```jsx
import { useUnit } from '../context/UnitContext';

function Navbar() {
  const { unitSystem, toggle } = useUnit();
  return (
    <nav>
      {/* existing nav content */}
      <button onClick={toggle} className="unit-toggle">
        {unitSystem === 'SI' ? '🇺🇸 Switch to US units' : '🇪🇺 Switch to SI units'}
      </button>
    </nav>
  );
}
```

Style the button to be clearly visible but not disruptive.

✅ **Phase 3 complete when:** clicking the button switches `unitSystem` between `'SI'` and `'US'` and the value is readable via `useUnit()` in any child component.

---

## PHASE 4 — Refactor variable names (decouple units from names)

**Step 4.1 — Audit all variable names containing unit suffixes**

Search the entire codebase for variable names matching patterns like:
- `_kg_h`, `_kg`, `_kW`, `_C`, `_bar`, `_m3_h`, `_kJ_kg`

List every occurrence before renaming anything.

**Step 4.2 — Rename variables**

Rename each variable by removing the unit suffix. Examples:
- `masseDechet_kg_h` → `masseDechet`
- `temperatureEntree_C` → `temperatureEntree`
- `puissanceThermique_kW` → `puissanceThermique`
- `pressionFour_bar` → `pressionFour`

Do this with a careful find-and-replace, one variable at a time, verifying no breakage after each rename.

**Step 4.3 — Add a comment header to each section**

At the top of each calculation file or section, add:
```js
// All variables below are in SI units internally.
// Use toSI() on input, fromSI() on output, label() for display.
```

✅ **Phase 4 complete when:** no variable name contains a unit suffix, and the app still compiles and runs correctly.

---

## PHASE 5 — Wire up inputs (US → SI conversion on entry)

For each user input field, apply `toSI()` before storing the value in state.

Pattern:
```jsx
import { toSI } from '../utils/units';
import { useUnit } from '../context/UnitContext';

function InputField({ quantity, value, onChange }) {
  const { unitSystem } = useUnit();
  return (
    <input
      value={value}
      onChange={e => onChange(toSI(e.target.value, quantity, unitSystem))}
    />
  );
}
```

Apply this pattern to **every input** that represents a physical quantity with a unit. Inputs that are dimensionless (ratios, percentages, counts) do not need conversion.

✅ **Phase 5 complete when:** entering a value in US mode stores the SI-equivalent in state, verified by logging state values.

---

## PHASE 6 — Wire up outputs (SI → US conversion on display)

For each displayed result or output value, apply `fromSI()` before rendering, and use `label()` for the unit label.

Pattern:
```jsx
import { fromSI, label } from '../utils/units';
import { useUnit } from '../context/UnitContext';

function ResultRow({ quantity, valueSI, name }) {
  const { unitSystem } = useUnit();
  const displayed = fromSI(valueSI, quantity, unitSystem);
  return (
    <tr>
      <td>{name}</td>
      <td>{displayed?.toFixed(2)}</td>
      <td>{label(quantity, unitSystem)}</td>
    </tr>
  );
}
```

Apply to all result tables, summary panels, and any displayed calculated value.

✅ **Phase 6 complete when:** switching SI ↔ US in the UI instantly updates all displayed values and unit labels without recalculating.

---

## PHASE 7 — Update the report

The report (PDF or print view) must reflect the active unit system at the time of generation.

- Pass `unitSystem` into the report generation function
- Replace all hardcoded unit strings in the report template with `label(quantity, unitSystem)`
- Apply `fromSI()` to all values printed in the report
- Add a header line in the report indicating the unit system used:
  > *"All values expressed in SI units"* or *"All values expressed in US customary units"*

✅ **Phase 7 complete when:** generating the report in US mode produces a report with US values and labels throughout.

---

## FINAL CHECK

After all phases:
1. Switch to US mode — enter values — run calculation — check results display in US
2. Switch back to SI — verify values and labels update instantly
3. Generate report in both modes — verify units are correct in both
4. Check that no unit suffix remains in any variable name
