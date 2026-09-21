import {fh_CO2,fh_H2O, fh_O2,fh_N2,fh_AIR} from '../A_Transverse_fonction/enthalpy_gas';

// All variables below are in SI units internally.
// Use toSI() on input, fromSI() on output, label() for display.

export const H_in_systemB = (Mass, cvw_kj, M_dry_air, T_air, M_steam_water, T_water, T_waste, Head_los) => {
  const a = Mass * cvw_kj;
  const b = M_dry_air * fh_AIR(T_air);
  const c = M_steam_water * fh_H2O(T_water);
  const d = Mass * 0.25 * 4.186 * T_waste;
  
  return a + b + c + d;
};


export const H_in_systemA = (Mass, cvw_kj, M_dry_air, T_air, M_steam_water, T_water, T_waste, Head_los, Tair_prechauffe, poucentage_prechauffe) => {
  const a = Mass * cvw_kj;
  const b = M_dry_air * ((1 - poucentage_prechauffe) * fh_AIR(T_air) + poucentage_prechauffe * fh_AIR(Tair_prechauffe));
  const c = M_steam_water * fh_H2O(T_water);
  const d = Mass * 0.25 * 4.186 * T_waste;
  
  return (a + b + c + d) * (1 - Head_los / 100);
};


export const H_in_system = (Mass, cvw_kj, M_dry_air, T_air, M_steam_water, T_water, T_waste, Head_los, M_inert, Tf_init) => {
  const a = Mass * cvw_kj;
  const b = M_dry_air * fh_AIR(T_air);
  const c = M_steam_water * fh_H2O(T_water);
  const d = Mass * 0.25 * 4.186 * T_waste;
  const e = Mass * 0.25 * 4.186 * Tf_init;
  
  // Pertes par les imbrules
  const PCI_imb_kj = 33000;
  const imb_pourcent = 0.03;
  const f = M_inert * imb_pourcent * PCI_imb_kj;
  
  return a + b + c + d - e - f;
};


export const Pa_four = (D, L, N, C) => {
  const a = Math.pow(D * Math.sin(40 * Math.PI / 180), 3);
  
  let cValue;
  if (C === "oui") {
    cValue = 0.0018;
  } else {
    cValue = 0.00092;
  }
  
  return (86.4 * a * L * N * cValue) / 0.85;
};
