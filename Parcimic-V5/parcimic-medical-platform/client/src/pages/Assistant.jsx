import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, MessageCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { llmChat } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { 
  getSystemPrompt, 
  buildPromptWithContext, 
  extractUserData 
} from '../utils/healthContext';

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  const isBlocked = msg.blocked;
  
  return (
    <div className={`flex gap-3 md:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      {!isUser && (
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-md ${
          isBlocked ? 'bg-warning-500' : 'bg-gradient-to-br from-brand-500 to-brand-600'
        }`}>
          {isBlocked ? (
            <AlertCircle size={16} className="text-white" strokeWidth={2} />
          ) : (
            <MessageCircle size={16} className="text-white" strokeWidth={2} />
          )}
        </div>
      )}
      <div className={`max-w-[88%] md:max-w-[75%] lg:max-w-[70%] min-w-0 ${
        isUser 
          ? 'bg-brand-600 text-white rounded-2xl rounded-tr-md px-4 md:px-5 py-3 md:py-4 text-sm md:text-base shadow-sm'
          : isBlocked 
            ? 'bg-warning-50 border border-warning-200 text-gray-800 rounded-2xl rounded-tl-md px-4 md:px-5 py-3 md:py-4 text-sm md:text-base shadow-sm' 
            : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-md px-4 md:px-5 py-3 md:py-4 text-sm md:text-base shadow-sm'
      }`}>
        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
        <p className={`text-[10px] md:text-xs mt-2 ${isUser ? 'text-white/70' : 'text-gray-400'}`}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'What does my risk score mean?',
  'What is sepsis in simple terms?',
  'When should I go to the hospital?',
  'What does a high heart rate mean?',
  'How can I lower my fever at home?',
  'What are early warning signs?',
];

export default function Assistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! I'm Parcimic AI — your personal health assistant.\n\nI can help you understand your health check results, explain what certain readings mean, and guide you on what to do next.\n\nWhat would you like to know?",
    ts: Date.now(),
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Load user health data for context
  useEffect(() => {
    if (!user) return;
    
    const loadUserData = async () => {
      try {
        const predQuery = query(
          collection(db, 'predictions'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const predSnap = await getDocs(predQuery);
        const lastResult = predSnap.empty ? null : predSnap.docs[0].data();

        const medQuery = query(
          collection(db, 'medications'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const medSnap = await getDocs(medQuery);
        const medications = medSnap.docs.map(d => d.data());

        const symQuery = query(
          collection(db, 'symptoms'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const symSnap = await getDocs(symQuery);
        const recentSymptoms = symSnap.empty ? null : symSnap.docs[0].data();

        setUserData(extractUserData(lastResult, medications, recentSymptoms));
      } catch (err) {
        console.error('[Assistant] Failed to load user data:', err);
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setMessages((p) => [...p, { role: 'user', content, ts: Date.now() }]);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = getSystemPrompt();
      const userPrompt = buildPromptWithContext(content, userData);
      
      const history = messages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await llmChat({ 
        message: userPrompt, 
        history,
        systemPrompt 
      });

      let response = data.reply || "I'm not sure about that. Could you rephrase?";

      if (response.length > 600) {
        response = response.substring(0, 600) + '...';
      }

      setMessages((p) => [...p, { 
        role: 'assistant', 
        content: response, 
        ts: Date.now() 
      }]);

    } catch (err) {
      console.error('[Assistant] Error:', err);
      toast.error('Could not get a response. Please try again.');
      setMessages((p) => [...p, { 
        role: 'assistant', 
        content: "Sorry, I had trouble responding. Please try again.", 
        ts: Date.now() 
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      
      {/* Desktop: Centered chat container */}
      <div className="flex-1 min-h-0 flex items-stretch lg:items-center justify-center overflow-hidden p-0 lg:p-6">
        <div className="w-full lg:max-w-4xl xl:max-w-5xl h-full flex flex-col lg:rounded-xl lg:shadow-lg lg:border lg:border-gray-200 bg-white overflow-hidden">

          {/* Title bar */}
          <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-4 bg-brand-600 lg:bg-white lg:border-b lg:border-gray-200 shrink-0 lg:rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white lg:bg-brand-500 rounded-full flex items-center justify-center shadow-lg lg:shadow-none">
                <MessageCircle size={18} className="text-brand-500 lg:text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-base font-semibold text-white lg:text-gray-900">Parcimic AI</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 lg:bg-success-500 rounded-full animate-pulse" />
                  <p className="text-xs text-white/90 lg:text-gray-400">Online</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setMessages([{ role: 'assistant', content: "Chat cleared. What would you like to know?", ts: Date.now() }])}
              className="btn btn-sm bg-white/20 lg:bg-gray-100 text-white lg:text-gray-700 border-0 lg:border lg:border-gray-200 hover:bg-white/30 lg:hover:bg-gray-200 px-3">
              <RefreshCw size={14} strokeWidth={2} /> Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 lg:px-8 py-5 md:py-6 space-y-5 md:space-y-6 bg-gray-50/50">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pb-3">
                {SUGGESTIONS.map((q) => (
                  <button key={q} onClick={() => send(q)} disabled={loading}
                    className="text-xs md:text-sm text-brand-600 bg-white border border-brand-200 hover:border-brand-400 hover:bg-brand-50 hover:shadow-sm px-3.5 py-2.5 rounded-full transition-all font-medium touch-manipulation active:scale-95">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

            {loading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-md">
                  <MessageCircle size={16} className="text-white" strokeWidth={2} />
                </div>
                <div className="bubble-ai flex items-center gap-2 py-4">
                  {[0, 150, 300].map((d) => (
                    <div key={d} className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 md:px-6 lg:px-8 py-4 bg-white border-t border-gray-200 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] lg:rounded-b-xl">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask about your health..."
                disabled={loading}
                className="input flex-1 text-sm md:text-base shadow-sm"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="btn-primary btn px-5 shrink-0 disabled:opacity-40 shadow-md hover:shadow-lg transition-shadow">
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Health guidance only • Not a substitute for professional medical advice
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
