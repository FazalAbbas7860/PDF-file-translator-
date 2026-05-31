import express from "express";
import path from "path";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Multer setup for in-memory uploads up to 25MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
});

// Configure base parameters
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initializer for Gemini
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured in Secrets / environment variables on the server.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Helper to call a function with exponential backoff retries for transient/503/high-demand/429 errors
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error) || error.message || "";
    const status = error.status || (error.getStatusCode ? error.getStatusCode() : undefined);
    const isTransient = 
      status === 503 ||
      status === 429 ||
      errorStr.includes("503") || 
      errorStr.includes("UNAVAILABLE") || 
      errorStr.includes("high demand") || 
      errorStr.includes("Resource has been exhausted") ||
      errorStr.includes("429") ||
      errorStr.includes("RESOURCE_EXHAUSTED");

    if (isTransient && retries > 0) {
      console.warn(`Transient Gemini error (503/429/high demand). Retrying in ${delayMs}ms... (Remaining retries: ${retries})`, error.message || error);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

// Helper to run a generateContent call with retries and an optional fallback model (e.g., gemini-3.1-flash-lite)
async function generateContentWithFallback(
  contents: any,
  config: any,
  primaryModel: string = "gemini-3.5-flash",
  fallbackModel: string = "gemini-3.1-flash-lite"
): Promise<any> {
  const ai = getGeminiClient();

  const runWithModel = async (modelName: string) => {
    return await withRetry(async () => {
      return await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      });
    }, 3, 1500);
  };

  try {
    // Try primary first
    return await runWithModel(primaryModel);
  } catch (error: any) {
    const errorStr = JSON.stringify(error) || error.message || "";
    const isTransient = 
      errorStr.includes("503") || 
      errorStr.includes("UNAVAILABLE") || 
      errorStr.includes("high demand") || 
      errorStr.includes("Resource has been exhausted") ||
      errorStr.includes("429");

    if (isTransient) {
      console.warn(`Primary model ${primaryModel} failed with transient error. Trying fallback model ${fallbackModel}...`);
      try {
        return await runWithModel(fallbackModel);
      } catch (fallbackError) {
        console.error(`Fallback model ${fallbackModel} also failed. Re-throwing primary error.`, fallbackError);
        throw error; // Throw original error so the client receives the detailed message
      }
    }
    throw error;
  }
}

// 1. PDF TEXT EXTRACTION API
app.post("/api/pdf/extract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "براہ کرم پی ڈی ایف فائل اپلوڈ کریں۔ (Please upload a PDF file.)" });
    }

    const pdfBase64 = req.file.buffer.toString("base64");

    const pdfPart = {
      inlineData: {
        data: pdfBase64,
        mimeType: "application/pdf",
      },
    };

    const response = await generateContentWithFallback(
      [
        pdfPart,
        "Read and extract all textual contents from this PDF document verbatim. Return ONLY the plain text content. Do not write summaries, do not introduce sections, do not frame. Provide a perfect transcription.",
      ],
      undefined,
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite"
    );

    const parsedText = response.text || "";
    return res.json({ text: parsedText });
  } catch (error: any) {
    console.error("PDF Extraction Service Failure:", error);
    return res.status(500).json({
      error: error.message || "پی ڈی ایف سے ٹیکسٹ نکالنے میں خرابی پیش آئی۔ (Error extracting PDF content.)",
    });
  }
});

// 2. VIDEO/AUDIO TRANSCRIBE AND TIMESTAMP SUBTITLE API
app.post("/api/video/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "براہ کرم کوئی ویڈیو یا آڈیو فائل اپلوڈ کریں۔ (No media file provided.)" });
    }

    const mediaBase64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const mediaPart = {
      inlineData: {
        data: mediaBase64,
        mimeType: mimeType,
      },
    };

    // Use Structured JSON schema to return timestamps and full transcription cleanly
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        fullText: {
          type: Type.STRING,
          description: "Full consecutive transcription transcript text of the spoken dialogue.",
        },
        subtitles: {
          type: Type.ARRAY,
          description: "List of subtitle blocks with precise timestamps corresponding to dialogue.",
          items: {
            type: Type.OBJECT,
            properties: {
              time: {
                type: Type.STRING,
                description: "Timestamp of this dialogue line, format [MM:SS] (e.g., '00:04', '01:15').",
              },
              text: {
                type: Type.STRING,
                description: "Spoken text during this segment.",
              },
            },
            required: ["time", "text"],
          },
        },
      },
      required: ["fullText", "subtitles"],
    };

    const response = await generateContentWithFallback(
      [
        mediaPart,
        "Transcribe this audio/video. Gather every spoken word accurately. Generate subtitles blocks showing timestamp segments format MM:SS and spoken phrases.",
      ],
      {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite"
    );

    const jsonStr = response.text || "{}";
    const data = JSON.parse(jsonStr.trim());

    return res.json({
      fullText: data.fullText || "",
      subtitles: data.subtitles || [],
      originalName: req.file.originalname,
    });
  } catch (error: any) {
    console.error("Transcription Failure:", error);
    return res.status(500).json({
      error: error.message || "آڈیو/ویڈیو ٹرانسکرپٹ تیار کرنے میں خرابی پیش آئی۔ (Transcription parsing stalled.)",
    });
  }
});

