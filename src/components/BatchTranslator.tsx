import React, { useState, useRef, useEffect } from 'react';
import { exportToPdf } from '../utils/pdfGenerator';
import { 
  FileText, Video, Upload, Trash2, Play, CheckCircle2, 
  XCircle, AlertCircle, Download, FileUp, Sparkles, Languages,
  ChevronRight, Volume2, Archive, Loader2, Music, Check, X,
  Settings, RefreshCw
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, SavedItem, SubtitleBlock, TTS_VOICES } from '../types';

interface BatchTranslatorProps {
  onSaveItem: (item: Omit<SavedItem, 'id' | 'timestamp'>) => void;
  onGlobalSpeak: (text: string, langCode: string) => void;
}

interface BatchFileItem {
  id: string;
  file: File;
  name: string;
  size: string;
  type: 'pdf' | 'video';
  status: 'queued' | 'extracting' | 'transcribing' | 'translating' | 'completed' | 'failed';
  progress: number;
  originalText: string;
  translatedText: string;
  subtitles?: SubtitleBlock[];
  error?: string;
  ttsAudioUrl?: string;
}

export default function BatchTranslator({ onSaveItem, onGlobalSpeak }: BatchTranslatorProps) {
  const [queue, setQueue] = useState<BatchFileItem[]>([]);
  const [targetLang, setTargetLang] = useState('ur');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<BatchFileItem | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const [batchTtsVoice, setBatchTtsVoice] = useState('Kore');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [batchTtsError, setBatchTtsError] = useState('');

  // Auto-select the first completed item for preview when a batch runs
  useEffect(() => {
    if (selectedPreviewItem) {
      // Keep preview updated if the selected item changes status/content
      const updatedItem = queue.find(item => item.id === selectedPreviewItem.id);
      if (updatedItem && JSON.stringify(updatedItem) !== JSON.stringify(selectedPreviewItem)) {
        setSelectedPreviewItem(updatedItem);
      }
    }
  }, [queue, selectedPreviewItem]);

  // Overall progress calculator
  useEffect(() => {
    if (queue.length === 0) {
      setOverallProgress(0);
      return;
    }
    const finishedCount = queue.filter(item => item.status === 'completed' || item.status === 'failed').length;
    const pct = Math.round((finishedCount / queue.length) * 100);
    setOverallProgress(pct);
  }, [queue]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const identifyFileType = (file: File): 'pdf' | 'video' => {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return 'pdf';
    }
    return 'video'; // video/audio (MP4, MP3, WAV, WebM, Quicktime etc.)
  };

  const addFilesToQueue = (filesList: FileList) => {
    const validFiles: BatchFileItem[] = [];
    const maxLimit = 25 * 1024 * 1024; // 25MB

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const type = identifyFileType(file);
      
      // Basic validity checks
      const isValidPdf = type === 'pdf' && (file.type === 'application/pdf' || file.name.endsWith('.pdf'));
      const isValidMedia = type === 'video' && (
        file.type.startsWith('audio/') || 
        file.type.startsWith('video/') ||
        ['.mp4', '.mp3', '.wav', '.mov', '.webm', '.m4a', '.mpeg'].some(ext => file.name.toLowerCase().endsWith(ext))
      );

      if (isValidPdf || isValidMedia) {
        validFiles.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          file: file,
          name: file.name,
          size: formatFileSize(file.size),
          type: type,
          status: 'queued',
          progress: 0,
          originalText: '',
          translatedText: '',
        });
      }
    }

    if (validFiles.length > 0) {
      setQueue(prev => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input to allow re-selecting same files
    }
  };

  const removeFileFromQueue = (id: string) => {
    if (isProcessing) {
      const item = queue.find(q => q.id === id);
      if (item && (item.status === 'extracting' || item.status === 'transcribing' || item.status === 'translating')) {
        return;
      }
    }
    setQueue(prev => prev.filter(item => item.id !== id));
    if (selectedPreviewItem?.id === id) {
      setSelectedPreviewItem(null);
    }
  };

  const clearQueue = () => {
    if (isProcessing) {
      stopProcessing();
    }
    setQueue([]);
    setSelectedPreviewItem(null);
  };

  const stopProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setCurrentIndex(null);
    setQueue(prev => prev.map(item => {
      if (item.status === 'extracting' || item.status === 'transcribing' || item.status === 'translating') {
        return { ...item, status: 'queued', progress: 0 };
      }
      return item;
    }));
  };

  // Helper to trigger single item parsing and translation sequentially
  const processBatchQueue = async () => {
    if (queue.length === 0) return;
    
    // Filter queue to files that are standard 'queued' or 'failed' (to retry)
    const pendingItems = queue.filter(item => item.status === 'queued' || item.status === 'failed');
    if (pendingItems.length === 0) {
      alert("All files in the queue have already been processed.");
      return;
    }

    setIsProcessing(true);
    abortControllerRef.current = new AbortController();

    // Work on items one by one asynchronously to coordinate queue state nicely
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status !== 'queued' && item.status !== 'failed') {
        continue;
      }

      setCurrentIndex(i);
      
      // Create new clean update
      const initialStatus = item.type === 'pdf' ? 'extracting' : 'transcribing';
      updateQueueItem(item.id, { status: initialStatus, progress: 15, error: undefined });

      try {
        let extractedText = '';
        let subtitleBlocks: SubtitleBlock[] = [];

        // 25MB check
        if (item.file.size > 25 * 1024 * 1024) {
          throw new Error("File exceeds the maximum 25MB limit allowed for processing.");
        }

        // Mode-specific Extraction
        if (item.type === 'pdf') {
          extractedText = await extractPdfText(item.file, item.id);
        } else {
          const mediaResult = await transcribeMedia(item.file, item.id);
          extractedText = mediaResult.fullText;
          subtitleBlocks = mediaResult.subtitles || [];
        }

        if (!extractedText.trim()) {
          throw new Error("No readable transcript or text could be extracted from this files.");
        }

        // Translation update
        updateQueueItem(item.id, { 
          status: 'translating', 
          progress: 60, 
          originalText: extractedText,
          subtitles: subtitleBlocks 
        });

        // Translate
        const langName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
        const translatedText = await translateText(extractedText, langName);

        // Success Update
        updateQueueItem(item.id, {
          status: 'completed',
          progress: 100,
          translatedText: translatedText
        });

        // Automatically trigger history logging for client synchronization
        onSaveItem({
          type: item.type,
          title: item.name,
          originalText: extractedText,
          translatedText: translatedText,
          sourceLang: 'auto',
          targetLang: targetLang,
          subtitles: subtitleBlocks.length > 0 ? subtitleBlocks : undefined
        });

      } catch (err: any) {
        console.error(`Failed to process item: ${item.name}`, err);
        const errMsg = err.message || "An unexpected error occurred during processing.";
        
        updateQueueItem(item.id, {
          status: 'failed',
          progress: 0,
          error: errMsg
        });
      }

      // Small break between items to respect API rate-limits
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setIsProcessing(false);
    setCurrentIndex(null);
  };

  const updateQueueItem = (id: string, updates: Partial<BatchFileItem>) => {
    setQueue(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        return updated;
      }
      return item;
    }));
  };

  // FETCH PDF TEXT EXTRACTION
  const extractPdfText = async (file: File, id: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/pdf/extract', {
      method: 'POST',
      body: formData,
      signal: abortControllerRef.current?.signal,
    });

    let data: any = {};
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `Extraction failed with code ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to extract text from PDF.');
    }

    return data.text || '';
  };

  // FETCH MEDIA TRANSCRIPTION
  const transcribeMedia = async (file: File, id: string): Promise<{ fullText: string; subtitles: SubtitleBlock[] }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/video/transcribe', {
      method: 'POST',
      body: formData,
      signal: abortControllerRef.current?.signal,
    });

    let data: any = {};
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || `Transcription failed with code ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to transcribe media.');
    }

    return {
      fullText: data.fullText || '',
      subtitles: data.subtitles || []
    };
  };

  // FETCH MULTILINGUAL TRANSLATION
  const translateText = async (text: string, langName: string): Promise<string> => {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLanguage: 'auto-detection',
        targetLanguage: langName,
      }),
      signal: abortControllerRef.current?.signal,
    });

    let data: any = {};
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      throw new Error(textResponse || `Translation failed with code ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || 'Translation failed.');
    }

    return data.translatedText || '';
  };

  // TTS Voice Synthesis for the currently selected item
  const handleSynthesizeTtsForSelected = async (item: BatchFileItem) => {
    if (!item.translatedText.trim()) return;
    setIsSynthesizing(true);
    setBatchTtsError('');

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.translatedText,
          voiceName: batchTtsVoice,
          langCode: targetLang,
        }),
      });

      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server error (${response.status}): Failed to synthesize voice.`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Server failed to generate voice.');
      }

      const audioBlobUrl = `data:${data.mimeType};base64,${data.audio}`;
      
      // Update queue with cached URLs
      updateQueueItem(item.id, { ttsAudioUrl: audioBlobUrl });
      
      // Update local preview state
      setSelectedPreviewItem(prev => prev && prev.id === item.id ? { ...prev, ttsAudioUrl: audioBlobUrl } : prev);

      // Auto-play synthesized voice safely after loading chunk
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.load();
          audioPlayerRef.current.play().catch(e => console.log("Auto-play blocked by browser. Click Play manually.", e));
        }
      }, 300);

    } catch (err: any) {
      console.error("Speech Synthesis Failed inside Batch processor:", err);
      setBatchTtsError(err.message || 'Speech Synthesis Failed. Browser speech synthesis fallback activated.');
      // Offline fallback speech
      onGlobalSpeak(item.translatedText, targetLang);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Helper downloads
  const handleDownloadPdfFile = (item: BatchFileItem) => {
    try {
      exportToPdf({
        title: "Tarjuma AI Batch Translation",
        subtitle: `Target Language: ${targetLang.toUpperCase()} | File Ref: ${item.name}`,
        contentText: item.translatedText,
        langCode: targetLang,
        filename: `TarjumaAI_Translated_${item.name.replace(/\.[^/.]+$/, "")}.pdf`
      });
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF file utilizing custom fonts.");
    }
  };

  const handleDownloadTxtFile = (item: BatchFileItem) => {
    try {
      const element = document.createElement("a");
      const file = new Blob([item.translatedText], {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      element.download = `TarjumaAI_Translated_${item.name.replace(/\.[^/.]+$/, "")}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (e) {
      console.error(e);
      alert("Failed to compile translated text download.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans" id="batch_translator_view">
      
      {/* Intro Header & Target Language */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6" id="batch_header_panel">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-cyan-400" />
            <span>AI Batch File Processing Queue</span>
          </h2>
          <p className="text-slate-400 text-xs">
            Upload multiple PDF documents and Video/Audio tracks. Get simultaneous transcribing, smart OCRs, and fluid translation.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl" id="batch_lang_selector">
            <Languages className="w-4 h-4 text-slate-400" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={isProcessing}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-2"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl transition"
            id="batch_add_files_btn"
          >
            <FileUp className="w-4 h-4 text-cyan-400" />
            <span>Add Files</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,video/*,audio/*,.mp4,.mp3,.wav,.mov,.webm"
            className="hidden"
          />
        </div>
      </div>

      {/* Main Drag-Drop Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="batch_workspace_grid">
        
        {/* Left Side: Queue List */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed py-8 px-4 transition duration-200 flex flex-col items-center justify-center text-center ${
              isDragActive 
                ? 'border-cyan-400 bg-cyan-500/5' 
                : queue.length > 0 
                  ? 'border-slate-800 bg-slate-900/10' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
            }`}
            id="batch_drop_area"
          >
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            
            <p className="text-slate-300 text-xs font-medium mb-1">
              Drag & drop multiple PDF, Video, or Audio files here
            </p>
            <p className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">
              Files up to 25MB each
            </p>
          </div>

          {/* Queue Container */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-4 md:p-6 flex flex-col gap-4" id="batch_queue_card">
            
            {/* Header & Status Indicator */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white uppercase font-mono tracking-widest">
                  Active Batch Queue ({queue.length})
                </span>
                {queue.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-[10px] font-bold font-mono text-cyan-400 shrink-0">
                    {queue.filter(item => item.status === 'completed').length} / {queue.length} Done
                  </span>
                )}
              </div>

              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-xs text-rose-400 hover:text-rose-300 transition flex items-center gap-1 font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Queue</span>
                </button>
              )}
            </div>

            {/* If queue is empty */}
            {queue.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-600" />
                <p className="text-slate-500 text-xs max-w-sm">
                  Add files to the translation queue. You can mix and match PDF documents with media video files.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                
                {/* Overall Master Metrics Panel */}
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                          <span>Batch Processing...</span>
                        </>
                      ) : (
                        <span>Queue Ready for Processing</span>
                      )}
                    </span>
                    <span className="text-slate-400 text-xs font-semibold font-mono">
                      {overallProgress}% Overall
                    </span>
                  </div>
                  
                  {/* Master Progress Bar */}
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-300" 
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>

                  {/* Operational States Summary */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-1 text-[10px] font-mono">
                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-900">
                      <p className="text-slate-500 font-bold uppercase">Total</p>
                      <p className="text-white text-xs font-black pt-0.5">{queue.length}</p>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-900">
                      <p className="text-emerald-500 font-bold uppercase">Success</p>
                      <p className="text-emerald-400 text-xs font-black pt-0.5">
                        {queue.filter(item => item.status === 'completed').length}
                      </p>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-900">
                      <p className="text-rose-500 font-bold uppercase">Failed</p>
                      <p className="text-rose-400 text-xs font-black pt-0.5">
                        {queue.filter(item => item.status === 'failed').length}
                      </p>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-900">
                      <p className="text-slate-500 font-bold uppercase">Queued</p>
                      <p className="text-slate-300 text-xs font-black pt-0.5">
                        {queue.filter(item => item.status === 'queued').length}
                      </p>
                    </div>
                  </div>

                  {/* Main Batch Action controller */}
                  <div className="pt-2 flex items-center gap-3">
                    {isProcessing ? (
                      <button
                        onClick={stopProcessing}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel Batch Processing</span>
                      </button>
                    ) : (
                      <button
                        onClick={processBatchQueue}
                        disabled={queue.filter(item => item.status === 'queued' || item.status === 'failed').length === 0}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-500/10 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <Play className="w-4 h-4 stroke-[2.5]" />
                        <span>Process Batch Translation</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Queue List Items */}
                <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1 space-y-1">
                  {queue.map((item, index) => {
                    const isCurrent = currentIndex === index;
                    const isSelected = selectedPreviewItem?.id === item.id;
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.status === 'completed' || item.status === 'failed') {
                            setSelectedPreviewItem(item);
                            setBatchTtsError('');
                          }
                        }}
                        className={`group border rounded-xl p-3 flex flex-col gap-2 transition cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-800/60 border-cyan-500/40' 
                            : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/30'
                        } ${isCurrent ? 'ring-1 ring-cyan-400/40' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Icon block based on type */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              item.type === 'pdf' 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            }`}>
                              {item.type === 'pdf' ? (
                                <FileText className="w-4 h-4" />
                              ) : (
                                <Video className="w-4 h-4" />
                              )}
                            </div>

                            <div className="overflow-hidden">
                              <p className="text-white text-xs font-semibold truncate max-w-[200px] sm:max-w-[250px]">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                <span>{item.size}</span>
                                <span>•</span>
                                <span className={`uppercase font-bold ${item.type === 'pdf' ? 'text-rose-400/80' : 'text-indigo-400/80'}`}>
                                  {item.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick statuses */}
                          <div className="flex items-center gap-2shrink-0">
                            {item.status === 'queued' && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-full">
                                Queued
                              </span>
                            )}

                            {(item.status === 'extracting' || item.status === 'transcribing') && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>{item.status === 'extracting' ? 'OCR Extraction' : 'Transcribing'}</span>
                              </span>
                            )}

                            {item.status === 'translating' && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin hover:text-cyan-300" />
                                <span>Translating</span>
                              </span>
                            )}

                            {item.status === 'completed' && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span>Success</span>
                              </span>
                            )}

                            {item.status === 'failed' && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center gap-1">
                                <XCircle className="w-3 h-3 shrink-0" />
                                <span>Failed</span>
                              </span>
                            )}

                            {/* Detour action when not processing */}
                            {!isProcessing && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFileFromQueue(item.id);
                                }}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition"
                                title="Remove File"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Progress or error diagnostics */}
                        {(item.status !== 'queued' && item.status !== 'completed' && item.status !== 'failed') && (
                          <div className="w-full space-y-1.5 pt-1">
                            <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-400 transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {item.status === 'failed' && item.error && (
                          <div className="mt-1 p-2 bg-rose-500/5 rounded-lg border border-rose-500/10 text-[10px] text-rose-400 font-mono leading-relaxed flex items-start gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{item.error}</span>
                          </div>
                        )}

                        {/* Direct exports when success */}
                        {item.status === 'completed' && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-900/60 mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPdfFile(item);
                              }}
                              className="text-[10px] font-medium text-slate-300 hover:text-cyan-400 transition flex items-center gap-1 bg-slate-950 px-2 py-1 border border-slate-900 rounded-lg hover:border-cyan-500/20"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download PDF</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadTxtFile(item);
                              }}
                              className="text-[10px] font-medium text-slate-300 hover:text-cyan-400 transition flex items-center gap-1 bg-slate-950 px-2 py-1 border border-slate-900 rounded-lg hover:border-cyan-500/20"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Download TXT</span>
                            </button>

                            {/* View translation tag */}
                            <span className="text-[9px] font-mono text-slate-500 ml-auto group-hover:text-cyan-500/60 transition flex items-center gap-1">
                              <span>View Details</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Translation Preview Drawer */}
        <div className="lg:col-span-5 flex flex-col h-full shrink-0">
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-4 md:p-6 flex flex-col gap-4 h-full min-h-[450px]">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="font-semibold text-xs text-white uppercase font-mono tracking-widest">
                Active Translation Preview
              </span>
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>

            {!selectedPreviewItem ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-12 px-6 my-auto space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 flex items-center justify-center">
                  <Languages className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400 font-medium font-sans">
                  No preview item selected
                </p>
                <p className="text-[11px] text-slate-500 leading-normal max-w-xs">
                  Process files inside the queue, then click on success items to parse original text alongside the finished translation here.
                </p>
              </div>
            ) : (
              <div className="flex-grow flex flex-col gap-4 h-full justify-between">
                
                {/* Meta details */}
                <div className="space-y-1">
                  <h3 className="text-white text-xs font-bold font-sans truncate">
                    Preview: {selectedPreviewItem.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {selectedPreviewItem.type.toUpperCase()}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      Target: {SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang}
                    </span>
                  </div>
                </div>

                {/* Subtitle / text preview drawers side by side */}
                <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[300px] md:max-h-[380px] pr-1 py-1 flex-grow">
                  
                  {/* Original panel */}
                  <div className="bg-slate-950/40 border border-slate-900/80 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-900/60">
                      <span>Original Speech / Text</span>
                      <span className="text-sky-400 font-semibold uppercase">({selectedPreviewItem.type})</span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto pr-1">
                      {selectedPreviewItem.originalText || "No text compiled."}
                    </p>
                  </div>

                  {/* Translated panel */}
                  <div className="bg-cyan-500/[0.02] border border-cyan-500/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 uppercase tracking-wider pb-1 border-b border-cyan-500/5">
                      <span>AI Translated Result</span>
                      <button
                        onClick={() => onGlobalSpeak(selectedPreviewItem.translatedText, targetLang)}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition"
                        title="Sync vocal synthesize readout"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Speak Output</span>
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap max-h-[140px] overflow-y-auto pr-1 dir-rtl" style={{ direction: targetLang === 'ur' || targetLang === 'ar' || targetLang === 'fa' ? 'rtl' : 'ltr' }}>
                      {selectedPreviewItem.translatedText}
                    </p>
                  </div>

                  {/* Speech synthesis controller integration */}
                  <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Settings className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Vocal Native Reader Settings</span>
                      </span>
                      <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 text-[9px] rounded uppercase font-bold border border-cyan-900/30">Gemini 3.1 TTS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-mono">Speaker Voice:</span>
                        <select
                          value={batchTtsVoice}
                          onChange={(e) => setBatchTtsVoice(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 pr-1 cursor-pointer"
                        >
                          {TTS_VOICES.map(voice => (
                            <option key={voice.id} value={voice.id}>{voice.name.split(' (')[0]}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col justify-end">
                        <button
                          type="button"
                          onClick={() => handleSynthesizeTtsForSelected(selectedPreviewItem)}
                          disabled={isSynthesizing}
                          className="w-full flex items-center justify-center gap-1 py-1.5 px-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition"
                        >
                          {isSynthesizing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Generating...</span>
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

                    {batchTtsError && (
                      <p className="text-[10px] text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 leading-relaxed font-mono">
                        {batchTtsError}
                      </p>
                    )}

                    {/* Audio Player and download row if audio exists */}
                    {selectedPreviewItem.ttsAudioUrl && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 border-t border-slate-950">
                        <audio ref={audioPlayerRef} src={selectedPreviewItem.ttsAudioUrl} controls className="h-8 w-full sm:max-w-[210px] outline-none" />
                        <a
                          href={selectedPreviewItem.ttsAudioUrl}
                          download={`TarjumaAI_Batch_${selectedPreviewItem.name.replace(/\.[^/.]+$/, "")}_Voice.wav`}
                          className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-2 py-1 border border-cyan-500/20 rounded-lg"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download WAV</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Foot control buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => handleDownloadPdfFile(selectedPreviewItem)}
                    className="flex-grow flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownloadTxtFile(selectedPreviewItem)}
                    className="flex-grow flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Download TXT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
