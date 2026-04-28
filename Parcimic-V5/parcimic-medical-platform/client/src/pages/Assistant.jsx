import React, { useState, useRef, useEffect } from 'react';
import { Send, Shield, RefreshCw, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { llmChat } from '../utils/api';

const SUGGESTIONS = [
  'Am I okay based on my result?',
  'What is sepsis in simple terms?',
  'When should I go to the hospital?',
  'What does a high heart rate mean?',
  'How can I lower my fever at home?',
  'What are early warning signs to watch for?',
  'What does low oxygen level mean?',
  'How much water should I drink when sick?',
];

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
      {!isUser && (
        <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
          <Shield size={14} className="text-brand-500" strokeWidth={2.5} />
        </div>
      )}
      <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        <p className={`text-2xs mt-2 ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function Assistant() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! I'm Parcimic AI — your personal health assistant.\n\nI can help you understand your health check results, explain what certain readings mean, and guide you on what to do next.\n\nWhat would you like to know?",
    ts: Date.now(),
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setMessages((p) => [...p, { role: 'user', content, ts: Date.now() }]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const data = await llmChat({ message: content, history });
      setMessages((p) => [...p, { role: 'assistant', content: data.reply || "I'm not sure about that. Could you rephrase?", ts: Date.now() }]);
    } catch {
      toast.error('Could not get a response. Please try again.');
      setMessages((p) => [...p, { role: 'assistant', content: "Sorry, I had trouble responding. Please try again in a moment.", ts: Date.now() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ask Parcimic AI</h1>
          <p className="text-sm text-gray-500 mt-1">Get simple, clear answers about your health</p>
        </div>
        <button
          onClick={() => setMessages([{ role: 'assistant', content: "Chat cleared. What would you like to know?", ts: Date.now() }])}
          className="btn-ghost btn btn-sm">
          <RefreshCw size={13} strokeWidth={2} /> Clear
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Chat window */}
        <div className="lg:col-span-2 card flex flex-col" style={{ height: '520px' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
              <Shield size={16} className="text-brand-500" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Parcimic AI</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-success-500 rounded-full" />
                <span className="text-xs text-gray-400">Online · Always here to help</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
            {loading && (
              <div className="flex gap-3 animate-slide-up">
                <div className="w-8 h-8 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
                  <Shield size={14} className="text-brand-500" strokeWidth={2.5} />
                </div>
                <div className="bubble-ai flex items-center gap-2 py-3">
                  {[0, 150, 300].map((d) => (
                    <div key={d} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="flex gap-2">
              <input ref={inputRef} value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
                placeholder="Ask anything about your health..."
                disabled={loading} className="input flex-1" />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="btn-primary btn px-4">
                <Send size={15} strokeWidth={2} />
              </button>
            </div>
            <p className="text-2xs text-gray-400 mt-2">Press Enter to send</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <p className="section-label">Suggested Questions</p>
            <div className="space-y-1">
              {SUGGESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)} disabled={loading}
                  className="w-full flex items-center gap-2 text-left text-xs text-gray-600 hover:text-brand-600 hover:bg-brand-50 px-3 py-2.5 rounded-lg transition-colors border border-transparent hover:border-brand-100">
                  <ChevronRight size={12} className="text-gray-300 shrink-0" strokeWidth={2.5} />
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4">
            <p className="section-label">Disclaimer</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Parcimic AI provides general health information only. Always consult a qualified doctor for medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
