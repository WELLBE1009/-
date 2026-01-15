
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Compass, 
  HelpCircle, 
  Send, 
  X, 
  Info, 
  Target, 
  ExternalLink, 
  Image as ImageIcon,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { Message, GuideItem } from './types';
import { chatWithGemini } from './services/geminiService';

const ORGANIZATION_PURPOSE = "私たちは街にサウナという木を植え森を育て、人々に元気にとどけます";

const GUIDE_ITEMS: GuideItem[] = [
  { num: "01", title: "直感を言葉にする", desc: "感じている違和感やワクワクをそのまま入力。" },
  { num: "02", title: "ビジュアルを共有", desc: "写真や図解をアップして、感覚を具体化。" },
  { num: "03", title: "原点に立ち返る", desc: "パーパスとの繋がりを再確認し、誠実さを育む。" }
];

const INITIAL_SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: 'おかえりなさい。ここは安全な質問の場所です。\n現在の状況や、意思決定において感じている微かな違和感など、何でも言葉にしてみてください。'
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{data: string, type: string} | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([INITIAL_SYSTEM_MESSAGE]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleResetChat = () => {
    if (window.confirm("これまでの会話をクリアしてもよろしいですか？")) {
      setMessages([INITIAL_SYSTEM_MESSAGE]);
      setInputValue("");
      setSelectedImage(null);
    }
  };

  const renderContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const isImage = part.match(/\.(jpeg|jpg|gif|png|webp)$/i);
        if (isImage) {
          return (
            <div key={i} className="my-3">
              <img 
                src={part} 
                alt="Shared content" 
                className="max-w-full rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <a href={part} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 flex items-center gap-1 mt-1 hover:underline">
                <ExternalLink size={10} /> View Original
              </a>
            </div>
          );
        }
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline break-all hover:text-indigo-800 inline-flex items-center gap-1">
            {part} <ExternalLink size={12} />
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const currentText = inputValue;
    const currentImage = selectedImage;
    
    const userMessage: Message = { 
      role: 'user', 
      content: currentText || (currentImage ? "画像を共有しました" : ""),
      image: currentImage?.data,
      mimeType: currentImage?.type
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const aiResponse = await chatWithGemini(newMessages);
      setMessages(prev => [...prev, { role: 'system', content: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: "通信エラーが発生しました。時間を置いて再度お試しください。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target?.result as string;
        setSelectedImage({ data: base64Image, type: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden flex-col md:flex-row">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={onFileChange} 
        accept="image/*" 
      />

      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Header */}
        <header className="py-6 md:py-8 border-b border-slate-100 flex flex-col items-center justify-center bg-white shrink-0 relative px-4 z-10 shadow-sm">
          <div className="flex items-center gap-3 mb-2 md:mb-3 text-slate-900">
            <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-indigo-100 shadow-lg">
              <Compass size={24} className="md:w-6 md:h-6" strokeWidth={2.5} />
            </div>
            <h1 className="font-black text-xl md:text-2xl tracking-tight uppercase italic text-indigo-600">Compass</h1>
          </div>
          <div className="max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 text-indigo-400 mb-1">
              <Target size={14} className="animate-pulse" />
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400">Current Purpose</span>
            </div>
            <p className="text-sm md:text-lg font-bold text-slate-700 leading-tight md:leading-relaxed px-4">
              「{ORGANIZATION_PURPOSE}」
            </p>
          </div>

          <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2">
            <button 
              onClick={handleResetChat}
              className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
              title="会話をリセット"
              aria-label="Reset chat"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={() => setShowGuide(true)}
              className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-slate-50"
              aria-label="Help"
            >
              <HelpCircle size={22} />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
          <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 md:space-y-10 max-w-4xl mx-auto w-full custom-scrollbar"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-4 md:p-6 rounded-2xl md:rounded-[1.8rem] text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {msg.image && (
                      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200/20">
                        <img src={msg.image} alt="Uploaded" className="max-w-full block" />
                      </div>
                    )}
                    {renderContent(msg.content)}
                  </div>
                  <div className={`mt-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'user' ? 'Source' : 'Compass'}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 px-5 py-4 rounded-full flex gap-1.5 items-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-8 bg-white/80 backdrop-blur-md border-t border-slate-100">
            <div className="max-w-3xl mx-auto space-y-4">
              {selectedImage && (
                <div className="relative inline-block group">
                  <img src={selectedImage.data} className="h-20 w-20 object-cover rounded-xl border-2 border-indigo-100 shadow-md" alt="Preview" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-white text-slate-500 rounded-full p-1 shadow-md border border-slate-100 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              <div className="relative flex items-center gap-2 bg-slate-50 rounded-2xl md:rounded-[2.2rem] p-1.5 md:p-2 border border-slate-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all duration-300">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-white"
                  aria-label="Upload image"
                >
                  <ImageIcon size={20} />
                </button>
                
                <textarea
                  rows={1}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    // Default behavior is newline on Enter.
                  }}
                  placeholder="今、何を感じていますか？"
                  className="flex-1 bg-transparent border-none py-3 px-2 focus:ring-0 resize-none text-sm md:text-base leading-tight placeholder:text-slate-400 max-h-32 custom-scrollbar overflow-y-auto"
                />
                
                <button 
                  onClick={handleSendMessage}
                  disabled={(!inputValue.trim() && !selectedImage) || isTyping}
                  className="p-3 bg-indigo-600 text-white rounded-xl md:rounded-full hover:bg-indigo-700 disabled:opacity-20 disabled:grayscale transition-all shadow-md shadow-indigo-100 flex items-center justify-center shrink-0"
                  aria-label="Send message"
                >
                  {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <p className="hidden md:block text-[9px] text-center text-slate-400 tracking-[0.4em] font-black uppercase opacity-60">
                Dialogue with your inner source
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-100">
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Info size={20}/>
                </div>
                <h3 className="font-black text-lg text-slate-800 tracking-tight">使い方のヒント</h3>
              </div>
              <button 
                onClick={() => setShowGuide(false)} 
                className="text-slate-400 hover:text-slate-900 p-2 rounded-full hover:bg-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 md:p-10 space-y-8">
              <div className="space-y-6">
                {GUIDE_ITEMS.map((item, i) => (
                  <div key={i} className="flex gap-5 group">
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-base transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                      {item.num}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm md:text-base mb-1">{item.title}</h4>
                      <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
                <Target size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  あなたはソースとして、この「クリエイティブ・フィールド」の全ての責任を持っています。ここでは自分に嘘をつかず、ありのままを対話してください。
                </p>
              </div>

              <button 
                onClick={() => setShowGuide(false)}
                className="w-full bg-slate-900 text-white py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] font-black text-sm hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                対話を開始する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
