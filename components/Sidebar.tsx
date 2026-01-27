
import React, { useState } from 'react';
import { Message } from '../types';

interface SidebarProps {
  onClear: () => void;
  onClose: () => void;
  onHome?: () => void;
  onLogout?: () => void;
  userEmail?: string;
  onShowIntel: () => void;
  activeModel: string;
  onModelChange: (model: any) => void;
  onNavPhotos: () => void;
  onNavChat: () => void;
  onSearchChange: (term: string) => void;
  recentChats: Message[];
  activeView: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onClear, onClose, onHome, onLogout, userEmail, onShowIntel, activeModel, onModelChange, onNavPhotos, onNavChat, onSearchChange, recentChats, activeView
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearchChange(val);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#e4d8cc]">
      {/* Brand & Fixed Header */}
      <div className="p-6 pb-2 space-y-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onHome}>
          <div className="w-10 h-10 rounded-xl bg-[#2d3436] flex items-center justify-center shadow-md">
            <i className="fa-solid fa-feather text-white text-sm"></i>
          </div>
          <span className="font-bold text-xl tracking-tight text-[#2d3436]">Lumina</span>
        </div>

        {/* Action: New Chat */}
        <button 
          onClick={() => { onClear(); onNavChat(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2d3436] text-white hover:bg-black transition-all text-sm font-bold shadow-md group"
        >
          <i className="fa-solid fa-plus text-xs opacity-70 transition-transform group-hover:rotate-90"></i>
          New Chat
        </button>

        {/* Action: Search Chats */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
          <input 
            type="text" 
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search Chats"
            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2d3436]/10 transition-all placeholder:text-stone-400"
          />
        </div>

        {/* Navigation Modalities */}
        <nav className="space-y-1">
          <button 
            onClick={onNavPhotos}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeView === 'photos' ? 'bg-white text-[#2d3436] shadow-sm' : 'text-stone-600 hover:bg-white/40'}`}
          >
            <i className="fa-solid fa-image text-xs opacity-70"></i>
            Photos
          </button>
          <button 
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-bold text-stone-600 hover:bg-white/40 group"
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-folder-tree text-xs opacity-70"></i>
              Projects
            </div>
            <i className="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-30"></i>
          </button>
        </nav>
      </div>

      {/* RECENT CHATS - The designated scrollable section */}
      <div className="flex-1 overflow-hidden flex flex-col mt-4">
        <div className="px-6 mb-3">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Recent Chats</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-0.5">
          {recentChats.length === 0 ? (
            <div className="px-6 py-10 text-center opacity-30">
              <i className="fa-solid fa-ghost text-2xl mb-2 block"></i>
              <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Streams</p>
            </div>
          ) : (
            recentChats.slice().reverse().map((chat) => (
              <button 
                key={chat.id}
                onClick={onNavChat}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/50 transition-all group border border-transparent hover:border-stone-200/20"
              >
                <div className="text-sm font-bold text-stone-700 truncate group-hover:text-[#2d3436]">
                  {chat.parts[0]?.text || "Empty Protocol"}
                </div>
                <div className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter mt-0.5">
                  {new Date(chat.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* User & Model Footer */}
      <div className="p-6 pt-4 border-t border-stone-200/30">
        <div className="mb-6">
          <div className="flex bg-white/50 p-1 rounded-xl border border-stone-200">
            <button 
              onClick={() => onModelChange('gemini-3-flash-preview')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeModel.includes('flash') ? 'bg-[#2d3436] text-white shadow-sm' : 'text-stone-400'}`}
            >
              Flash
            </button>
            <button 
              onClick={() => onModelChange('gemini-3-pro-preview')}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeModel.includes('pro') ? 'bg-[#2d3436] text-white shadow-sm' : 'text-stone-400'}`}
            >
              Pro
            </button>
          </div>
        </div>

        {userEmail && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2d3436] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                {userEmail[0].toUpperCase()}
              </div>
              <p className="text-xs font-bold text-[#2d3436] truncate max-w-[120px]">{userEmail}</p>
            </div>
            <button onClick={onLogout} className="text-stone-400 hover:text-rose-500 transition-colors p-2">
              <i className="fa-solid fa-right-from-bracket text-xs"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
