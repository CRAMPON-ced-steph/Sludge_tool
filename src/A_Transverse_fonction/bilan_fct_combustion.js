
import { psat_T } from './steam_table3';

// All variables below are in SI units internally.
// Use toSI() on input, fromSI() on output, label() for display.




// Function to calculate cv_kj
export const cv_kj = (C, H, O, N, S, Cl) => {
  return 4.1868 * (84 * C + (277.65 - 54) * H - 26.5 * O + 25 * S + 15 * N - 5.5 * Cl);
};

// Function to calculate cv_waste
export const cv_waste = (cv, comb, water) => {
  let result = cv * (comb / 100) - 4.1868 * 590 * (water / 100);
  return result < 0 ? 0 : result;
};




export const calculateWaterContent = (T_air, airRelativeMoisture) => {
  if (T_air > 100) {
    return psat_T(20) * (airRelativeMoisture) * 18 / 22.4 / 100;
  } else {
    return psat_T(T_air) * (airRelativeMoisture) * 18 / 22.4 / 100;
  }
};
