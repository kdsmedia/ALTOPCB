
import React, { useState, useRef, useEffect } from 'react';
import { PCBComponent, PCBRoute } from '../App';

interface MainCanvasProps {
  components: PCBComponent[];
  routes: PCBRoute[];
  selectedId: string | null;
  routingStart: { compId: string, pinId: string } | null;
  activeLayer: 'top' | 'bottom';
  onComponentClick: (id: string | null) => void;
  onComponentMove: (id: string, x: number, y: number) => void;
  onPinClick: (compId: string, pinId: string) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  isFlipped: boolean;
}

const MainCanvas: React.FC<MainCanvasProps> = ({ 
  components, routes, selectedId, routingStart, activeLayer,
  onComponentClick, onComponentMove, onPinClick, onRotate, onDelete, isFlipped
}) => {
  const [scale, setScale] = useState(1.5);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState<'none' | 'panning' | 'component'>('none');
  const [activeCompId, setActiveCompId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  
  const GRID_SIZE = 25.4; 

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };

    const compEl = target.closest('.comp-interactive');
    
    if (compEl) {
      const compId = compEl.getAttribute('data-comp-id');
      if (compId) {
        setDragMode('component');
        setActiveCompId(compId);
        onComponentClick(compId);
      }
    } else {
      setDragMode('panning');
      onComponentClick(null);
    }
    
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === 'none') return;

    // DX harus dibalik jika sedang dalam mode Flip agar pergerakan mouse natural
    let dx = e.clientX - lastPointerPos.current.x;
    const dy = e.clientY - lastPointerPos.current.y;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };

    if (dragMode === 'panning') {
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (dragMode === 'component' && activeCompId) {
      const comp = components.find(c => c.id === activeCompId);
      if (comp) {
        // Balik arah pergerakan horizontal jika sedang flipped
        const moveX = isFlipped ? -dx : dx;
        onComponentMove(activeCompId, comp.x + moveX / scale, comp.y + dy / scale);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDragMode('none');
    setActiveCompId(null);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(0.1, prev * delta), 10));
  };

  const getPinPos = (compId: string, pinId: string) => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return { x: 0, y: 0 };
    const pin = comp.pins.find(p => p.id === pinId);
    if (!pin) return { x: 0, y: 0 };
    
    const rad = (comp.rotation * Math.PI) / 180;
    const rx = pin.x * Math.cos(rad) - pin.y * Math.sin(rad);
    const ry = pin.x * Math.sin(rad) + pin.y * Math.cos(rad);
    
    return { x: comp.x + rx, y: comp.y + ry };
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-[#11240a] rounded-xl border-2 border-[#2c4a1e] relative shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] overflow-hidden touch-none ${dragMode === 'panning' ? 'cursor-grabbing' : 'cursor-grab'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ 
          backgroundImage: `radial-gradient(#fbbf24 1.2px, transparent 1.2px)`, 
          backgroundSize: `${GRID_SIZE * scale}px ${GRID_SIZE * scale}px`,
          backgroundPosition: `${offset.x + (containerRef.current?.offsetWidth || 0) / 2}px ${offset.y + (containerRef.current?.offsetHeight || 0) / 2}px`
        }} 
      />

      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, 
          transformOrigin: 'center' 
        }}
      >
        <svg id="pcb-svg-canvas" className="absolute w-[10000px] h-[10000px] pointer-events-none overflow-visible">
          {/* Group wrapper untuk menangani Flipping Horizontal */}
          <g transform={isFlipped ? "scale(-1, 1)" : ""}>
            {routes.map(route => {
              const start = getPinPos(route.fromComp, route.fromPin);
              const end = getPinPos(route.toComp, route.toPin);
              return (
                <path 
                  key={route.id} 
                  d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`} 
                  stroke={route.color} 
                  strokeWidth={3 / scale + 1.8} 
                  strokeLinecap="round"
                  fill="none" 
                  opacity={route.layer === activeLayer ? 1 : 0.1} 
                  className={`pcb-export-route transition-opacity duration-300 drop-shadow-[0_0_3px_rgba(255,255,255,0.2)]`}
                  data-layer={route.layer}
                />
              );
            })}

            {components.map(comp => (
              <g key={comp.id} className="pcb-export-component" transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}>
                <rect 
                  data-comp-id={comp.id}
                  className={`comp-interactive cursor-move pointer-events-auto transition-all ${selectedId === comp.id ? 'stroke-white stroke-[2.5px]' : 'stroke-white/10'}`}
                  x="-30" y="-45" width="60" height="90" rx="4" fill="#0f172a" 
                />
                
                <text className="pcb-export-ignore uppercase tracking-widest" y="-52" textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="monospace" pointerEvents="none" transform={isFlipped ? "scale(-1, 1)" : ""}>{comp.name}</text>
                <text className="pcb-export-ignore" y="58" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace" pointerEvents="none" transform={isFlipped ? "scale(-1, 1)" : ""}>{comp.type}</text>

                {comp.pins.map(pin => (
                  <g 
                    key={pin.id} 
                    transform={`translate(${pin.x}, ${pin.y})`} 
                    className="cursor-pointer group pointer-events-auto" 
                    onClick={(e) => { e.stopPropagation(); onPinClick(comp.id, pin.id); }}
                  >
                    <circle r="6.5" fill="#d4af37" className="pcb-export-pad group-hover:fill-white transition-colors" />
                    <circle r="2.5" fill="#111" className="pcb-export-pad-hole" />
                    {routingStart?.compId === comp.id && routingStart.pinId === pin.id && (
                      <circle r="10" stroke="#22c55e" strokeWidth="2.5" fill="none" className="animate-ping pcb-export-ignore" />
                    )}
                    <text 
                      x={pin.x > 0 ? 12 : -12} y="3.5" 
                      textAnchor={pin.x > 0 ? (isFlipped ? 'end' : 'start') : (isFlipped ? 'start' : 'end')} 
                      fill={pin.type === 'VCC' ? '#ef4444' : pin.type === 'GND' ? '#71717a' : '#fbbf24'} 
                      fontSize="7" fontWeight="bold" fontFamily="monospace" pointerEvents="none"
                      className="pcb-export-ignore"
                      transform={isFlipped ? "scale(-1, 1)" : ""}
                    >
                      {pin.label}
                    </text>
                  </g>
                ))}

                {selectedId === comp.id && (
                  <g className="pcb-export-ignore" transform={`translate(0, -${90 / scale + 15}) scale(${1/scale + 0.45}) ${isFlipped ? "scale(-1, 1)" : ""}`}>
                    <rect x="-48" y="-20" width="96" height="36" rx="10" fill="#020617" stroke="white/10" strokeWidth="1" />
                    <g className="cursor-pointer hover:opacity-80 pointer-events-auto" onClick={(e) => { e.stopPropagation(); onRotate(comp.id); }}>
                      <circle cx="-24" cy="-2" r="12" fill="#3b82f6" />
                      <path d="M-28 -2 A 4 4 0 1 1 -20 -2" stroke="white" strokeWidth="2" fill="none" />
                    </g>
                    <g className="cursor-pointer hover:opacity-80 pointer-events-auto" onClick={(e) => { e.stopPropagation(); onDelete(comp.id); }}>
                      <circle cx="24" cy="-2" r="12" fill="#ef4444" />
                      <path d="M20 -6 L28 2 M28 -6 L20 2" stroke="white" strokeWidth="2" />
                    </g>
                  </g>
                )}
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="absolute bottom-6 right-6 flex flex-col gap-2 pcb-export-ignore">
        <div className="flex flex-col bg-[#0b1425]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-1">
          <button onClick={() => setScale(s => Math.min(s * 1.2, 10))} className="p-3 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90" title="Zoom In">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <div className="h-px bg-white/5 mx-2" />
          <button onClick={() => setScale(s => Math.max(s * 0.8, 0.1))} className="p-3 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90" title="Zoom Out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <div className="h-px bg-white/5 mx-2" />
          <button onClick={() => { setScale(1.5); setOffset({x:0,y:0}); }} className="p-3 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90" title="Reset Tampilan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainCanvas;
