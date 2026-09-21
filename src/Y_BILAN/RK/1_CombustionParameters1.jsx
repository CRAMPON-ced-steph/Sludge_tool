import React, { useState, useEffect } from 'react';
import { cv_kj, cv_waste } from '../../A_Transverse_fonction/bilan_fct_combustion';
import { getLanguageCode } from '../../F_Gestion_Langues/Fonction_Traduction';
import { translations } from './RK_traduction';

const CombustionParameters = ({ innerData, currentLanguage = 'fr' }) => {
  // Get translations
  const languageCode = getLanguageCode(currentLanguage);
  const t = (key) => translations[languageCode]?.[key] || translations['fr']?.[key] || key;

  const columns = [
    'Masse [kg/h]',
    'C%',
    'H%',
    'O%',
    'N%',
    'S%',
    'Cl%',
    'SUM1',
    '%Comb',
    '%Water',
    '%Inert',
    'SUM2',
    'Comb CV [kJ/kg]',
    'Waste CV [kJ/kg]',
    'Waste CV [kcal/kg]',
  ];

  const rows = [
    { name: 'HCV', data: {} },
    { name: 'LCV', data: {} },
    { name: 'MCV', data: {} },
    { name: 'Packed waste', data: {} },
    { name: 'Direct lines', data: {} },
    { name: 'Solids', data: {} },
    { name: 'Gas/Fuel', data: {} },
    { name: 'Various', data: {} },
  ];

  const defaultValues = [
    // HCV
    {
      'Masse [kg/h]': 1,
      'C%': 80,
      'H%': 10,
      'O%': 5,
      'N%': 2.5,
      'S%': 2.1,
      'Cl%': 0.4,
      'SUM1': 100,
      '%Comb': 85,
      '%Water': 15,
      '%Inert': 0,
      'SUM2': 100,
      'Comb CV [kJ/kg]': 200,
      'Waste CV [kJ/kg]': 100,
      'Waste CV [kcal/kg]': 100,
    },
    // LCV
    {
      'Masse [kg/h]': 2,
      'C%': 80,
      'H%': 10,
      'O%': 5,
      'N%': 2,
      'S%': 0,
      'Cl%': 3,
      'SUM1': 100,
      '%Comb': 15,
      '%Water': 85,
      '%Inert': 0,
      'SUM2': 0,
      'Comb CV [kJ/kg]': 100,
      'Waste CV [kJ/kg]': 0,
      'Waste CV [kcal/kg]': 0,
    },
    // MCV
    {
      'Masse [kg/h]': 3,
      'C%': 80,
      'H%': 10,
      'O%': 5.5,
      'N%': 3,
      'S%': 0,
      'Cl%': 1.5,
      'SUM1': 100,
      '%Comb': 52.5,
      '%Water': 47.5,
      '%Inert': 0,
      'SUM2': 0,
      'Comb CV [kJ/kg]': 100,
      'Waste CV [kJ/kg]': 0,
      'Waste CV [kcal/kg]': 0,
    },
    // Packaged waste
    {
      'Masse [kg/h]': 4,
      'C%': 60,
      'H%': 5,
      'O%': 21,
      'N%': 10,
      'S%': 1,
      'Cl%': 3,
      'SUM1': 100,
      '%Comb': 80,
      '%Water': 5,
      '%Inert': 15,
      'SUM2': 0,
      'Comb CV [kJ/kg]': 100,
      'Waste CV [kJ/kg]': 0,
      'Waste CV [kcal/kg]': 0,
    },
    // Direct lines
    {
      'Masse [kg/h]': 5,
      'C%': 60,
      'H%': 5,
      'O%': 21,
      'N%': 10,
      'S%': 1,
      'Cl%': 3,
      'SUM1': 100,
      '%Comb': 90,
      '%Water': 10,
      '%Inert': 0,
      'SUM2': 0,
      'Comb CV [kJ/kg]': 100,
      'Waste CV [kJ/kg]': 0,
      'Waste CV [kcal/kg]': 0,
    },
    // Solids
    {
      'Masse [kg/h]': 6,
      'C%': 60,
      'H%': 5,
      'O%': 21,
      'N%': 10,
      'S%': 1,
      'Cl%': 3,
      'SUM1': 100,
      '%Comb': 25,
      '%Water': 70,
      '%Inert': 5,
      'SUM2': 0,
      'Comb CV [kJ/kg]': 100,
      'Waste CV [kJ/kg]': 0,
      'Waste CV [kcal/kg]': 0,
    },
    // Gas/Fuel
    {
      'Masse [kg/h]': 7,
      'C%': 60,
      'H%': 5,
      'O%': 21,
      'N%': 10,
      'S%': 1,
      'Cl%': 3,
      'SUM1': 100,
      '%Comb': 100,
      '%Water': 0,
      '%Inert': 0,
      'SUM2': 0,
      'Comb CV [kJ/kg]': 100,
      'Waste CV [kJ/kg]': 0,
      'Waste CV [kcal/kg]': 0,
    },
    // Various
    {
      'Masse [kg/h]': 8,
      'C%': 60,
      'H%': 5,
      'O%': 21,
      'N%': 10,
      'S%': 1,
      'Cl%': 3,
      'SUM1': 100,
      '%Comb': 90,
      '%Water': 10,
      '%Inert': 0,
      'SUM2': 0,
      'Comb CV [kJ/kg]': 100,
      'Waste CV [kJ/kg]': 0,
      'Waste CV [kcal/kg]': 0,
    },
  ];

  const saveToLocalStorage = (data) => {
    localStorage.setItem('combustionParameters', JSON.stringify(data));
  };

  const loadFromLocalStorage = () => {
    const savedData = localStorage.getItem('combustionParameters');
    return savedData ? JSON.parse(savedData) : null;
  };

  const [parameters, setParameters] = useState(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      return savedData;
    }
    return rows.map((row, index) => ({...row, data: defaultValues[index] || {}}));
  });

  const calculateSum = (rowData, keys) => {
    return keys.reduce((sum, key) => sum + (rowData[key] || 0), 0);
  };

  const calculateRowSum = (rowData) => calculateSum(rowData, ['C%', 'H%', 'O%', 'N%', 'S%', 'Cl%']);
  const calculateRowSum2 = (rowData) => calculateSum(rowData, ['%Comb', '%Water', '%Inert']);

  const updateRow = (rowData) => {
    rowData['SUM1'] = calculateRowSum(rowData);
    rowData['SUM2'] = calculateRowSum2(rowData);
    rowData['Comb CV [kJ/kg]'] = cv_kj(
      rowData['C%'],
      rowData['H%'],
      rowData['O%'],
      rowData['N%'],
      rowData['S%'],
      rowData['Cl%']
    ).toFixed(1);
    rowData['Waste CV [kJ/kg]'] = cv_waste(
      rowData['Comb CV [kJ/kg]'],
      rowData['%Comb'],
      rowData['%Water']
    ).toFixed(1);
    rowData['Waste CV [kcal/kg]'] = (rowData['Waste CV [kJ/kg]'] / 4.1868).toFixed(1);
    return rowData;
  };

  const columns2 = [
    'Masse totale [kg/h]',
    'C [kg/h]',
    'H [kg/h]',
    'O [kg/h]',
    'N [kg/h]',
    'S [kg/h]',
    'Cl [kg/h]',
    'SUM tot',
    'Comb  [kg/h]',
    'Water  [kg/h]',
    'Inert  [kg/h]',
    'SUM2 tot',
    'Comb CV tot [kJ/kg]',
    'Waste CV tot [kJ/kg]',
    'Waste CV tot [kcal/kg]',
  ];

  const rows2 = [
    { name: 'Masse [kg/h]', data: {} },
    { name: 'Masse [%]', data: {} },
    { name: 'Mix [%]', data: {} },
    { name: 'kmoles', data: {} },
    { name: 'O2stoechio', data: {} },
    { name: 'H2Ostoechio', data: {} },
  ];

  const [parameters2, setParameters2] = useState(rows2);
  const [totalMasse, setTotalMasse] = useState(rows2);
  const [C_moles, setCmoles] = useState(rows2);
  const [H_moles, setHmoles] = useState(rows2);
  const [O_moles, setOmoles] = useState(rows2);
  const [N_moles, setNmoles] = useState(rows2);
  const [S_moles, setSmoles] = useState(rows2);
  const [Cl_moles, setClmoles] = useState(rows2);

  const [C, set] = useState(rows2);
  const [H, set_H] = useState(rows2);
  const [O, set_O] = useState(rows2);
  const [N, set_N] = useState(rows2);
  const [S, set_S] = useState(rows2);
  const [Cl, set_Cl] = useState(rows2);

  const [Comb, set_Comb] = useState(rows2);
  const [Water, set_Water] = useState(rows2);
  const [Inert, set_Inert] = useState(rows2);

  const [Masse_H2O_comb_input, setH2OmasseCombInput] = useState(rows2);

  const updateSecondTable = () => {
    const updatedRows2 = [...parameters2];
    
    const totalMass = parameters.reduce((sum, row) => sum + (row.data['Masse [kg/h]'] || 0), 0);
    setTotalMasse(totalMass)

    columns2.forEach(col => {
      if (col === 'Masse totale [kg/h]') {
        updatedRows2[0].data[col] = totalMass;
        updatedRows2[1].data[col] = totalMass !== 0 ? 100 : 0;
      } 
      else if (['C [kg/h]','H [kg/h]', 'O [kg/h]', 'N [kg/h]', 'S [kg/h]', 'Cl [kg/h]'].includes(col)) 
      {
        const element = col.split(' ')[0];
        const total = parameters.reduce((sum, row) => sum + (row.data['Masse [kg/h]'] || 0) * (row.data[element + '%'] || 0)/100 * (row.data['%Comb'] || 0) / 100, 0);
        updatedRows2[0].data[col] = total;
        updatedRows2[1].data[col] = totalMass !== 0 ? (total / totalMass) * 100 : 0;
        updatedRows2[2].data[col] = updatedRows2[0].data['Comb  [kg/h]'] !== 0 ? (updatedRows2[0].data[col]) / (updatedRows2[0].data['Comb  [kg/h]']) * 100 : 0;

        if (updatedRows2.length < 6) return;
        updatedRows2[3].data['C [kg/h]'] = updatedRows2[0].data['C [kg/h]'] / 12.01;
        updatedRows2[3].data['H [kg/h]'] = updatedRows2[0].data['H [kg/h]'] / 2.016;
        updatedRows2[3].data['O [kg/h]'] = updatedRows2[0].data['O [kg/h]'] / 16/2;
        updatedRows2[3].data['N [kg/h]'] = updatedRows2[0].data['N [kg/h]'] / 14.007/2;
        updatedRows2[3].data['S [kg/h]'] = updatedRows2[0].data['S [kg/h]'] / 32.066;
        updatedRows2[3].data['Cl [kg/h]'] = updatedRows2[0].data['Cl [kg/h]'] / 35.45;

        setCmoles (updatedRows2[3].data['C [kg/h]'])
        setHmoles (updatedRows2[3].data['H [kg/h]'])
        setOmoles (updatedRows2[3].data['O [kg/h]'])
        setNmoles (updatedRows2[3].data['N [kg/h]'])
        setSmoles (updatedRows2[3].data['S [kg/h]'])
        setClmoles (updatedRows2[3].data['Cl [kg/h]'])

        set (updatedRows2[0].data['C [kg/h]'])
        set_H (updatedRows2[0].data['H [kg/h]'])
        set_O (updatedRows2[0].data['O [kg/h]'])
        set_N (updatedRows2[0].data['N [kg/h]'])
        set_S (updatedRows2[0].data['S [kg/h]'])
        set_Cl (updatedRows2[0].data['Cl [kg/h]'])

        set_Comb (updatedRows2[0].data['Comb  [kg/h]'])
        set_Water (updatedRows2[0].data['Water  [kg/h]'])
        set_Inert (updatedRows2[0].data['Inert  [kg/h]'])

        const coeff_O2_stoechio = {C :1 , H : 0.5, O : -1, N :0,S : 1, Cl : -0.5}
        updatedRows2[4].data[col] = updatedRows2[3].data[col]  * coeff_O2_stoechio[element];
        updatedRows2[5].data['C [kg/h]'] =   0;
        updatedRows2[5].data['H [kg/h]'] =    updatedRows2[3].data['H [kg/h]'] ;
        updatedRows2[5].data['O [kg/h]'] =0;
        updatedRows2[5].data['N [kg/h]'] = 0;
        updatedRows2[5].data['S [kg/h]'] = 0;
        updatedRows2[5].data['Cl [kg/h]'] = 0;

        const O2_stoechio_kmoles = updatedRows2[4].data['C [kg/h]'] + updatedRows2[4].data['H [kg/h]'] + updatedRows2[4].data['O [kg/h]'] + updatedRows2[4].data['N [kg/h]'] + updatedRows2[4].data['S [kg/h]'] + updatedRows2[4].data['Cl [kg/h]'];
        updatedRows2[4].data['Masse totale [kg/h]'] = O2_stoechio_kmoles;

        const H2O_stoechio_kmoles = updatedRows2[5].data['H [kg/h]'];
        updatedRows2[5].data['Masse totale [kg/h]'] = H2O_stoechio_kmoles;

      } else if (['Comb  [kg/h]', 'Water  [kg/h]', 'Inert  [kg/h]'].includes(col)) {
        const element = col.split('  ')[0];
        const total = parameters.reduce((sum, row) => sum + (row.data['Masse [kg/h]'] || 0) * (row.data['%' + element] || 0) / 100, 0);
        updatedRows2[0].data[col] = total;
      }
    });

    updatedRows2[0].data['SUM tot'] = ['C [kg/h]', 'H [kg/h]', 'O [kg/h]', 'N [kg/h]', 'S [kg/h]', 'Cl [kg/h]']
      .reduce((sum, key) => sum + (updatedRows2[0].data[key] || 0), 0);
    
    updatedRows2[1].data['SUM tot'] = ['C [kg/h]', 'H [kg/h]', 'O [kg/h]', 'N [kg/h]', 'S [kg/h]', 'Cl [kg/h]']
    .reduce((sum, key) => sum + (updatedRows2[1].data[key] || 0), 0);
    updatedRows2[2].data['SUM tot'] = ['C [kg/h]', 'H [kg/h]', 'O [kg/h]', 'N [kg/h]', 'S [kg/h]', 'Cl [kg/h]']
    .reduce((sum, key) => sum + (updatedRows2[2].data[key] || 0), 0);

    updatedRows2[0].data['SUM2 tot'] = ['Comb  [kg/h]', 'Water  [kg/h]', 'Inert  [kg/h]']
      .reduce((sum, key) => sum + (updatedRows2[0].data[key] || 0), 0);
    updatedRows2[1].data['Comb  [kg/h]'] = totalMass !== 0 ? (updatedRows2[0].data['Comb  [kg/h]']*100) / totalMass : 0;
    updatedRows2[1].data['Water  [kg/h]'] = totalMass !== 0 ? (updatedRows2[0].data['Water  [kg/h]']*100) / totalMass : 0;
    updatedRows2[1].data['Inert  [kg/h]'] = totalMass !== 0 ? (updatedRows2[0].data['Inert  [kg/h]']*100) / totalMass : 0;
  
    updatedRows2[1].data['SUM2 tot'] = ['Comb  [kg/h]', 'Water  [kg/h]', 'Inert  [kg/h]']
    .reduce((sum, key) => sum + (updatedRows2[1].data[key] || 0), 0);
  
    const totalCombMass = updatedRows2[0].data['Comb  [kg/h]'] || 0;
    const totalWaterMass = updatedRows2[0].data['Water  [kg/h]'] || 0;
    setH2OmasseCombInput(totalWaterMass)

    const cv = cv_kj(
      updatedRows2[2].data['C [kg/h]'] || 0,
      updatedRows2[2].data['H [kg/h]'] || 0,
      updatedRows2[2].data['O [kg/h]'] || 0,
      updatedRows2[2].data['N [kg/h]'] || 0,
      updatedRows2[2].data['S [kg/h]'] || 0,
      updatedRows2[2].data['Cl [kg/h]'] || 0
    );

    updatedRows2[2].data['Comb CV tot [kJ/kg]'] = cv;
    updatedRows2[2].data['Waste CV tot [kJ/kg]'] = totalMass !== 0 ? cv_waste(
      updatedRows2[2].data['Comb CV tot [kJ/kg]'],
      (totalCombMass / totalMass) * 100,
      (totalWaterMass / totalMass) * 100
    ) : 0;
    
    updatedRows2[2].data['Waste CV tot [kcal/kg]'] = updatedRows2[2].data['Waste CV tot [kJ/kg]'] / 4.1868;
  
    setParameters2(updatedRows2);
  };

  useEffect(() => {
    const updatedRows = parameters.map(row => ({...row, data: updateRow({...row.data})}));
    setParameters(updatedRows);
    updateSecondTable();
    saveToLocalStorage(updatedRows);
  }, [parameters]);
  
  useEffect(() => {
    updateInnerData();
  }, [parameters, parameters2]);

  const updateInnerData = () => {
    innerData['O2_stoechio_kmoles'] = parameters2[4].data['Masse totale [kg/h]'] || 0;
    innerData['H2O_stoechio_kmoles'] = parameters2[5].data['Masse totale [kg/h]'] || 0;
    innerData['cv'] = parameters2[2].data['Comb CV tot [kJ/kg]'] || 0;
    innerData['cvw'] = parameters2[2].data['Waste CV tot [kJ/kg]'] || 0;
    innerData['cvw'] = parameters2[2].data['Waste CV tot [kcal/kg]'] || 0;
    innerData['masse'] = totalMasse;
    innerData['masse_eau_input'] =Masse_H2O_comb_input;

    innerData['Cmoles'] = C_moles ;
    innerData['Hmoles'] = H_moles ;
    innerData['Omoles'] = O_moles ;
    innerData['Nmoles'] = N_moles ;
    innerData['Smoles'] = S_moles ;
    innerData['Clmoles'] = Cl_moles ;

    innerData['Cmass'] = C ;
    innerData['Hmass'] = H ;
    innerData['Omass'] = O ;
    innerData['Nmass'] = N ;
    innerData['Smass'] = S ;
    innerData['Clmass'] = Cl ;

    innerData['Combmass'] = Comb ;
    innerData['Watermass'] = Water ;
    innerData['Inertmass'] = Inert ;
  };
  
  const updateCell = (rowIndex, column, value) => {
    if (column === 'Masse [kg/h]') {
      if (value < 0) return;
    } else {
      if (value < 0 || value > 100) return;
    }
    
    const updatedRows = [...parameters];
    updatedRows[rowIndex].data[column] = parseFloat(value) || 0;
    updatedRows[rowIndex].data = updateRow(updatedRows[rowIndex].data);
    setParameters(updatedRows);
    saveToLocalStorage(updatedRows);
  };
  
  const resetToDefault = () => {
    const defaultRows = rows.map((row, index) => ({...row, data: defaultValues[index] || {}}));
    setParameters(defaultRows);
    saveToLocalStorage(defaultRows);
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '3000px', margin: '0 auto' }}>
      <button onClick={resetToDefault} style={{marginBottom: '10px'}}>
        {t('resetDefaultValues')}
      </button>
      {/* Premier tableau */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <div style={{ width: '100px', flexShrink: 0 }}></div>
          {columns.map((col, colIndex) => (
            <div
              key={colIndex}
              style={{
                width: '80px',
                flexShrink: 0,
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '12px',
                wordBreak: 'break-word',
              }}
            >
              {col}
            </div>
          ))}
        </div>
        {parameters.map((row, rowIndex) => {
          const rowBg = rowIndex % 2 === 1 ? '#e0f7fa' : 'transparent';
          return (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '2px',
                backgroundColor: rowBg,
                borderRadius: '3px',
              }}
            >
              <div style={{ width: '100px', flexShrink: 0, textAlign: 'left' }}>
                <h3 style={{ margin: '0', fontSize: '14px' }}>{row.name}</h3>
              </div>
              {columns.map((col, colIndex) => {
                const isSum = col === 'SUM1' || col === 'SUM2';
                const isCalc = isSum || col === 'Comb CV [kJ/kg]' || col === 'Waste CV [kJ/kg]' || col === 'Waste CV [kcal/kg]';
                const val = row.data[col] !== undefined ? row.data[col] : 0;
                const sumInvalid = isSum && Math.abs(parseFloat(val) - 100) > 0.01;
                let cellBg;
                if (sumInvalid) cellBg = '#ef9a9a';
                else if (isCalc) cellBg = '#f9f9f9';
                else cellBg = 'transparent';
                return (
                  <div
                    key={colIndex}
                    style={{ width: '80px', flexShrink: 0, textAlign: 'center' }}
                  >
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                      disabled={isCalc}
                      min="0"
                      max={col === 'Masse [kg/h]' ? undefined : '100'}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '6px',
                        border: sumInvalid ? '1px solid #e53935' : '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: cellBg,
                        fontWeight: sumInvalid ? 'bold' : 'normal',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
  
      {/* Deuxième tableau */}
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          <div style={{ width: '100px', flexShrink: 0 }}></div>
          {columns2.map((col, colIndex) => (
            <div
              key={colIndex}
              style={{
                width: '80px',
                flexShrink: 0,
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '12px',
                wordBreak: 'break-word',
              }}
            >
              {col}
            </div>
          ))}
        </div>
        {parameters2.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '2px',
            }}
          >
            <div style={{ width: '100px', flexShrink: 0, textAlign: 'left' }}>
              <h3 style={{ margin: '0', fontSize: '14px' }}>{row.name}</h3>
            </div>
            {columns2.map((col, colIndex) => (
              <div
                key={colIndex}
                style={{
                  width: '80px',
                  flexShrink: 0,
                  textAlign: 'center',
                }}
              >
                <input
                  type="number"
                  value={row.data[col] !== undefined ? row.data[col].toFixed(3) : ''}
                  readOnly
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: '#f9f9f9',
                    textAlign: 'center',
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
  
export default CombustionParameters;