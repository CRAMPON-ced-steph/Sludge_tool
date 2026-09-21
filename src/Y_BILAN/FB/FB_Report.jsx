import React from 'react';
import { getLanguageCode } from '../../F_Gestion_Langues/Fonction_Traduction';
import { translations } from './FB_traduction';
import { getOpexData } from '../../A_Transverse_fonction/opexDataService';
import { CO2_kg_m3, H2O_kg_m3, O2_kg_m3, N2_kg_m3 } from '../../A_Transverse_fonction/conv_calculation';
import { useUnit } from '../../context/UnitContext';
import { fromSI, label as unitLabel } from '../../utils/units';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v, decimals = 2) => {
  const n = parseFloat(v);
  return isNaN(n) ? '—' : n.toFixed(decimals);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>{title}</h2>
    {children}
  </div>
);

const SubSection = ({ title, children }) => (
  <div style={styles.subSection}>
    {title && <h3 style={styles.subTitle}>{title}</h3>}
    {children}
  </div>
);

const KV = ({ label, value, unit = '' }) => (
  <div style={styles.kvRow}>
    <span style={styles.kvLabel}>{label}</span>
    <span style={styles.kvValue}>
      {value}
      {unit ? <span style={styles.kvUnit}> {unit}</span> : null}
    </span>
  </div>
);

