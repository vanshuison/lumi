
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onSuggestedAction: (text: string) => void;
  onSpeak: (id: string, text: string) => void;
  onRegenerate?: (id: string) => void;
  onInlineAction: (action: string, originalText: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping, onSuggestedAction, onSpeak, onRegenerate, onInlineAction }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const renderMarkdown = (content: string) => {
    const rawHtml = marked.parse(content) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return { __html: cleanHtml };
  };

  const handleCopy = (messageId: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center animate-in fade-in duration-1000">
        <div className="w-20 h-20 rounded-3xl bg-[#2d3436] flex items-center justify-center shadow-2xl mb-8 rotate-3">
          <i className="fa-solid fa-feather-pointed text-white text-3xl"></i>
        </div>
        <h2 className="text-4xl font-bold tracking-tight text-[#2d3436] mb-4">
          Lumina <span className="font-light italic text-stone-400">OS</span>
        </h2>
        <p className="max-w-md text-stone-500 text-base mb-12 leading-relaxed font-medium">
          Select a mode or upload a document to begin.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {[
            { icon: 'fa-rocket', title: 'Founder Mode', text: 'Analyze this startup idea for scalability' },
            { icon: 'fa-code', title: 'Code Architect', text: 'Review this code for security vulnerabilities' },
            { icon: 'fa-pen-nib', title: 'Editor Mode', text: 'Rewrite this email to be more persuasive' },
            { icon: 'fa-file-pdf', title: 'Document Analysis', text: 'Summarize the key points of this PDF' }
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => onSuggestedAction(item.text)}
              className="flex items-center gap-5 p-5 rounded-2xl bg-white border border-stone-200/60 hover:border-[#2d3436] hover:bg-stone-50 text-left transition-all group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 group-hover:text-[#2d3436] group-hover:bg-white transition-all">
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">{item.title}</span>
                <span className="text-sm text-[#2d3436] truncate block font-medium">"{item.text}"</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto px-4 py-12 md:px-12 space-y-8 custom-scrollbar scroll-smooth bg-[#fcfaf2]/50"
    >
      <div className="max-w-4xl mx-auto space-y-12">
        {messages.map((message) => {
          const messageText = message.parts.map(p => p.text || '').join('\n');
          return (
            <div 
              key={message.id}
              className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-5 w-full ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`
                  w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm
                  ${message.role === 'user' ? 'bg-[#2d3436] text-white' : 'bg-white border border-stone-200 text-stone-400'}
                `}>
                  <i className={`fa-solid ${message.role === 'user' ? 'fa-user text-xs' : 'fa-feather text-xs'}`}></i>
                </div>
                
                <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Attachments Display */}
                  {message.attachments && message.attachments.length > 0 && (
                     <div className="flex gap-2 mb-2 flex-wrap justify-end">
                       {message.attachments.map((att, i) => (
                         <div key={i} className="bg-white border border-stone-200 p-2 rounded-lg flex items-center gap-2 shadow-sm">
                           {att.type === 'image' ? (
                             <img src={`data:${att.mimeType};base64,${att.data}`} className="w-8 h-8 rounded object-cover" />
                           ) : (
                             <div className="w-8 h-8 bg-red-50 text-red-500 rounded flex items-center justify-center"><i className="fa-solid fa-file-pdf"></i></div>
                           )}
                           <span className="text-[10px] font-bold text-stone-600 truncate max-w-[80px]">{att.name || 'File'}</span>
                         </div>
                       ))}
                     </div>
                  )}

                  <div className={`
                    px-6 py-4 rounded-[2rem] text-[15px] leading-relaxed relative group/bubble
                    ${message.role === 'user' 
                      ? 'bg-[#2d3436] text-white rounded-tr-none shadow-md' 
                      : 'bg-white border border-stone-200/60 text-[#2d3436] rounded-tl-none shadow-sm'
                    }
                  `}>
                    {message.parts.map((part, pIdx) => (
                      <div key={pIdx}>
                        {part.inlineData && (
                          <div className="mb-4 rounded-xl overflow-hidden border border-stone-100 shadow-sm">
                            <img 
                              src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} 
                              alt="Visual input" 
                              className="max-h-80 w-auto object-contain"
                            />
                          </div>
                        )}
                        {part.text && (
                          <div className="markdown-content" dangerouslySetInnerHTML={renderMarkdown(part.text)} />
                        )}
                      </div>
                    ))}
                    
                    <div className={`mt-4 flex flex-wrap items-center gap-3 border-t pt-3 transition-opacity ${message.role === 'user' ? 'border-white/10' : 'border-stone-100'}`}>
                      <button 
                        onClick={() => handleCopy(message.id, messageText)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${copiedId === message.id ? 'bg-emerald-500 text-white' : (message.role === 'user' ? 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white' : 'bg-stone-50 text-stone-400 hover:text-[#2d3436] hover:bg-stone-100')}`}
                        title="Copy text content"
                      >
                        <i className={`fa-solid ${copiedId === message.id ? 'fa-check' : 'fa-copy'} text-[10px]`}></i>
                      </button>
                      
                      {message.role === 'assistant' && (
                        <>
                          <button 
                            onClick={() => onRegenerate?.(message.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-50 text-stone-400 hover:text-[#2d3436] hover:bg-stone-100 transition-all"
                            title="Regenerate"
                          >
                            <i className="fa-solid fa-rotate-right text-[10px]"></i>
                          </button>
                          <button 
                            onClick={() => onSpeak(message.id, message.parts.find(p => p.text)?.text || '')}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${message.isSpeaking ? 'bg-[#2d3436] text-white animate-pulse' : 'bg-stone-50 text-stone-400 hover:text-[#2d3436] hover:bg-stone-100'}`}
                            title="Read Aloud"
                          >
                            <i className={`fa-solid ${message.isSpeaking ? 'fa-waveform-lines' : 'fa-volume-high'} text-[10px]`}></i>
                          </button>
                          
                          {/* INLINE ACTIONS */}
                          <div className="h-4 w-[1px] bg-stone-200 mx-1"></div>
                          
                          <button onClick={() => onInlineAction('shorten', messageText)} className="text-[10px] font-bold text-stone-400 hover:text-[#2d3436] px-2 py-1 hover:bg-stone-100 rounded-lg transition-colors">
                            Shorten
                          </button>
                          <button onClick={() => onInlineAction('email', messageText)} className="text-[10px] font-bold text-stone-400 hover:text-[#2d3436] px-2 py-1 hover:bg-stone-100 rounded-lg transition-colors">
                            To Email
                          </button>
                          <button onClick={() => onInlineAction('memory', messageText)} className="text-[10px] font-bold text-stone-400 hover:text-emerald-600 px-2 py-1 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1">
                            <i className="fa-solid fa-memory"></i> Remember
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {message.groundingLinks && message.groundingLinks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-700">
                      {message.groundingLinks.map((link, lIdx) => (
                        <a 
                          key={lIdx} 
                          href={link.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-stone-100 text-[10px] font-bold text-stone-400 hover:text-[#2d3436] hover:border-stone-300 transition-all shadow-sm group"
                        >
                          <i className="fa-solid fa-link text-[8px] opacity-40 group-hover:opacity-100"></i>
                          {link.title || 'Referenced Source'}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-4 animate-in fade-in duration-300">
            <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-200">
              <i className="fa-solid fa-feather text-xs animate-bounce"></i>
            </div>
            <div className="px-6 py-4 bg-white border border-stone-200/60 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
