
import React, { useState, useRef, useEffect } from 'react';
import { Attachment, ImageSize } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachments: Attachment[], deepThink: boolean, imageGenConfig?: { enabled: boolean; size: ImageSize }, isFast?: boolean) => void;
  isTyping: boolean;
  hasLocation?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isTyping, hasLocation }) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  
  // Feature Toggles
  const [deepThink, setDeepThink] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [isImageGen, setIsImageGen] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText((prev) => {
          const newText = prev + transcript;
          if (textAreaRef.current) {
            setTimeout(() => {
              textAreaRef.current!.style.height = 'auto';
              textAreaRef.current!.style.height = `${Math.min(textAreaRef.current!.scrollHeight, 250)}px`;
            }, 0);
          }
          return newText;
        });
      };

      recognition.onerror = (event: any) => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isListening) recognitionRef.current.stop();
    else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && attachments.length === 0) || isTyping) return;
    if (isListening) recognitionRef.current.stop();
    
    onSend(text, attachments, deepThink, isImageGen ? { enabled: true, size: imageSize } : undefined, isTurbo);
    setText('');
    setAttachments([]);
    if (textAreaRef.current) textAreaRef.current.style.height = 'auto';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          const isImage = file.type.startsWith('image/');
          setAttachments(prev => [...prev, {
            type: isImage ? 'image' : 'file',
            mimeType: file.type,
            data: base64,
            name: file.name
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 250)}px`;
    setText(target.value);
  };

  // Logic to prevent conflicting modes
  const toggleImageGen = () => {
    const newState = !isImageGen;
    setIsImageGen(newState);
    if (newState) {
      setIsTurbo(false);
      setDeepThink(false);
    }
  };

  const toggleTurbo = () => {
    const newState = !isTurbo;
    setIsTurbo(newState);
    if (newState) {
      setIsImageGen(false);
      setDeepThink(false);
    }
  };

  const toggleDeepThink = () => {
    const newState = !deepThink;
    setDeepThink(newState);
    if (newState) {
      setIsTurbo(false);
      setIsImageGen(false);
    }
  };

  return (
    <div className="px-6 pb-10 pt-4 bg-[#fcfaf2]/80 backdrop-blur-lg">
      <div className="max-w-4xl mx-auto">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4 animate-in slide-in-from-bottom-2 duration-300">
            {attachments.map((att, i) => (
              <div key={i} className="relative group inline-block">
                <div className={`
                  flex items-center gap-3 p-3 rounded-2xl border border-stone-200 shadow-sm bg-white
                  ${att.type === 'image' ? 'pr-3' : 'pr-4'}
                `}>
                  {att.type === 'image' ? (
                    <img src={`data:${att.mimeType};base64,${att.data}`} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                      <i className="fa-solid fa-file-pdf text-lg"></i>
                    </div>
                  )}
                  <span className="text-xs font-bold text-stone-600 max-w-[100px] truncate">{att.name || 'Attachment'}</span>
                </div>
                <button 
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-[#2d3436] text-white rounded-full flex items-center justify-center text-[10px] shadow-md border border-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative group">
          <div className={`flex items-end gap-1 bg-white border rounded-[1.75rem] p-2 pr-3 shadow-sm transition-all focus-within:shadow-md ${isImageGen ? 'border-purple-300 ring-2 ring-purple-50' : 'border-stone-200 focus-within:border-stone-400'}`}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-stone-400 hover:text-[#2d3436] hover:bg-stone-50 rounded-2xl transition-all flex-shrink-0"
              title="Upload Image or Document"
            >
              <i className="fa-solid fa-paperclip text-lg"></i>
            </button>
            
            <button 
              onClick={toggleListening}
              className={`p-3.5 rounded-2xl transition-all flex-shrink-0 ${isListening ? 'text-rose-500 bg-rose-50 animate-pulse' : 'text-stone-400 hover:text-[#2d3436] hover:bg-stone-50'}`}
              title={isListening ? "Stop Dictation" : "Start Voice Protocol"}
            >
              <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'} text-lg`}></i>
            </button>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*,application/pdf" 
              multiple
              className="hidden" 
            />
            
            <textarea
              ref={textAreaRef}
              rows={1}
              value={text}
              onChange={adjustHeight}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : (isImageGen ? "Describe image to generate..." : "Message, edit image, or upload PDF...")}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[#2d3436] placeholder:text-stone-300 font-medium py-3.5 resize-none text-[15px] custom-scrollbar"
            />

            <button 
              onClick={handleSend}
              disabled={(!text.trim() && attachments.length === 0) || isTyping}
              className={`
                w-11 h-11 rounded-2xl transition-all flex items-center justify-center flex-shrink-0
                ${(!text.trim() && attachments.length === 0) || isTyping 
                  ? 'bg-stone-50 text-stone-300 border border-stone-100' 
                  : isImageGen ? 'bg-purple-600 text-white shadow-lg hover:bg-purple-700' : 'bg-[#2d3436] text-white shadow-lg hover:bg-black active:scale-95'}
              `}
            >
              {isTyping ? (
                <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
              ) : (
                <i className={`fa-solid ${isImageGen ? 'fa-wand-magic-sparkles' : 'fa-arrow-up-long'} text-sm`}></i>
              )}
            </button>
          </div>
          
          <div className="mt-3 flex flex-wrap items-center justify-between px-4 gap-y-2">
             <div className="flex gap-3 sm:gap-4 items-center">
                <button 
                  onClick={toggleDeepThink}
                  className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${deepThink ? 'text-indigo-600' : 'text-stone-300 hover:text-stone-400'}`}
                >
                  <i className={`fa-solid fa-brain ${deepThink ? 'animate-pulse' : ''}`}></i>
                  Reasoning {deepThink ? 'ON' : 'OFF'}
                </button>

                <span className="w-1 h-1 rounded-full bg-stone-200"></span>

                <button 
                  onClick={toggleTurbo}
                  className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${isTurbo ? 'text-amber-500' : 'text-stone-300 hover:text-stone-400'}`}
                >
                  <i className="fa-solid fa-bolt"></i>
                  Turbo {isTurbo ? 'ON' : 'OFF'}
                </button>

                <span className="w-1 h-1 rounded-full bg-stone-200"></span>

                <button 
                  onClick={toggleImageGen}
                  className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${isImageGen ? 'text-purple-500' : 'text-stone-300 hover:text-stone-400'}`}
                >
                  <i className="fa-solid fa-image"></i>
                  Img Gen {isImageGen ? 'ON' : 'OFF'}
                </button>
             </div>

            {isImageGen && (
              <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1 animate-in slide-in-from-left-2 fade-in">
                {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setImageSize(size)}
                    className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${imageSize === size ? 'bg-white text-[#2d3436] shadow-sm' : 'text-stone-400 hover:text-[#2d3436]'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
