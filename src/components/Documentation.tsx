import { BookOpen, Command, Globe, Server, CheckCircle2 } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-2">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-teal-400" />
          <span>Project Documentation & Setup Guide</span>
        </h1>
        <p className="text-slate-300 text-lg leading-relaxed">
          This is a full-stack production-ready "AI PDF & Video Translator" application. With this app, you can extract text from PDF documents using OCR, or transcribe video and audio files using AI Speech-to-Text. You can translate extracted dialogues dynamically into any supported language, listen to the translated results voiced by natural Text-To-Speech models, and download the content as newly formatted PDFs or MP3 audio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tech Stack Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            <Server className="w-5 h-5 text-teal-400" />
            <span>Tech Stack Details</span>
          </h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
              <span><strong>Frontend:</strong> React 19 (TypeScript) + Tailwind CSS 4 + Vite</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
              <span><strong>Animations:</strong> Motion (Framer Motion library)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
              <span><strong>Backend:</strong> Custom Express.js Server + TSX Engine</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
              <span><strong>AI Core:</strong> Gemini APIs for Advanced OCR, Translation, and TTS</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
              <span><strong>Document Generation:</strong> Client-side jsPDF rendering layers</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
              <span><strong>File Streaming:</strong> Multer memory storage buffers</span>
            </li>
          </ul>
        </div>

        {/* Directory Structure Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <Command className="w-5 h-5 text-indigo-400" />
            <span>Directory Configuration</span>
          </h2>
          <div className="font-mono text-xs bg-slate-950/80 p-4 rounded-lg overflow-x-auto text-slate-400 border border-slate-800">
            <p className="text-emerald-400">/ (Root Directory)</p>
            <p className="pl-4">├── <span className="text-slate-200">server.ts</span> (Backend API endpoints & Vite Server)</p>
            <p className="pl-4">├── <span className="text-slate-200">package.json</span> (Configured Node.js script tasks)</p>
            <p className="pl-4">├── <span className="text-slate-200">vite.config.ts</span> (Vite compiler plugins)</p>
            <p className="pl-4">├── <span className="text-slate-200">tsconfig.json</span> (TypeScript compilation settings)</p>
            <p className="pl-4">├── <span className="text-slate-200">.env.example</span> (Secure environment key templates)</p>
            <p className="pl-4">├── <span className="text-emerald-400">src/</span> (React Fontend Application)</p>
            <p className="pl-8">├── <span className="text-slate-200">main.tsx</span> (Client Entry point)</p>
            <p className="pl-8">├── <span className="text-slate-200">App.tsx</span> (Central application router)</p>
            <p className="pl-8">├── <span className="text-slate-200">types.ts</span> (Type interfaces for translations)</p>
            <p className="pl-8">└── <span className="text-emerald-400">components/</span> (React UI Component Panels)</p>
            <p className="pl-12">├── <span className="text-slate-200">Header.tsx</span></p>
            <p className="pl-12">├── <span className="text-slate-200">PdfTranslator.tsx</span></p>
            <p className="pl-12">├── <span className="text-slate-200">VideoTranslator.tsx</span></p>
            <p className="pl-12">└── <span className="text-slate-200">HistoryList.tsx</span></p>
          </div>
        </div>
      </div>

      {/* Local Setup instructions */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Server className="w-6 h-6 text-teal-400" />
          <span>Local Deployment Instructions</span>
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <span className="bg-slate-800 text-teal-400 text-xs px-2.5 py-1 rounded font-mono">Step 1: Install Dependencies</span>
            <p className="text-sm text-slate-300">Run the command below inside the cloned project directory to install packages:</p>
            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-indigo-300 border border-slate-800">npm install</pre>
          </div>

          <div className="space-y-2">
            <span className="bg-slate-800 text-teal-400 text-xs px-2.5 py-1 rounded font-mono">Step 2: API Keys Configuration</span>
            <p className="text-sm text-slate-300">
              Create a <code className="text-pink-400 font-mono">.env</code> configuration file in the application root directory and insert your secure Google Gemini API keys:
            </p>
            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-indigo-300 border border-slate-800">GEMINI_API_KEY="AIzaSyYourSecretKeyHere..."</pre>
          </div>

          <div className="space-y-2">
            <span className="bg-slate-800 text-teal-400 text-xs px-2.5 py-1 rounded font-mono">Step 3: Launch Local Dev Server</span>
            <p className="text-sm text-slate-300">This script initializes the full-stack development workspace (Express and Vite concurrently):</p>
            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-indigo-300 border border-slate-800">npm run dev</pre>
            <p className="text-xs text-slate-400">The developer gateway is accessible at <code className="text-slate-300">http://localhost:3000</code>.</p>
          </div>
        </div>
      </div>

      {/* Deployment Instructions */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Globe className="w-6 h-6 text-indigo-400" />
          <span>Cloud Deployment Guide</span>
        </h2>

        <div className="space-y-6 text-sm text-slate-300">
          {/* Render */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>1. Render Web Service Deployment</span>
            </h3>
            <p className="pl-4 leading-relaxed">
              Create a new Web Service inside the Render console, attach your GitHub Repository, and adjust the environment variables configuration properties as shown:
            </p>
            <ul className="list-disc pl-8 space-y-1 text-slate-400 font-mono text-xs">
              <li><strong>Environment Type:</strong> Node</li>
              <li><strong>Build Command:</strong> npm run build</li>
              <li><strong>Start Command:</strong> npm start</li>
              <li><strong>Environment Variables:</strong> Set GEMINI_API_KEY and NODE_ENV="production"</li>
            </ul>
          </div>

          {/* Railway */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>2. Railway Cloud Deployment</span>
            </h3>
            <p className="pl-4 leading-relaxed">
              Create a new empty project container on Railway, bind your secure GitHub codebase, and the platform will read package configurations and trigger builds natively. Simply navigate to the <strong>Variables</strong> pane to declare your <code className="text-emerald-400">GEMINI_API_KEY</code>.
            </p>
          </div>

          {/* Vercel */}
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>3. Vercel Serverless Configurations</span>
            </h3>
            <p className="pl-4 leading-relaxed">
              Since this full-stack application utilizes a native production-optimized Express.js server, standard persistent servers are required. To deploy on serverless backends like Vercel, a custom <code className="text-indigo-400">vercel.json</code> rewrite file must be included. For maximum simplicity and performance, Docker and continuous instances like Render or Railway are highly recommended.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
