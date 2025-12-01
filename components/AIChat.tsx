import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { generateAIResponse } from '../services/ai';
import { AI_PROMPTS } from '../constants';
import { MessageSquare, X, Send, Sparkles, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';
import { AIMessage, AIAction } from '../types';
import { isShopAIEnabled } from '../services/adminStorage';

export const AIChat: React.FC = () => {
  const { t, language, updateStock, settings, currentUser, ...appState } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Suggested Prompts
  const prompts = AI_PROMPTS[language] || AI_PROMPTS['en'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Check if AI is enabled for this shop
  const shopId = settings?.shopId;
  if (!shopId) return null; // Don't show if no shop ID
  
  const isAIEnabled = isShopAIEnabled(shopId);

  // If AI is disabled for this shop, don't render the button
  if (!isAIEnabled) return null;

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    
    const shopId = settings?.shopId || '';
    const userId = currentUser?.id || 'unknown';
    const userName = currentUser?.fullName || 'Unknown User';
    const shopName = settings?.businessName || 'Unknown Shop';
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: text, timestamp: Date.now() }]);
    setLoading(true);

    try {
      const responseStr = await generateAIResponse(
        text, 
        appState as any, 
        language,
        shopId,
        userId,
        userName,
        shopName
      );
      let parsedResponse: { type: string, text: string, action?: any };
      
      try {
        parsedResponse = JSON.parse(responseStr);
      } catch (e) {
        // Fallback for non-JSON response
        parsedResponse = { type: 'text', text: responseStr };
      }

      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: parsedResponse.text, 
        action: parsedResponse.type === 'action' ? parsedResponse.action : undefined,
        timestamp: Date.now() 
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, something went wrong.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = (action: AIAction) => {
    try {
        if (action.type === 'RESTOCK') {
            const { id, amount, unit } = action.payload;
            updateStock(id, Number(amount), unit === 'carton' ? 'carton' : 'unit');
            alert(t('actionExecuted'));
            // Add a system confirmation message
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: `✅ ${t('actionExecuted')}: ${action.summary}`, 
                timestamp: Date.now() 
            }]);
        }
        // Handle other actions...
    } catch (e) {
        alert("Failed to execute action");
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-110 transition-all z-50 group"
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full sm:w-[400px] sm:bottom-24 sm:right-8 h-[85vh] sm:h-[600px] bg-white sm:rounded-3xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
             <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">{t('aiHelp')}</h3>
            <p className="text-[10px] text-indigo-100 opacity-80">Powered by Gemini</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setMessages([])} className="hover:bg-white/10 p-2 rounded-full transition-colors" title={t('clearChat')}>
                <Zap className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
            <Sparkles className="w-16 h-16 mb-4 text-indigo-300" />
            <h4 className="text-xl font-bold text-gray-700 mb-2">How can I help?</h4>
            <p className="text-sm text-gray-500">Ask about sales, inventory, profit, or just chat!</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm leading-relaxed relative ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}>
              {/* Markdown-ish rendering for simple tables/bold */}
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ 
                  __html: msg.text
                    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
                    .replace(/\n/g, '<br/>') // Line breaks
                }} 
              />
              <span className="text-[9px] opacity-50 block text-right mt-1">{new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>

            {/* Action Card */}
            {msg.role === 'ai' && msg.action && (
                <div className="mt-2 ml-2 bg-white border border-indigo-100 p-4 rounded-xl shadow-md w-[85%] animate-in slide-in-from-left-5">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs text-indigo-500 font-bold uppercase tracking-wide">Suggested Action</p>
                            <p className="text-sm font-semibold text-gray-800">{msg.action.summary}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => msg.action && executeAction(msg.action)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        {t('applyAction')} <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (Chips) */}
      <div className="relative bg-white border-t border-gray-100">
        <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>
        <div className="p-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
           <div className="grid grid-rows-2 grid-flow-col gap-2 w-max">
               {prompts.map((p, i) => (
                   <button 
                       key={i} 
                       onClick={() => handleSend(p)}
                       className="px-4 py-2 bg-gray-50 hover:bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm rounded-xl text-xs font-medium text-gray-600 transition-all text-left max-w-[200px] truncate"
                   >
                       {p}
                   </button>
               ))}
           </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-200 pb-safe">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            }}
            placeholder={t('aiPromptPlaceholder')}
            className="flex-1 border border-gray-200 bg-gray-50 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-sm text-gray-900 max-h-24 placeholder-gray-400"
            rows={1}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="bg-indigo-600 text-white w-10 h-10 rounded-full hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center shrink-0 mb-0.5 transition-colors shadow-lg shadow-indigo-200"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};