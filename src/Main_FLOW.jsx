/* eslint-disable react/prop-types */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {ReactFlow, Controls, Background, Panel, useNodesState, useEdgesState, addEdge, getIncomers, getOutgoers, getConnectedEdges, useReactFlow} from '@xyflow/react';
import { Eraser } from './C_Components/EraserTool/Eraser';
import '@xyflow/react/dist/style.css';
import DropdownMenu from './C_Components/MenuDeroulant';
import { takeScreenshot } from './H_SaveAndLoad/screenshotUtils';
import Toggle10choice from './F_Gestion_Langues/togglechoice';
import { useUnit } from './context/UnitContext';

import {
  RKMainPage, FBMainPage, WHBMainPage,
  CO2MainPage, CYCLONEMainPage, AIRINJECTIONMainPage, BHFMainPage, IACTMainPage, ELECTROFILTERMainPage,
  REACTORMainPage, STACKMainPage, IDFANMainPage,
  AIRCOOLERMainPage,
  WATERCOOLERMainPage,
  TUBEANDSHELLMainPage,
  SEP12MainPage,
  SEP21MainPage,
} from './C_Components/RetroAndBilanComponents';

import Sidebar from './C_Components/SidebarV1';
import OPEX_form from './OPEX';
import LinearGraph from './G_Graphiques/Combustion_diagramme/LinearGraph';
import DataFlowDisplay from './C_Components/DataFlowDisplay';
import DashboardWindow from './G_Graphiques/Dashboard/Dashboard';
import GlobalReport from './D_BILAN_Rapports/GlobalReport';
const initialNodes = [];
const initialEdges = [];

function FitViewButton() {
  const { fitView } = useReactFlow();
  return (
    <button
      className="fit-btn"
      onClick={() => fitView({ padding: 0.2, duration: 300 })}
      title="Fit canvas to window"
    >
      ⤢ Fit
    </button>
  );
}

function LockScrollButton() {
  const { fitView } = useReactFlow();
  const [locked, setLocked] = React.useState(false);

  const toggle = () => {
    const next = !locked;
    document.documentElement.style.overflow = next ? 'hidden' : '';
    document.body.style.overflow = next ? 'hidden' : '';
    if (next) fitView({ padding: 0.2, duration: 300 });
    setLocked(next);
  };

  return (
    <button
      className={`lock-btn${locked ? ' active' : ''}`}
      onClick={toggle}
      title={locked ? 'Restore scrollbars' : 'Hide scrollbars & fit view'}
    >
      {locked ? '⊠ Locked' : '⊡ Lock'}
    </button>
  );
}

