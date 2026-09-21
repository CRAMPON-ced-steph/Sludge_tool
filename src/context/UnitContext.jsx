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
