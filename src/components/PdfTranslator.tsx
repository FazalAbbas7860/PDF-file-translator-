import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { 
  FileText, Upload, ArrowRight, Volume2, Download, RefreshCw, 
  Settings, CheckCircle2, AlertTriangle, Book, FileUp, Sparkles, AlertCircle
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TTS_VOICES, SavedItem } from '../types';

interface PdfTranslatorProps {
  onSaveItem: (item: Omit<SavedItem, 'id' | 'timestamp'>) => void;
  onGlobalSpeak: (text: string, langCode: string) => void;
}

export default function PdfTranslator({ onSaveItem, onGlobalSpeak }: PdfTranslatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('ur');
  const [ttsVoice, setTtsVoice] = useState('Kore');
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  // Drag and drop states
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        resetStates();
        await autoExtractText(droppedFile);
      } else {
        setErrorMessage("صرف پی ڈی ایف فائلز اپلوڈ کی جاسکتی ہیں۔ (Only PDF formats are supported.)");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      resetStates();
      await autoExtractText(selectedFile);
    }
  };

  const resetStates = () => {
    setExtractedText('');
    setTranslatedText('');
    setTtsAudioUrl(null);
    setErrorMessage('');
  };

  // 1. EXTRACT TEXT FROM PDF VIA EXPRESS API
  const autoExtractText = async (pdfFile: File) => {
    setIsExtracting(true);
    setErrorMessage('');
    
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const response = await fetch('/api/pdf/extract', {
        method: 'POST',
        body: formData,
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `سرور کی خرابی (${response.status}): پی ڈی ایف سے ٹیکسٹ نکالنے میں خرابی پیش آئی۔`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'پی ڈی ایف سے ٹیکسٹ نکالنے میں خرابی پیش آئی۔');
      }

      setExtractedText(data.text);
      if (!data.text || data.text.trim() === '') {
        setErrorMessage("ہمیں پی ڈی ایف سے کوئی لکھائی حاصل نہیں ہوئی۔ (No readable text extracted from PDF.)");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'کنکشن میں خرابی۔ سرور چیک کریں۔');
    } finally {
      setIsExtracting(false);
    }
  };

  // 2. TRANSLATE EXTRACED TEXT
  const handleTranslate = async () => {
    if (!extractedText.trim()) return;
    setIsTranslating(true);
    setErrorMessage('');

    try {
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extractedText,
          sourceLanguage: 'auto-detection',
          targetLanguage: langName,
        }),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `سرور کی خرابی (${response.status}): ترجمہ کرنے میں خرابی پیش آئی۔`);
      }

      if (!response.ok) {
         throw new Error(data.error || 'ترجمہ میں خرابی پیش آئی۔');
      }

      setTranslatedText(data.translatedText);
      setTtsAudioUrl(null); // Reset TTS audio on new translation

      // Save to global history
      onSaveItem({
        type: 'pdf',
        title: file ? file.name : 'PDF Translation',
        originalText: extractedText,
        translatedText: data.translatedText,
        sourceLang: 'auto',
        targetLang: targetLang,
      });

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Translation failed. Please check your system configuration.');
    } finally {
      setIsTranslating(false);
    }
  };

  // 3. GENERATE TEXT TO SPEECH (TTS) AUDIO
  const handleSynthesizeTts = async () => {
    if (!translatedText.trim()) return;
    setIsSynthesizing(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translatedText,
          voiceName: ttsVoice,
          langCode: targetLang,
        }),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `سرور کی خرابی (${response.status}): آواز بنانے میں ناکامی۔`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'آڈیو بنانے میں سرور فیل ہوا۔ Client TTS کا آزمائیں متبادل کے طور پر۔');
      }

      const audioBlobUrl = `data:${data.mimeType};base64,${data.audio}`;
      setTtsAudioUrl(audioBlobUrl);
      
      // Auto play generated voice
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.load();
          audioPlayerRef.current.play().catch(e => console.log("Auto-play blocked by browser. Click Play manually.", e));
        }
      }, 300);

    } catch (err: any) {
      console.error("Express TTS service failed, using client browser fallback speech:", err);
      // Fallback: Use client standard SpeechSynthesis client API
      onGlobalSpeak(translatedText, targetLang);
      setErrorMessage("سرور آڈیو سروس دستیاب نہیں۔ لوکل براؤزر سپیچ کا استعمال کیا گیا ہے۔ (Server TTS missed, using fallback browser voice.)");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 4. DOWNLOAD TRANSLATED TEXT AS NEW PDF
  const handleDownloadPdf = () => {
    if (!translatedText) return;

    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Tarjuma AI Translated Document", 15, 15);
      
      doc.setFontSize(10);
      doc.text(`Target Language: ${SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang}`, 15, 22);
      doc.text(`Source: ${file ? file.name : 'Uploaded File'}`, 15, 27);
      
      doc.setLineWidth(0.5);
      doc.line(15, 30, 195, 30);

      doc.setFontSize(11);
      
      // Split text into lines to avoid overflow in jsPDF
      const splitText = doc.splitTextToSize(translatedText, 175);
      doc.text(splitText, 15, 40);
      
      doc.save(`TarjumaAI_${file ? file.name.replace('.pdf', '') : 'document'}_translated.pdf`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to generate PDF document.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Bento-style control panel and upload grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Upload File Card (Bento col-span-5) */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`md:col-span-5 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col justify-center items-center gap-4 ${
            isDragActive 
              ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)] scale-102' 
              : file 
              ? 'border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/60' 
              : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/50'
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <FileUp className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <p className="font-bold text-slate-200 text-sm">
              {file ? file.name : 'Select or drag PDF file'}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • PDF` : 'Drag & drop or Click to browse'}
            </p>
          </div>
          <button className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-lg shadow-cyan-950/20">
            Choose File
          </button>
        </div>

        {/* Bento System Status & Language selector card (Bento col-span-7) */}
        <div className="md:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Target Localization</span>
              <span className="px-2 py-0.5 bg-emerald-950/30 text-emerald-400 border border-emerald-500/25 rounded text-[9px] uppercase font-bold tracking-wider">Engine: Gemini 3.5</span>
            </div>
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-cyan-500 rounded-full"></span>
              Translation Settings
            </h3>
            <p className="text-xs text-slate-400 mt-1">Welcome! Select your PDF document, set your target language, and generate an AI translation.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 font-medium font-mono">Choose Language:</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 font-medium font-mono">TTS Voice Speaker:</span>
              <select
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans"
              >
                {TTS_VOICES.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>OCR: Google Cloud Native</span>
            <span>Speed: Instant AI Proxy</span>
          </div>
        </div>

      </div>

      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-300 urdu-font leading-relaxed">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Main Translation Stage Panels */}
      {(file || isExtracting) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Output Box: Extracted Content */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full"></span> Extracted Text
              </span>
              {isExtracting && (
                <span className="text-xs text-cyan-400 animate-pulse flex items-center gap-1.5 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Extractor OCR Active...
                </span>
              )}
            </div>

            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Upload a PDF file. The extracted text will appear here automatically."
              className="w-full h-80 bg-slate-950/85 border border-slate-800/60 rounded-xl p-4 text-slate-300 text-sm focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 focus:outline-none resize-none font-sans leading-relaxed"
              disabled={isExtracting}
            ></textarea>

            {extractedText.trim() && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs rounded-xl transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-500/10"
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Translating...</span>
                    </>
                  ) : (
                    <>
                      <span>Translate Document</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Output Box: Translated Content */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span> Translation Output
              </span>
              {isTranslating && (
                <span className="text-xs text-purple-400 animate-pulse flex items-center gap-1.5 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Neural Translate Engine active...
                </span>
              )}
            </div>

            <textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              placeholder="The dynamic AI translation will appear here..."
              dir={targetLang === 'ur' || targetLang === 'ar' || targetLang === 'fa' ? 'rtl' : 'ltr'}
              className={`w-full h-80 bg-slate-950/85 border border-slate-800/60 rounded-xl p-4 text-slate-200 text-lg font-sans focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 focus:outline-none resize-none scroll-smooth select-all leading-relaxed ${
                targetLang === 'ur' || targetLang === 'ar' || targetLang === 'fa' ? 'text-right' : 'text-left'
              }`}
            ></textarea>

            {translatedText.trim() && (
              <div className="space-y-4">
                {/* Voice Control Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/65 shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-400 font-mono">TTS Native Sound:</span>
                    <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 text-[10px] font-mono rounded uppercase font-semibold border border-cyan-800/20">{ttsVoice} matched</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ttsAudioUrl && (
                      <audio ref={audioPlayerRef} src={ttsAudioUrl} controls className="h-6 max-w-[130px] outline-none" />
                    )}
                    <button
                      onClick={handleSynthesizeTts}
                      disabled={isSynthesizing}
                      className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
                    >
                      {isSynthesizing ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Generating Voice...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen Voice</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex justify-between items-center pt-2 gap-3.5">
                  <button
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Download PDF</span>
                  </button>

                  {ttsAudioUrl && (
                    <a
                      href={ttsAudioUrl}
                      download={`TarjumaAI_TTS_Speech.wav`}
                      className="px-4 py-2 border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Speech (WAV)</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
