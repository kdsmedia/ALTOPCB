
import React, { useState } from 'react';

interface HeaderProps {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onDRC: () => void;
  onExport: (format: string) => void;
  activeLayer: 'top' | 'bottom';
  onToggleLayer: () => void;
  layerMode: 'single' | 'double';
  onToggleLayerMode: () => void;
  isFlipped: boolean;
  onToggleFlip: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onSave, onUndo, onRedo, onReset, onDRC, onExport, activeLayer, onToggleLayer, layerMode, onToggleLayerMode, isFlipped, onToggleFlip
}) => {
  const [showExport, setShowExport] = useState(false);

  return (
    <header className="w-full px-4 pt-4 relative z-50">
      <div className="bg-[#0b1425] border border-slate-800/80 rounded-2xl px-3 py-3 flex items-center justify-between shadow-2xl">
        {/* LOGO ALTOPCB */}
        <div className="bg-[#0a1a0c] border border-[#22c55e]/50 rounded-xl p-1.5 flex flex-col items-center justify-center flex-shrink-0 mr-2 min-w-[56px] shadow-[0_0_15px_rgba(34,197,94,0.2)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M15 2v2M15 20v2M9 2v2M9 20v2M2 15h2M20 15h2M2 9h2M20 9h2"/></svg>
          <span className="text-[8px] font-black text-white mt-0.5 uppercase tracking-tighter">ALTOPCB</span>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          {/* LAYER MODE SELECTOR */}
          <div className="flex items-center bg-slate-900 rounded-full p-1 border border-white/5 mr-1">
            <button 
              onClick={() => layerMode === 'double' && onToggleLayerMode()}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold transition-all ${layerMode === 'single' ? 'bg-[#3b82f6] text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              1 LAYER
            </button>
            <button 
              onClick={() => layerMode === 'single' && onToggleLayerMode()}
              className={`px-3 py-1.5 rounded-full text-[9px] font-bold transition-all ${layerMode === 'double' ? 'bg-[#6366f1] text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              2 LAYER
            </button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* SIMPAN */}
          <CircularButton bgColor="bg-[#fbbf24]" textColor="text-black" icon={<SaveIcon />} onClick={onSave} title="Simpan Proyek" />
          
          {/* UNDO/REDO */}
          <CircularButton bgColor="bg-[#94a3b8]" textColor="text-white" icon={<UndoIcon />} onClick={onUndo} title="Undo" />
          <CircularButton bgColor="bg-[#94a3b8]" textColor="text-white" icon={<RedoIcon />} onClick={onRedo} title="Redo" />
          
          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* RESET (Rapikan) */}
          <CircularButton bgColor="bg-[#22c55e]" textColor="text-white" icon={<RefreshIcon />} onClick={onReset} title="Rapikan Komponen ke Grid" />
          
          {/* FLIP (Cermin) */}
          <CircularButton 
            bgColor={isFlipped ? "bg-[#f472b6]" : "bg-slate-800"} 
            textColor="text-white" 
            icon={<FlipIcon />} 
            onClick={onToggleFlip} 
            title="Cermin Horizontal (Mirror View)" 
          />

          {/* TOGGLE LAYER */}
          <CircularButton 
            bgColor={layerMode === 'single' ? 'bg-slate-700' : 'bg-white'} 
            textColor={layerMode === 'single' ? 'text-slate-500' : 'text-[#334155]'} 
            icon={<LayerIcon />} 
            onClick={onToggleLayer} 
            title={layerMode === 'single' ? "Layer Terkunci (1 Layer)" : `Pindah ke Layer ${activeLayer === 'top' ? 'BOTTOM' : 'TOP'}`} 
          />
          
          {/* DRC */}
          <CircularButton bgColor="bg-[#3b82f6]" textColor="text-white" icon={<ToolsIcon />} onClick={onDRC} title="Cek Jalur (DRC)" />
          
          {/* EKSPOR */}
          <div className="relative">
            <CircularButton bgColor="bg-[#0ea5e9]" textColor="text-white" icon={<DownloadIcon />} onClick={() => setShowExport(!showExport)} title="Ekspor Layout" />
            {showExport && (
              <div className="absolute top-full right-0 mt-3 bg-[#0b1425] border border-white/10 rounded-xl p-2 shadow-2xl flex flex-col gap-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200">
                {['png', 'jpg', 'gerber'].map(fmt => (
                  <button key={fmt} onClick={() => { onExport(fmt); setShowExport(false); }} className="px-4 py-2.5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-left transition-colors flex items-center gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]"></span>
                    Format .{fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const CircularButton: React.FC<{ bgColor: string; textColor: string; icon: React.ReactNode; onClick?: () => void, title?: string }> = ({ bgColor, textColor, icon, onClick, title }) => (
  <button onClick={onClick} title={title} className={`${bgColor} ${textColor} w-11 h-11 rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:brightness-110 transition-all flex-shrink-0 group`}>
    {icon}
  </button>
);

const SaveIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>;
const UndoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>;
const RedoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg>;
const RefreshIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M21 3v9h-9"/></svg>;
const FlipIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12l10-10 10 10-10 10-10-10z"/><path d="M22 12H12M2 12h10"/></svg>;
const LayerIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 17l10 5 10-5M2 12l10 5 10-5M12 2L2 7l10 5 10-5-10-5z"/></svg>;
const ToolsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const DownloadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

export default Header;
