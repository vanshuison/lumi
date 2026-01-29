
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface SidebarProps {
  onClear: () => void;
  onClose: () => void;
  onHome?: () => void;
  onLogout?: () => void;
  userEmail?: string;
  onShowIntel: () => void;
  activeModel: string;
  onNavPhotos: () => void;
  onNavChat: () => void;
  onSearchChange: (term: string) => void;
  recentChats: Message[];
  activeView: string;
  onDeleteChat?: (id: string) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onClear, onClose, onHome, onLogout, userEmail, onShowIntel, onNavPhotos, onNavChat, onSearchChange, recentChats, activeView, onDeleteChat, onRenameChat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearchChange(val);
  };

  const startEditing = (id: string, currentText: string) => {
    setEditingId(id);
    setEditValue(currentText);
    setMenuOpenId(null);
  };

  const submitRename = (id: string) => {
    if (onRenameChat && editValue.trim()) {
      onRenameChat(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleShare = (text: string) => {
    navigator.clipboard.writeText(`Check out this Lumina session: "${text}"`).then(() => {
      alert("Share link copied to clipboard!");
    });
    setMenuOpenId(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#e4d8cc]">
      <div className="p-6 pb-2 space-y-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onHome}>
          <div className="w-10 h-10 rounded-xl bg-[#2d3436] flex items-center justify-center shadow-md">
            <i className="fa-solid fa-feather text-white text-sm"></i>
          </div>
          <span className="font-bold text-xl tracking-tight text-[#2d3436]">Lumina</span>
        </div>

        <button 
          onClick={() => { onClear(); onNavChat(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2d3436] text-white hover:bg-black transition-all text-sm font-bold shadow-md group"
        >
          <i className="fa-solid fa-plus text-xs opacity-70 transition-transform group-hover:rotate-90"></i>
          New Chat
        </button>

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

        <nav className="space-y-1">
          <button 
            onClick={onNavPhotos}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeView === 'photos' ? 'bg-white text-[#2d3436] shadow-sm' : 'text-stone-600 hover:bg-white/40'}`}
          >
            <i className="fa-solid fa-image text-xs opacity-70"></i>
            Photos
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col mt-4">
        <div className="px-6 mb-3">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Recent Streams</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-0.5">
          {recentChats.length === 0 ? (
            <div className="px-6 py-10 text-center opacity-30">
              <i className="fa-solid fa-ghost text-2xl mb-2 block"></i>
              <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Streams</p>
            </div>
          ) : (
            recentChats.slice().reverse().map((chat) => (
              <div 
                key={chat.id} 
                className="group relative flex items-center"
              >
                {editingId === chat.id ? (
                  <div className="w-full px-4 py-3">
                    <input 
                      autoFocus
                      className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-stone-400"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => submitRename(chat.id)}
                      onKeyDown={(e) => e.key === 'Enter' && submitRename(chat.id)}
                    />
                  </div>
                ) : (
                  <button 
                    onClick={onNavChat}
                    className="flex-1 text-left px-4 py-3 rounded-xl hover:bg-white/50 transition-all border border-transparent hover:border-stone-200/20 pr-14 relative w-full overflow-hidden"
                  >
                    <div className="text-sm font-bold text-stone-700 truncate w-full group-hover:text-[#2d3436]">
                      {chat.parts[0]?.text || "Empty Protocol"}
                    </div>
                    <div className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter mt-0.5">
                      {new Date(chat.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </button>
                )}

                {editingId !== chat.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === chat.id ? null : chat.id); }}
                    className="absolute right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-stone-300/50 text-stone-400 hover:text-[#2d3436] transition-all z-10"
                  >
                    <i className="fa-solid fa-ellipsis-vertical text-xs"></i>
                  </button>
                )}

                {menuOpenId === chat.id && (
                  <div 
                    ref={menuRef}
                    className="absolute right-3 top-10 bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 z-20 w-44 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleShare(chat.parts[0]?.text || "Chat"); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50 flex items-center gap-3"
                    >
                      <i className="fa-solid fa-share-nodes w-4 opacity-50"></i> Share
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startEditing(chat.id, chat.parts[0]?.text || ""); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50 flex items-center gap-3"
                    >
                      <i className="fa-solid fa-pen w-4 opacity-50"></i> Rename Chat
                    </button>
                    <div className="h-[1px] bg-stone-100 my-1 mx-2"></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteChat?.(chat.id); setMenuOpenId(null); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-3"
                    >
                      <i className="fa-solid fa-trash-can w-4 opacity-70"></i> Delete Chat
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-6 pt-4 border-t border-stone-200/30">
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
