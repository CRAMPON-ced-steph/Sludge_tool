import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const FBCalcOpex = ({ innerData, innerDataTick, setInnerData }) => {
  const prevOutputRef = useRef({});

  const toSignificantFigures = (value, figures = 2) => {
    if (value === 0 || value === null || value === undefined) return 0;
    return parseFloat(value.toPrecision(figures));
  };

  useEffect(() => {
    if (!innerData || !setInnerData) return;

    const conso_reactifs = innerData?.Conso_reactifs ?? {};

    const consoElec1 = toSignificantFigures(innerData.Puissance_elec_ventilateur);
    const consoElec2 = toSignificantFigures(0);
    const consoElec3 = toSignificantFigures(0);
    const consoElec4 = toSignificantFigures(0);
    const consoElec5 = toSignificantFigures(0);
    const consoElec6 = toSignificantFigures(0);

    const labelElec1 = 'Ventilateur';
    const labelElec2 = '';
    const labelElec3 = '';
    const labelElec4 = '';
    const labelElec5 = '';
    const labelElec6 = '';

    const conso_air_co_N_m3 = toSignificantFigures(0);

    const Conso_EauPotable_m3         = toSignificantFigures(innerData.Conso_EauPotable_m3         ?? 0);
    const Conso_EauRefroidissement_m3 = toSignificantFigures(innerData.Conso_EauRefroidissement_m3 ?? 0);
    const Conso_EauDemin_m3           = toSignificantFigures(innerData.Conso_EauDemin_m3           ?? 0);
    const Conso_EauRiviere_m3         = toSignificantFigures(innerData.Conso_EauRiviere_m3         ?? 0);
    const Conso_EauAdoucie_m3         = toSignificantFigures(innerData.Conso_EauAdoucie_m3         ?? 0);

    const Conso_CaCO3 = toSignificantFigures(conso_reactifs.CaCO3 ?? 0);
    const Conso_CaO = toSignificantFigures(conso_reactifs.CaO ?? 0);
    const Conso_CaOH2_dry = toSignificantFigures(conso_reactifs.CaOH2dry ?? 0);
    const Conso_CaOH2_wet = toSignificantFigures(conso_reactifs.CaOH2wet ?? 0);
    const Conso_NaOH = toSignificantFigures(conso_reactifs.NaOH ?? 0);
    const Conso_NaOHCO3 = toSignificantFigures(conso_reactifs.NaOHCO3 ?? 0);
    const Conso_Ammonia = toSignificantFigures(conso_reactifs.Ammonia ?? 0);
    const Conso_NaBrCaBr2 = toSignificantFigures(conso_reactifs.NaBrCaBr2 ?? 0);
    const Conso_CAP = toSignificantFigures(conso_reactifs.CAP ?? 0);

    const conso_gaz_H       = toSignificantFigures(innerData.conso_gaz_H     ?? 0);
    const conso_gaz_L       = toSignificantFigures(innerData.conso_gaz_L     ?? 0);
    const conso_gaz_Process = toSignificantFigures(innerData.conso_gaz_Process ?? 0);
    const conso_fuel        = toSignificantFigures(innerData.conso_fuel        ?? 0);

    const conso_incineration_ash = toSignificantFigures(1);
    const conso_boiler_ash = toSignificantFigures(0);
    const conso_fly_ash = toSignificantFigures(0);

    const CO2_transport_incineratino_ash = toSignificantFigures(1);
    const CO2_transport_boiler_ash = toSignificantFigures(0);
    const CO2_transport_fly_ash = toSignificantFigures(0);
    const CO2_transport_reactifs = toSignificantFigures(conso_reactifs.CO2_transport ?? 0);

    const cout_transport_incineratino_ash = toSignificantFigures(1);
    const cout_transport_boiler_ash = toSignificantFigures(0);
    const cout_transport_fly_ash = toSignificantFigures(0);
    const cout_transport_reactifs = toSignificantFigures(conso_reactifs.cout ?? 0);

    const newOutput = {
      consoElec1, consoElec2, consoElec3, consoElec4, consoElec5, consoElec6,
      labelElec1, labelElec2, labelElec3, labelElec4, labelElec5, labelElec6,
      conso_air_co_N_m3,
      Conso_EauPotable_m3, Conso_EauRefroidissement_m3, Conso_EauDemin_m3,
      Conso_EauRiviere_m3, Conso_EauAdoucie_m3,
      Conso_CaCO3, Conso_CaO, Conso_CaOH2_dry, Conso_CaOH2_wet,
      Conso_NaOH, Conso_NaOHCO3, Conso_Ammonia, Conso_NaBrCaBr2, Conso_CAP,
      cout_transport_total: 1,
      conso_gaz_H, conso_gaz_L, conso_gaz_Process, conso_fuel,
      conso_incineration_ash, conso_boiler_ash, conso_fly_ash,
      CO2_transport_incineratino_ash, CO2_transport_boiler_ash, CO2_transport_fly_ash, CO2_transport_reactifs,
      cout_transport_incineratino_ash, cout_transport_boiler_ash, cout_transport_fly_ash, cout_transport_reactifs,
    };

    // Guard anti-boucle : n'appelle setInnerData que si au moins une valeur a changé
    const prev = prevOutputRef.current;
    const changed = Object.keys(newOutput).some(k => prev[k] !== newOutput[k]);
    if (!changed) return;

    prevOutputRef.current = newOutput;
    setInnerData(prevData => ({ ...prevData, ...newOutput }));
  }, [
    innerDataTick,
    setInnerData,
    innerData?.Puissance_elec_ventilateur,
    innerData?.Conso_EauPotable_m3,
    innerData?.Conso_EauRefroidissement_m3,
    innerData?.Conso_EauDemin_m3,
    innerData?.Conso_EauRiviere_m3,
    innerData?.Conso_EauAdoucie_m3,
    innerData?.Conso_reactifs?.CaCO3,
    innerData?.Conso_reactifs?.CaO,
    innerData?.Conso_reactifs?.CaOH2dry,
    innerData?.Conso_reactifs?.CaOH2wet,
    innerData?.Conso_reactifs?.NaOH,
    innerData?.Conso_reactifs?.NaOHCO3,
    innerData?.Conso_reactifs?.Ammonia,
    innerData?.Conso_reactifs?.NaBrCaBr2,
    innerData?.Conso_reactifs?.CAP,
    innerData?.Conso_reactifs?.CO2_transport,
    innerData?.Conso_reactifs?.cout,
    innerData?.conso_gaz_H,
    innerData?.conso_gaz_L,
    innerData?.conso_gaz_Process,
    innerData?.conso_fuel,
  ]);

  return null;
};

FBCalcOpex.propTypes = {
  innerData: PropTypes.object.isRequired,
  innerDataTick: PropTypes.number,
  setInnerData: PropTypes.func.isRequired,
};

export default FBCalcOpex;