function Flow({
  currentUser,
  adminEmail,
  onShowEmailManagement,
  onLogout
}) {
  const { unitSystem, toggle: toggleUnit } = useUnit();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [headNode, setHeadNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const { fitView } = useReactFlow();
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const id = setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    return () => clearTimeout(id);
  }, [nodes.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const [showDataFlowDisplay, setShowDataFlowDisplay] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showOPEX, setShowOPEX] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveProjectTitle, setSaveProjectTitle] = useState('');

  // Language management state
  const [currentLanguage, setCurrentLanguage] = useState(() => 
    localStorage.getItem('selectedLanguage') || 'fr'
  );
  
  // Fonction pour mettre à jour la langue
  const handleLanguageChange = useCallback((newLanguage) => {
    setCurrentLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  }, []);

  const toggleOPEX = useCallback(() => {
    setShowOPEX(prevShowOPEX => !prevShowOPEX);
  }, []);

  // Sauvegarde des positions originales avant réarrangement vertical
  const savedPositionsRef = useRef(null);

  useEffect(() => {
    if (showDataFlowDisplay) {
      // Sauvegarder les positions actuelles
      setNodes(prevNodes => {
        savedPositionsRef.current = prevNodes.map(n => ({ id: n.id, position: { ...n.position } }));
        // Réarranger en colonne verticale
        return prevNodes.map((node, index) => ({
          ...node,
          position: { x: 40, y: 20 + index * 90 },
        }));
      });
    } else if (savedPositionsRef.current) {
      // Restaurer les positions d'origine
      const saved = savedPositionsRef.current;
      savedPositionsRef.current = null;
      setNodes(prevNodes =>
        prevNodes.map(node => {
          const orig = saved.find(s => s.id === node.id);
          return orig ? { ...node, position: orig.position } : node;
        })
      );
    }
  }, [showDataFlowDisplay, setNodes]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onConnect = useCallback((params) => setEdges((els) => addEdge(params, els)), []);

  const onNodesDelete = useCallback(
    (deleted) => {
      setEdges((currentEdges) =>
        deleted.reduce((acc, node) => {
          const incomers = getIncomers(node, nodes, currentEdges);
          const outgoers = getOutgoers(node, nodes, currentEdges);
          const connectedEdges = getConnectedEdges([node], currentEdges);

          const remainingEdges = acc.filter((edge) => !connectedEdges.includes(edge));
          const createdEdges = incomers.flatMap(({ id: source }) =>
            outgoers.map(({ id: target }) => ({
              id: `${source}->${target}`,
              source,
              target,
            }))
          );

          return [...remainingEdges, ...createdEdges];
        }, currentEdges)
      );
    },
    [nodes]
  );

  const NODE_COLORS = {
    // Four — rouge
    'RK+SCC': { background: '#e53935', color: '#fff' },
    'GF':     { background: '#e53935', color: '#fff' },
    'FB':     { background: '#e53935', color: '#fff' },
    // Récupération d'énergie — orange
    'WHB':             { background: '#fb8c00', color: '#fff' },
    'HX_TubeAndShell': { background: '#fb8c00', color: '#fff' },
    'IACT':            { background: '#fb8c00', color: '#fff' },
    // Traitement sec — gris foncé
    'BHF':          { background: '#757575', color: '#fff' },
    'ELECTROFILTER':{ background: '#757575', color: '#fff' },
    'CYCLONE':      { background: '#757575', color: '#fff' },
    'REACTOR':      { background: '#757575', color: '#fff' },
    'AIRINJECTION': { background: '#757575', color: '#fff' },
    // Échangeurs — rouge clair
    'Cooling_HX_air': { background: '#ffcdd2', color: '#000' },
    'Cooling_HX_eau': { background: '#ffcdd2', color: '#000' },
    // Traitement de l'eau — vert foncé
    'EAU_BRUTE_ENTREE': { background: '#2e7d32', color: '#fff' },
    'BOUE_ENTREE':      { background: '#2e7d32', color: '#fff' },
    'EAU_SORTIE':       { background: '#2e7d32', color: '#fff' },
    'BOUE_SORTIE':      { background: '#2e7d32', color: '#fff' },
    'EPAISSISSEMENT':   { background: '#2e7d32', color: '#fff' },
    'DESHYDRATATION':   { background: '#2e7d32', color: '#fff' },
    'DIGESTEUR':        { background: '#2e7d32', color: '#fff' },
    'EXELYS':           { background: '#2e7d32', color: '#fff' },
    'BIOTHELYS':        { background: '#2e7d32', color: '#fff' },
  };

  const onAddNode = useCallback(
    (label) => {
      const nodeStyle = NODE_COLORS[label] || {};
      const newNode = {
        id: `${nodes.length + 1}`,
        data: { label },
        position: { x: headNode ? headNode.position.x + 200 : 0, y: 100 },
        sourcePosition: 'right',
        targetPosition: 'left',
        type: ['STACK', 'EAU_SORTIE', 'BOUE_SORTIE'].includes(label) ? 'output' : ['RK+SCC', 'GF', 'FB', 'EAU_BRUTE_ENTREE', 'BOUE_ENTREE'].includes(label) ? 'input' : undefined,
        style: nodeStyle.background ? { backgroundColor: nodeStyle.background, color: nodeStyle.color, border: '1px solid rgba(0,0,0,0.15)', borderRadius: '4px' } : undefined,
      };
      setNodes((prevNodes) => [...prevNodes, newNode]);

      if (headNode) {
        setEdges((prevEdges) => [
          ...prevEdges,
          {
            id: `${headNode.id}-${newNode.id}`,
            source: headNode.id,
            target: newNode.id,
            label: (prevEdges.length + 1).toString(),
            type: 'step',
          },
        ]);
      }

      setHeadNode(newNode);
    },
    [nodes, headNode, setNodes, setEdges]
  );

  const onSendData = useCallback(
    (data) => {
      if (selectedNode) {
        const targetNode = nodes.find((node) =>
          edges.some((edge) => edge.source === selectedNode.id && edge.target === node.id)
        );
  
        // Mise à jour du nœud cible avec les résultats
        if (targetNode) {
          setNodes((prevNodes) =>
            prevNodes.map((node) =>
              node.id === targetNode.id
                ? { ...node, data: { ...node.data, result: { ...data.result } } }
                : node
            )
          );
        }

        // Mise à jour du nœud sélectionné avec result + consommationElec
        const elecValue = data.result?.activeNodes_Elec?.[0]?.data?.consommationElec;
        const eauValue = data.result?.activeNodes_Eau?.[0]?.data?.consommationEau;
        const reactifsValue = data.result?.activeNodes_Reactifs?.[0]?.data?.consommationReactifs;
        const energieValue = data.result?.activeNodes_Energie?.[0]?.data?.consommationEnergie;
        const CO2Value = data.result?.activeNodes_CO2?.[0]?.data?.emissionsCO2;
        const coutValue = data.result?.activeNodes_cout?.[0]?.data?.cout;

        setNodes((prevNodes) =>
          prevNodes.map((node) =>
            node.id === selectedNode.id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    result: { ...data.result },
                    ...(data.inputData !== undefined && { inputData: data.inputData }),
                    ...(elecValue !== undefined && { consommationElec: elecValue }),
                    ...(eauValue !== undefined && { consommationEau: eauValue }),
                    ...(reactifsValue !== undefined && { consommationReactifs: reactifsValue }),
                    ...(energieValue !== undefined && { consommationEnergie: energieValue }),
                    ...(CO2Value !== undefined && { emissionsCO2: CO2Value }),
                    ...(coutValue !== undefined && { cout: coutValue }),
                    isActive: true,
                  },
                }
              : node
          )
        );
      }
    },
    [selectedNode, nodes, edges, setNodes]
  );

  const renderParameterTab = () => {
    if (!selectedNode) return null;

    const componentMap = {
      'RK+SCC': RKMainPage,
      FB: FBMainPage,
      WHB: WHBMainPage,
      CO2: CO2MainPage,
      CYCLONE: CYCLONEMainPage,
      AIRINJECTION: AIRINJECTIONMainPage,
      BHF: BHFMainPage,
      IACT: IACTMainPage,
      ELECTROFILTER: ELECTROFILTERMainPage,
      REACTOR: REACTORMainPage,
      STACK: STACKMainPage,
      IDFAN: IDFANMainPage,
      Cooling_HX_air: AIRCOOLERMainPage,
      Cooling_HX_eau: WATERCOOLERMainPage,
      HX_TubeAndShell: TUBEANDSHELLMainPage,
      '2to1': SEP21MainPage,
      '1to2': SEP12MainPage,








    };

    const Component = componentMap[selectedNode.data.label];
    if (!Component) return null;

    return (
      <Component
        key={selectedNode.id}
        title={selectedNode.data.label}
        nodeData={selectedNode.data}
        onSendData={onSendData}
        onGoBack={() => setSelectedNode(null)}
        onClose={() => setSelectedNode(null)}
        currentLanguage={currentLanguage}
      />
    );
  };

  // Function to save the project
  const handleSaveProject = () => {
    setSaveProjectTitle('');
    setShowSaveDialog(true);
  };

  const confirmSaveProject = async () => {
    const projectData = { nodes, edges, selectedNode, currentLanguage };
    const json = JSON.stringify(projectData, null, 2);
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const safeName = saveProjectTitle.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_') || 'projet';
    const filename = `${yyyy}_${mm}_${dd}_${safeName}.json`;

    if (window.showSaveFilePicker) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(json);
        await writable.close();
        setShowSaveDialog(false);
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      }
    } else {
      // Fallback navigateurs sans File System Access API
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowSaveDialog(false);
    }
  };

  // Function to load the project
  const handleLoadProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
   
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const projectData = JSON.parse(event.target.result);
            const restoredNodes = (projectData.nodes || []).map(n => {
              const nodeStyle = NODE_COLORS[n.data?.label] || {};
              return nodeStyle.background
                ? { ...n, style: { ...n.style, backgroundColor: nodeStyle.background, color: nodeStyle.color, border: '1px solid rgba(0,0,0,0.15)', borderRadius: '4px' } }
                : n;
            });
            setNodes(restoredNodes);
            setEdges(projectData.edges || []);
            setSelectedNode(projectData.selectedNode);
            
            // Load language from project if available
            if (projectData.currentLanguage) {
              setCurrentLanguage(projectData.currentLanguage);
              localStorage.setItem('selectedLanguage', projectData.currentLanguage);
            }
          } catch (error) {
            console.error('Error loading project:', error);
            alert('Error loading project file. Please ensure it is a valid project configuration.');
          }
        };
        reader.readAsText(file);
      }
    };
   
    input.click();
  };

  const handleScreenshot = useCallback(async () => {
    try {
      await takeScreenshot();
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  }, []);

  const [showRapportEditor, setShowRapportEditor] = useState(false);
  const handleEditRapport = useCallback(() => {
    setShowRapportEditor(prev => !prev);
  }, []);

  return (
    <>
    <div className="app-banner">
      <span>BIOSOLIDS INCINERATION DESIGN TOOL</span>
      <button
        onClick={toggleUnit}
        className="unit-toggle-btn"
        title={unitSystem === 'SI' ? 'Switch to US customary units' : 'Switch to SI units'}
      >
        {unitSystem === 'SI' ? '🇺🇸 US units' : '🇪🇺 SI units'}
      </button>
    </div>
    <div className="Zone-fond-blanc">
      <Sidebar onAddNode={onAddNode} currentLanguage={currentLanguage} />
      
      <DropdownMenu
        currentUser={currentUser}
        adminEmail={adminEmail}
        showDataFlowDisplay={showDataFlowDisplay}
        showGraph={showGraph}
        showOPEX={showOPEX}
        onToggleDataFlow={() => setShowDataFlowDisplay(!showDataFlowDisplay)}
        onToggleGraph={() => setShowGraph(!showGraph)}
        onShowDashboard={() => setShowDashboard(true)}
        onShowEmailManagement={onShowEmailManagement}
        onToggleOPEX={toggleOPEX}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        onLogout={onLogout}
        onScreenshot={handleScreenshot}
        onEditRapport={handleEditRapport}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />

      <div
        className="relative-flex-container"
        style={showDataFlowDisplay ? { flex: '0 0 280px', minWidth: 0 } : {}}
      >
        <div className="btn-position">
          <Toggle10choice
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={isEraserActive ? undefined : onNodeClick}
          onNodesChange={onNodesChange}
          onNodesDelete={onNodesDelete}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="top-right"
          style={{ backgroundColor: '#F7F9FB' }}
        >
          <Background />
          <Controls />
          <Panel position="top-left">
            <button
              className="reset-btn"
              onClick={() => { if (window.confirm('Réinitialiser ? Toutes les données non sauvegardées seront perdues.')) window.location.reload(); }}
              title="Reset — recharge la page"
            >
              ↺ Reset
            </button>
            <button
              className={`eraser-btn${isEraserActive ? ' active' : ''}`}
              onClick={() => setIsEraserActive((v) => !v)}
            >
              🧹 Erase
            </button>
            <FitViewButton />
            <LockScrollButton />
          </Panel>
          {isEraserActive && <Eraser />}
        </ReactFlow>
      </div>

      {showDataFlowDisplay && (
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0, height: '100%' }}>
          <DataFlowDisplay
            nodes={nodes}
            currentLanguage={currentLanguage}
            onClose={() => setShowDataFlowDisplay(false)}
          />
        </div>
      )}
      
      {showGraph && (
        <LinearGraph
          currentLanguage={currentLanguage}
          onClose={() => setShowGraph(false)}
        />
      )}
      
      {renderParameterTab()}
      
      {showDashboard && (
        <DashboardWindow 
          onClose={() => setShowDashboard(false)}
          nodes={nodes}
          currentLanguage={currentLanguage}
        />
      )}   

      {showOPEX && (
        <OPEX_form
          onClose={() => setShowOPEX(false)}
          currentLanguage={currentLanguage}
        />
      )}

      {showRapportEditor && (
        <GlobalReport
          nodes={nodes}
          onClose={() => setShowRapportEditor(false)}
        />
      )}

      {/* Modal sauvegarde projet */}
      {showSaveDialog && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        }}>
          <div style={{
            background: 'white', borderRadius: '8px', padding: '28px 32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', minWidth: '340px',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1a3a6b' }}>
              Sauvegarder le projet
            </h3>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>
              Titre du projet
            </label>
            <input
              type="text"
              value={saveProjectTitle}
              onChange={(e) => setSaveProjectTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmSaveProject(); if (e.key === 'Escape') setShowSaveDialog(false); }}
              placeholder="ex : four_RK_site_A"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px',
                marginBottom: '8px',
              }}
            />
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '18px' }}>
              {(() => {
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const safe = saveProjectTitle.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_') || 'projet';
                return `Fichier : ${yyyy}_${mm}_${dd}_${safe}.json`;
              })()}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{ padding: '7px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '13px' }}
              >
                Annuler
              </button>
              <button
                onClick={confirmSaveProject}
                style={{ padding: '7px 16px', border: 'none', borderRadius: '4px', background: '#1a3a6b', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default Flow;


