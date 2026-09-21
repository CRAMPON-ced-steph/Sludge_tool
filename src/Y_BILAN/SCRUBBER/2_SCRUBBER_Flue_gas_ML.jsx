import React, { useState, useEffect, useCallback } from 'react';
import MassCalculator from '../../C_Components/Tableau_fumee_inverse';
import TableGeneric from '../../C_Components/Tableau_generique';
import { Tsat_p, hL_T, hL_p, hV_p, h_pT } from '../../A_Transverse_fonction/steam_table3';
import { fh_CO2, fh_H2O, fh_O2, fh_N2 } from '../../A_Transverse_fonction/enthalpy_gas';

import PrintButton from '../../C_Components/Windows_print';

import { getLanguageCode } from '../../F_Gestion_Langues/Fonction_Traduction';
import { translations } from './SCRUBBER_traduction';

import { H2O_kg_m3, CO2_kg_m3, O2_kg_m3, N2_kg_m3 } from '../../A_Transverse_fonction/conv_calculation';
import { h_fumee, Qeau_added_to_be_at_T } from '../../A_Transverse_fonction/enthalpy_mix_gas';

const SCRUBBERFlueGasParameters = ({ innerData, currentLanguage = 'fr', onDataUpdate }) => {
  const initialEmissions_SCRUBBER = {
    'Flue gas temperature outlet [°C]': innerData?.T_OUT - 150 || 1,
    'Ambient air temperature [°C]': 20,
    'Volume of air ingress [Nm3/h]': 0,
    'Thermal losses [%]': 2,
    'Cooling water temperature [°C]': 20,
  };

  const languageCode = getLanguageCode(currentLanguage);
  const t = (key) => {
    return translations[languageCode]?.[key] || translations['fr']?.[key] || key;
  };

  const [emissions_SCRUBBER, setEmissions_SCRUBBER] = useState(() => {
    const savedEmissions = localStorage.getItem('emissions_SCRUBBER');
    return savedEmissions ? JSON.parse(savedEmissions) : initialEmissions_SCRUBBER;
  });

  useEffect(() => {
    localStorage.setItem('emissions_SCRUBBER', JSON.stringify(emissions_SCRUBBER));
  }, [emissions_SCRUBBER]);

  // Utiliser le callback fourni si disponible, sinon modifier directement
  const updateInnerData = useCallback((updates) => {
    if (onDataUpdate) {
      onDataUpdate(updates);
    } else if (innerData) {
      Object.assign(innerData, updates);
    }
  }, [innerData, onDataUpdate]);

  const T_IN = innerData?.T_OUT || 1;
  const FG_IN = innerData?.FG_OUT || { CO2: 1, H2O: 1, O2: 1, N2: 1 };

  const T_in = T_IN;
  const T_out = emissions_SCRUBBER['Flue gas temperature outlet [°C]'];
  const T_air = emissions_SCRUBBER['Ambient air temperature [°C]'];
  const V_air_ingress = emissions_SCRUBBER['Volume of air ingress [Nm3/h]'];
  const Pth = emissions_SCRUBBER['Thermal losses [%]'];
  const T_eau = emissions_SCRUBBER['Cooling water temperature [°C]'];

  // Conversion to m3/h
  const FG_CO2 = CO2_kg_m3(FG_IN.CO2);
  const FG_H2O = H2O_kg_m3(FG_IN.H2O);
  const FG_O2 = O2_kg_m3(FG_IN.O2);
  const FG_N2 = N2_kg_m3(FG_IN.N2);

  const FG_humide_tot = FG_CO2 + FG_H2O + FG_O2 + FG_N2;
  const FG_sec_tot = FG_CO2 + FG_O2 + FG_N2;

  // Air ingress calculations
  let FG_air_O2 = 0;
  let FG_air_N2 = 0;
  let FG_air_CO2 = 0;
  let FG_air_H2O = 0;
  let Q_eau = 0;
  let Delta_H = 0;
  let H_in_SCRUBBER = 0;
  let H_out_SCRUBBER = 0;
  let T_with_air_ingress_out = T_out;

  if (V_air_ingress !== 0) {
    FG_air_O2 = 0.21 * V_air_ingress;
    FG_air_N2 = 0.79 * V_air_ingress;

    T_with_air_ingress_out = (T_out * FG_humide_tot + V_air_ingress * T_air) / (FG_humide_tot + V_air_ingress);
    H_in_SCRUBBER = h_fumee(T_in, FG_IN.CO2, FG_IN.H2O, FG_IN.N2, FG_IN.O2);
    H_out_SCRUBBER = h_fumee(T_out + (T_out - T_with_air_ingress_out), FG_IN.CO2, FG_IN.H2O, FG_IN.N2, FG_IN.O2);
    Delta_H = H_in_SCRUBBER * (1 - Pth / 100) - H_out_SCRUBBER;

    Q_eau = Qeau_added_to_be_at_T(
      T_in,
      T_eau,
      T_out + (T_out - T_with_air_ingress_out),
      Pth,
      FG_IN.CO2,
      FG_IN.H2O,
      FG_IN.N2,
      FG_IN.O2
    );
  } else {
    T_with_air_ingress_out = T_out;
    H_in_SCRUBBER = h_fumee(T_in, FG_IN.CO2, FG_IN.H2O, FG_IN.N2, FG_IN.O2);
    H_out_SCRUBBER = h_fumee(T_out, FG_IN.CO2, FG_IN.H2O, FG_IN.N2, FG_IN.O2);
    Delta_H = H_in_SCRUBBER * (1 - Pth / 100) - H_out_SCRUBBER;
    Q_eau = Qeau_added_to_be_at_T(T_in, T_eau, T_out, Pth, FG_IN.CO2, FG_IN.H2O, FG_IN.N2, FG_IN.O2);
  }

  // Output masses
  const masses_FG_in_SCRUBBER = {
    CO2: FG_IN.CO2,
    O2: FG_IN.O2,
    H2O: FG_IN.H2O,
    N2: FG_IN.N2,
  };

  const masses_FG_out_SCRUBBER = {
    CO2: FG_IN.CO2 + FG_air_CO2,
    O2: FG_IN.O2 + FG_air_O2,
    H2O: FG_IN.H2O + Q_eau + FG_air_H2O,
    N2: FG_IN.N2 + FG_air_N2,
  };

  const FG_CO2_EAU = CO2_kg_m3(masses_FG_out_SCRUBBER.CO2);
  const FG_H2O_EAU = H2O_kg_m3(masses_FG_out_SCRUBBER.H2O);
  const FG_O2_EAU = O2_kg_m3(masses_FG_out_SCRUBBER.O2);
  const FG_N2_EAU = N2_kg_m3(masses_FG_out_SCRUBBER.N2);

  const FG_humide_EAU_tot_real = FG_CO2_EAU + FG_O2_EAU + FG_N2_EAU + FG_H2O_EAU;
  const FG_sec_EAU_tot_real = FG_CO2_EAU + FG_O2_EAU + FG_N2_EAU;

  const O2pourcent = (FG_O2_EAU / FG_humide_EAU_tot_real) * 100;

  // Update parent component data
  useEffect(() => {
    updateInnerData({
      'FG_humide_tot': FG_humide_tot,
      'FG_out': masses_FG_out_SCRUBBER,
      'FG_sec_tot': FG_sec_tot,
      'T_sortie': T_out,
      'FG_humide_EAU_tot_norm': FG_humide_EAU_tot_real,
      'FG_sec_EAU_tot_norm': FG_sec_EAU_tot_real,
      'Q_eau': Q_eau,
      'O2pourcent': O2pourcent,
    });
  }, [
    FG_humide_tot,
    masses_FG_out_SCRUBBER,
    FG_sec_tot,
    T_out,
    FG_humide_EAU_tot_real,
    FG_sec_EAU_tot_real,
    Q_eau,
    O2pourcent,
    updateInnerData,
  ]);

  const masses_Air_ingress = {
    CO2: FG_air_CO2,
    O2: FG_air_O2,
    H2O: FG_air_H2O,
    N2: FG_air_N2,
  };

  const elementsGeneric = [
    { text: t('Temperature inlet SCRUBBER [°C]'), value: T_in.toFixed(0) },
    { text: t('Delta enthalpies [kJ/h]'), value: Delta_H.toFixed(0) },
    { text: t('Sprayed/cooling water [kg/h]'), value: Q_eau.toFixed(0) },
    { text: t('Flue gas volume outlet [Nm3/h]'), value: FG_humide_EAU_tot_real.toFixed(0) },
  ];

  const handleChange = (name, value) => {
    if (name === 'Volume of air ingress [Nm3/h]') {
      value = Math.max(0, Math.min(10000, value));
    }
    setEmissions_SCRUBBER((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearMemory = useCallback(() => {
    localStorage.removeItem('emissions_SCRUBBER');
    setEmissions_SCRUBBER(initialEmissions_SCRUBBER);
  }, []);

  return (
    <div className="cadre_pour_onglet">
      <h3>{t('Calculation parameters')}</h3>
      <div className="cadre_param_bilan">
        <button onClick={clearMemory}>{t('Clear memory')}</button>

        {Object.entries(emissions_SCRUBBER).map(([key, value]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <label
              style={{
                flex: '1',
                marginRight: '10px',
                textAlign: 'right',
                fontWeight: 'bold',
              }}
            >
              {t(key)}:
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleChange(key, Number(e.target.value))}
              min={key === 'Volume of air ingress [Nm3/h]' ? 0 : undefined}
              max={key === 'Volume of air ingress [Nm3/h]' ? 10000 : undefined}
              step={key === 'Thermal losses [%]' ? 0.1 : 1}
              style={{
                flex: '0 0 205px',
                padding: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
        ))}
      </div>

      <h3>{t('Calculated parameters')}</h3>
      <TableGeneric elements={elementsGeneric} />

      <h3>{t('Flue gas composition')}</h3>
      <h4>
        {t('Flue gas inlet at inlet temperature')} (&nbsp;{T_in.toFixed(0)}°C)
      </h4>
      <MassCalculator masses={masses_FG_in_SCRUBBER} TemperatureImposee={T_in} />

      <h4>
        {t('Air ingress at ambient temperature')} (&nbsp;{T_air.toFixed(0)}°C)
      </h4>
      <MassCalculator masses={masses_Air_ingress} TemperatureImposee={T_air} />

      <h4>
        {t('Flue gas outlet at outlet temperature')} (&nbsp;{T_out.toFixed(0)}°C)
      </h4>
      <MassCalculator masses={masses_FG_out_SCRUBBER} TemperatureImposee={T_out} />
    </div>
  );
};

export default SCRUBBERFlueGasParameters;