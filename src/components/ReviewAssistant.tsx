import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Bot, User as UserIcon, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type Message = { role: 'user' | 'assistant'; content: string };

const SUGGESTED_QUERIES = [
  'Summarize the biggest risks in this plan',
  'How strong is my competition?',
  'Is the market size realistic?',
  'What should I ask the financial agent to focus on?',
];

export default function ReviewAssistant({ threadId }: { threadId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || !threadId || loading) return;

    const userMsg: Message = { role: 'user', content: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/assistant/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          thread_id: threadId,
          question: question.trim(),
          history: messages,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Assistant error (${res.status})`);
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="border border-white/[0.06] bg-[#111118] rounded-xl overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-[#6C47FF]/10 to-[#00D4AA]/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">Research Assistant</h3>
          <p className="text-xs text-[#888899]">Ask questions about the analysis so far</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-4">
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-[#6C47FF]/10 flex items-center justify-center mx-auto mb-3">
                <Bot className="w-6 h-6 text-[#6C47FF]" />
              </div>
              <p className="text-sm font-bold text-white mb-1">Ask me anything about your analysis</p>
              <p className="text-xs text-[#888899]">I have context of the market research, competitors, and business plan.</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#555566]">Suggested questions</p>
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left px-4 py-2.5 rounded-lg border border-white/[0.06] bg-[#0D0D14] hover:bg-[#1A1A22] hover:border-[#6C47FF]/40 text-sm text-[#E0E0EE] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user'
                ? 'bg-[#00D4AA]/10 border border-[#00D4AA]/30'
                : 'bg-gradient-to-br from-[#6C47FF] to-[#00D4AA]'
            }`}>
              {msg.role === 'user' ? (
                <UserIcon className="w-4 h-4 text-[#00D4AA]" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
            </div>
            <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[#00D4AA]/10 border border-[#00D4AA]/20 text-[#E0E0EE]'
                  : 'bg-[#0D0D14] border border-white/[0.06] text-[#F0F0F0]'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C47FF] to-[#00D4AA] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0D0D14] border border-white/[0.06]">
              <Loader2 className="w-4 h-4 text-[#6C47FF] animate-spin" />
              <span className="text-sm text-[#888899]">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-lg border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF6B6B] text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06] bg-[#0D0D14]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={threadId ? 'Ask about the analysis...' : 'Waiting for run to start...'}
            disabled={loading || !threadId}
            className="flex-1 bg-[#111118] border border-white/[0.08] focus:border-[#6C47FF]/40 rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#555566] focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim() || !threadId}
            className="px-4 rounded-lg bg-[#6C47FF] hover:bg-[#7D5AFF] disabled:bg-[#222233] disabled:text-[#555566] text-white transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-[#555566] mt-2 text-center">
          Grounded in the actual pipeline output — no fabricated answers.
        </p>
      </div>
    </div>
  );
}
