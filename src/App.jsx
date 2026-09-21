import React, { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Flow from './Main_FLOW';
import { writeDefaultsToStorage, initFromStorage } from './A_Transverse_fonction/opexDataService';

function App() {
  useEffect(() => {
    writeDefaultsToStorage();
    initFromStorage();
  }, []);

  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

export default App;
