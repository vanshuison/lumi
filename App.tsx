
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Message, ChatState, Memory, PersonaType, Attachment, ImageSize } from './types';
import { generateIntelligentResponse, generateSpeech, extractMemories } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import AuthPages from './components/AuthPages';
import IntelligenceModal from './components/IntelligenceModal';
import PhotosView from './components/PhotosView';
import MemoryModal from './components/MemoryModal';
import CommandPalette from './components/CommandPalette';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'chat' | 'login' | 'signup' | 'photos'>('landing');
  const [session, setSession] = useState<any>(null);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [state, setState] = useState<ChatState>({ messages: [], isTyping: false, error: null });
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activePersona, setActivePersona] = useState<PersonaType>('default');

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Command Palette Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (error) => console.warn("Spatial grounding offline: Geolocation denied.", error),
        { enableHighAccuracy: true }
      );
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setView('chat');
        loadHistory(session.user.id);
        const stored = localStorage.getItem('lumina_memories');
        if (stored) setMemories(JSON.parse(stored));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setView('chat');
        loadHistory(session.user.id);
      } else {
        setView('landing');
        setState({ messages: [], isTyping: false, error: null });
      }
    });

    requestLocation();
    return () => subscription.unsubscribe();
  }, []);

  const loadHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true });
      if (error) throw error;
      if (data) {
        const formattedMessages: Message[] = data.map(m => ({
          id: m.id,
          role: m.role,
          parts: m.parts,
          groundingLinks: m.grounding_links,
          timestamp: new Date(m.created_at).getTime(),
          attachments: [] 
        }));
        setState(prev => ({ ...prev, messages: formattedMessages }));
      }
    } catch (err) {
      console.error("History sync failed:", err);
    }
  };

  const saveMessage = async (msg: Partial<Message>) => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase.from('chat_messages').insert({
        user_id: session.user.id,
        role: msg.role,
        parts: msg.parts,
        grounding_links: msg.groundingLinks,
      }).select();
      return data?.[0]?.id;
    } catch (err) {
      console.error("Persistence failed:", err);
    }
  };

  const addMemory = (content: string, category: 'fact' | 'preference' = 'fact') => {
    const newMemory: Memory = {
      id: Date.now().toString(),
      content,
      category,
      created_at: new Date().toISOString()
    };
    const updated = [...memories, newMemory];
    setMemories(updated);
    localStorage.setItem('lumina_memories', JSON.stringify(updated));
  };

  const deleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    localStorage.setItem('lumina_memories', JSON.stringify(updated));
  };

  const handleDeleteChat = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    try {
      await supabase.from('chat_messages').delete().eq('id', id);
      setState(prev => ({ ...prev, messages: prev.messages.filter(m => m.id !== id) }));
    } catch (err) { console.error("Delete failed:", err); }
  };

  const handleSendMessage = async (
    text: string, 
    attachments: Attachment[] = [], 
    deepThink: boolean = false, 
    imageGenConfig?: { enabled: boolean; size: ImageSize },
    isFast?: boolean
  ) => {
    if (!text.trim() && attachments.length === 0) return;
    if (!session) { setView('login'); return; }
    if (view !== 'chat') setView('chat');

    const tempId = Date.now().toString();
    const userMessage: Message = {
      id: tempId,
      role: 'user',
      parts: [{ text }],
      attachments,
      timestamp: Date.now(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
      error: null
    }));
    
    const dbId = await saveMessage(userMessage);
    if (dbId) {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === tempId ? { ...m, id: dbId } : m)
      }));
    }

    if (!imageGenConfig?.enabled) {
      extractMemories(text).then(extracted => {
        extracted.forEach(fact => addMemory(fact, 'fact'));
      });
    }

    try {
      const history = state.messages.map(m => ({ role: m.role, parts: m.parts.map(p => ({ text: p.text || '' })) }));
      const memoryContext = memories.map(m => m.content);
      
      // Determine Model
      let model = 'gemini-3-flash-preview';
      if (isFast) model = 'gemini-2.5-flash-lite'; // Fast Response
      // Note: Image Editing (Flash Image) and Image Gen (Pro Image) are handled inside service logic based on config/attachments
      
      const response = await generateIntelligentResponse(
        text, 
        history, 
        attachments, 
        location, 
        model, 
        activePersona, 
        memoryContext, 
        deepThink,
        imageGenConfig
      );

      const parts: any[] = [];
      if (response.text) parts.push({ text: response.text });
      if (response.generatedImage) {
        parts.push({ 
          inlineData: { 
            mimeType: response.generatedImage.mimeType, 
            data: response.generatedImage.data 
          } 
        });
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        parts,
        groundingLinks: response.groundingLinks,
        timestamp: Date.now(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isTyping: false
      }));
      
      saveMessage(assistantMessage);
    } catch (err: any) {
      setState(prev => ({ ...prev, isTyping: false, error: err.message || "Intelligence stream failure." }));
    }
  };

  const handleInlineAction = async (action: string, originalText: string) => {
    let prompt = "";
    if (action === 'shorten') prompt = "Rewrite your last response to be incredibly concise (less than 50 words).";
    if (action === 'email') prompt = "Convert your last response into a professional email draft.";
    if (action === 'memory') {
       addMemory(originalText.slice(0, 100), 'preference');
       alert("Saved to Memory Cortex.");
       return;
    }
    await handleSendMessage(prompt);
  };

  const handleSpeak = async (messageId: string, text: string) => {
    try {
      setState(prev => ({ ...prev, messages: prev.messages.map(m => m.id === messageId ? { ...m, isSpeaking: true } : m) }));
      const base64Audio = await generateSpeech(text);
      if (!base64Audio) throw new Error("Speech synthesis failed.");
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      const dataInt16 = new Int16Array(bytes.buffer);
      const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setState(prev => ({ ...prev, messages: prev.messages.map(m => m.id === messageId ? { ...m, isSpeaking: false } : m) }));
      source.start();
    } catch (err) {
      console.error("Speech error:", err);
      setState(prev => ({ ...prev, messages: prev.messages.map(m => m.id === messageId ? { ...m, isSpeaking: false } : m) }));
    }
  };

  const clearChat = async () => {
    if (session?.user?.id) await supabase.from('chat_messages').delete().eq('user_id', session.user.id);
    setState({ messages: [], isTyping: false, error: null });
  };

  const handleLogout = async () => await supabase.auth.signOut();

  const filteredHistory = useMemo(() => {
    return state.messages.filter(m => m.role === 'user' && (searchTerm ? m.parts.some(p => p.text?.toLowerCase().includes(searchTerm.toLowerCase())) : true));
  }, [state.messages, searchTerm]);

  if (view === 'landing' && !session) return <LandingPage onStart={() => setView('login')} onLogin={() => setView('login')} onSignup={() => setView('signup')} onQuickInquiry={(val) => { setView('chat'); handleSendMessage(val); }} />;
  if ((view === 'login' || view === 'signup') && !session) return <AuthPages type={view} onSwitch={() => setView(view === 'login' ? 'signup' : 'login')} onSuccess={() => setView('chat')} onBack={() => setView('landing')} />;

  return (
    <div className="flex h-screen bg-[#fcfaf2] text-[#2d3436] overflow-hidden animate-in fade-in duration-700">
      {isSidebarOpen && <div className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-40 lg:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />}
      <CommandPalette isOpen={showPalette} onClose={() => setShowPalette(false)} onSelectPersona={setActivePersona} onOpenMemory={() => setShowMemory(true)} onNewChat={() => { clearChat(); }} />

      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-all duration-300 ease-out z-50 w-80 bg-[#e4d8cc] border-r border-stone-200/50 flex flex-col shadow-xl lg:shadow-none`}>
        <Sidebar 
          onClear={clearChat} 
          onClose={() => setIsSidebarOpen(false)} 
          onHome={() => setView('landing')} 
          onLogout={handleLogout}
          userEmail={session?.user?.email}
          onShowIntel={() => setShowIntelligence(true)}
          activeModel="gemini-3-flash-preview"
          onNavPhotos={() => { setView('photos'); setIsSidebarOpen(false); }}
          onNavChat={() => { setView('chat'); setIsSidebarOpen(false); }}
          onSearchChange={setSearchTerm}
          recentChats={filteredHistory}
          activeView={view}
          onDeleteChat={handleDeleteChat}
        />
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0 bg-[#fcfaf2]">
        <header className="h-20 border-b border-stone-200/60 flex items-center justify-between px-8 bg-white/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 hover:bg-stone-200/50 rounded-xl text-stone-600 transition-colors">
              <i className="fa-solid fa-bars-staggered text-xl"></i>
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowPalette(true)}>
              <div className="w-10 h-10 rounded-2xl bg-[#2d3436] flex items-center justify-center shadow-md">
                <i className="fa-solid fa-feather text-white text-sm"></i>
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight leading-none text-[#2d3436]">Lumina</h1>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-0.5">{activePersona !== 'default' ? `${activePersona} Mode` : 'Standard Mode'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setShowMemory(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:border-[#2d3436] transition-all shadow-sm">
                <i className="fa-solid fa-brain text-indigo-500"></i>
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-500 hidden sm:inline">Memory</span>
             </button>
             {location && <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100/50 border border-stone-200/30 text-[9px] font-black uppercase tracking-widest text-stone-400"><i className="fa-solid fa-location-crosshairs text-emerald-500"></i> Grounded</div>}
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {state.error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
              <div className="bg-rose-50 border border-rose-100 text-rose-800 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <p className="text-sm font-bold flex-1">{state.error}</p>
                <button onClick={() => setState(prev => ({ ...prev, error: null }))}><i className="fa-solid fa-xmark opacity-50"></i></button>
              </div>
            </div>
          )}
          {view === 'photos' ? <PhotosView photos={[]} /> : <MessageList messages={state.messages} isTyping={state.isTyping} onSuggestedAction={handleSendMessage} onSpeak={handleSpeak} onInlineAction={handleInlineAction} />}
        </div>

        {view === 'chat' && <div className="relative z-30"><InputArea onSend={handleSendMessage} isTyping={state.isTyping} hasLocation={!!location} /></div>}
      </main>

      {showIntelligence && <IntelligenceModal onClose={() => setShowIntelligence(false)} model="gemini-3-flash-preview" />}
      {showMemory && <MemoryModal onClose={() => setShowMemory(false)} memories={memories} onDelete={deleteMemory} />}
    </div>
  );
};

export default App;
