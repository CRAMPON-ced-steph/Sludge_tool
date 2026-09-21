
import React, { useState, useEffect } from 'react';
import MassCalculator from '../../C_Components/Tableau_fumee_inverse';
import TableGeneric from '../../C_Components/Tableau_generique';
import GasTable from '../../C_Components/Tableau_air';
import { calculateWaterContent } from '../../A_Transverse_fonction/bilan_fct_combustion';
import { H_in_systemA } from '../../A_Transverse_fonction/bilan_fct_RK';
import { H2O_kg_m3, CO2_kg_m3, O2_kg_m3, N2_kg_m3, CO2_m3, H2O_m3, N2_m3, O2_m3 } from '../../A_Transverse_fonction/conv_calculation';
import { TEMP_FUMEE_INC, Q_AIR_DILUTION } from '../../A_Transverse_fonction/enthalpy_mix_gas';

const CaptureParameters = ({ innerData }) => {
  const [emissions, setEmissions] = useState(() => {
    const savedEmissions = localStorage.getItem('emissions_CO2');
    return savedEmissions ? JSON.parse(savedEmissions) : {
      'Flue gas temperature outlet [°C]': 900,
      'Air factor': 1,
      'Combustion Air Temperature [°C]': 20,
      'Waste Temperature [°C]': 20,
      'Steam water temperature': 20,
      'Estimated thermal Losses [%]': 8,
      'Air preheating part [%]': 20,
      'Air preheating temperature [°C]': 20,
      'Air Relative Moisture [%]': 50,
      'Water vaporized from extractor [kg/h] ': 500,
    };
  });

  const defaultEmissions = {
    'Flue gas temperature outlet [°C]': 900,
    'Air factor': 1,
    'Combustion Air Temperature [°C]': 20,
    'Waste Temperature [°C]': 20,
    'Steam water temperature': 20,
    'Estimated thermal Losses [%]': 8,
    'Air preheating part [%]': 20,
    'Air preheating temperature [°C]': 20,
    'Air Relative Moisture [%]': 50,
    'Water vaporized from extractor [kg/h] ': 500,
  };

  useEffect(() => {
    localStorage.setItem('emissions_CO2', JSON.stringify(emissions));
  }, [emissions]);

  const handleChange = (name, value) => {
    setEmissions(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetValues = () => {
    setEmissions(defaultEmissions);
  };





  const T_out = emissions['Flue gas temperature outlet [°C]'];
  const T_air = emissions['Combustion Air Temperature [°C]'];
  const T_waste = emissions['Waste Temperature [°C]'];
  const T_steam_water = emissions['Steam water temperature'];
  const T_air_prechauffe = emissions['Air preheating temperature [°C]'];
  const airRelativeMoisture = emissions['Air Relative Moisture [%]'];
  const Air_factor = emissions['Air factor'];
  const Th_loss_pourcent = emissions['Estimated thermal Losses [%]'];
  const Air_preheat_pourcent = emissions['Air preheating part [%]'];
  const Water_vaporized_extractor = emissions['Water vaporized from extractor [kg/h] '];

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

  const elementsGeneric = [
    { text: 'Air Stoechio [Kmole]', value: Air_stoechio_kmole.toFixed(2) },
    { text: 'Calculated temperature [°C]', value: T_four_calcule.toFixed(2) },
    { text: 'Water Content [kg/Nm3]', value: Water_content_kg_Nm3.toFixed(5) },
    { text: 'H_system', value: H_system.toFixed(0) },
    { text: 'Air factor calculated', value: Air_factor_calculated.toFixed(1) },
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

  innerData['FG_OUT'] = masses_FG_out_extractor_RK;
  innerData['FG_RK_OUT'] = volume_FG_out_extractor_RK;
  innerData['O2_calcule'] = O2_sec_pourcent;
  innerData['T_OUT'] = T_out;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h3>Calculation parameters</h3>
      <div
        style={{
          background: 'lightgrey',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}
      >
        {Object.entries(emissions).map(([key, value]) => (
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
              {key}:
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleChange(key, Number(e.target.value))}
              style={{
                flex: '0 0 100px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
          </div>
        ))}
      </div>

      <h3>Calculated parameters</h3>
      <TableGeneric elements={elementsGeneric} />

      <h3>Combustion air composition</h3>
      <h3>At the stoechiometry</h3>
      <GasTable data={AirStData} />
    
      <h3>At the adiabaticity</h3>
      <GasTable data={AirAdiaData} />
    
      <h3>Combustion air total</h3>
      <GasTable data={AirCombData} />

      <div style={{ marginTop: '20px' }}>
        <h3>Flue gas composition</h3>
        <h4>Flue gas at the stoechiometry</h4>
        <MassCalculator masses={masses_FG_stoechio} TemperatureImposee={T_four_calcule} />

        <h4>Output flue gas without water from extractor</h4>
        <MassCalculator masses={masses_FG_out_RK} TemperatureImposee={T_out} />

        <h4>Output flue gas with water from extractor</h4>
        <MassCalculator masses={masses_FG_out_extractor_RK} TemperatureImposee={T_out} />

        <button
          onClick={() => window.print()}
          style={{
            width: '100%',
            padding: '12px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Export Results
        </button>

        <button
          onClick={resetValues}
          style={{
            width: '100%',
            padding: '12px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Reset Values
        </button>


      </div>
    </div>
  );
};

export default CaptureParameters;