
import React from 'react';

interface FooterProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
}

const Footer: React.FC<FooterProps> = ({ value, onChange, onSend }) => {
  return (
    <footer className="p-3 sm:p-4 pb-8 sm:pb-12">
      <div className="bg-[#0b1425] border border-slate-800/60 rounded-[2.5rem] sm:rounded-[3rem] p-1.5 sm:p-2 flex items-center shadow-2xl max-w-4xl mx-auto w-full">
        {/* Search Input Container */}
        <div className="flex-1 flex items-center px-3 sm:px-5 gap-2 sm:gap-3 bg-[#030712] rounded-[2rem] sm:rounded-[2.5rem] h-12 sm:h-16">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder="Minta AI tambahkan"
            className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-600 focus:outline-none text-sm sm:text-lg font-medium min-w-0"
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
          />
        </div>

        {/* Plus Button */}
        <button 
          onClick={onSend}
          className="ml-2 sm:ml-3 bg-[#6366f1] text-white w-14 sm:w-28 h-12 sm:h-16 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.4)] active:scale-95 transition-transform flex-shrink-0"
        >
          <div className="border-2 border-white/90 rounded-lg sm:rounded-xl p-1 sm:p-1.5 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
