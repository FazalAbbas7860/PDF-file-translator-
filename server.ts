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

// 1. PDF TEXT EXTRACTION API
app.post("/api/pdf/extract", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "براہ کرم پی ڈی ایف فائل اپلوڈ کریں۔ (Please upload a PDF file.)" });
    }

    const ai = getGeminiClient();
    const pdfBase64 = req.file.buffer.toString("base64");

    const pdfPart = {
      inlineData: {
        data: pdfBase64,
        mimeType: "application/pdf",
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        pdfPart,
        "Read and extract all textual contents from this PDF document verbatim. Return ONLY the plain text content. Do not write summaries, do not introduce sections, do not frame. Provide a perfect transcription.",
      ],
    });

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

    const ai = getGeminiClient();
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        mediaPart,
        "Transcribe this audio/video. Gather every spoken word accurately. Generate subtitles blocks showing timestamp segments format MM:SS and spoken phrases.",
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

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

    const ai = getGeminiClient();
    const prompt = `Translate the following text into ${targetLanguage}. Keep the original paragraph structures and line breaks. Deliver a natural, high-quality, and culturally accurate translation.

Original Text:
${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

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

    // Use Gemini 3.1 TTS Model as specified in skill guidelines
    const response = await ai.models.generateContent({
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

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/wav";

    if (!base64Audio) {
      throw new Error("No voice audio synthesized by the model.");
    }

    return res.json({
      audio: base64Audio,
      mimeType: mimeType,
    });
  } catch (error: any) {
    console.error("Speech Synthesis Failed:", error);
    return res.status(500).json({
      error: error.message || "آواز جنریٹ کرنے میں خرابی۔ (TTS synthesiser failed.)",
    });
  }
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
