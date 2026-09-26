import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support high resolution base64 screen/image captures
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface OverlayBoxItem {
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  original_text: string;
  translated_thai: string;
  category: 'dialogue' | 'ui' | 'narration' | 'sfx' | 'heading' | 'other';
  reading_direction?: 'horizontal' | 'vertical';
  confidence?: number;
  bg_theme?: 'dark' | 'light' | 'bubble';
}

export interface OverlayTranslationResponse {
  success: boolean;
  detected_source_language: string;
  overall_summary_thai: string;
  items: OverlayBoxItem[];
  error?: string;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Dedicated source code download endpoint
app.get('/api/download-source', (_req, res) => {
  const filePath = path.resolve(__dirname, 'public', 'thai-overlay-translator-source.tar.gz');
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', 'attachment; filename="thai-overlay-translator-source.tar.gz"');
  res.sendFile(filePath);
});

app.get('/thai-overlay-translator-source.tar.gz', (_req, res) => {
  const filePath = path.resolve(__dirname, 'public', 'thai-overlay-translator-source.tar.gz');
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', 'attachment; filename="thai-overlay-translator-source.tar.gz"');
  res.sendFile(filePath);
});

// Explicitly serve public assets (/manifest.json, /sw.js, icons) with CORS headers so tools like PWABuilder can always fetch them
app.use(express.static(path.resolve(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (filePath.endsWith('manifest.json')) {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    }
  },
}));

