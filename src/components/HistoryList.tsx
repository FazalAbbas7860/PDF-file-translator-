import { SavedItem, SUPPORTED_LANGUAGES } from '../types';
import { FileText, Video, Calendar, Trash2, ArrowRight, Volume2, Download, AlertCircle } from 'lucide-react';

interface HistoryListProps {
  items: SavedItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onSelect: (item: SavedItem) => void;
  onSpeak: (text: string, langCode: string) => void;
  onDownloadPdf: (item: SavedItem) => void;
}

export default function HistoryList({
  items,
  onDelete,
  onClearAll,
  onSpeak,
  onDownloadPdf
}: Omit<HistoryListProps, 'onSelect'> & { onSelect?: (item: SavedItem) => void }) {
  
  const getLanguageName = (code: string) => {
    return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code.toUpperCase();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto animate-bounce" />
        <h3 className="text-lg font-bold text-slate-300">History Is Empty</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Your translated items will be preserved here. Select or upload PDF or Video above to start your first translation.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-2 animate-fade-in">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-5 bg-cyan-500 rounded-full"></span>
            <span>Saved Work Inventory</span>
          </h2>
          <p className="text-xs text-slate-500 font-mono">Total records in bento archive: {items.length}</p>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 transition-all font-medium border border-rose-500/15 cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900/40 border-l-[3px] rounded-2xl p-5 hover:bg-slate-900/70 transition-all duration-200 shadow-xl group relative flex flex-col justify-between ${
              item.type === 'pdf' 
                ? 'border-cyan-500 border-r border-t border-b border-slate-800/85 shadow-cyan-950/10' 
                : 'border-purple-500 border-r border-t border-b border-slate-800/85 shadow-purple-950/10'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    item.type === 'pdf' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {item.type === 'pdf' ? <FileText className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-slate-200 truncate group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDelete(item.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-850 transition-colors shrink-0 cursor-pointer"
                  title="Remove from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Languages badges */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-xl w-fit border border-slate-800">
                <span className="text-slate-400 font-medium">{getLanguageName(item.sourceLang)}</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-cyan-400 font-bold">{getLanguageName(item.targetLang)}</span>
              </div>

              {/* Preview comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-slate-800/85 pt-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono">Original Source:</span>
                  <p className="text-slate-400 line-clamp-3 leading-relaxed font-sans">{item.originalText || 'N/A'}</p>
                </div>
                <div className="space-y-1 bg-cyan-950/15 p-2.5 rounded-xl border border-cyan-500/10">
                  <span className="text-[10px] text-cyan-400 font-mono">Translated Output:</span>
                  <p 
                    dir={item.targetLang === 'ur' || item.targetLang === 'ar' || item.targetLang === 'fa' ? 'rtl' : 'ltr'}
                    className={`text-slate-200 font-sans line-clamp-3 leading-relaxed select-all ${
                      item.targetLang === 'ur' || item.targetLang === 'ar' || item.targetLang === 'fa' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {item.translatedText}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex items-center justify-between border-t border-slate-800/85 mt-4 pt-3.5 gap-2">
              <button
                onClick={() => onDownloadPdf(item)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={() => onSpeak(item.translatedText, item.targetLang)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Listen Voice</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
