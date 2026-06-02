import { 
  FileText, 
  Video, 
  HelpCircle, 
  BookOpen,
  Cpu, 
  Clock, 
  ShieldCheck
} from 'lucide-react';

export default function Documentation() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in p-2 font-sans" id="docs_wrapper">
      {/* Intro Hero Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-lg text-center md:text-left" id="docs_hero">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shrink-0">
            <BookOpen className="w-8 h-8 text-amber-400" id="docs_hero_icon" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-teal-400">
              How It Works & App Guide
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              This web application utilizes state-of-the-art Artificial Intelligence to transcribe and translate PDF documents, videos, and audio files between English and Urdu. Learn how easily this system processes your files.
            </p>
            <p className="text-slate-400 text-xs md:text-sm italic">
              Experience flawless, idiomatic translations and premium text-to-speech audio outputs in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Mode 1: PDF Translator Guide */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6" id="docs_pdf_section">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20 text-teal-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-teal-400">
              PDF Translation & Export Guide
            </h2>
            <p className="text-xs text-slate-400">Step-by-step document translation instructions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span> Document Extraction & Parsing
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold flex items-center justify-center shrink-0 border border-teal-500/20 mt-0.5">1</span>
                <div>
                  <h4 className="font-semibold text-slate-300 text-sm">Upload Your Document:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed"> Drag & drop your PDF file directly into the dashboard interface, or select it manually using the file picker.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold flex items-center justify-center shrink-0 border border-teal-500/20 mt-0.5">2</span>
                <div>
                  <h4 className="font-semibold text-slate-300 text-sm">Automated OCR Engine:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">The high-fidelity OCR parser digitizes your PDF text instantly, removing formatting artifacts and preparing it for the language transition.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Translation & Vocal Synthesis
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold flex items-center justify-center shrink-0 border border-teal-500/20 mt-0.5">3</span>
                <div>
                  <h4 className="font-semibold text-slate-300 text-sm">Translate & Refine:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Initiate translation with a single click. The contextual system processes idiomatic phrasing, allowing you to edit the generated text before saving.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-400 text-xs font-bold flex items-center justify-center shrink-0 border border-teal-500/20 mt-0.5">4</span>
                <div>
                  <h4 className="font-semibold text-slate-300 text-sm">Listen & Export PDF:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Save the finished document in an elegant, beautifully rendered Nasto-style PDF file, or synthesize conversational audio to download as an MP3 file.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode 2: Video/Audio Translator Guide */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-8 space-y-6" id="docs_video_section">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 shrink-0">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-indigo-400">
              Media Transcribing & Translation Guide
            </h2>
            <p className="text-xs text-slate-400">Step-by-step audio/video transcribe and translation guide</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Speech Recognition & Timestamps
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-500/20 mt-0.5">1</span>
                <div>
                  <h4 className="font-semibold text-slate-300 text-sm">Upload Your Audio/Video:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Feed any high quality audio track (MP3/WAV) or video episode (MP4) to the application with a convenient maximum storage size constraint of 25MB.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-500/20 mt-0.5">2</span>
                <div>
                  <h4 className="font-semibold text-slate-300 text-sm">Timestamp Transcription:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">The AI decoder analyzes auditory wave sequences, converting spoken dialogue into segmented transcriptions grouped synchronously by precise seconds.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span> Multilingual Dialog Dubbing
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-500/20 mt-0.5">3</span>
                <div>
                  <h4 className="font-semibold text-slate-300 text-sm">Segment-by-Segment Translation:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Get accurate line-by-line translation matching speech markers, preserving original dialogue indices for convenient editing.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 border border-indigo-500/20 mt-0.5">4</span>
                <div>
                  <h4 className="font-semibold text-slate-300 text-sm">Synthesize Voice Audio Tracks:</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Trigger natural vocal voiceovers for individual tracks, or easily save and copy the timed subtitle sequence files.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 text-center space-y-3" id="highlight_ai_power">
          <div className="mx-auto w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 border border-amber-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm">Idiomatic Context Translation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unlike cold word-for-word replacements, our advanced AI analyzes cultural context, metaphors, and specific localized grammar to offer true, flowing results.
          </p>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 text-center space-y-3" id="highlight_privacy">
          <div className="mx-auto w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm">Data Security & Privacy</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            All files uploaded onto the server are evaluated transiently. PDF text dumps are treated with absolute confidentiality and processed purely client-side or on secured sandboxes.
          </p>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6 text-center space-y-3" id="highlight_history">
          <div className="mx-auto w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm">Offline History Archives</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access previous transcripts or translated PDFs directly using the local browser archive log. Return to your active workflow any time without losing translated details.
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6" id="docs_faq_section">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>Frequently Asked Questions (FAQs)</span>
        </h2>
        <div className="divide-y divide-slate-800/60">
          <div className="py-4 space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm md:text-base">Q: Is this translation service free? Are there file limits?</h3>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              A: Yes, the utility is entirely free of charge. You can read and translate documents containing extensive pages. Audio and video files have a limit of 25MB per upload.
            </p>
          </div>

          <div className="py-4 space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm md:text-base">Q: Will the exported translated PDF render Urdu fonts correctly?</h3>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              A: Absolutely. Our backend dynamically loads official Noto Nastaliq Urdu and classical Amiri fonts. This guarantees that printed Urdu characters appear naturally connected with flawless spacing and alignment.
            </p>
          </div>

          <div className="py-4 space-y-2">
            <h3 className="font-semibold text-slate-200 text-sm md:text-base">Q: Can I edit the transcribed dialogues or text fragments?</h3>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              A: Yes. All translated text and parsed transcripts are interactive. You can modify specific paragraphs, correct typos, or adjust contextual meanings directly inside our editor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
