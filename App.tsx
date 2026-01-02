
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import MainCanvas from './components/MainCanvas';
import Footer from './components/Footer';
import { GoogleGenAI, Type } from "@google/genai";

export interface Pin {
  id: string;
  label: string;
  x: number; 
  y: number;
  type: 'VCC' | 'GND' | 'SIGNAL';
}

export interface PCBComponent {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  pins: Pin[];
}

export interface PCBRoute {
  id: string;
  fromComp: string;
  fromPin: string;
  toComp: string;
  toPin: string;
  color: string;
  layer: 'top' | 'bottom';
}

const ROUTE_COLORS = [
  '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', 
  '#06b6d4', '#f97316', '#ffffff', '#84cc16', '#6366f1', 
];

const App: React.FC = () => {
  const [components, setComponents] = useState<PCBComponent[]>([]);
  const [routes, setRoutes] = useState<PCBRoute[]>([]);
  const [history, setHistory] = useState<{comps: PCBComponent[], routes: PCBRoute[]}[]>([]);
  const [redoStack, setRedoStack] = useState<{comps: PCBComponent[], routes: PCBRoute[]}[]>([]);
  
  const [aiInput, setAiInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routingStart, setRoutingStart] = useState<{compId: string, pinId: string} | null>(null);
  const [activeLayer, setActiveLayer] = useState<'top' | 'bottom'>('top');
  const [layerMode, setLayerMode] = useState<'single' | 'double'>('double');
  const [isFlipped, setIsFlipped] = useState(false);

  const GRID_SIZE = 25.4; 

  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev, { comps: JSON.parse(JSON.stringify(components)), routes: JSON.parse(JSON.stringify(routes)) }].slice(-30));
    setRedoStack([]);
  }, [components, routes]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(prevStack => [...prevStack, { comps: JSON.parse(JSON.stringify(components)), routes: JSON.parse(JSON.stringify(routes)) }]);
    setComponents(prev.comps);
    setRoutes(prev.routes);
    setHistory(prevHistory => prevHistory.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prevHistory => [...prevHistory, { comps: JSON.parse(JSON.stringify(components)), routes: JSON.parse(JSON.stringify(routes)) }]);
    setComponents(next.comps);
    setRoutes(next.routes);
    setRedoStack(prevStack => prevStack.slice(0, -1));
  };

  const handleSave = () => {
    localStorage.setItem('altopcb_pro_project', JSON.stringify({ components, routes, layerMode }));
    setStatusType('success');
    setAiResponse("PROGRES DISIMPAN: Proyek berhasil disimpan ke penyimpanan lokal.");
    setTimeout(() => setAiResponse(null), 3000);
  };

  const handleResetLayout = () => {
    pushHistory();
    setComponents(prev => prev.map(c => ({
      ...c,
      x: Math.round(c.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(c.y / GRID_SIZE) * GRID_SIZE
    })));
    setStatusType('success');
    setAiResponse("RAPID LAYOUT: Komponen telah disejajarkan pada grid 2.54mm.");
    setTimeout(() => setAiResponse(null), 3000);
  };

  const handleDRCCheck = () => {
    const collisions: string[] = [];
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const c1 = components[i];
        const c2 = components[j];
        const dx = Math.abs(c1.x - c2.x);
        const dy = Math.abs(c1.y - c2.y);
        if (dx < 60 && dy < 90) collisions.push(`${c1.name} & ${c2.name}`);
      }
    }
    if (collisions.length > 0) {
      setStatusType('error');
      setAiResponse(`DRC GAGAL: Tabrakan komponen pada: ${collisions.join(', ')}.`);
    } else {
      setStatusType('success');
      setAiResponse("DRC BERHASIL: Tidak ditemukan tumpang tindih.");
    }
    setTimeout(() => setAiResponse(null), 5000);
  };

  const handleExport = (format: string) => {
    if (format === 'gerber') {
      setStatusType('info');
      setAiResponse("GERBER: Fitur ekspor gerber standar sedang disiapkan.");
      return;
    }
    setStatusType('info');
    setAiResponse(`MENGHASILKAN CETAKAN ${isFlipped ? 'CERMIN ' : ''}${format.toUpperCase()}...`);
    const svgElement = document.getElementById('pcb-svg-canvas') as unknown as SVGSVGElement;
    if (!svgElement) return;

    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("viewBox", "-500 -500 1000 1000");
    clone.setAttribute("width", "1000");
    clone.setAttribute("height", "1000");

    clone.querySelectorAll('.pcb-export-ignore').forEach(el => (el as HTMLElement).style.display = 'none');
    clone.querySelectorAll('.pcb-export-component rect').forEach(el => {
        (el as HTMLElement).style.fill = 'none';
        (el as HTMLElement).style.stroke = 'none';
    });

    clone.querySelectorAll('.pcb-export-route').forEach(el => {
      const path = el as SVGPathElement;
      if (path.getAttribute('data-layer') === activeLayer) {
        path.style.stroke = 'black';
        path.style.opacity = '1';
        path.style.filter = 'none';
      } else {
        path.style.display = 'none';
      }
    });

    clone.querySelectorAll('.pcb-export-pad').forEach(el => {
      (el as SVGCircleElement).style.fill = 'black';
      (el as SVGCircleElement).style.stroke = 'none';
    });
    clone.querySelectorAll('.pcb-export-pad-hole').forEach(el => {
      (el as SVGCircleElement).style.fill = 'white';
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2500; 
      canvas.height = 2500;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (isFlipped) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(img, 0, 0, 2500, 2500);
        const dataUrl = canvas.toDataURL(`image/${format}`, 1.0);
        const link = document.createElement('a');
        link.download = `AltoPCB_Cetak_${activeLayer}_${isFlipped ? 'Flipped_' : ''}${Date.now()}.${format}`;
        link.href = dataUrl;
        link.click();
        setStatusType('success');
        setAiResponse("SIAP CETAK: Gambar monokrom telah diunduh.");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const getSmartRouteColor = (pin1: Pin | undefined, pin2: Pin | undefined, count: number) => {
    if (pin1?.type === 'VCC' || pin2?.type === 'VCC') return '#ef4444'; 
    if (pin1?.type === 'GND' || pin2?.type === 'GND') return '#000000'; 
    return ROUTE_COLORS[count % ROUTE_COLORS.length];
  };

  const handleSendMessage = async () => {
    if (!aiInput.trim() || isProcessing) return;
    setIsProcessing(true);
    pushHistory();
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User: "${aiInput}". Context: ${layerMode.toUpperCase()}, Layer Sekarang: ${activeLayer}.`,
        config: { 
          systemInstruction: `Anda AltoPCB AI. Buat komponen/jalur. JSON format. Actions: ADD_COMP, ADD_ROUTE.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    payload: { type: Type.OBJECT }
                  }
                }
              },
              message: { type: Type.STRING }
            }
          }
        }
      });
      const res = JSON.parse(response.text || '{}');
      let updatedComps = [...components];
      let updatedRoutes = [...routes];
      let successCount = 0;
      if (res.actions) {
        res.actions.forEach((action: any) => {
          if (action.type === 'ADD_COMP' && action.payload.comp) {
            const c = action.payload.comp;
            const newComp: PCBComponent = {
              id: `comp_${Date.now()}_${Math.random()}`,
              name: c.name, type: c.type, x: Math.round(Math.random() * 4) * GRID_SIZE, y: Math.round(Math.random() * 4) * GRID_SIZE, rotation: 0,
              pins: c.pins.map((p: any, i: number) => ({
                id: `pin_${i}`, label: p.label, type: p.type, x: (i % 2 === 0 ? -GRID_SIZE : GRID_SIZE), y: (Math.floor(i / 2) * GRID_SIZE) - GRID_SIZE
              }))
            };
            updatedComps.push(newComp);
            successCount++;
          } else if (action.type === 'ADD_ROUTE' && action.payload.route) {
            const { fromComp, fromPin, toComp, toPin } = action.payload.route;
            const c1 = updatedComps.find(c => c.id === fromComp || c.name.toLowerCase() === fromComp.toLowerCase());
            const c2 = updatedComps.find(c => c.id === toComp || c.name.toLowerCase() === toComp.toLowerCase());
            if (c1 && c2) {
              const p1 = c1.pins.find(p => p.id === fromPin || p.label.toLowerCase() === fromPin.toLowerCase());
              const p2 = c2.pins.find(p => p.id === toPin || p.label.toLowerCase() === toPin.toLowerCase());
              if (p1 && p2) {
                updatedRoutes.push({
                  id: `route_${Date.now()}_${Math.random()}`, fromComp: c1.id, fromPin: p1.id, toComp: c2.id, toPin: p2.id,
                  color: getSmartRouteColor(p1, p2, updatedRoutes.length), layer: layerMode === 'single' ? 'top' : activeLayer
                });
                successCount++;
              }
            }
          }
        });
      }
      setComponents(updatedComps);
      setRoutes(updatedRoutes);
      setStatusType(successCount > 0 ? 'success' : 'info');
      setAiResponse(res.message || "AI memproses permintaan.");
    } catch (e) {
      setAiResponse("AI gagal merespon.");
    } finally {
      setIsProcessing(false);
      setAiInput('');
      setTimeout(() => setAiResponse(null), 5000);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#020617] text-slate-200 overflow-hidden grid-bg">
      <Header 
        onSave={handleSave} onUndo={handleUndo} onRedo={handleRedo} onReset={handleResetLayout} onDRC={handleDRCCheck} onExport={handleExport}
        activeLayer={activeLayer} onToggleLayer={() => layerMode === 'double' && setActiveLayer(l => l === 'top' ? 'bottom' : 'top')}
        layerMode={layerMode} onToggleLayerMode={() => setLayerMode(m => m === 'single' ? 'double' : 'single')}
        isFlipped={isFlipped} onToggleFlip={() => setIsFlipped(!isFlipped)}
      />
      <main className="flex-1 px-4 py-8 relative overflow-hidden flex items-center justify-center">
        <MainCanvas 
          components={components} routes={routes} selectedId={selectedId} routingStart={routingStart} activeLayer={activeLayer} isFlipped={isFlipped}
          onComponentClick={setSelectedId} onComponentMove={(id, x, y) => setComponents(prev => prev.map(c => c.id === id ? { ...c, x, y } : c))}
          onPinClick={(compId, pinId) => {
            if (!routingStart) setRoutingStart({ compId, pinId });
            else {
              if (routingStart.compId === compId && routingStart.pinId === pinId) { setRoutingStart(null); return; }
              pushHistory();
              const c1 = components.find(c => c.id === routingStart.compId);
              const c2 = components.find(c => c.id === compId);
              const p1 = c1?.pins.find(p => p.id === routingStart.pinId);
              const p2 = c2?.pins.find(p => p.id === pinId);
              setRoutes([...routes, { id: `route_${Date.now()}`, fromComp: routingStart.compId, fromPin: routingStart.pinId, toComp: compId, toPin: pinId, color: getSmartRouteColor(p1, p2, routes.length), layer: layerMode === 'single' ? 'top' : activeLayer }]);
              setRoutingStart(null);
            }
          }}
          onRotate={(id) => { pushHistory(); setComponents(prev => prev.map(c => c.id === id ? { ...c, rotation: (c.rotation + 90) % 360 } : c)); }}
          onDelete={(id) => { pushHistory(); setComponents(prev => prev.filter(c => c.id !== id)); setRoutes(prev => prev.filter(r => r.fromComp !== id && r.toComp !== id)); setSelectedId(null); }}
        />
        {(aiResponse || isProcessing) && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 w-full max-w-lg z-20 px-4">
            <div className={`bg-[#0b1425]/95 backdrop-blur-xl border ${statusType === 'success' ? 'border-emerald-500/50' : statusType === 'error' ? 'border-red-500/50' : 'border-white/10'} rounded-2xl p-4 shadow-2xl transition-all duration-300`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isProcessing ? 'animate-pulse bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {isProcessing ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                </div>
                <div className="flex-1"><p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">ALTOPCB ENGINE</p><p className="text-sm font-medium text-slate-200">{aiResponse}</p></div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer value={aiInput} onChange={(e) => setAiInput(e.target.value)} onSend={handleSendMessage} />
    </div>
  );
};

export default App;
