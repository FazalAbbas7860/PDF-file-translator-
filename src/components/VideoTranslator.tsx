import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Video, Upload, ArrowRight, Volume2, Download, RefreshCw, 
  Settings, CheckCircle2, AlertTriangle, Book, Film, Speaker, Sparkles, AlertCircle, Play, FileText
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, TTS_VOICES, SavedItem, SubtitleBlock } from '../types';

interface VideoTranslatorProps {
  onSaveItem: (item: Omit<SavedItem, 'id' | 'timestamp'>) => void;
  onGlobalSpeak: (text: string, langCode: string) => void;
}

export default function VideoTranslator({ onSaveItem, onGlobalSpeak }: VideoTranslatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  const [fullText, setFullText] = useState('');
  const [subtitles, setSubtitles] = useState<SubtitleBlock[]>([]);
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('ur');
  const [ttsVoice, setTtsVoice] = useState('Puck');
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
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav'];
      if (validTypes.includes(droppedFile.type) || droppedFile.name.endsWith('.mp4') || droppedFile.name.endsWith('.mp3') || droppedFile.name.endsWith('.wav') || droppedFile.name.endsWith('.mov')) {
        setFile(droppedFile);
        resetStates();
        await autoTranscribeMedia(droppedFile);
      } else {
        setErrorMessage("صرف آڈیو اور ویڈیو فائلز اپلوڈ کی جاسکتی ہیں۔ (Only audio and video formats are supported.)");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      resetStates();
      await autoTranscribeMedia(selectedFile);
    }
  };

  const resetStates = () => {
    setFullText('');
    setSubtitles([]);
    setTranslatedText('');
    setTtsAudioUrl(null);
    setErrorMessage('');
  };

  // 1. UPLOAD AND TRANSCRIBE SPEECH FROM MEDIA
  const autoTranscribeMedia = async (mediaFile: File) => {
    setIsTranscribing(true);
    setErrorMessage('');
    
    try {
      const formData = new FormData();
      formData.append('file', mediaFile);

      const response = await fetch('/api/video/transcribe', {
        method: 'POST',
        body: formData,
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `سرور کی خرابی (${response.status}): اسپیچ پروسیسنگ میں خرابی پیش آئی۔`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'ٹرانسکرپٹ اور اسپیچ پروسیسنگ میں خرابی پیش آئی۔');
      }

      setFullText(data.fullText);
      setSubtitles(data.subtitles || []);
      
      if (!data.fullText) {
        setErrorMessage("ہمیں کوئی گفتگو ریکارڈنگ سے نہیں ملی۔ (Could not detect clear speech audio.)");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'سرور سیٹ اپ سے کنکشن بند ہے۔ جیمنائی سروس چیک کریں۔');
    } finally {
      setIsTranscribing(false);
    }
  };

  // 2. TRANSLATE EXTRACED SPEECH TEXT
  const handleTranslate = async () => {
    if (!fullText.trim()) return;
    setIsTranslating(true);
    setErrorMessage('');

    try {
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullText,
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
         throw new Error(data.error || 'Translation operation failed.');
      }

      setTranslatedText(data.translatedText);
      setTtsAudioUrl(null); // Reset TTS audio on new translation

      // Save to global history
      onSaveItem({
        type: 'video',
        title: file ? file.name : 'Video Transcript Translation',
        originalText: fullText,
        translatedText: data.translatedText,
        sourceLang: 'auto',
        targetLang: targetLang,
        subtitles: subtitles,
      });

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Technical issue with translation service.');
    } finally {
      setIsTranslating(false);
    }
  };

  // 3. GENERATE AUDIO VOICE FOR TRANSLATED TRANSCRIPT
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
        throw new Error(data.error || 'TTS audio voice generation failed.');
      }

      const audioBlobUrl = `data:${data.mimeType};base64,${data.audio}`;
      setTtsAudioUrl(audioBlobUrl);
      
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.load();
          audioPlayerRef.current.play().catch(e => console.log("Voice Auto-play block.", e));
        }
      }, 300);

    } catch (err: any) {
      console.error(err);
      // Fallback
      onGlobalSpeak(translatedText, targetLang);
      setErrorMessage("سرور آڈیو سروس ناقص۔ لوکل متبادل اسپیچ کا آغاز کر دیا گیا ہے۔");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // 4. EXPORT SRT SUBTITLES FILE
  const handleDownloadSrt = () => {
    if (subtitles.length === 0) return;
    
    let srtContent = '';
    subtitles.forEach((sub, index) => {
      const blockNum = index + 1;
      const cleanTime = sub.time.includes(':') ? sub.time : `00:${sub.time}`;
      
      // Construct start and approximate next end times (e.g., +4s)
      const parts = cleanTime.split(':');
      let mins = parseInt(parts[0]) || 0;
      let secs = parseInt(parts[1]) || 0;
      
      let nextMins = mins;
      let nextSecs = secs + 4;
      if (nextSecs >= 60) {
        nextSecs -= 60;
        nextMins += 1;
      }
      
      const pad = (n: number) => String(n).padStart(2, '0');
      
      const startTimeStr = `00:${pad(mins)}:${pad(secs)},000`;
      const endTimeStr = `00:${pad(nextMins)}:${pad(nextSecs)},000`;
      
      srtContent += `${blockNum}\n${startTimeStr} --> ${endTimeStr}\n${sub.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/srt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TarjumaAI_${file ? file.name.split('.')[0] : 'transcription'}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. DOWNLOAD SUBTITLES TRANSCRIPT TXT
  const handleDownloadTxtTranscript = () => {
    let text = `AI SUBTITLE TIMELINE TRANSCRIPT\nSource: ${file ? file.name : 'Media File'}\n=====================\n\n`;
    subtitles.forEach(sub => {
      text += `[${sub.time}]  ${sub.text}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TarjumaAI_${file ? file.name.split('.')[0] : 'transcript'}_subtitles.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,audio/mp3,audio/mpeg,audio/wav,audio/ogg" 
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
            <Film className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <p className="font-bold text-slate-200 text-sm">
              {file ? file.name : 'Select or drag a video or audio file'}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Media` : 'MP4, MOV, AVI, MP3, WAV (Max 25MB)'}
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
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Whisper Voice Core</span>
              <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/20 rounded text-[9px] uppercase font-bold tracking-wider">Engine: Gemini MultiModal</span>
            </div>
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-cyan-500 rounded-full"></span>
              Speech Translation Settings
            </h3>
            <p className="text-xs text-slate-400 mt-1">Upload an audio or video file. Automatically transcribe dialogue and translate speech into any other language using Artificial Intelligence.</p>
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
            <span>Speech Recognizer: Whisper Large v3</span>
            <span>Synthesizer: Google TTS Cloud</span>
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

      {/* Structured Media Panels */}
      {(file || isTranscribing) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Subtitles Timelines column */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full"></span> Speech Subtitles Timeline
              </span>
              {isTranscribing && (
                <span className="text-xs text-cyan-400 animate-pulse flex items-center gap-1.5 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Auto Speech transcribe...
                </span>
              )}
            </div>

            {/* Display Subtitles Timeline list */}
            {subtitles.length > 0 ? (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                {subtitles.map((sub, i) => (
                  <div key={i} className="flex gap-3 hover:bg-slate-900/40 p-2 rounded-lg transition-all group border border-transparent hover:border-slate-800/40">
                    <span className="font-mono text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 h-film py-0.5 px-2 rounded-md">
                      {sub.time}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans flex-1">
                      {sub.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                value={fullText}
                onChange={(e) => setFullText(e.target.value)}
                placeholder="The dynamic AI transcription will appear here once audio/video is analyzed..."
                className="w-full h-80 bg-slate-950/85 border border-slate-800/60 rounded-xl p-4 text-slate-300 text-sm focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 focus:outline-none resize-none font-sans leading-relaxed"
                disabled={isTranscribing}
              ></textarea>
            )}

            {/* Bottom tools for timelines */}
            {subtitles.length > 0 && (
              <div className="flex gap-2 justify-between border-t border-slate-800/60 pt-3">
                <button
                  onClick={handleDownloadSrt}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-[11px] text-cyan-400 flex items-center gap-1 border border-cyan-500/15 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download SRT Subtitles
                </button>
                <button
                  onClick={handleDownloadTxtTranscript}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-[11px] text-slate-300 flex items-center gap-1 border border-slate-800 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Download Timeline Text
                </button>
              </div>
            )}

            {fullText.trim() && (
              <div className="flex justify-end border-t border-slate-800/40 pt-3">
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
                      <span>Translate dialogue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Translation side column */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span> Media Speech Translation
              </span>
              {isTranslating && (
                <span className="text-xs text-purple-400 animate-pulse flex items-center gap-1.5 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Translation active...
                </span>
              )}
            </div>

            <textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              placeholder="The speech translation output will appear here..."
              dir={targetLang === 'ur' || targetLang === 'ar' || targetLang === 'fa' ? 'rtl' : 'ltr'}
              className={`w-full h-80 bg-slate-950/85 border border-slate-800/60 rounded-xl p-4 text-slate-200 text-lg font-sans focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 focus:outline-none resize-none scroll-smooth select-all leading-relaxed ${
                targetLang === 'ur' || targetLang === 'ar' || targetLang === 'fa' ? 'text-right' : 'text-left'
              }`}
            ></textarea>

            {translatedText.trim() && (
              <div className="space-y-4">
                {/* Voice player bar */}
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
                          <span>Generating Speech...</span>
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

                {/* Subtitle export options */}
                <div className="flex justify-between items-center pt-2 gap-3.5">
                  <button
                    onClick={() => {
                      const doc = new jsPDF();
                      doc.setFontSize(16);
                      doc.text("Tarjuma AI Translated Video Voice", 15, 15);
                      doc.setLineWidth(0.5);
                      doc.line(15, 20, 195, 20);
                      doc.setFontSize(11);
                      const splitText = doc.splitTextToSize(translatedText, 175);
                      doc.text(splitText, 15, 30);
                      doc.save(`TarjumaAI_Video_Translated_${file ? file.name.split('.')[0] : 'transcript'}.pdf`);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Download PDF Translation</span>
                  </button>

                  {ttsAudioUrl && (
                    <a
                      href={ttsAudioUrl}
                      download={`Video_Voiceover_Tarjuma_${Date.now()}.wav`}
                      className="flex-1 px-4 py-2 border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
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
