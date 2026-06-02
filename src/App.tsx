import { useState, useEffect } from 'react';
import { SavedItem } from './types';
import Header from './components/Header';
import PdfTranslator from './components/PdfTranslator';
import VideoTranslator from './components/VideoTranslator';
import BatchTranslator from './components/BatchTranslator';
import HistoryList from './components/HistoryList';
import Documentation from './components/Documentation';
import { Sparkles, FileText, Video, History, HelpCircle, AudioWaveform as Waveform, Globe2, Archive } from 'lucide-react';
import { exportToPdf } from './utils/pdfGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pdf' | 'video' | 'batch' | 'history' | 'guide'>('pdf');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  // Load items from localstorage on mount
  useEffect(() => {
    const data = localStorage.getItem('tarjuma_ai_history');
    if (data) {
      try {
        setSavedItems(JSON.parse(data));
      } catch (e) {
        console.error("Failed to restore previous state log", e);
      }
    }
  }, []);

  // Save history items change
  const handleSaveItem = (item: Omit<SavedItem, 'id' | 'timestamp'>) => {
    const newItem: SavedItem = {
      ...item,
      id: `item_${Date.now()}`,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...savedItems];
    setSavedItems(updated);
    localStorage.setItem('tarjuma_ai_history', JSON.stringify(updated));
  };

  const handleDeleteItem = (id: string) => {
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    localStorage.setItem('tarjuma_ai_history', JSON.stringify(updated));
  };

  const handleClearAllHistory = () => {
    setSavedItems([]);
    localStorage.removeItem('tarjuma_ai_history');
  };

  // CLIENT SIDE STANDARD SPEECH SYNTHESIS ENGINE (FALLBACK / OFFLINE)
  const handleClientSpeak = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      // Cancel previous speak streams first
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Attempt to match the native voice if possible
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = null;
      
      if (langCode === 'ur') {
        // Find custom Urdu or Hindi voices for phonetic matches
        matchedVoice = voices.find(v => v.lang.includes('ur') || v.lang.includes('hi') || v.lang.includes('ar'));
      } else {
        matchedVoice = voices.find(v => v.lang.includes(langCode));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      
      utterance.rate = 0.95; // Slightly slower for clear narration
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support text-to-speech (TTS).");
    }
  };

  const handleDownloadPdf = (item: SavedItem) => {
    try {
      exportToPdf({
        title: "Tarjuma AI Translated Document",
        subtitle: `Target: ${item.targetLang.toUpperCase()} | Saved Ref: ${item.title}`,
        contentText: item.translatedText,
        langCode: item.targetLang,
        filename: `TarjumaAI_Export_${item.id}.pdf`
      });
    } catch (e) {
      console.error(e);
      alert("Failed to create PDF file export utilizing custom fonts.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      
      {/* Navbar segment */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} savedCount={savedItems.length} />

      {/* Main Container Core - Mobile First-padding to prevent overlap with sticky bottom toolbar */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 pb-24 md:py-8">
        
        {/* Responsive Hero Banner - compact on mobile, majestic on desktop */}
        <div className="text-center space-y-2 md:space-y-4 mb-4 md:mb-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] md:text-xs font-mono tracking-wider uppercase">
            <Globe2 className="w-3 md:w-3.5 h-3 md:h-3.5 animate-spin-slow" /> Fast Multilingual AI Translator
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Fully Automated <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">PDF & Video</span> Translator
          </h1>
          <p className="text-slate-400 text-xs md:text-base leading-relaxed hidden sm:block">
            Upload any PDF document or video/audio file. Transcribe dialogue, translate documents into arbitrary languages instantly, and generate high-fidelity vocal readouts with natural text-to-speech. Easily export results in standard PDF and audio formats.
          </p>
          <p className="text-slate-400 text-xs leading-relaxed sm:hidden px-2">
            Upload PDF or Media. Transcribe, translate, and synthesize voice with natural speech.
          </p>
        </div>

        {/* Selected Module State Renders */}
        <div className="bg-slate-900/10 border border-slate-800/40 rounded-2xl md:rounded-3xl p-3 sm:p-6 lg:p-8 backdrop-blur-sm shadow-xl min-h-[400px]">
          {activeTab === 'pdf' && (
            <PdfTranslator onSaveItem={handleSaveItem} onGlobalSpeak={handleClientSpeak} />
          )}

          {activeTab === 'video' && (
            <VideoTranslator onSaveItem={handleSaveItem} onGlobalSpeak={handleClientSpeak} />
          )}

          {activeTab === 'batch' && (
            <BatchTranslator onSaveItem={handleSaveItem} onGlobalSpeak={handleClientSpeak} />
          )}

          {activeTab === 'history' && (
            <HistoryList 
              items={savedItems} 
              onDelete={handleDeleteItem} 
              onClearAll={handleClearAllHistory}
              onSelect={(item) => alert(`Selected ${item.title}`)}
              onSpeak={handleClientSpeak}
              onDownloadPdf={handleDownloadPdf}
            />
          )}

          {activeTab === 'guide' && (
            <Documentation />
          )}
        </div>

      </main>

      {/* Footer Block */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Tarjuma AI Translator • Free & Open Source Technical Suite • ML Powered</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Gemini Ready</span>
            <span>Local Time: 14:00 UTC</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
