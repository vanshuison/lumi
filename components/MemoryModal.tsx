
import React, { useState } from 'react';
import { Memory } from '../types';

interface MemoryModalProps {
  onClose: () => void;
  memories: Memory[];
  onDelete: (id: string) => void;
}

const MemoryModal: React.FC<MemoryModalProps> = ({ onClose, memories, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'fact' | 'preference'>('all');

  const filteredMemories = activeTab === 'all' 
    ? memories 
    : memories.filter(m => m.category === activeTab);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#2d3436]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#fcfaf2] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[85vh]">
        <div className="bg-white p-8 border-b border-stone-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#2d3436]">Cortex Memory</h2>
            <p className="text-stone-400 text-xs font-medium mt-1">Lumina learns about you to serve you better.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 text-stone-400 hover:bg-stone-200 flex items-center justify-center transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="px-8 py-4 bg-stone-50 border-b border-stone-100 flex gap-4 overflow-x-auto">
          {['all', 'fact', 'preference'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#2d3436] text-white shadow-md' : 'text-stone-400 hover:text-[#2d3436] hover:bg-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-3">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <i className="fa-solid fa-brain text-4xl text-stone-300 mb-4"></i>
              <p className="text-stone-500 font-bold">No memories formed yet.</p>
              <p className="text-xs text-stone-400 mt-2">I will automatically learn from our conversations.</p>
            </div>
          ) : (
            filteredMemories.map(m => (
              <div key={m.id} className="group bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-[#2d3436] transition-colors flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                   <div className={`mt-1 w-2 h-2 rounded-full ${m.category === 'fact' ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                   <div>
                     <p className="text-[#2d3436] font-medium text-sm leading-relaxed">{m.content}</p>
                     <p className="text-[10px] text-stone-400 mt-1 uppercase font-bold tracking-wider">{m.category} • {new Date(m.created_at).toLocaleDateString()}</p>
                   </div>
                </div>
                <button 
                  onClick={() => onDelete(m.id)}
                  className="text-stone-300 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 bg-stone-50 border-t border-stone-200 text-center">
           <p className="text-[10px] text-stone-400 font-medium"><i className="fa-solid fa-lock mr-1"></i> Memories are stored locally in your encrypted session for this demo.</p>
        </div>
      </div>
    </div>
  );
};

export default MemoryModal;
