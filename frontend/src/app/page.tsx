'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistoryItem {
  id: string;
  userMessage: string;
  aiReply: string;
  createdAt: string;
}

export default function ChatPage() {
  const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/chats');
        if (!response.ok) throw new Error('Failed to fetch chat history');
        const data: ChatHistoryItem[] = await response.json();
        
        // Show chats in order oldest to newest. NestJS returns them DESC (newest first).
        const sortedChats = [...data].reverse();
        
        const history: Message[] = [];
        for (const chat of sortedChats) {
          history.push({ role: 'user', content: chat.userMessage });
          history.push({ role: 'assistant', content: chat.aiReply });
        }
        setHistoryMessages(history);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, historyMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: [...historyMessages, ...messages].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch reply');

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAnyMessages = historyMessages.length > 0 || messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-white border-b p-4 shadow-sm z-10">
        <h1 className="text-xl font-bold text-gray-800 text-center">k8s learning</h1>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasAnyMessages && !isLoading && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Start a conversation...
          </div>
        )}

        {/* Loaded History */}
        {historyMessages.map((msg, index) => (
          <div
            key={`history-${index}`}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600/80 text-white rounded-br-none border border-blue-500/20 backdrop-blur-sm'
                  : 'bg-white/95 text-gray-800 border border-gray-200/50 rounded-bl-none backdrop-blur-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Premium Divider separating Loaded History from Current Session */}
        {historyMessages.length > 0 && (
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
            <span className="px-5 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400 bg-slate-800/90 border border-slate-700 rounded-full shadow-lg select-none backdrop-blur-md">
              Loaded History
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
          </div>
        )}

        {/* Current Active Session Messages */}
        {messages.map((msg, index) => (
          <div
            key={`session-${index}`}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading / Typing indicator */}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white text-gray-400 border p-3 rounded-lg rounded-bl-none italic">
              AI is typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
