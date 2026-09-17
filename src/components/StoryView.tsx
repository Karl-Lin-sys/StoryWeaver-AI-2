import React, { useState, useRef, useEffect } from 'react';
import { StoryState } from '../types';
import { Volume2, Loader2, Send, RefreshCw, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  state: StoryState;
  onSendMessage: (text: string) => Promise<void>;
  onReset: () => void;
}

export function StoryView({ state, onSendMessage, onReset }: Props) {
  const [playing, setPlaying] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.history]);

  const handleReadAloud = async () => {
    if (audioUrl) {
      if (playing) {
        audioRef.current?.pause();
        setPlaying(false);
      } else {
        audioRef.current?.play();
        setPlaying(true);
      }
      return;
    }

    setTtsLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: state.openingParagraph })
      });

      if (!res.ok) throw new Error('Failed to generate audio');

      const data = await res.json();
      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.onended = () => setPlaying(false);
      
      audio.play();
      setPlaying(true);
    } catch (err) {
      console.error(err);
      alert("Failed to play audio.");
    } finally {
      setTtsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const msg = input.trim();
    setInput('');
    setChatLoading(true);
    try {
      await onSendMessage(msg);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left Column: Image and Opening */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl overflow-hidden shadow-sm border border-stone-200 bg-white"
        >
          {state.image && (
            <img 
              src={state.image.url} 
              alt="Story inspiration" 
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-serif text-stone-900">Chapter One</h2>
              <button
                onClick={handleReadAloud}
                disabled={ttsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full font-medium transition-colors text-sm disabled:opacity-50"
              >
                {ttsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                {playing ? 'Pause' : 'Read Aloud'}
              </button>
            </div>
            
            <p className="text-stone-700 leading-relaxed font-serif text-lg whitespace-pre-wrap">
              {state.openingParagraph}
            </p>
          </div>
        </motion.div>
        
        <button
          onClick={onReset}
          className="self-start flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Start a new story
        </button>
      </div>

      {/* Right Column: Chat Interface */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm h-[600px]">
        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <h3 className="font-semibold text-stone-800">Continue the Story</h3>
          <p className="text-xs text-stone-500">Guide the characters or explore the world.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-stone-50/30">
          <AnimatePresence initial={false}>
            {state.history.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white border border-stone-200 text-stone-700 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">
                    {msg.text}
                  </p>
                </div>
              </motion.div>
            ))}
            
            {chatLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 flex-row"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-stone-100 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What happens next?"
            className="flex-1 bg-stone-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-full px-5 py-3 text-sm outline-none transition-all"
            disabled={chatLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || chatLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shrink-0 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
