
import React, { useState, useRef, useEffect } from 'react';

interface InputAreaProps {
  onSend: (text: string, image?: { data: string; mimeType: string }) => void;
  isTyping: boolean;
  hasLocation?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isTyping, hasLocation }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = () => {
    if ((!text.trim() && !image) || isTyping) return;
    if (isListening) {
      recognitionRef.current.stop();
    }
    onSend(text, image ? { data: image.data, mimeType: image.mimeType } : undefined);
    setText('');
    setImage(null);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setImage({
          data: base64,
          mimeType: file.type,
          preview: URL.createObjectURL(file)
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset inputs to allow same file re-upload if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
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

  return (
    <div className="px-6 pb-10 pt-4 bg-[#fcfaf2]/80 backdrop-blur-lg">
      <div className="max-w-4xl mx-auto">
        {image && (
          <div className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-xl bg-white">
                <img src={image.preview} alt="Upload" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-[#2d3436] text-white rounded-full flex items-center justify-center text-[10px] shadow-lg border-2 border-[#fcfaf2]"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        )}

        <div className="relative group">
          <div className="flex items-end gap-1 bg-white border border-stone-200 rounded-[1.75rem] p-2 pr-3 shadow-sm transition-all focus-within:border-stone-400 focus-within:shadow-md">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 text-stone-400 hover:text-[#2d3436] hover:bg-stone-50 rounded-2xl transition-all flex-shrink-0"
              title="Upload Image for Analysis"
            >
              <i className="fa-regular fa-image text-lg"></i>
            </button>
            
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className="p-3.5 text-stone-400 hover:text-[#2d3436] hover:bg-stone-50 rounded-2xl transition-all flex-shrink-0 hidden sm:flex"
              title="Capture Image for Analysis"
            >
              <i className="fa-solid fa-camera text-lg"></i>
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
              accept="image/*" 
              className="hidden" 
            />

            <input 
              type="file" 
              ref={cameraInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
            />
            
            <textarea
              ref={textAreaRef}
              rows={1}
              value={text}
              onChange={adjustHeight}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening to audio stream..." : "Enter query or analyze image..."}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[#2d3436] placeholder:text-stone-300 font-medium py-3.5 resize-none text-[15px] custom-scrollbar"
            />

            <button 
              onClick={handleSend}
              disabled={(!text.trim() && !image) || isTyping}
              className={`
                w-11 h-11 rounded-2xl transition-all flex items-center justify-center flex-shrink-0
                ${(!text.trim() && !image) || isTyping 
                  ? 'bg-stone-50 text-stone-300 border border-stone-100' 
                  : 'bg-[#2d3436] text-white shadow-lg hover:bg-black active:scale-95'}
              `}
            >
              {isTyping ? (
                <i className="fa-solid fa-circle-notch animate-spin text-sm"></i>
              ) : (
                <i className="fa-solid fa-arrow-up-long text-sm"></i>
              )}
            </button>
          </div>
          
          <div className="mt-3 flex items-center justify-between px-4">
             <div className="flex gap-4">
                <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                  <i className={`fa-solid ${isListening ? 'fa-signal text-emerald-500' : 'fa-shield-check'} text-[10px]`}></i> {isListening ? 'Voice Stream' : 'Secure Session'}
                </span>
                <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest flex items-center gap-1.5">
                  <i className="fa-solid fa-wifi text-[10px]"></i> Grounding Active
                </span>
                {hasLocation && (
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 animate-in fade-in duration-500">
                    <i className="fa-solid fa-location-crosshairs text-[10px]"></i> Spatial Enabled
                  </span>
                )}
             </div>
             <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest opacity-60">
               Lumina Neural Core
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
