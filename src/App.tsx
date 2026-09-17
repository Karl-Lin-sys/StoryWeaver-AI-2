/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { StoryView } from './components/StoryView';
import { StoryState } from './types';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<StoryState>({
    image: null,
    openingParagraph: null,
    history: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const mimeType = file.type;
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const url = URL.createObjectURL(file);

      setState(prev => ({ ...prev, image: { base64, mimeType, url } }));

      // Fetch the story
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate story');
      }

      const data = await res.json();
      setState(prev => ({
        ...prev,
        openingParagraph: data.story
      }));
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    // Add user message to history
    setState(prev => ({
      ...prev,
      history: [...prev.history, { role: "user", text }]
    }));

    try {
      // Send chat request
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           history: [
             { role: "model", text: state.openingParagraph! },
             ...state.history
           ],
           message: text
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const data = await res.json();
      setState(prev => ({
        ...prev,
        history: [...prev.history, { role: "model", text: data.reply }]
      }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="py-5 px-8 flex items-center justify-between border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-800">StoryWeaver AI</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10">
        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 shadow-sm flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {!state.openingParagraph && !loading ? (
          <ImageUploader onUpload={handleImageUpload} />
        ) : loading && !state.openingParagraph ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-6">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-stone-500 font-medium animate-pulse text-lg tracking-wide">Analyzing image and weaving story...</p>
          </div>
        ) : (
          <StoryView 
            state={state} 
            onSendMessage={handleSendMessage}
            onReset={() => setState({ image: null, openingParagraph: null, history: [] })}
          />
        )}
      </main>
    </div>
  );
}