// 3. MULTILINGUAL TRANSLATION SERVICE API
app.post("/api/translate", async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: "Missing required text or targetLanguage parameters." });
    }

    // Clean up language names to avoid parenthetical issues (e.g. "Urdu (اردو)" -> "Urdu")
    let cleanTarget = targetLanguage;
    if (targetLanguage.includes('(')) {
      cleanTarget = targetLanguage.split('(')[0].trim();
    }

    const prompt = `Translate the following text into the target language: ${cleanTarget} (${targetLanguage}). Keep the original paragraph structures and line breaks exactly intact. Deliver a natural, high-quality, and culturally accurate translation.

Original Text:
${text}`;

    const response = await generateContentWithFallback(
      prompt,
      {
        systemInstruction: `You are an expert professional translator specializing in accurate, high-fidelity translation into ${cleanTarget}. Convert the given text verbatim while maintaining natural flow. Do NOT add any explanations, introductory text, summary, wrapper tags, notes, or conversational lines. Return ONLY the final translated content.`,
      },
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite"
    );

    return res.json({ translatedText: response.text || "" });
  } catch (error: any) {
    console.error("Translation Service Failure:", error);
    return res.status(500).json({
      error: error.message || "ترجمہ کرنے میں ناکامی۔ (Translation engine faulted.)",
    });
  }
});

// 4. TEXT-TO-SPEECH (TTS) VOICES GENERATOR API
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceName, langCode } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing speech content text." });
    }

    const ai = getGeminiClient();

    // Clean text to keep length reasonable for single TTS candidates
    const maxLength = 600;
    const cleanText = text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

    // Use Gemini 3.1 TTS Model as specified in skill guidelines, with transient retry wrapper
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Generate spoken dialogue for this text in its native accent and natural voice: ${cleanText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || 'Puck' },
            },
          },
        },
      });
    }, 3, 1000);

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No voice audio synthesized by the model.");
    }

    // Convert raw linear PCM to standard WAV format
    const pcmBuffer = Buffer.from(base64Audio, "base64");
    
    // Add 44-byte standard mono 24000Hz 16-bit WAV header to the PCM data
    const numChannels = 1;
    const bitsPerSample = 16;
    const sampleRate = 24000;
    const fileSizeBytes = 36 + pcmBuffer.length;
    const wavHeader = Buffer.alloc(44);

    wavHeader.write("RIFF", 0);
    wavHeader.writeUInt32LE(fileSizeBytes, 4);
    wavHeader.write("WAVE", 8);
    wavHeader.write("fmt ", 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20); // Audio format 1 = PCM
    wavHeader.writeUInt16LE(numChannels, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
    wavHeader.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
    wavHeader.writeUInt16LE(bitsPerSample, 34);
    wavHeader.write("data", 36);
    wavHeader.writeUInt32LE(pcmBuffer.length, 40);

    const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
    const base64Wav = wavBuffer.toString("base64");

    return res.json({
      audio: base64Wav,
      mimeType: "audio/wav",
    });
  } catch (error: any) {
    console.error("Speech Synthesis Failed:", error);
    return res.status(500).json({
      error: error.message || "آواز جنریٹ کرنے میں خرابی۔ (TTS synthesiser failed.)",
    });
  }
});

// Prevent unhandled /api/* routes from falling through to public HTML pages/SPAs
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found.` });
});

// Global Error Handler for API routes to always return JSON errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global express error caught:", err);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected system error occurred on the server."
  });
});

// Integrate Frontend (Vite Setup for Dev/Production)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted successfully.");
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI PDF & Video Translator is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
