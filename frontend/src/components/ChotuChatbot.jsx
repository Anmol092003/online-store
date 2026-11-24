import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  DollarSign,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

const CHOTU_BASE_URL = 'http://localhost:8083';

export default function ChotuChatbot() {
  const { user } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Namaste Admin! I am **Chotu**, your store operations AI assistant. You can ask me for **sales insights**, **inventory levels**, **low-stock alerts**, or speaking directly using the microphone button below."
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Strictly for ADMIN only
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // English (India) / also understands global English

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied.');
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechError('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSendMessage = async (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage = { role: 'user', content: trimmed };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputText('');
    setLoading(true);

    try {
      const token = localStorage.getItem('bazaar_token');
      const response = await fetch(`${CHOTU_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: trimmed,
          history: updatedHistory.slice(-6)
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied: Admin privileges required.');
        }
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          guardrailTriggered: data.guardrail_triggered
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "⚠️ **Could not connect to Chotu service.**\n\nPlease ensure the Python FastAPI service is running on port **8083**:\n```bash\ncd backend/chotu-bhat-bat\npython -m uvicorn main:app --port 8083 --reload\n```",
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared. What store analytics or inventory details can I fetch for you?"
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button for Admin */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Chotu AI Admin Assistant"
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#1E6B52] to-[#15533F] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Bot className="w-5 h-5 text-amber-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#1E6B52]" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold leading-tight flex items-center gap-1">
                Chotu AI <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
              <div className="text-[10px] text-emerald-100 font-medium">Admin Intelligence</div>
            </div>
          </button>
        )}
      </div>

      {/* Slide-Up Chat Window */}
      {isOpen && (
        <div
          role="region"
          aria-labelledby="chotu-heading"
          className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[430px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#1E6B52] to-[#15533F] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
                <Bot className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 id="chotu-heading" className="text-sm font-bold flex items-center gap-1.5">
                  Chotu AI
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-full">
                    Admin
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-emerald-200" /> Sales, Inventory & Guardrails
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                title="Clear conversation"
                className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close Chotu"
                className="p-2 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick-Prompt Suggestions */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <button
              onClick={() => handleSendMessage("What are our latest sales insights and revenue?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
            >
              <TrendingUp className="w-3 h-3 text-[#1E6B52]" /> Sales Insights
            </button>
            <button
              onClick={() => handleSendMessage("Which products are low on stock?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition flex items-center gap-1 shadow-2xs"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock
            </button>
            <button
              onClick={() => handleSendMessage("Show total inventory valuation and summary")}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition flex items-center gap-1 shadow-2xs"
            >
              <DollarSign className="w-3 h-3 text-emerald-600" /> Inventory Value
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-[#1E6B52] text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-[#1E6B52] text-white rounded-tr-xs'
                      : msg.guardrailTriggered
                      ? 'bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-1">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-white border border-slate-200 rounded-2xl px-4 py-2.5 w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#1E6B52] animate-spin" />
                Chotu is analyzing store data...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Speech Status Notice */}
          {isListening && (
            <div className="px-4 py-1.5 bg-red-50 text-red-700 text-xs flex items-center justify-between border-t border-red-200 animate-pulse">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Listening to speech... Speak your question now!
              </span>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className="text-[10px] uppercase font-bold underline cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}

          {speechError && (
            <div className="px-4 py-1 bg-amber-50 text-amber-800 text-[11px] border-t border-amber-200">
              {speechError}
            </div>
          )}

          {/* Input Footer with Speech Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            {/* Speaking / Mic Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? 'Stop listening' : 'Speak with Chotu (Speech to Text)'}
              className={`p-2.5 rounded-xl transition duration-200 flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-bounce shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Input Field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening to your voice...' : 'Ask Chotu about sales or inventory...'}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#1E6B52] focus:bg-white transition"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2.5 rounded-xl bg-[#1E6B52] text-white hover:bg-[#15533F] disabled:opacity-40 transition shrink-0"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
