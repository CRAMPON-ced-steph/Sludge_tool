// ============================================================
// UTILITAIRES POUR CALCUL COMPOSITIONS D'AIR
// ============================================================

/**
 * Calcule les masses en kg/h des composants pour une composition d'air donnée
 */
export const calculateAirMassComposition = (airRow, masse_seche, humidite = 0) => {
  const total_masse = masse_seche + humidite;
  return {
    CO2: total_masse * (airRow.CO2_pct / 100),
    H2O: total_masse * (airRow.H2O_pct / 100),
    O2: total_masse * (airRow.O2_pct / 100),
    N2: total_masse * (airRow.N2_pct / 100),
    SO2: total_masse * (airRow.SO2_pct / 100),
    Cl: total_masse * (airRow.Cl_pct / 100),
  };
};

/**
 * Calcule les fractions massiques en % pour une composition d'air
 */
export const calculateAirMassicFractions = (
  CO2, H2O, O2, N2, SO2, Cl,
  FractionMassiqueC, FractionMassiqueH, FractionMassiqueO, 
  FractionMassiqueN, FractionMassiqueS, FractionMassiqueCl
) => {
  return {
    C_pct: FractionMassiqueC(CO2, H2O, O2, N2, SO2, Cl) || 0,
    H_pct: FractionMassiqueH(CO2, H2O, O2, N2, SO2, Cl) || 0,
    O_pct: FractionMassiqueO(CO2, H2O, O2, N2, SO2, Cl) || 0,
    N_pct: FractionMassiqueN(CO2, H2O, O2, N2, SO2, Cl) || 0,
    S_pct: FractionMassiqueS(CO2, H2O, O2, N2, SO2, Cl) || 0,
    Cl_pct: FractionMassiqueCl(CO2, H2O, O2, N2, SO2, Cl) || 0,
  };
};

/**
 * Calcule les masses des composants pour une composition d'air donnée
 */
export const calculateAirElementMasses = (
  C_pct, H_pct, O_pct, N_pct, S_pct, Cl_pct, 
  masse_seche, humidite = 0
) => {
  const total_masse = masse_seche + humidite;
  return {
    C: total_masse * (C_pct / 100),
    H: total_masse * (H_pct / 100),
    O: total_masse * (O_pct / 100),
    N: total_masse * (N_pct / 100),
    S: total_masse * (S_pct / 100),
    Cl: total_masse * (Cl_pct / 100),
  };
};

/**
 * Calcule les moles d'un élément à partir de sa masse
 */
export const calculateMoles = (masse, masse_molaire) => {
  if (!masse || !masse_molaire) return 0;
  return (masse / masse_molaire) * 1000;
};

/**
 * Molar masses
 */
export const MOLAR_MASSES = {
  C: 12.01,
  H: 1.008,
  O: 16,
  N: 14.007,
  S: 32.066,
  Cl: 35.45,
};