const GasTable = ({ data = {} }) => {
  const gases = ['CO2', 'H2O', 'O2', 'N2'];
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}></th>
          {gases.map(g => <th key={g} style={styles.th}>{g}</th>)}
          <th style={styles.th}>Total</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(data).map(([lbl, d]) => {
          const tot = gases.reduce((s, g) => s + (parseFloat(d[g]) || 0), 0);
          return (
            <tr key={lbl}>
              <td style={styles.tdLabel}>{lbl}</td>
              {gases.map(g => <td key={g} style={styles.td}>{fmt(d[g])}</td>)}
              <td style={{ ...styles.td, fontWeight: 'bold' }}>{fmt(tot)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const PollutantTable = ({ masses = {} }) => {
  const keys = Object.keys(masses).filter(k => masses[k] !== undefined);
  if (keys.length === 0) {
    return <p style={{ color: '#999', fontSize: 12, margin: '4px 0' }}>—</p>;
  }
  return (
    <table style={styles.table}>
      <thead>
        <tr>{keys.map(k => <th key={k} style={styles.th}>{k}</th>)}</tr>
      </thead>
      <tbody>
        <tr>{keys.map(k => <td key={k} style={styles.td}>{fmt(masses[k], 4)}</td>)}</tr>
      </tbody>
    </table>
  );
};

// ─── OPEX cost calculation (mirrors OpexDashboard logic) ──────────────────────

const computeOpexCosts = (innerData) => {
  const {
    purchaseElectricityPrice = 0,
    ratioElec = 0,
    availability = 8000,
    currency = '€',
    airConsumptionPrice = 0,
    powerRatio = 0,
    waterPrices = {},
    reagentsTypes = {},
    gasTypes = {},
    fuelTypes = {},
  } = getOpexData();

  const d = innerData || {};

  // ── Électricité ────────────────────────────────────────────────────────────
  const elecRows = [1, 2, 3, 4, 5, 6, 7, 8]
    .map(i => ({ label: d[`labelElec${i}`] || `Poste ${i}`, kW: d[`consoElec${i}`] || 0 }))
    .filter(r => r.kW > 0);
  const totalElec = elecRows.reduce((s, r) => s + r.kW, 0);
  const coutElec = (totalElec / 1000) * purchaseElectricityPrice;
  const co2Elec = (ratioElec * totalElec) / 1000;

  // ── Air comprimé ───────────────────────────────────────────────────────────
  const conso_air = d.conso_air_co_N_m3 || 0;
  const coutAir = (conso_air / 1000) * airConsumptionPrice;
  const co2Air = (conso_air * powerRatio * ratioElec) / 1000;

  // ── Eau ───────────────────────────────────────────────────────────────────
  const eauRows = [
    { label: 'Eau potable',           m3h: d.Conso_EauPotable_m3        || 0, prix: waterPrices?.potable       || 0 },
    { label: 'Eau de refroidissement',m3h: d.Conso_EauRefroidissement_m3 || 0, prix: waterPrices?.cooling       || 0 },
    { label: 'Eau déminéralisée',     m3h: d.Conso_EauDemin_m3          || 0, prix: waterPrices?.demineralized || 0 },
    { label: 'Eau de rivière',        m3h: d.Conso_EauRiviere_m3        || 0, prix: waterPrices?.river         || 0 },
    { label: 'Eau adoucie',           m3h: d.Conso_EauAdoucie_m3        || 0, prix: waterPrices?.soft          || 0 },
  ].filter(r => r.m3h > 0);
  const coutEau = eauRows.reduce((s, r) => s + r.m3h * r.prix, 0);

  // ── Réactifs ──────────────────────────────────────────────────────────────
  const reactifRows = [
    { label: 'CaCO₃',        kgh: d.Conso_CaCO3      || 0, prix: reagentsTypes?.CaCO3?.cost      || 0, co2T: reagentsTypes?.CaCO3?.co2PerTrip      || 0 },
    { label: 'CaO',          kgh: d.Conso_CaO         || 0, prix: reagentsTypes?.CaO?.cost         || 0, co2T: reagentsTypes?.CaO?.co2PerTrip         || 0 },
    { label: 'Ca(OH)₂ sec',  kgh: d.Conso_CaOH2_dry  || 0, prix: reagentsTypes?.CaOH2?.cost       || 0, co2T: reagentsTypes?.CaOH2?.co2PerTrip       || 0 },
    { label: 'Ca(OH)₂ hum.', kgh: d.Conso_CaOH2_wet  || 0, prix: reagentsTypes?.CaOH2?.cost       || 0, co2T: reagentsTypes?.CaOH2?.co2PerTrip       || 0 },
    { label: 'NaOH',         kgh: d.Conso_NaOH        || 0, prix: reagentsTypes?.NaOH?.cost        || 0, co2T: reagentsTypes?.NaOH?.co2PerTrip        || 0 },
    { label: 'NaHCO₃',       kgh: d.Conso_NaOHCO3    || 0, prix: reagentsTypes?.NaOHCO3?.cost     || 0, co2T: reagentsTypes?.NaOHCO3?.co2PerTrip     || 0 },
    { label: 'NH₃',          kgh: d.Conso_Ammonia     || 0, prix: reagentsTypes?.NH3?.cost         || 0, co2T: reagentsTypes?.NH3?.co2PerTrip         || 0 },
    { label: 'NaBr/CaBr₂',   kgh: d.Conso_NaBrCaBr2  || 0, prix: reagentsTypes?.NaBr_CaBr2?.cost  || 0, co2T: reagentsTypes?.NaBr_CaBr2?.co2PerTrip  || 0 },
    { label: 'CAP',          kgh: d.Conso_CAP         || 0, prix: reagentsTypes?.CAP?.cost         || 0, co2T: reagentsTypes?.CAP?.co2PerTrip         || 0 },
  ].filter(r => r.kgh > 0);
  const coutReactifs = reactifRows.reduce((s, r) => s + (r.kgh / 1000) * r.prix, 0);
  const co2TransportReactifs = reactifRows.reduce((s, r) => s + (r.kgh / 1000) * r.co2T, 0);

  // ── Énergie fossile ────────────────────────────────────────────────────────
  const energieRows = [
    { label: 'Gaz haute valeur', MW: d.conso_gaz_H      || 0, prix: gasTypes?.naturalGasH?.molecule  || 0, co2e: gasTypes?.naturalGasH?.co2Emission  || 0 },
    { label: 'Gaz basse valeur', MW: d.conso_gaz_L      || 0, prix: gasTypes?.naturalGasL?.molecule  || 0, co2e: gasTypes?.naturalGasL?.co2Emission  || 0 },
    { label: 'Gaz process',      MW: d.conso_gaz_Process|| 0, prix: gasTypes?.processGas?.molecule   || 0, co2e: gasTypes?.processGas?.co2Emission   || 0 },
    { label: 'Fuel',             MW: d.conso_fuel       || 0, prix: fuelTypes?.FOD?.liquid            || 0, co2e: fuelTypes?.FOD?.co2Emission          || 0 },
  ].filter(r => r.MW > 0);
  const coutEnergie = energieRows.reduce((s, r) => s + r.MW * r.prix, 0);
  const co2Energie = energieRows.reduce((s, r) => s + r.MW * r.co2e, 0);

  // ── Transport résidus ──────────────────────────────────────────────────────
  const coutTransportResidus =
    (d.cout_transport_incineratino_ash || 0) +
    (d.cout_transport_boiler_ash       || 0) +
    (d.cout_transport_fly_ash          || 0);
  const co2TransportResidus =
    (d.CO2_transport_incineratino_ash  || 0) +
    (d.CO2_transport_boiler_ash        || 0) +
    (d.CO2_transport_fly_ash           || 0);
  const coutTransportReactifs = d.cout_transport_reactifs || 0;

  // ── Totaux ─────────────────────────────────────────────────────────────────
  const totalCout_h =
    coutElec + coutAir + coutEau + coutReactifs + coutEnergie +
    coutTransportResidus + coutTransportReactifs;
  const totalCout_an = totalCout_h * availability;
  const totalCO2_kgh = co2Elec + co2Air + co2Energie + co2TransportReactifs + co2TransportResidus;

  return {
    elecRows, totalElec, coutElec, co2Elec,
    conso_air, coutAir, co2Air,
    eauRows, coutEau,
    reactifRows, coutReactifs, co2TransportReactifs,
    energieRows, coutEnergie, co2Energie,
    coutTransportResidus, co2TransportResidus,
    coutTransportReactifs,
    totalCout_h, totalCout_an, totalCO2_kgh,
    currency, availability,
  };
};

// ─── OPEX section ─────────────────────────────────────────────────────────────

const OpexCostSection = ({ opex }) => {
  const {
    elecRows, totalElec, coutElec, co2Elec,
    coutAir, co2Air,
    eauRows, coutEau,
    reactifRows, coutReactifs, co2TransportReactifs,
    energieRows, coutEnergie, co2Energie,
    coutTransportResidus, co2TransportResidus,
    coutTransportReactifs,
    totalCout_h, totalCout_an, totalCO2_kgh,
    currency, availability,
  } = opex;

  const noData =
    totalElec === 0 && coutEnergie === 0 && coutEau === 0 && reactifRows.length === 0;

  if (noData) {
    return (
      <p style={{ color: '#999', fontSize: 12, padding: '10px 14px' }}>
        Coûts OPEX non disponibles — ouvrir les onglets Design et OPEX pour les calculer.
      </p>
    );
  }

  return (
    <div>
      {/* Résumé en tuiles ────────────────────────────────────────────────── */}
      <div style={{ ...styles.subSection, paddingBottom: 4 }}>
        <div style={styles.tagRow}>
          {[
            { label: `Électricité [${currency}/h]`,        val: coutElec,             color: '#4a90e2' },
            { label: `Air comprimé [${currency}/h]`,       val: coutAir,              color: '#17a2b8' },
            { label: `Eau [${currency}/h]`,                val: coutEau,              color: '#2ecc71' },
            { label: `Réactifs [${currency}/h]`,           val: coutReactifs,         color: '#e74c3c' },
            { label: `Énergie fossile [${currency}/h]`,    val: coutEnergie,          color: '#f39c12' },
            { label: `Transport résidus [${currency}/h]`,  val: coutTransportResidus, color: '#8e44ad' },
            { label: `Transport réactifs [${currency}/h]`, val: coutTransportReactifs,color: '#9b59b6' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ ...styles.tag, borderLeft: `4px solid ${color}`, minWidth: 140 }}>
              <span style={styles.tagLabel}>{label}</span>
              <span style={{ ...styles.tagValue, color }}>{fmt(val, 2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totaux ─────────────────────────────────────────────────────────── */}
      <div style={styles.twoCol}>
        <div style={{ ...styles.subSection, background: '#f0f5ff', margin: 8, borderRadius: 6 }}>
          <h3 style={{ ...styles.subTitle, color: '#1a3a6b', fontSize: 14 }}>Total coût</h3>
          <KV label={`Coût horaire [${currency}/h]`}                    value={fmt(totalCout_h, 2)} />
          <KV label={`Coût annuel (${availability}h) [${currency}/an]`} value={fmt(totalCout_an, 0)} />
        </div>
        <div style={{ ...styles.subSection, background: '#f5f0ff', margin: 8, borderRadius: 6 }}>
          <h3 style={{ ...styles.subTitle, color: '#6a1a6b', fontSize: 14 }}>Total CO₂</h3>
          <KV label="CO₂ électricité [kg/h]"         value={fmt(co2Elec, 3)} />
          <KV label="CO₂ air comprimé [kg/h]"        value={fmt(co2Air, 3)} />
          <KV label="CO₂ énergie fossile [kg/h]"     value={fmt(co2Energie, 3)} />
          <KV label="CO₂ transport réactifs [kg/h]"  value={fmt(co2TransportReactifs, 3)} />
          <KV label="CO₂ transport résidus [kg/h]"   value={fmt(co2TransportResidus, 3)} />
          <KV label="Total CO₂ [kg/h]"               value={fmt(totalCO2_kgh, 2)} />
        </div>
      </div>

      {/* Détail par catégorie ────────────────────────────────────────────── */}
      <div style={styles.twoCol}>

        {/* Électricité */}
        {elecRows.length > 0 && (
          <div style={styles.subSection}>
            <h3 style={styles.subTitle}>Électricité — détail</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Poste</th>
                  <th style={styles.th}>kW</th>
                  <th style={styles.th}>{`${currency}/h`}</th>
                </tr>
              </thead>
              <tbody>
                {elecRows.map(r => {
                  const { purchaseElectricityPrice = 0 } = getOpexData();
                  const cout = (r.kW / 1000) * purchaseElectricityPrice;
                  return (
                    <tr key={r.label}>
                      <td style={styles.tdLabel}>{r.label}</td>
                      <td style={styles.td}>{fmt(r.kW)}</td>
                      <td style={styles.td}>{fmt(cout, 2)}</td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: 'bold', background: '#eaf0fb' }}>
                  <td style={styles.tdLabel}>Total</td>
                  <td style={styles.td}>{fmt(totalElec)}</td>
                  <td style={styles.td}>{fmt(coutElec, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Eau */}
        {eauRows.length > 0 && (
          <div style={styles.subSection}>
            <h3 style={styles.subTitle}>Eau — détail</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>m³/h</th>
                  <th style={styles.th}>{`${currency}/m³`}</th>
                  <th style={styles.th}>{`${currency}/h`}</th>
                </tr>
              </thead>
              <tbody>
                {eauRows.map(r => (
                  <tr key={r.label}>
                    <td style={styles.tdLabel}>{r.label}</td>
                    <td style={styles.td}>{fmt(r.m3h, 3)}</td>
                    <td style={styles.td}>{fmt(r.prix, 3)}</td>
                    <td style={styles.td}>{fmt(r.m3h * r.prix, 2)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', background: '#eafaf1' }}>
                  <td style={styles.tdLabel}>Total</td>
                  <td style={styles.td}></td>
                  <td style={styles.td}></td>
                  <td style={styles.td}>{fmt(coutEau, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Réactifs */}
        {reactifRows.length > 0 && (
          <div style={styles.subSection}>
            <h3 style={styles.subTitle}>Réactifs — détail</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Réactif</th>
                  <th style={styles.th}>kg/h</th>
                  <th style={styles.th}>{`${currency}/T`}</th>
                  <th style={styles.th}>{`${currency}/h`}</th>
                </tr>
              </thead>
              <tbody>
                {reactifRows.map(r => (
                  <tr key={r.label}>
                    <td style={styles.tdLabel}>{r.label}</td>
                    <td style={styles.td}>{fmt(r.kgh, 3)}</td>
                    <td style={styles.td}>{fmt(r.prix, 2)}</td>
                    <td style={styles.td}>{fmt((r.kgh / 1000) * r.prix, 2)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', background: '#fdecea' }}>
                  <td style={styles.tdLabel}>Total</td>
                  <td style={styles.td}></td>
                  <td style={styles.td}></td>
                  <td style={styles.td}>{fmt(coutReactifs, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Énergie fossile */}
        {energieRows.length > 0 && (
          <div style={styles.subSection}>
            <h3 style={styles.subTitle}>Énergie fossile — détail</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>MW</th>
                  <th style={styles.th}>{`${currency}/MWh`}</th>
                  <th style={styles.th}>{`${currency}/h`}</th>
                  <th style={styles.th}>CO₂ [kg/h]</th>
                </tr>
              </thead>
              <tbody>
                {energieRows.map(r => (
                  <tr key={r.label}>
                    <td style={styles.tdLabel}>{r.label}</td>
                    <td style={styles.td}>{fmt(r.MW, 3)}</td>
                    <td style={styles.td}>{fmt(r.prix, 2)}</td>
                    <td style={styles.td}>{fmt(r.MW * r.prix, 2)}</td>
                    <td style={styles.td}>{fmt(r.MW * r.co2e, 3)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', background: '#fff8e1' }}>
                  <td style={styles.tdLabel}>Total</td>
                  <td style={styles.td}></td>
                  <td style={styles.td}></td>
                  <td style={styles.td}>{fmt(coutEnergie, 2)}</td>
                  <td style={styles.td}>{fmt(co2Energie, 3)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const FB_Report = ({ innerData = {}, currentLanguage = 'fr' }) => {
  const languageCode = getLanguageCode(currentLanguage);
  const t = (key) => translations[languageCode]?.[key] || translations['fr']?.[key] || key;

  const { unitSystem } = useUnit();
  const d = (val, qty, dec = 2) => {
    const v = fromSI(val, qty, unitSystem);
    return v != null && isFinite(v) ? Number(v).toFixed(dec) : '—';
  };
  const ul = (qty) => unitLabel(qty, unitSystem);

  // ── Section 1 : Boues ────────────────────────────────────────────────────────
  const daysPerWeek        = innerData.daysPerWeek        ?? 0;
  const hoursPerDay        = innerData.hoursPerDay        ?? 0;
  const totalHoursPerWeek  = innerData.totalHoursPerWeek  ?? 0;

  const sludgeType         = innerData.sludgeType         || '—';
  const MS_pourcent        = innerData.MS_pourcent        ?? 0;
  const MV_pourcent        = innerData.MV_pourcent        ?? 0;
  const MS            = innerData.MS            ?? 0;
  const MasseBoueBrute     = innerData.BoueBrute     || innerData.MasseBoueBrute || 0;
  const MV            = innerData.MV            ?? 0;
  const EauExtraite   = innerData.EauExtraite   ?? 0;
  const MM            = innerData.MM            ?? 0;

  const C_percent          = innerData.C_percent          ?? 0;
  const H_percent          = innerData.H_percent          ?? 0;
  const O_percent          = innerData.O_percent          ?? 0;
  const N_percent          = innerData.N_percent          ?? 0;
  const S_percent          = innerData.S_percent          ?? 0;
  const Cl_percent         = innerData.Cl_percent         ?? 0;

  const pciKJkgMV          = innerData.pciKJkgMV          ?? 0;
  const PCIKCALKGMV        = innerData.PCIKCALKGMV        ?? 0;
  const pciKcalkg          = innerData.pciKcalkg          ?? 0;
  const pcsKcalkgMV        = innerData.pcsKcalkgMV        ?? 0;
  const pcsKcalkg          = innerData.pcsKcalkg          ?? 0;
  const pciDulong          = innerData.pciDulong          ?? 0;

  const heavyMetalsData    = innerData.heavyMetalsData    || {};
  const metalMasses        = {
    Al:    innerData.Al    ?? 0,
    As:    innerData.As    ?? 0,
    Cd:    innerData.Cd    ?? 0,
    Cr:    innerData.Cr    ?? 0,
    Cu:    innerData.Cu    ?? 0,
    Fe:    innerData.Fe    ?? 0,
    Hg:    innerData.Hg    ?? 0,
    Ni:    innerData.Ni    ?? 0,
    Pb:    innerData.Pb    ?? 0,
    Zn:    innerData.Zn    ?? 0,
    PCDDF: innerData.PCDDF ?? 0,
    Ti:    innerData.Ti    ?? 0,
    Hf:    innerData.HF    ?? 0,
  };

  // ── Section 2 : Combustion ───────────────────────────────────────────────────
  // T_OUT = T_fumee_sortie_HX (remapped by sendAllData)
  // T_OUT : clé remappée dans sendAllData (T_fumee_sortie_HX → T_OUT)
  // Quand le rapport est affiché comme onglet, innerData = innerDataRef.current (clé brute)
  // Quand affiché dans GlobalReport, innerData = node.data.result (clé remappée)
  const T_OUT       = innerData.T_OUT       || innerData.T_fumee_sortie_HX || 0;
  const P_out_mmCE  = innerData.P_out_mmCE  || innerData.P_sortie_HX_mmCE    || 0;
  const O2_calcule  = innerData.O2_calcule  || 0;
  const FG_OUT_mass = innerData.FG_OUT_mass || {};

  // Nm³/h : direct or fallback computed from kg/h
  const _nm3Fallback = {
    CO2: CO2_kg_m3(FG_OUT_mass.CO2 || 0),
    H2O: H2O_kg_m3(FG_OUT_mass.H2O || 0),
    O2:  O2_kg_m3(FG_OUT_mass.O2   || 0),
    N2:  N2_kg_m3(FG_OUT_mass.N2   || 0),
  };
  _nm3Fallback.dry = _nm3Fallback.CO2 + _nm3Fallback.O2 + _nm3Fallback.N2;
  _nm3Fallback.wet = _nm3Fallback.dry + _nm3Fallback.H2O;
  const FG_OUT_vol   = innerData.FG_OUT_vol || _nm3Fallback;
  const FG_wet_total   = (FG_OUT_mass.CO2 || 0) + (FG_OUT_mass.H2O || 0)
                       + (FG_OUT_mass.O2  || 0) + (FG_OUT_mass.N2  || 0);

  // Air de combustion
  const Masse_air_sec              = innerData.Masse_air_sec_combustion_tot ?? 0;
  const Q_air_comb_tot            = innerData.Q_air_comb_tot             ?? 0;
  const Volume_air_balayage             = innerData.Volume_air_balayage              ?? 0;
  const Volume_air_combustible_total    = innerData.Volume_air_combustible_total ?? 0;
  const Temp_air_fluidisation           = innerData.Temp_air_fluidisation_av_prechauffe ?? 0;
  const Tair_ap_prechauffe            = innerData.Tair_ap_prechauffe             ?? 0;
  const Temp_air_soufflante           = innerData.Temp_air_soufflante            ?? 0;
  const Meau_air_comburant              = innerData.Meau_air_comburant               ?? 0;

  // Paramètres combustion
  const Exces_air                       = innerData.Exces_air                        ?? 0;
  const Exces_air_lit                   = innerData.Exces_air_lit                    ?? 0;
  const Exces_air_combustible           = innerData.Exces_air_combustible            ?? 0;
  const Q_gaz_mass                      = innerData.Q_gaz_mass                      ?? 0;
  const Q_gaz_vol                     = innerData.Q_gaz_vol                     ?? 0;

  // Fumées voûte
  const FG_wet                    = innerData.FG_wet                    ?? 0;
  const FG_dry                    = innerData.FG_dry                    ?? 0;
  const Rho_FG_kg_Nm3                   = innerData.Rho_FG_kg_Nm3                   ?? 0;
  const Temp_fumee_voute              = innerData.Temp_fumee_voute              ?? 0;
  const Tf_voute_ap_HX               = innerData.Tf_voute_ap_HX                ?? 0;
  const m_co                            = innerData.m_co                            ?? 0;
  const m_co2                           = innerData.m_co2                           ?? 0;
  const m_h2o                           = innerData.m_h2o                           ?? 0;
  const m_n2                            = innerData.m_n2                            ?? 0;
  const m_o2                            = innerData.m_o2                            ?? 0;
  const m_so2                           = innerData.m_so2                           ?? 0;
  const m_chcl                          = innerData.m_chcl                          ?? 0;

  // Paramètres thermiques
  const Rdt_HX                          = innerData.Rdt_HX                          ?? 0;
  const Hf_voute                     = innerData.Hf_voute                     ?? 0;
  const Hf_voute_ap_HX              = innerData.Hf_voute_ap_HX               ?? 0;
  const Hair_ap_prechauffage         = innerData.Hair_ap_prechauffage         ?? 0;

  // Bilan énergétique — clés confirmées dans innerData (écrites par CombustionTab)
  const H_in              = innerData.H_in             ?? 0;
  const H_pertes          = innerData.H_pertes         ?? 0;
  const H_imbrule         = innerData.H_imbrule        ?? 0;
  const H_air_balayage    = innerData.H_air_balayage   ?? 0;
  const H_air_soufflante  = innerData.H_air_soufflante ?? 0;

  // Valeurs écrites depuis CombustionTab (via mes ajouts), ou dérivées si absent
  // H_NETTE_BOUE : stockée par CombustionTab, sinon calculée depuis les données boue
  const _eau = MasseBoueBrute - MS;  // humidité boue
  const _H_MV  = (pciKJkgMV * MV) / 3600;
  const _H_Evap = (_eau * (4.1868 * 15 - 2501.6)) / 3600; // T_boue ≈ 15°C
  const H_NETTE_BOUE = innerData.H_NETTE_BOUE !== undefined && innerData.H_NETTE_BOUE !== 0
    ? innerData.H_NETTE_BOUE
    : _H_MV + _H_Evap;

  // H_gaz appoint : stockée, sinon 0
  const H_gaz_inter = innerData.H_gaz_inter !== undefined
    ? innerData.H_gaz_inter
    : 0;

  // H_out : stockée, sinon H_in (convergence → H_out ≈ H_in)
  const H_out = (innerData.H_out !== undefined && innerData.H_out !== 0)
    ? innerData.H_out
    : H_in;

  // H_matiere_minerale : stockée, sinon déduite de H_out - autres sorties
  const H_matiere_minerale = (innerData.H_matiere_minerale !== undefined && innerData.H_matiere_minerale !== 0)
    ? innerData.H_matiere_minerale
    : H_out - Hf_voute - H_pertes - H_imbrule;

  // Résidu (doit être ≈ 0 à convergence)
  const H_gaz_residuel = (innerData.H_gaz_residuel !== undefined && innerData.H_gaz_residuel !== 0)
    ? innerData.H_gaz_residuel
    : H_out - H_in;

  // ── Section 3 : Polluants ─────────────────────────────────────────────────────
  // Keys as remapped by sendAllData: PollutantInput / PollutantOutput (not PInput / Poutput)
  const PollutantInput  = innerData.PollutantInput  || {};
  const PollutantOutput = innerData.PollutantOutput || {};
  const Residus         = innerData.Residus         || {};
  const Conso_reactifs  = innerData.Conso_reactifs  || {};

  const reactifDisplay = [
    { label: 'CaCO₃ [kg/h]',        value: Conso_reactifs.CaCO3     },
    { label: 'CaO [kg/h]',          value: Conso_reactifs.CaO       },
    { label: 'Ca(OH)₂ sec [kg/h]',  value: Conso_reactifs.CaOH2dry  },
    { label: 'Ca(OH)₂ hum. [kg/h]', value: Conso_reactifs.CaOH2wet  },
    { label: 'NaOH [kg/h]',         value: Conso_reactifs.NaOH      },
    { label: 'NaHCO₃ [kg/h]',       value: Conso_reactifs.NaOHCO3   },
    { label: 'NH₃ [kg/h]',          value: Conso_reactifs.Ammonia   },
    { label: 'NaBr/CaBr₂ [kg/h]',   value: Conso_reactifs.NaBrCaBr2 },
    { label: 'CAP [kg/h]',          value: Conso_reactifs.CAP       },
  ].filter(r => parseFloat(r.value) > 0);

  // ── Section 4 : Dimensionnement ───────────────────────────────────────────────
  const Modele                      = innerData.Modele                          || '—';
  const NombreFour                  = Number(innerData.NombreFour)              || 1;
  const DiametreFreeboard           = innerData.DiametreFreeboard_m             || innerData.DiametreFreeboard || 0;
  const DiametreVoute               = innerData.DiametreVoute_m                 || innerData.DiametreVoute      || 0;
  const SurfaceVoute_m2             = innerData.SurfaceVoute_m2                 || 0;
  const NbrTuyeresActifs            = innerData.NbrTuyeres                      || 0;
  const NbTrousParTuyere            = innerData.NbTrousIter2                    || 0;
  const VitesseTuyere_ms            = innerData.VitesseReelleTuyereIter2_ms     || 0;
  const PressionFreeboard           = innerData.PressionFreeboard               || innerData.Pression_Freeboard || 0;
  const VitesseVoute2_ms            = innerData.VitesseVoute2_ms                || 0;
  const VitesseFreeboard            = innerData.VitesseReelleFour_ms            || 0;
  // Charges théoriques (calculées comme dans VouteTab)
  const _surf                       = SurfaceVoute_m2 > 0 ? SurfaceVoute_m2 : null;
  const ChargMS_kg_h_m2             = _surf ? (MS / NombreFour / _surf) : 0;
  const ChargMV_kg_h_m2             = _surf ? (MV / NombreFour / _surf) : 0;
  const ChargEau_kg_h_m2            = _surf ? (EauExtraite / NombreFour / _surf) : 0;
  // Capacité et densité thermique
  const CapaciteThermique        = H_in - H_pertes - H_imbrule - H_air_balayage;
  const DensiteThermique_kW_m2      = _surf ? (CapaciteThermique / _surf) : 0;
  // HX data — dimensionnement échangeur
  const S_echange_m2                = innerData.S_echange_m2        || 0;
  const DTLM_HX                     = innerData.DTLM_HX             || 0;
  const Facteur_UA                  = innerData.Facteur_UA           || 0;
  const Coeff_Hext_HX               = innerData.Coeff_Hext_HX       ?? 0;
  const coeff_Hint_HX               = innerData.coeff_Hint_HX       ?? 0;
  const FactUEncrasse_HX            = innerData.FactUEncrasse_HX    ?? 0;
  const Section_calandre_m2         = innerData.Section_calandre_m2 ?? 0;
  // HX côté fumées
  const P_freeboard_mmCE            = innerData.P_freeboard          ?? 0;
  const Q_FG_wet_entree        = innerData.Q_FG_wet_entree ?? 0;
  const P_sortie_HX_fg_mmCE        = innerData.P_sortie_HX_fg_mmCE  ?? 0;
  const Q_FG_wet_sortie       = innerData.Q_FG_wet_sortie ?? 0;
  // HX côté air
  const PDC_HX_cote_air_mmCE        = innerData.PDC_HX_cote_air_mmCE   ?? 0;
  const P_cote_air_entree_mmCE      = innerData.P_cote_air_entree_mmCE ?? 0;
  const Q_air_entree_HX        = innerData.Q_air_entree_HX  ?? 0;
  const Q_air_sortie_HX        = innerData.Q_air_sortie_HX  ?? 0;
  // Ventilateur
  const Q_air_pulser          = innerData.Q_air_pulser           ?? 0;
  const Q_air_ventilateur      = innerData.Q_air_ventilateur       ?? 0;
  const Puissance_elec_ventilateur = innerData.Puissance_elec_ventilateur ?? 0;
  const Rendement_ventilateur_HX    = innerData.Rendement_ventilateur_HX     ?? 0;

  // ── Section 5 : OPEX ─────────────────────────────────────────────────────────
  const opex = computeOpexCosts(innerData);

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>
        Four à Lit Fluidisé (FB) — Rapport de synthèse
      </h1>
      <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic', marginBottom: 16, padding: '4px 10px', backgroundColor: '#f0f4ff', borderRadius: 4, display: 'inline-block' }}>
        {unitSystem === 'SI'
          ? 'All values expressed in SI units (kg/h, °C, kW, Nm³/h, bar)'
          : 'All values expressed in US customary units (lb/h, °F, BTU/h, scfh, psi)'}
      </div>

      {/* ── SECTION 1 : Boues ──────────────────────────────────────────────── */}
      <Section title={`1. ${t('Caractéristiques des Boues')}`}>

        {/* Fonctionnement + Débit */}
        <div style={styles.twoCol}>
          <SubSection title={t('Fonctionnement')}>
            <KV label={t('Nombre de jours par semaine')} value={fmt(daysPerWeek, 0)} unit="j/sem" />
            <KV label={t('Nombre d\'heures par jour')}   value={fmt(hoursPerDay, 0)} unit="h/j"   />
            <KV label="Total"                            value={fmt(totalHoursPerWeek, 0)} unit="h/sem" />
          </SubSection>
          <SubSection title={t('Caractéristiques des Boues')}>
            <KV label={t('Type de boue')}          value={sludgeType}                />
            <KV label={t('Siccité')}               value={fmt(MS_pourcent, 1)}  unit="%" />
            <KV label="MV"                         value={fmt(MV_pourcent, 1)}  unit="%" />
            <KV label={t('Débit MS')}              value={d(MS, 'massFlow', 0)}           unit={`${ul('massFlow')} MS`} />
            <KV label="Débit boue brute"           value={d(MasseBoueBrute, 'massFlow', 0)} unit={ul('massFlow')} />
            <KV label="Débit MV"                   value={d(MV, 'massFlow', 0)}           unit={`${ul('massFlow')} MV`} />
            <KV label="Eau extraite"               value={d(EauExtraite, 'massFlow', 0)}  unit={ul('massFlow')} />
            <KV label="Cendres (MM)"               value={d(MM, 'massFlow', 0)}           unit={ul('massFlow')} />
          </SubSection>
        </div>

        {/* CHONS + PCI */}
        <div style={styles.twoCol}>
          <SubSection title="Composition CHONS (% MV)">
            <div style={styles.tagRow}>
              {[
                { sym: 'C',  val: C_percent  },
                { sym: 'H',  val: H_percent  },
                { sym: 'O',  val: O_percent  },
                { sym: 'N',  val: N_percent  },
                { sym: 'S',  val: S_percent  },
                { sym: 'Cl', val: Cl_percent },
              ].map(({ sym, val }) => (
                <div key={sym} style={{ ...styles.tag, minWidth: 70 }}>
                  <span style={styles.tagLabel}>{sym} [%]</span>
                  <span style={styles.tagValue}>{fmt(val, 2)}</span>
                </div>
              ))}
            </div>
          </SubSection>
          <SubSection title="PCI / PCS">
            <KV label="PCI [kJ/kg MV]"    value={fmt(pciKJkgMV, 0)}   />
            <KV label="PCI [kcal/kg MV]"  value={fmt(PCIKCALKGMV, 0)} />
            <KV label="PCI [kcal/kg boue]"value={fmt(pciKcalkg, 0)}   />
            <KV label="PCS [kcal/kg MV]"  value={fmt(pcsKcalkgMV, 0)} />
            <KV label="PCS [kcal/kg boue]"value={fmt(pcsKcalkg, 0)}   />
            <KV label="PCI Dulong [kcal/kg MV]" value={fmt(pciDulong, 0)} />
          </SubSection>
        </div>

        {/* Métaux lourds */}
        <SubSection title="Métaux lourds">
          <div style={styles.tableTitle}>Teneurs [mg/kg MS]</div>
          <table style={styles.table}>
            <thead>
              <tr>
                {Object.keys(heavyMetalsData).map(k => (
                  <th key={k} style={styles.th}>{k.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.keys(heavyMetalsData).map(k => (
                  <td key={k} style={styles.td}>{fmt(heavyMetalsData[k], k === 'pcddf' ? 6 : 0)}</td>
                ))}
              </tr>
            </tbody>
          </table>
          <div style={{ ...styles.tableTitle, marginTop: 10 }}>Masses [kg/h]</div>
          <table style={styles.table}>
            <thead>
              <tr>
                {Object.keys(metalMasses).map(k => (
                  <th key={k} style={styles.th}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.keys(metalMasses).map(k => (
                  <td key={k} style={styles.td}>{fmt(metalMasses[k], k === 'PCDDF' ? 8 : 5)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </SubSection>

      </Section>

      {/* ── SECTION 2 : Combustion ─────────────────────────────────────────── */}
      <Section title={`2. ${t('Combustion')}`}>

        {/* Air de combustion + Paramètres combustion */}
        <div style={styles.twoCol}>
          <SubSection title="Air de combustion">
            <KV label="Masse air sec total"           value={d(Masse_air_sec, 'massFlow', 0)}             unit={ul('massFlow')} />
            <KV label="Débit air total"              value={d(Q_air_comb_tot, 'volumeFlow', 0)}          unit={ul('volumeFlow')} />
            <KV label="Dont : air combustible"       value={d(Volume_air_combustible_total, 'volumeFlow', 0)} unit={ul('volumeFlow')} />
            <KV label="Dont : air de balayage"       value={d(Volume_air_balayage, 'volumeFlow', 0)}     unit={ul('volumeFlow')} />
            <KV label="T° air fluidisation av. préch." value={d(Temp_air_fluidisation, 'temperature', 0)} unit={ul('temperature')} />
            <KV label="T° air ap. préchauffage (lit)"  value={d(Tair_ap_prechauffe, 'temperature', 0)}   unit={ul('temperature')} />
            <KV label="T° air soufflante"              value={d(Temp_air_soufflante, 'temperature', 0)}  unit={ul('temperature')} />
            <KV label="Eau dans l'air comburant"     value={d(Meau_air_comburant, 'massFlow', 2)}        unit={ul('massFlow')} />
          </SubSection>

          <SubSection title="Paramètres de combustion">
            <KV label="Excès d'air global [%]"              value={fmt(Exces_air, 1)}                    />
            <KV label="Excès d'air lit [%]"                 value={fmt(Exces_air_lit, 1)}                />
            <KV label="Excès d'air combustible [%]"         value={fmt(Exces_air_combustible, 1)}        />
            <KV label="O₂ calculé (sec) [%]"               value={fmt((O2_calcule || 0) * 100, 2)}      />
            <KV label="Débit gaz naturel"           value={d(Q_gaz_mass, 'massFlow', 2)}        unit={ul('massFlow')} />
            <KV label="Débit gaz naturel"           value={d(Q_gaz_vol, 'volumeFlow', 2)}      unit={ul('volumeFlow')} />
          </SubSection>
        </div>

        {/* Fumées voûte + Paramètres thermiques */}
        <div style={styles.twoCol}>
          <SubSection title="Fumées sortie voûte">
            <KV label="T° fumées voûte"          value={d(Temp_fumee_voute, 'temperature', 0)} unit={ul('temperature')} />
            <KV label="T° fumées ap. HX"         value={d(Tf_voute_ap_HX, 'temperature', 0)}  unit={ul('temperature')} />
            <KV label="Débit fumées humides"      value={d(FG_wet, 'volumeFlow', 0)}            unit={ul('volumeFlow')} />
            <KV label="Débit fumées sèches"       value={d(FG_dry, 'volumeFlow', 0)}            unit={ul('volumeFlow')} />
            <KV label="Densité fumées [kg/Nm³]"  value={fmt(Rho_FG_kg_Nm3, 4)}               />
          </SubSection>

          <SubSection title="Paramètres thermiques">
            <KV label="Rendement HX [%]"             value={fmt(Rdt_HX, 1)}                             />
            <KV label="Enthalpie fumées voûte"      value={d(Hf_voute, 'energy', 1)}           unit={ul('energy')} />
            <KV label="Enthalpie fumées ap. HX"     value={d(Hf_voute_ap_HX, 'energy', 1)}    unit={ul('energy')} />
            <KV label="Chaleur récupérée air"       value={d(Hair_ap_prechauffage, 'energy', 1)} unit={ul('energy')} />
          </SubSection>
        </div>

        {/* Résultat de convergence + Gaz sortie four */}
        <div style={styles.twoCol}>
          <SubSection title="Résultat de convergence">
            <KV label="Débit gaz naturel convergé"  value={d(Q_gaz_mass, 'massFlow', 3)}     unit={ul('massFlow')} />
            <KV label="Débit gaz naturel convergé"  value={d(Q_gaz_vol, 'volumeFlow', 3)}   unit={ul('volumeFlow')} />
            <KV label="O₂ calculé (sec) [%]"        value={fmt((O2_calcule || 0) * 100, 2)} />
            <KV label="T° sortie HX"                 value={d(T_OUT, 'temperature', 0)}      unit={ul('temperature')} />
            <KV label="Pression sortie HX [mmCE]"   value={fmt(P_out_mmCE)}                />
          </SubSection>

          <SubSection title="Gaz sortie four">
            <KV label="Débit humide total"  value={d(FG_wet_total, 'massFlow', 0)}      unit={ul('massFlow')} />
            <KV label="Débit sec"           value={d(FG_OUT_vol.dry, 'volumeFlow', 0)} unit={ul('volumeFlow')} />
            <KV label="Débit humide"        value={d(FG_OUT_vol.wet, 'volumeFlow', 0)} unit={ul('volumeFlow')} />
            <GasTable
              data={{
                [ul('massFlow')]:   FG_OUT_mass,
                [ul('volumeFlow')]: {
                  CO2: FG_OUT_vol.CO2,
                  H2O: FG_OUT_vol.H2O,
                  O2:  FG_OUT_vol.O2,
                  N2:  FG_OUT_vol.N2,
                },
              }}
            />
          </SubSection>
        </div>

        {/* Bilan énergétique simplifié */}
        <SubSection title={`Bilan énergétique simplifié (${ul('energy')})`}>
          <table style={styles.table}>
            <thead>
              <tr style={{ backgroundColor: '#D4B5A0' }}>
                <th style={{ ...styles.th, width: '40%' }}>Paramètre</th>
                <th style={{ ...styles.th, backgroundColor: '#FFE6CC' }}>Entrée ({ul('energy')})</th>
                <th style={{ ...styles.th, backgroundColor: '#E6F3FF' }}>Sortie ({ul('energy')})</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'H_NETTE_BOUE',        vin: H_NETTE_BOUE,         vout: null },
                { label: 'Hair_ap_préchauffage', vin: Hair_ap_prechauffage,  vout: null },
                { label: 'H_air_balayage',       vin: H_air_balayage,        vout: null },
                { label: 'H_gaz appoint',        vin: H_gaz_inter,              vout: null },
                { label: 'H_matière_minérale',   vin: null, vout: H_matiere_minerale },
                { label: 'Hf_voûte',             vin: null, vout: Hf_voute },
                { label: 'Pertes thermiques',    vin: null, vout: H_pertes },
                { label: 'Imbrûlés (CO + H₂)',   vin: null, vout: H_imbrule },
              ].map(({ label, vin, vout }) => (
                <tr key={label}>
                  <td style={{ ...styles.tdLabel, fontWeight: 'bold' }}>{label}</td>
                  <td style={{ ...styles.td, backgroundColor: '#FFF8F0' }}>{vin != null ? d(vin, 'energy') : '—'}</td>
                  <td style={{ ...styles.td, backgroundColor: '#F0F6FF' }}>{vout != null ? d(vout, 'energy') : '—'}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold' }}>
                <td style={{ ...styles.tdLabel, backgroundColor: '#B0D0E8' }}>TOTAL ENTRÉE (H_in)</td>
                <td style={{ ...styles.td, backgroundColor: '#ADD8E6' }}>{d(H_in, 'energy')}</td>
                <td style={{ ...styles.td, backgroundColor: '#B0D0E8' }}>—</td>
              </tr>
              <tr style={{ fontWeight: 'bold' }}>
                <td style={{ ...styles.tdLabel, backgroundColor: '#B0D0E8' }}>TOTAL SORTIE (H_out)</td>
                <td style={{ ...styles.td, backgroundColor: '#B0D0E8' }}>—</td>
                <td style={{ ...styles.td, backgroundColor: '#ADD8E6' }}>{d(H_out, 'energy')}</td>
              </tr>
              <tr style={{ opacity: 0.8 }}>
                <td style={{ ...styles.tdLabel, fontStyle: 'italic', backgroundColor: '#f8f8f8' }}>
                  Résidu (H_out − H_in) — doit être ≈ 0
                </td>
                <td style={{ ...styles.td, backgroundColor: '#f8f8f8' }}>—</td>
                <td style={{
                  ...styles.td,
                  backgroundColor: '#f8f8f8',
                  fontStyle: 'italic',
                  color: H_gaz_residuel != null && Math.abs(H_gaz_residuel) < 1 ? '#16a34a' : '#dc2626',
                }}>
                  {H_gaz_residuel != null ? fmt(H_gaz_residuel, 4) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </SubSection>


      </Section>

      {/* ── SECTION 3 : Émissions polluantes ───────────────────────────────── */}
      <Section title={`3. ${t('Polluant')} — Émissions polluantes`}>
        <SubSection title="Gaz en entrée [kg/h]">
          <PollutantTable masses={PollutantInput} />
        </SubSection>
        <SubSection title="Gaz en sortie [kg/h]">
          <PollutantTable masses={PollutantOutput} />
        </SubSection>
        <div style={styles.twoCol}>
          <SubSection title="Résidus solides">
            <KV label="Cendres de foyer (sec)"  value={d(Residus.DryBottomAsh, 'massFlow')} unit={ul('massFlow')} />
            <KV label="Cendres de foyer (hum.)" value={d(Residus.WetBottomAsh, 'massFlow')} unit={ul('massFlow')} />
            <KV label="Cendres volantes"         value={d(Residus.FlyAsh, 'massFlow')}       unit={ul('massFlow')} />
          </SubSection>
          <SubSection title="Consommation réactifs de traitement">
            {reactifDisplay.length > 0
              ? reactifDisplay.map(({ label, value }) => (
                  <KV key={label} label={label} value={fmt(value, 3)} />
                ))
              : <p style={{ color: '#999', fontSize: 12, margin: 0 }}>Aucun réactif ou données non disponibles.</p>
            }
          </SubSection>
        </div>
      </Section>

      {/* ── SECTION 4 : Dimensionnement ────────────────────────────────────── */}
      <Section title="4. Dimensionnement">

        <SubSection title={`${t('Voûte')} — ${t('Résumé Final')} ${t('Dimensionnement Réacteur')}`}>
          {Modele === '—' && NbrTuyeresActifs === 0 ? (
            <p style={{ color: '#888', fontSize: 11, margin: '6px 0' }}>
              Données voûte non disponibles — ouvrir l'onglet Voûte.
            </p>
          ) : (
            <div style={{ ...styles.twoCol, gap: 24 }}>
              <div>
                <KV label={t('Modèle')}                                   value={Modele}                              />
                <KV label="Nombre de fours"                               value={fmt(NombreFour, 0)}                  />
                <KV label="Ø freeboard [m]"                               value={fmt(DiametreFreeboard, 3)}           />
                <KV label="Ø voûte [m]"                                   value={fmt(DiametreVoute, 3)}               />
                <KV label="Surface voûte [m²]"                            value={fmt(SurfaceVoute_m2, 4)}             />
                <KV label="Vitesse freeboard [m/s]"                       value={fmt(VitesseFreeboard, 3)}            />
                <KV label="Vitesse voûte iter. 2 [m/s]"                   value={fmt(VitesseVoute2_ms, 4)}            />
                <KV label="Pression finale freeboard [mmCE]"              value={fmt(PressionFreeboard, 2)}           />
              </div>
              <div>
                <KV label="Nb tuyères actives"                            value={fmt(NbrTuyeresActifs, 0)}            />
                <KV label="Nb trous / tuyère"                             value={fmt(NbTrousParTuyere, 0)}            />
                <KV label="Vitesse réelle tuyère [m/s]"                   value={fmt(VitesseTuyere_ms, 1)}            />
                <KV label="Charge MS théorique [kg MS/h/m²]"             value={fmt(ChargMS_kg_h_m2, 2)}            />
                <KV label="Charge MV théorique [kg MV/h/m²]"             value={fmt(ChargMV_kg_h_m2, 2)}            />
                <KV label={`Charge eau théorique [kg eau/h/m²]${ChargEau_kg_h_m2 > 540 ? ' ⚠' : ''}`}
                                                                          value={fmt(ChargEau_kg_h_m2, 2)}
                />
                <KV label="Capacité thermique du four" value={d(CapaciteThermique, 'energy', 1)} unit={ul('energy')} />
                <KV label="Densité thermique du four [kW/m²]" value={fmt(DensiteThermique_kW_m2, 1)} />
              </div>
            </div>
          )}
        </SubSection>

        <SubSection title="HX côté fumées">
          <div style={{ ...styles.twoCol, gap: 32 }}>
            <div>
              <KV label="T° fumées voûte"          value={d(Temp_fumee_voute, 'temperature', 0)} unit={ul('temperature')} />
              <KV label="Débit fumées humides"     value={d(FG_wet, 'volumeFlow', 0)}            unit={ul('volumeFlow')} />
              <KV label="Pression freeboard [mmCE]" value={fmt(P_freeboard_mmCE, 0)}        />
              <KV label="Débit fumées entrée HX [m³/h]" value={fmt(Q_FG_wet_entree, 0)}   />
              <KV label="Enthalpie fumées entrée"  value={d(Hf_voute, 'energy', 1)}             unit={ul('energy')} />
            </div>
            <div>
              <KV label="T° fumées sortie HX"       value={d(Tf_voute_ap_HX, 'temperature', 0)} unit={ul('temperature')} />
              <KV label="Pression sortie HX fumées [mmCE]" value={fmt(P_sortie_HX_fg_mmCE, 0)}    />
              <KV label="Débit fumées sortie HX [m³/h]"   value={fmt(Q_FG_wet_sortie, 0)}   />
              <KV label="Enthalpie fumées sortie"          value={d(Hf_voute_ap_HX, 'energy', 1)} unit={ul('energy')} />
            </div>
          </div>
        </SubSection>

        <SubSection title="HX côté air">
          <div style={{ ...styles.twoCol, gap: 32 }}>
            <div>
              <KV label="T° air soufflante"          value={d(Temp_air_soufflante, 'temperature', 0)} unit={ul('temperature')} />
              <KV label="Débit air"                  value={d(Q_air_comb_tot, 'volumeFlow', 0)}     unit={ul('volumeFlow')} />
              <KV label="PDC HX côté air [mmCE]"    value={fmt(PDC_HX_cote_air_mmCE, 1)}   />
              <KV label="Pression entrée HX air [mmCE]" value={fmt(P_cote_air_entree_mmCE, 0)} />
              <KV label="Débit air entrée HX [m³/h]" value={fmt(Q_air_entree_HX, 0)}   />
              <KV label="Enthalpie air entrée"       value={d(H_air_soufflante, 'energy', 1)}       unit={ul('energy')} />
            </div>
            <div>
              <KV label="T° air ap. préchauffe"      value={d(Tair_ap_prechauffe, 'temperature', 0)} unit={ul('temperature')} />
              <KV label="Débit air sortie HX [m³/h]" value={fmt(Q_air_sortie_HX, 0)}   />
              <KV label="Enthalpie air sortie"        value={d(Hair_ap_prechauffage, 'energy', 1)} unit={ul('energy')} />
            </div>
          </div>
        </SubSection>

        <SubSection title="Dimensionnement de l'échangeur">
          <div style={{ ...styles.twoCol, gap: 32 }}>
            <div>
              <KV label="Rendement HX [%]"                 value={fmt(Rdt_HX, 1)}                             />
              <KV label="Q chaleur cédée fumées"   value={d(Hf_voute - Hf_voute_ap_HX, 'energy', 1)}             unit={ul('energy')} />
              <KV label="Q chaleur reçue air"      value={d(Hair_ap_prechauffage - H_air_soufflante, 'energy', 1)} unit={ul('energy')} />
              <KV label="DTLM [K]"                         value={fmt(DTLM_HX, 2)}                            />
              <KV label="Facteur UA [W/K]"                 value={fmt(Facteur_UA, 0)}                         />
            </div>
            <div>
              <KV label="Surface d'échange [m²]"           value={fmt(S_echange_m2, 2)}                       />
              <KV label="Section calandre [m²]"            value={fmt(Section_calandre_m2, 4)}                />
              <KV label="Hext [kCal/m².°C]"                value={fmt(Coeff_Hext_HX, 4)}                     />
              <KV label="Hint [kCal/m².°C]"                value={fmt(coeff_Hint_HX, 4)}                     />
              <KV label="U encrassé [kCal/m².°C]"          value={fmt(FactUEncrasse_HX, 4)}                   />
            </div>
          </div>
        </SubSection>

        <SubSection title="Ventilateur">
          <div style={{ ...styles.twoCol, gap: 32 }}>
            <div>
              <KV label="Débit air à pulser"         value={d(Q_air_pulser, 'volumeFlow', 0)}         unit={ul('volumeFlow')} />
              <KV label="Pression ventilateur [mmCE]" value={fmt(P_cote_air_entree_mmCE, 0)}         />
              <KV label="T° air soufflante"           value={d(Temp_air_soufflante, 'temperature', 0)} unit={ul('temperature')} />
            </div>
            <div>
              <KV label="Débit ventilateur [m³/h]"         value={fmt(Q_air_ventilateur, 0)}         />
              <KV label="Rendement ventilateur [%]"        value={fmt(Rendement_ventilateur_HX * 100, 1)} />
              <KV label="Puissance électrique"  value={d(Puissance_elec_ventilateur, 'energy', 1)} unit={ul('energy')} />
            </div>
          </div>
        </SubSection>

      </Section>

      {/* ── SECTION 5 : OPEX ───────────────────────────────────────────────── */}
      <Section title={`5. ${t('OPEX')} — Coûts horaires`}>
        <OpexCostSection opex={opex} />
      </Section>

      <div style={styles.footer}>
        Rapport généré automatiquement — {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 13,
    color: '#222',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '20px 24px',
    backgroundColor: '#fff',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a3a6b',
    borderBottom: '3px solid #4a90e2',
    paddingBottom: 8,
    marginBottom: 24,
  },
  section: {
    marginBottom: 28,
    border: '1px solid #d0daea',
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    background: '#4a90e2',
    margin: 0,
    padding: '8px 14px',
  },
  subSection: {
    padding: '10px 14px',
  },
  subTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a3a6b',
    margin: '0 0 6px 0',
    borderBottom: '1px solid #e0e8f4',
    paddingBottom: 3,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
  },
  kvRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    borderBottom: '1px dotted #e8e8e8',
  },
  kvLabel: {
    color: '#444',
    flex: 1,
  },
  kvValue: {
    fontWeight: 'bold',
    color: '#1a3a6b',
    minWidth: 80,
    textAlign: 'right',
  },
  kvUnit: {
    fontWeight: 'normal',
    color: '#666',
    fontSize: 11,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 11,
    marginBottom: 8,
  },
  th: {
    background: '#eaf0fb',
    border: '1px solid #c5d5ea',
    padding: '4px 6px',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1a3a6b',
  },
  td: {
    border: '1px solid #dde6f0',
    padding: '3px 6px',
    textAlign: 'center',
    color: '#222',
  },
  tdLabel: {
    border: '1px solid #dde6f0',
    padding: '3px 8px',
    textAlign: 'left',
    color: '#333',
    fontStyle: 'italic',
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '4px 0',
  },
  tag: {
    background: '#f0f5ff',
    border: '1px solid #c5d5ea',
    borderRadius: 4,
    padding: '4px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 110,
  },
  tagLabel: {
    fontSize: 10,
    color: '#555',
  },
  tagValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a3a6b',
  },
  footer: {
    marginTop: 24,
    textAlign: 'right',
    fontSize: 11,
    color: '#999',
    borderTop: '1px solid #eee',
    paddingTop: 8,
  },
};

export default FB_Report;
