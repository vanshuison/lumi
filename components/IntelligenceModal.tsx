
import React from 'react';

interface IntelligenceModalProps {
  onClose: () => void;
  model: string;
}

const IntelligenceModal: React.FC<IntelligenceModalProps> = ({ onClose, model }) => {
  const isPro = model.includes('pro');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#2d3436]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#fcfaf2] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-[#2d3436] p-10 text-white relative">
          <div className="absolute top-8 right-8">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center">
              <i className="fa-solid fa-microchip text-[#2d3436] text-3xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Intelligence Profile</h2>
              <p className="text-stone-400 font-mono text-xs uppercase tracking-[0.2em] mt-1">Lumina Core Specification</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Engine</p>
              <p className="text-sm font-bold truncate">{isPro ? 'Gemini 3 Pro' : 'Gemini 3 Flash'}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-[9px] font-black uppercase text-stone-500 mb-1">State</p>
              <p className="text-sm font-bold text-emerald-400">Grounded</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Thinking</p>
              <p className="text-sm font-bold">{isPro ? '32K Budget' : 'Real-time'}</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-4">Architectural Knowledge</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-[#2d3436] mt-2 shadow-sm"></div>
                <p className="text-stone-600 text-sm leading-relaxed">
                  <span className="font-bold text-[#2d3436]">Multimodal Processing:</span> Simultaneously analyzes semantic text, high-resolution imagery, and structured datasets.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-[#2d3436] mt-2 shadow-sm"></div>
                <p className="text-stone-600 text-sm leading-relaxed">
                  <span className="font-bold text-[#2d3436]">Web-Grounded Intelligence:</span> Real-time integration with Google Search results ensures responses are anchored in verified, current facts.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-[#2d3436] mt-2 shadow-sm"></div>
                <p className="text-stone-600 text-sm leading-relaxed">
                  <span className="font-bold text-[#2d3436]">Spatial Reasoning:</span> Native Google Maps tool configuration for precise geolocation, routing, and geographical context.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200">
             <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-stone-400">
               <span>Registry 2025.04</span>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span>Sync: 100%</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceModal;
