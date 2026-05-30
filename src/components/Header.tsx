import { Languages, FileText, Video, History, BookOpen, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'pdf' | 'video' | 'history' | 'guide';
  setActiveTab: (tab: 'pdf' | 'video' | 'history' | 'guide') => void;
  savedCount: number;
}

export default function Header({ activeTab, setActiveTab, savedCount }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform hover:rotate-3">
              <Languages className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-lg md:text-xl tracking-tight text-white flex items-center gap-2">
                AI PDF & Video <span className="text-cyan-400">Translator</span>
              </span>
              <p className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> Bento Power Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Online Badge from Bento Design */}
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] font-mono text-cyan-400 font-semibold shadow-[0_0_10px_rgba(34,211,238,0.1)]">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></span>
              System: Online
            </span>

            <nav className="flex items-center gap-1.5 md:gap-3">
              <button
                onClick={() => setActiveTab('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'pdf'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.05)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>PDF Translator</span>
              </button>

              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'video'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.05)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Video/Audio</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 relative ${
                  activeTab === 'history'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Archive History</span>
                {savedCount > 0 && (
                  <span className="absolute -top-1.5 -right-1 bg-cyan-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-950 animate-bounce">
                    {savedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  activeTab === 'guide'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Guide Book</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
