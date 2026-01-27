
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Message, ChatState, MessagePart } from './types';
import { generateIntelligentResponse, generateSpeech } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import MessageList from './components/MessageList';
import InputArea from './components/InputArea';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import AuthPages from './components/AuthPages';
import IntelligenceModal from './components/IntelligenceModal';
import PhotosView from './components/PhotosView';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'chat' | 'login' | 'signup' | 'photos'>('landing');
  const [session, setSession] = useState<any>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-3-flash-preview');
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [state, setState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    error: null,
  });

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Spatial coordinates locked.");
          setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        (error) => {
          console.warn("Spatial grounding offline: Geolocation denied.", error);
          setState(prev => ({ ...prev, error: "Spatial grounding disabled. Location permission required for nearby recommendations." }));
        },
        { enableHighAccuracy: true }
      );
    } else {
      setState(prev => ({ ...prev, error: "Geolocation protocol not supported by this browser." }));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setView('chat');
        loadHistory(session.user.id);
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

    // Auto-init Location Protocol
    requestLocation();

    return () => subscription.unsubscribe();
  }, []);

  const loadHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        const formattedMessages: Message[] = data.map(m => ({
          id: m.id,
          role: m.role,
          parts: m.parts,
          groundingLinks: m.grounding_links,
          timestamp: new Date(m.created_at).getTime(),
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
      await supabase.from('chat_messages').insert({
        user_id: session.user.id,
        role: msg.role,
        parts: msg.parts,
        grounding_links: msg.groundingLinks,
      });
    } catch (err) {
      console.error("Persistence failed:", err);
    }
  };

  const handleSendMessage = async (text: string, image?: { data: string; mimeType: string }) => {
    if (!text.trim() && !image) return;

    if (!session) {
      setView('login');
      return;
    }

    if (view !== 'chat') setView('chat');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ text }],
      timestamp: Date.now(),
    };

    if (image) {
      userMessage.parts.push({
        inlineData: { data: image.data, mimeType: image.mimeType }
      });
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
      error: null
    }));
    
    saveMessage(userMessage);

    try {
      const history = state.messages.map(m => ({
        role: m.role,
        parts: m.parts.map(p => ({ text: p.text || '' }))
      }));

      // Automatically passes location for spatial grounding tool logic
      const response = await generateIntelligentResponse(text, history, image, location, activeModel);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        parts: [{ text: response.text }],
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
      setState(prev => ({
        ...prev,
        isTyping: false,
        error: err.message || "Intelligence stream failure."
      }));
    }
  };

  const handleRegenerate = async (assistantId: string) => {
    const messageIndex = state.messages.findIndex(m => m.id === assistantId);
    if (messageIndex === -1) return;

    // Find the user prompt that preceded this assistant message
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0 || state.messages[userMessageIndex].role !== 'user') return;

    const userMessage = state.messages[userMessageIndex];
    const text = userMessage.parts.find(p => p.text)?.text || '';
    const imagePart = userMessage.parts.find(p => p.inlineData);
    const image = imagePart ? { data: imagePart.inlineData!.data, mimeType: imagePart.inlineData!.mimeType } : undefined;

    // Maintain history before that specific turn
    const historyBefore = state.messages.slice(0, userMessageIndex).map(m => ({
      role: m.role,
      parts: m.parts.map(p => ({ text: p.text || '' }))
    }));

    // Temporary update state to show typing
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(m => m.id !== assistantId),
      isTyping: true,
      error: null
    }));

    try {
      const response = await generateIntelligentResponse(text, historyBefore, image, location, activeModel);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        parts: [{ text: response.text }],
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
      setState(prev => ({
        ...prev,
        isTyping: false,
        error: err.message || "Regeneration failure."
      }));
    }
  };

  const handleSpeak = async (messageId: string, text: string) => {
    try {
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? { ...m, isSpeaking: true } : m)
      }));

      const base64Audio = await generateSpeech(text);
      if (!base64Audio) throw new Error("Speech synthesis failed.");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

      const dataInt16 = new Int16Array(bytes.buffer);
      const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(m => m.id === messageId ? { ...m, isSpeaking: false } : m)
        }));
      };
      source.start();
    } catch (err) {
      console.error("Speech error:", err);
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? { ...m, isSpeaking: false } : m)
      }));
    }
  };

  const clearChat = async () => {
    if (session?.user?.id) {
      await supabase.from('chat_messages').delete().eq('user_id', session.user.id);
    }
    setState({ messages: [], isTyping: false, error: null });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const allPhotos = useMemo(() => {
    const photos: { data: string, mimeType: string, timestamp: number }[] = [];
    state.messages.forEach(msg => {
      msg.parts.forEach(part => {
        if (part.inlineData) {
          photos.push({
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
            timestamp: msg.timestamp
          });
        }
      });
    });
    return photos;
  }, [state.messages]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return state.messages.filter(m => m.role === 'user');
    return state.messages.filter(m => 
      m.role === 'user' && 
      m.parts.some(p => p.text?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [state.messages, searchTerm]);

  if (view === 'landing' && !session) {
    return (
      <LandingPage 
        onStart={() => setView('login')} 
        onLogin={() => setView('login')} 
        onSignup={() => setView('signup')}
        onQuickInquiry={(val) => {
          setView('chat');
          handleSendMessage(val);
        }}
      />
    );
  }

  if ((view === 'login' || view === 'signup') && !session) {
    return (
      <AuthPages 
        type={view} 
        onSwitch={() => setView(view === 'login' ? 'signup' : 'login')} 
        onSuccess={() => setView('chat')} 
        onBack={() => setView('landing')} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#fcfaf2] text-[#2d3436] overflow-hidden animate-in fade-in duration-700">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 transition-all duration-300 ease-out
        z-50 w-80 bg-[#e4d8cc] border-r border-stone-200/50 flex flex-col shadow-xl lg:shadow-none
      `}>
        <Sidebar 
          onClear={clearChat} 
          onClose={() => setIsSidebarOpen(false)} 
          onHome={() => setView('landing')} 
          onLogout={handleLogout}
          userEmail={session?.user?.email}
          onShowIntel={() => setShowIntelligence(true)}
          activeModel={activeModel}
          onModelChange={setActiveModel}
          onNavPhotos={() => { setView('photos'); setIsSidebarOpen(false); }}
          onNavChat={() => { setView('chat'); setIsSidebarOpen(false); }}
          onSearchChange={setSearchTerm}
          recentChats={filteredHistory}
          activeView={view}
        />
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0 bg-[#fcfaf2]">
        <header className="h-20 border-b border-stone-200/60 flex items-center justify-between px-8 bg-white/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 hover:bg-stone-200/50 rounded-xl text-stone-600 transition-colors"
            >
              <i className="fa-solid fa-bars-staggered text-xl"></i>
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
              <div className="w-10 h-10 rounded-2xl bg-[#2d3436] flex items-center justify-center shadow-md">
                <i className="fa-solid fa-feather text-white text-sm"></i>
              </div>
              <h1 className="font-bold text-xl tracking-tight leading-none text-[#2d3436]">Lumina</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             {location ? (
               <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100/50 border border-stone-200/30 text-[9px] font-black uppercase tracking-widest text-stone-400">
                 <i className="fa-solid fa-location-crosshairs text-emerald-500"></i>
                 Spatial Grounded
               </div>
             ) : (
               <button 
                 onClick={requestLocation}
                 className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:border-[#2d3436] hover:text-[#2d3436] transition-all text-[9px] font-black uppercase tracking-widest text-stone-400 shadow-sm"
               >
                 <i className="fa-solid fa-location-dot"></i>
                 Enable Location
               </button>
             )}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200/50 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-stone-500"></span>
              </span>
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">Sync Active</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {state.error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
              <div className="bg-rose-50 border border-rose-100 text-rose-800 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <p className="text-sm font-bold flex-1">{state.error}</p>
                <button onClick={() => setState(prev => ({ ...prev, error: null }))}>
                  <i className="fa-solid fa-xmark opacity-50"></i>
                </button>
              </div>
            </div>
          )}
          {view === 'photos' ? (
            <PhotosView photos={allPhotos} />
          ) : (
            <MessageList 
              messages={state.messages} 
              isTyping={state.isTyping} 
              onSuggestedAction={handleSendMessage}
              onSpeak={handleSpeak}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>

        {view === 'chat' && (
          <div className="relative z-30">
            <InputArea onSend={handleSendMessage} isTyping={state.isTyping} hasLocation={!!location} />
          </div>
        )}
      </main>

      {showIntelligence && <IntelligenceModal onClose={() => setShowIntelligence(false)} model={activeModel} />}
    </div>
  );
};

export default App;
