
import React, { useEffect, useState } from 'react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona: (persona: string) => void;
  onOpenMemory: () => void;
  onNewChat: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelectPersona, onOpenMemory, onNewChat }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const commands = [
    { icon: 'fa-plus', label: 'New Chat', action: onNewChat, type: 'General' },
    { icon: 'fa-brain', label: 'Open Memory Cortex', action: onOpenMemory, type: 'General' },
    { icon: 'fa-user-tie', label: 'Founder Mode', action: () => onSelectPersona('founder'), type: 'Mode' },
    { icon: 'fa-code', label: 'Code Architect', action: () => onSelectPersona('coder'), type: 'Mode' },
    { icon: 'fa-pen-nib', label: 'Writer / Editor', action: () => onSelectPersona('writer'), type: 'Mode' },
    { icon: 'fa-chart-pie', label: 'Data Analyst', action: () => onSelectPersona('analyst'), type: 'Mode' },
  ];

  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4">
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-stone-200">
        <div className="p-4 border-b border-stone-100 flex items-center gap-3">
          <i className="fa-solid fa-magnifying-glass text-stone-400"></i>
          <input 
            autoFocus
            className="flex-1 bg-transparent outline-none text-[#2d3436] font-medium placeholder:text-stone-300"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="px-2 py-1 rounded bg-stone-100 text-[10px] font-bold text-stone-400">ESC</div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filtered.map((cmd, i) => (
            <button 
              key={i}
              onClick={() => { cmd.action(); onClose(); }}
              className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#fcfaf2] text-left group transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-stone-50 text-stone-400 flex items-center justify-center group-hover:bg-[#2d3436] group-hover:text-white transition-all">
                <i className={`fa-solid ${cmd.icon}`}></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#2d3436]">{cmd.label}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{cmd.type}</p>
              </div>
              <i className="fa-solid fa-arrow-turn-down-left text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