// Translation & OCR Endpoint
app.post('/api/translate-overlay', async (req, res) => {
  try {
    const { image, sourceLanguage = 'Auto Detect', tone = 'manga', customInstruction = '' } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, error: 'กรุณาส่งรูปภาพ (image base64) ที่ต้องการแปล' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ กรุณาตรวจสอบการตั้งค่า Secrets',
      });
    }

    // Extract mime type and base64 payload
    let mimeType = 'image/png';
    let base64Data = image;

    const matches = image.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    const toneDescriptions: Record<string, string> = {
      manga: 'บทสนทนามังงะ/การ์ตูน: ใช้สำนวนไทยที่เป็นธรรมชาติ เข้ากับอารมณ์ตัวละคร สนุกสนาน คมคาย สละสลวย หากเป็นเสียงเอฟเฟกต์ (SFX) ให้แปลเป็นคำบรรยายเสียงภาษาไทยที่เข้ากับภาพ (เช่น *ฟุ่บ*, *ตึง!*, *เคร้ง!*)',
      gaming: 'เกม & บทสนทนา RPG: ใช้ศัพท์เกมเมอร์ เข้าใจง่าย เหมาะกับ UI เกม เควส ไอเทม สกิล และบทสนทนาตัวละคร (เช่น "เควสหลัก:", "ค่าพลังโจมตี", "ระดับความยาก")',
      general: 'บทสนทนาทั่วไป: ภาษาไทยระดับสนทนา เป็นธรรมชาติ ไม่แข็งทื่อ สื่อความหมายถูกต้องตามบริบท',
      formal: 'ทางการและวิชาการ: ภาษาไทยสุภาพ ถูกต้องตามหลักไวยากรณ์ เหมาะสำหรับเอกสาร ป้ายประกาศ หรือเมนูทางการ',
    };

    const toneGuide = toneDescriptions[tone] || toneDescriptions.manga;

    const systemInstruction = `You are a high-precision OCR and Thai Screen Overlay Translation Engine (เครื่องมือแปลภาษาทับหน้าจอเป็นภาษาไทย).
Your task:
1. Detect all visible on-screen text, speech bubbles, dialogues, subtitles, UI elements, signs, or sound effects in the provided image.
2. For each detected text element, determine its precise 2D bounding box [box_2d] normalized on a scale from 0 to 1000, in the order [ymin, xmin, ymax, xmax], where 0 is top/left and 1000 is bottom/right.
3. Extract the exact 'original_text' (e.g. Japanese Kanji/Kana, English, Korean Hangul, Chinese Hanzi).
4. Translate each text into fluent, expressive, natural Thai ('translated_thai').
   - Tone requested: ${toneGuide}
   - Source Language requested: ${sourceLanguage}
   ${customInstruction ? `- Custom rule: ${customInstruction}` : ''}
5. Assign category: 'dialogue' | 'ui' | 'narration' | 'sfx' | 'heading' | 'other'.
6. Specify reading_direction ('horizontal' or 'vertical') especially for vertical Japanese manga.
7. Give a 1-2 sentence overall summary in Thai ('overall_summary_thai').
8. Identify the 'detected_source_language'.

Always return valid JSON adhering strictly to the schema provided.`;

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const promptText = `Analyze this image for screen overlay translation. Detect all text boxes with their [ymin, xmin, ymax, xmax] (0-1000 range), extract the original text, and translate each into high-quality Thai. Provide an overall summary in Thai.`;

    const modelCandidates = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let response: any = null;
    let lastError: any = null;

    for (const model of modelCandidates) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [imagePart, { text: promptText }],
          },
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detected_source_language: {
                  type: Type.STRING,
                  description: 'The primary detected language of the on-screen text (e.g. Japanese, English, Korean, Chinese)',
                },
                overall_summary_thai: {
                  type: Type.STRING,
                  description: 'A concise 1-2 sentence summary of the translated content in natural Thai.',
                },
                items: {
                  type: Type.ARRAY,
                  description: 'List of detected text segments with coordinates and Thai translations',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      box_2d: {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER },
                        description: '[ymin, xmin, ymax, xmax] coordinates normalized from 0 to 1000',
                      },
                      original_text: {
                        type: Type.STRING,
                        description: 'Original text detected in the image',
                      },
                      translated_thai: {
                        type: Type.STRING,
                        description: 'Accurate and fluent Thai translation fitting the bounding box',
                      },
                      category: {
                        type: Type.STRING,
                        description: 'dialogue, ui, narration, sfx, heading, or other',
                      },
                      reading_direction: {
                        type: Type.STRING,
                        description: 'horizontal or vertical',
                      },
                      confidence: {
                        type: Type.NUMBER,
                        description: 'Confidence score between 0.0 and 1.0',
                      },
                      bg_theme: {
                        type: Type.STRING,
                        description: 'Recommended overlay background style: bubble (white comic), dark (semi-transparent black), or light',
                      },
                    },
                    required: ['box_2d', 'original_text', 'translated_thai', 'category'],
                  },
                },
              },
              required: ['detected_source_language', 'overall_summary_thai', 'items'],
            },
          },
        });
        if (response && response.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed, trying next candidate...`, err?.message || err);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All model candidates failed to respond.');
    }

    const responseText = response.text?.trim() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', responseText);
      return res.status(500).json({
        success: false,
        error: 'ไม่สามารถแปลงข้อมูลผลลัพธ์จาก AI เป็น JSON ได้ กรุณาลองใหม่อีกครั้ง',
      });
    }

    const payload: OverlayTranslationResponse = {
      success: true,
      detected_source_language: parsed.detected_source_language || 'ไม่ระบุ',
      overall_summary_thai: parsed.overall_summary_thai || '',
      items: (parsed.items || []).map((item: any) => ({
        box_2d: item.box_2d && item.box_2d.length === 4 ? item.box_2d : [100, 100, 200, 400],
        original_text: item.original_text || '',
        translated_thai: item.translated_thai || '',
        category: item.category || 'dialogue',
        reading_direction: item.reading_direction || 'horizontal',
        confidence: typeof item.confidence === 'number' ? item.confidence : 0.95,
        bg_theme: item.bg_theme || 'bubble',
      })),
    };

    return res.json(payload);
  } catch (error: any) {
    console.error('Error in /api/translate-overlay:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'เกิดข้อผิดพลาดในการประมวลผลแปลภาษาโอเวอร์เลย์',
    });
  }
});

// Quick Text Translate Endpoint
app.post('/api/quick-translate', async (req, res) => {
  try {
    const { text, tone = 'general' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'กรุณาระบุข้อความที่ต้องการแปล' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `แปลข้อความนี้เป็นภาษาไทยที่สละสลวย เข้ากับบริบท (${tone}):\n\n${text}`,
      config: {
        systemInstruction: 'You are an expert translator specializing in natural, context-aware Thai translations for gaming, media, and everyday conversations.',
        temperature: 0.3,
      },
    });

    return res.json({
      success: true,
      translated_thai: response.text?.trim() || '',
    });
  } catch (error: any) {
    console.error('Error in /api/quick-translate:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'เกิดข้อผิดพลาดในการแปลข้อความ',
    });
  }
});

// Audio Speech to Thai Live Translation Endpoint
app.post('/api/translate-audio', async (req, res) => {
  try {
    const { audio, mimeType = 'audio/webm', sourceLanguage = 'Japanese', context = 'Anime dialogue' } = req.body;

    if (!audio) {
      return res.status(400).json({ success: false, error: 'กรุณาส่งไฟล์เสียง (audio base64)' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ',
      });
    }

    let cleanBase64 = audio;
    const matches = audio.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      cleanBase64 = matches[2];
    }

    const audioPart = {
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    };

    const promptText = `Listen carefully to this audio from a video/anime/stream (presumed language: ${sourceLanguage}, context: ${context}).
1. Transcribe the original speech accurately into the spoken language (e.g. Japanese kanji/hiragana, English, etc.).
2. Translate the speech into fluent, natural, expressive Thai as anime/movie subtitles.
   - If it is anime, make the Thai translation sound like professional Thai anime/drama dubbing/subtitles (natural particles, emotional expressions, character nuances).
   - If there is no clear speech, background noise only, or music only, set has_speech to false.
3. Identify the speaker mood or tone (e.g. excited, angry, calm, whispered, serious).
4. Return JSON only.`;

    const modelCandidates = ['gemini-3.8-flash', 'gemini-3.5-transcribe', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let response: any = null;
    let lastError: any = null;

    for (const model of modelCandidates) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [audioPart, { text: promptText }],
          },
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                has_speech: {
                  type: Type.BOOLEAN,
                  description: 'Whether human speech or dialogue was detected in the audio clip',
                },
                detected_language: {
                  type: Type.STRING,
                  description: 'Detected language spoken in the audio (e.g. Japanese, English, Korean)',
                },
                original_transcript: {
                  type: Type.STRING,
                  description: 'Verbatim transcript in the source language',
                },
                thai_translation: {
                  type: Type.STRING,
                  description: 'Natural, expressive Thai subtitle translation',
                },
                speaker_mood: {
                  type: Type.STRING,
                  description: 'Emotion or style of the speaker (e.g. ตื่นเต้น, โกรธ, เศร้า, สนทนาปกติ)',
                },
              },
              required: ['has_speech', 'detected_language', 'original_transcript', 'thai_translation'],
            },
          },
        });
        if (response && response.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Audio model ${model} failed, trying next...`, err?.message || err);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All model candidates failed to transcribe/translate audio.');
    }

    const parsed = JSON.parse(response.text.trim());
    return res.json({
      success: true,
      has_speech: Boolean(parsed.has_speech),
      detected_language: parsed.detected_language || sourceLanguage,
      original_transcript: parsed.original_transcript || '',
      thai_translation: parsed.thai_translation || '',
      speaker_mood: parsed.speaker_mood || 'ปกติ',
    });
  } catch (error: any) {
    console.error('Error in /api/translate-audio:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'เกิดข้อผิดพลาดในการแปลเสียง',
    });
  }
});

// Mount Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Thai Overlay Translator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
