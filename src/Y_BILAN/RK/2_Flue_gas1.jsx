import React, { useState, useEffect, useCallback } from 'react';
import MassCalculator from '../../C_Components/Tableau_fumee_inverse';
import TableGeneric from '../../C_Components/Tableau_generique';
import GasTable from '../../C_Components/Tableau_air';

import PrintButton from '../../C_Components/Windows_print';
import Input_bilan from '../../C_Components/MiseEnFormeInputParamBilan';

import { getTranslatedParameter, getLanguageCode } from '../../F_Gestion_Langues/Fonction_Traduction';
import { translations } from './RK_traduction';

import { calculateWaterContent } from '../../A_Transverse_fonction/bilan_fct_combustion';
import { H_in_systemA } from '../../A_Transverse_fonction/bilan_fct_RK';
import { H2O_kg_m3, CO2_kg_m3, O2_kg_m3, N2_kg_m3, CO2_m3, H2O_m3, N2_m3, O2_m3 } from '../../A_Transverse_fonction/conv_calculation';
import { TEMP_FUMEE_INC, Q_AIR_DILUTION } from '../../A_Transverse_fonction/enthalpy_mix_gas';

import '../../index.css';

const FlueGasParameters = ({ innerData, currentLanguage = 'fr' }) => {
  // Utilisation de clés internes simples
  const [emissions, setEmissions] = useState(() => {
    const savedEmissions = localStorage.getItem('emissions_RK');
    return savedEmissions ? JSON.parse(savedEmissions) : {
      flueGasTemperatureOutlet: 900,
      airFactor: 1,
      combustionAirTemperature: 20,
      wasteTemperature: 20,
      steamWaterTemperature: 20,
      estimatedThermalLosses: 8,
      airPreheatingPart: 20,
      airPreheatingTemperature: 20,
      airRelativeMoisture: 50,
      waterVaporizedFromExtractor: 500,
    };
  });

  const defaultEmissions = {
    flueGasTemperatureOutlet: 900,
    airFactor: 1,
    combustionAirTemperature: 20,
    wasteTemperature: 20,
    steamWaterTemperature: 20,
    estimatedThermalLosses: 8,
    airPreheatingPart: 20,
    airPreheatingTemperature: 20,
    airRelativeMoisture: 50,
    waterVaporizedFromExtractor: 500,
  };

  useEffect(() => {
    localStorage.setItem('emissions_RK', JSON.stringify(emissions));
  }, [emissions]);

  // Fonction de traduction
  const languageCode = getLanguageCode(currentLanguage);
  const t = (key) => {
    return translations[languageCode]?.[key] || translations['fr']?.[key] || key;
  };


  // Utilisation des clés internes simplifiées
  const T_out = emissions.flueGasTemperatureOutlet;
  const T_air = emissions.combustionAirTemperature;
  const T_waste = emissions.wasteTemperature;
  const T_steam_water = emissions.steamWaterTemperature;
  const T_air_prechauffe = emissions.airPreheatingTemperature;
  const airRelativeMoisture = emissions.airRelativeMoisture;
  const Air_factor = emissions.airFactor;
  const Th_loss_pourcent = emissions.estimatedThermalLosses;
  const Air_preheat_pourcent = emissions.airPreheatingPart;
  const Water_vaporized_extractor = emissions.waterVaporizedFromExtractor;

  const Air_stoechio_kmole = (innerData.O2_stoechio_kmoles || 0) / 0.21;
  const Water_content_kg_Nm3 = calculateWaterContent(T_air, airRelativeMoisture);
  const Air_combustion_stoechio_sec_tot_vol = Air_stoechio_kmole * 22.4;
  const Air_combustion_stoechio_sec_tot_mass = Air_combustion_stoechio_sec_tot_vol * 1.293;
  const Air_combustion_stoechio_H2O_mass = Water_content_kg_Nm3 * Air_combustion_stoechio_sec_tot_vol;
  const Air_combustion_stoechio_O2_mass = 0.233 * Air_combustion_stoechio_sec_tot_mass;
  const Air_combustion_stoechio_N2_mass = (1 - 0.233) * Air_combustion_stoechio_sec_tot_mass;
  const Air_combustion_stoechio_CO2_mass = 0;
  const Air_combustion_stoechio_CO2_vol = 0;
  const Air_combustion_stoechio_H2O_vol = H2O_kg_m3(Air_combustion_stoechio_H2O_mass);
  const Air_combustion_stoechio_O2_vol = O2_kg_m3(Air_combustion_stoechio_O2_mass);
  const Air_combustion_stoechio_N2_vol = N2_kg_m3(Air_combustion_stoechio_N2_mass);
  const Air_combustion_stoechio_humide_tot_vol = Air_combustion_stoechio_sec_tot_vol * Air_factor + Air_combustion_stoechio_H2O_vol;
  const Air_combustion_stoechio_humide_tot_mass = Air_combustion_stoechio_humide_tot_vol * 1.293 + Air_combustion_stoechio_H2O_mass;

  const masse_dechets = innerData.masse;
  const cvw = innerData.cvw;

  let FG_CO2_stoechio_vol = innerData.Cmoles * 22.4;
  let FG_H2O_stoechio_vol = (innerData.Hmoles - innerData.Clmoles + innerData.masse_eau_input / 18) * 22.4 + Air_combustion_stoechio_H2O_mass * 22.4 / 18;
  let FG_O2_stoechio_vol = (Air_factor - 1) * 0.21 * Air_combustion_stoechio_sec_tot_mass;
  let FG_N2_stoechio_vol = innerData.Nmoles * 22.4 + Air_stoechio_kmole * 0.79 * 22.4 * Air_factor;
  let FG_CO2_stoechio_mass = CO2_m3(FG_CO2_stoechio_vol);
  let FG_H2O_stoechio_mass = H2O_m3(FG_H2O_stoechio_vol);
  let FG_O2_stoechio_mass = O2_m3(FG_O2_stoechio_vol);
  let FG_N2_stoechio_mass = N2_m3(FG_N2_stoechio_vol);

  let FG_stoechio_sec_tot = FG_CO2_stoechio_mass + FG_O2_stoechio_mass + FG_N2_stoechio_mass;
  let FG_stoechio_humide_tot = FG_stoechio_sec_tot + FG_H2O_stoechio_mass;

  let Air_comb_sec_tot_mass = Air_combustion_stoechio_sec_tot_mass;
  let H_system = 0;
  let T_four_calcule = 0;
  let Air_adia_sec_tot_mass = 0;

  for (let i = 1; i <= 20; i++) {
    H_system = H_in_systemA(masse_dechets, cvw, Air_comb_sec_tot_mass, T_air, Air_combustion_stoechio_H2O_mass, T_steam_water, T_waste, Th_loss_pourcent, T_air_prechauffe, Air_preheat_pourcent);
    T_four_calcule = TEMP_FUMEE_INC(H_system, FG_CO2_stoechio_mass, FG_H2O_stoechio_mass, FG_N2_stoechio_mass, FG_O2_stoechio_mass);
    Air_adia_sec_tot_mass = Q_AIR_DILUTION(T_air, T_four_calcule, T_out, FG_CO2_stoechio_mass, FG_H2O_stoechio_mass, FG_N2_stoechio_mass, FG_O2_stoechio_mass, 0);
    Air_comb_sec_tot_mass = Air_adia_sec_tot_mass + Air_combustion_stoechio_sec_tot_mass;
  }

  const Air_adia_sec_tot_vol = Air_adia_sec_tot_mass / 1.293;
  const Air_adia_H2O_mass = Air_adia_sec_tot_vol * Water_content_kg_Nm3;
  const Air_adia_O2_mass = Air_adia_sec_tot_mass * 0.233;
  const Air_adia_N2_mass = Air_adia_sec_tot_mass * (1 - 0.233);
  const Air_adia_CO2_mass = 0;
  const Air_adia_humide_tot_mass = Air_adia_sec_tot_mass + Air_adia_H2O_mass;

  const Air_adia_CO2_vol = CO2_m3(Air_adia_CO2_mass);
  const Air_adia_H2O_vol = H2O_m3(Air_adia_H2O_mass);
  const Air_adia_O2_vol = O2_m3(Air_adia_O2_mass);
  const Air_adia_N2_vol = N2_m3(Air_adia_N2_mass);
  const Air_adia_humide_tot_vol = Air_adia_sec_tot_vol + Air_adia_H2O_vol;

  const Air_comb_CO2_mass = Air_adia_CO2_mass + Air_combustion_stoechio_CO2_mass;
  const Air_comb_H2O_mass = Air_adia_H2O_mass + Air_combustion_stoechio_H2O_mass;
  const Air_comb_O2_mass = Air_adia_O2_mass + Air_combustion_stoechio_O2_mass;
  const Air_comb_N2_mass = Air_adia_N2_mass + Air_combustion_stoechio_N2_mass;
  Air_comb_sec_tot_mass = Air_adia_sec_tot_mass + Air_combustion_stoechio_sec_tot_mass;

  const Air_comb_humide_tot_mass = Air_comb_sec_tot_mass + Air_comb_H2O_mass;

  const Air_comb_CO2_vol = CO2_kg_m3(Air_comb_CO2_mass);
  const Air_comb_H2O_vol = H2O_kg_m3(Air_comb_H2O_mass);
  const Air_comb_O2_vol = O2_kg_m3(Air_comb_O2_mass);
  const Air_comb_N2_vol = N2_kg_m3(Air_comb_N2_mass);

  const Air_comb_sec_tot_vol = Air_comb_CO2_vol + Air_comb_O2_vol + Air_comb_N2_vol;
  const Air_comb_humide_tot_vol = Air_comb_sec_tot_vol + Air_comb_H2O_vol;

  const Air_factor_calculated = (Air_combustion_stoechio_sec_tot_vol + Air_adia_sec_tot_vol) / Air_combustion_stoechio_sec_tot_vol;

  const FG_CO2_vol = FG_CO2_stoechio_vol;
  const FG_H2O_vol = FG_H2O_stoechio_vol + Air_adia_H2O_vol;
  const FG_O2_vol = Air_adia_sec_tot_vol * 0.21;
  const FG_N2_vol = Air_adia_sec_tot_vol * 0.79 + FG_N2_stoechio_vol;

  const FG_CO2_mass = CO2_m3(FG_CO2_vol);
  const FG_H2O_mass = H2O_m3(FG_H2O_vol);
  const FG_O2_mass = O2_m3(FG_O2_vol);
  const FG_N2_mass = N2_m3(FG_N2_vol);

  const FG_CO2_extractor_mass = FG_CO2_mass;
  const FG_H2O_extractor_mass = FG_H2O_mass + Water_vaporized_extractor;
  const FG_O2_extractor_mass = FG_O2_mass;
  const FG_N2_extractor_mass = FG_N2_mass;

  const FG_CO2_extractor_vol = CO2_kg_m3(FG_CO2_extractor_mass);
  const FG_H2O_extractor_vol = H2O_kg_m3(FG_H2O_extractor_mass);
  const FG_O2_extractor_vol = O2_kg_m3(FG_O2_extractor_mass);
  const FG_N2_extractor_vol = N2_kg_m3(FG_N2_extractor_mass);
  const FG_dry_extractor = FG_CO2_extractor_vol + FG_O2_extractor_vol + FG_N2_extractor_vol;
  const FG_wet_extractor = FG_dry_extractor + FG_H2O_extractor_vol;

  const O2_sec_pourcent = FG_O2_extractor_vol / FG_dry_extractor * 100;

  // Éléments génériques avec traductions
  const elementsGeneric = [
    { text: t('airStoechio'), value: Air_stoechio_kmole.toFixed(2) },
    { text: t('calculatedTemperature'), value: T_four_calcule.toFixed(2) },
    { text: t('waterContent'), value: Water_content_kg_Nm3.toFixed(5) },
    { text: t('hSystem'), value: H_system.toFixed(0) },
    { text: t('airFactorCalculated'), value: Air_factor_calculated.toFixed(2) },
  ];

  const AirStData = {
    kg_h: {
      CO2: Air_combustion_stoechio_CO2_mass,
      H2O: Air_combustion_stoechio_H2O_mass,
      O2: Air_combustion_stoechio_O2_mass,
      N2: Air_combustion_stoechio_N2_mass,
      Q_dry_tot: Air_combustion_stoechio_sec_tot_mass,
      Q_wet_tot: Air_combustion_stoechio_humide_tot_mass
    },
    Nm3_h: {
      CO2: Air_combustion_stoechio_CO2_vol,
      H2O: Air_combustion_stoechio_H2O_vol,
      O2: Air_combustion_stoechio_O2_vol,
      N2: Air_combustion_stoechio_N2_vol,
      Q_dry_tot: Air_combustion_stoechio_sec_tot_vol,
      Q_wet_tot: Air_combustion_stoechio_humide_tot_vol
    }
  };

  const AirAdiaData = {
    kg_h: {
      CO2: Air_adia_CO2_mass,
      H2O: Air_adia_H2O_mass,
      O2: Air_adia_O2_mass,
      N2: Air_adia_N2_mass,
      Q_dry_tot: Air_adia_sec_tot_mass,
      Q_wet_tot: Air_adia_humide_tot_mass
    },
    Nm3_h: {
      CO2: Air_adia_CO2_vol,
      H2O: Air_adia_H2O_vol,
      O2: Air_adia_O2_vol,
      N2: Air_adia_N2_vol,
      Q_dry_tot: Air_adia_sec_tot_vol,
      Q_wet_tot: Air_adia_humide_tot_vol
    }
  };

  const AirCombData = {
    kg_h: {
      CO2: Air_comb_CO2_mass,
      H2O: Air_comb_H2O_mass,
      O2: Air_comb_O2_mass,
      N2: Air_comb_N2_mass,
      Q_dry_tot: Air_comb_sec_tot_mass,
      Q_wet_tot: Air_comb_humide_tot_mass
    },
    Nm3_h: {
      CO2: Air_comb_CO2_vol,
      H2O: Air_comb_H2O_vol,
      O2: Air_comb_O2_vol,
      N2: Air_comb_N2_vol,
      Q_dry_tot: Air_comb_sec_tot_vol,
      Q_wet_tot: Air_comb_humide_tot_vol
    }
  };

  const masses_FG_stoechio = {
    CO2: FG_CO2_stoechio_mass,
    O2: FG_O2_stoechio_mass,
    H2O: FG_H2O_stoechio_mass,
    N2: FG_N2_stoechio_mass
  };

  const masses_FG_out_RK = {
    CO2: FG_CO2_mass,
    O2: FG_O2_mass,
    H2O: FG_H2O_mass,
    N2: FG_N2_mass
  };

  const masses_FG_out_extractor_RK = {
    CO2: FG_CO2_extractor_mass,
    O2: FG_O2_extractor_mass,
    H2O: FG_H2O_extractor_mass,
    N2: FG_N2_extractor_mass
  };

  const volume_FG_out_extractor_RK = {
    CO2: FG_CO2_extractor_vol,
    O2: FG_O2_extractor_vol,
    H2O: FG_H2O_extractor_vol,
    N2: FG_N2_extractor_vol,
    dry: FG_dry_extractor,
    wet: FG_wet_extractor
  };

  const handleChange = (name, value) => {
    setEmissions(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetValues = () => {
    setEmissions(defaultEmissions);
  };

  const clearMemory = useCallback(() => {
    localStorage.removeItem('emissions_RK');
    setEmissions(defaultEmissions);
  }, []);

  // Mise à jour des données innerData
  innerData['FG_OUT'] = masses_FG_out_extractor_RK;
  innerData['FG_RK_OUT'] = volume_FG_out_extractor_RK;
  innerData['O2_calcule'] = O2_sec_pourcent;
  innerData['T_OUT'] = T_out;

  return (
    <div className="cadre_pour_onglet">
      <h3>{t('calculationParameters')}</h3>
      <div className="cadre_param_bilan">
        <button onClick={clearMemory}>{t('resetValues')}</button>
        <Input_bilan 
          input={emissions} 
          handleChange={handleChange} 
          currentLanguage={languageCode} 
          translations={translations}
        />
      </div>

      <h3>{t('calculatedParameters')}</h3>
      <TableGeneric elements={elementsGeneric} />
      
      <h3>{t('combustionAirComposition')}</h3>
      <h3>{t('atStoichiometry')}</h3>
      <GasTable data={AirStData} />
      
      <h3>{t('atAdiabaticity')}</h3>
      <GasTable data={AirAdiaData} />
      
      <h3>{t('combustionAirTotal')}</h3>
      <GasTable data={AirCombData} />

      <h3>{t('flueGasComposition')}</h3>
      <h4>{t('flueGasAtStoichiometry')} ({T_four_calcule.toFixed(0)}°C)</h4>
      <MassCalculator masses={masses_FG_stoechio} TemperatureImposee={T_four_calcule} />
      
      <h4>{t('outputFlueGasWithoutWater')} ({T_out}°C)</h4>
      <MassCalculator masses={masses_FG_out_RK} TemperatureImposee={T_out} />
      
      <h4>{t('outputFlueGasWithWater')} ({T_out}°C)</h4>
      <MassCalculator masses={masses_FG_out_extractor_RK} TemperatureImposee={T_out} />
      
      <PrintButton onClick={window.print} text={t('export')} />
    </div>
  );
};

export default FlueGasParameters;