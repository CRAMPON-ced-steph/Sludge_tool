import React, { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Flow from './Main_FLOW';
import { UnitProvider } from './context/UnitContext';
import { writeDefaultsToStorage, initFromStorage } from './A_Transverse_fonction/opexDataService';

function App() {
  useEffect(() => {
    writeDefaultsToStorage();
    initFromStorage();
  }, []);

  return (
    <UnitProvider>
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </UnitProvider>
  );
}

export default App;
