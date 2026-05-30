export interface SubtitleBlock {
  time: string;
  text: string;
}

export interface TranscriptionResult {
  fullText: string;
  subtitles: SubtitleBlock[];
  language?: string;
  originalName?: string;
}

export interface TranslationResult {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface SavedItem {
  id: string;
  type: 'pdf' | 'video';
  title: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  subtitles?: SubtitleBlock[];
}

export const SUPPORTED_LANGUAGES = [
  { code: 'ur', name: 'Urdu (اردو)', nativeName: 'اردو' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ar', name: 'Arabic (العربية)', nativeName: 'العربية' },
  { code: 'es', name: 'Spanish (Español)', nativeName: 'Español' },
  { code: 'fr', name: 'French (Français)', nativeName: 'Français' },
  { code: 'de', name: 'German (Deutsch)', nativeName: 'Deutsch' },
  { code: 'tr', name: 'Turkish (Türkçe)', nativeName: 'Türkçe' },
  { code: 'zh', name: 'Chinese (中文)', nativeName: '中文' },
  { code: 'hi', name: 'Hindi (हिन्दी)', nativeName: 'हिन्दी' },
  { code: 'fa', name: 'Persian (فارسی)', nativeName: 'فارسی' },
];

export const TTS_VOICES = [
  { id: 'Kore', name: 'Kore (Balanced & Professional)' },
  { id: 'Puck', name: 'Puck (Soft & Welcoming)' },
  { id: 'Charon', name: 'Charon (Deep & Clear)' },
  { id: 'Fenrir', name: 'Fenrir (Assertive & Bold)' },
  { id: 'Zephyr', name: 'Zephyr (Warm & Direct)' },
];
