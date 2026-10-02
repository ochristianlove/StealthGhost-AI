import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini client utility
const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory sync store for Mobile Companion (QR Sync to iOS/Android)
interface SyncRoom {
  roomId: string;
  lastUpdated: number;
  latestTranscript: string;
  latestAnswer: {
    question: string;
    quickAnswer: string;
    keyPoints: string[];
    technicalDetail?: string;
    codeSnippet?: string;
    starFramework?: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
    category: string;
    confidence: number;
  } | null;
  history: Array<{
    id: string;
    timestamp: number;
    question: string;
    answer: string;
  }>;
}

const syncRooms = new Map<string, SyncRoom>();

// Clean up stale sync rooms periodically (older than 6 hours)
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of syncRooms.entries()) {
    if (now - room.lastUpdated > 6 * 60 * 60 * 1000) {
      syncRooms.delete(id);
    }
  }
}, 30 * 60 * 1000);

// API Routes

// 1. Health & Config status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now(),
  });
});

// 2. Main Gemini Interview Copilot Endpoint
app.post('/api/gemini/assist', async (req, res) => {
  try {
    const {
      question,
      context = '',
      role = 'Senior Software Engineer / Full Stack',
      mode = 'concise', // 'concise' | 'star' | 'deep_technical' | 'code' | 'exam'
      screenImageBase64 = null,
      customApiKey = null,
      skills = [],
      speedMode = 'turbo', // 'turbo' | 'balanced' | 'comprehensive'
    } = req.body;

    if (!question && !screenImageBase64) {
      return res.status(400).json({ error: 'Question or screen image is required.' });
    }

    // Determine GenAI client (built-in server key or user-provided Gemini key)
    const client = customApiKey
      ? new GoogleGenAI({
          apiKey: customApiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        })
      : ai;

    const skillsContext =
      Array.isArray(skills) && skills.length > 0
        ? `CANDIDATE VERIFIED SKILLS & EXPERTISE:
The candidate specializes in: ${skills.join(', ')}.
Ground all answers, system design components, code paradigms, and metrics naturally within this exact skill profile.`
        : '';

    const speedDirective =
      speedMode === 'turbo'
        ? `TURBO SPEED DIRECTIVE:
Generate with maximum velocity. The "quickAnswer" must be a lightning-fast, ultra-high-conviction punchline (maximum 2 spoken sentences) that answers the core question immediately. Bullet points must be crisp, high-density phrases without filler.`
        : '';

    const systemInstruction = `You are StealthGhost AI, an elite real-time invisible interview copilot and mock exam mentor.
Your user is actively in a live job interview or technical mock exam.
Target Role: "${role}".
Operating Mode: "${mode}".
Speed Optimization: "${speedMode}".

${skillsContext}

${speedDirective}

CRITICAL INSTRUCTIONS:
1. Provide ultra-clear, spoken-friendly, punchy guidance designed for instant glancing while maintaining natural eye contact with the camera.
2. The "quickAnswer" must be 1-2 spoken sentences that the candidate can immediately voice aloud without hesitation.
3. "keyPoints" must be 3-5 concise bullet points highlighting core tradeoffs, metrics, or technologies.
4. If code is needed (LeetCode / algorithm / syntax), provide optimal, clean syntax in "codeSnippet" with Big-O time and space complexity in "technicalDetail".
5. If behavioral question, provide STAR framework breakdown (Situation, Task, Action, Result).
6. Always return clean, parseable JSON matching the requested structure.`;

    const promptText = `
Interview / Exam Question:
"${question || 'Analyze the provided exam question or technical problem in the screenshot.'}"

Additional Context / Candidate Profile:
"${context || 'Standard tech interview setting'}"

Response format requested:
{
  "quickAnswer": "1-2 sentence direct opening punchline",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "technicalDetail": "Deep technical explanation, architectural trade-offs, or Big-O analysis",
  "codeSnippet": "clean code if applicable, else empty string",
  "starFramework": {
    "situation": "brief situation",
    "task": "brief task",
    "action": "brief action taken",
    "result": "quantifiable outcome"
  },
  "category": "Behavioral" | "System Design" | "Algorithms" | "Technical Knowledge" | "General",
  "confidence": 95
}
`;

    let contentsPayload: any;
    if (screenImageBase64) {
      // Strip data:image/...;base64, prefix if present
      const cleanData = screenImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanData,
            },
          },
          { text: promptText },
        ],
      };
    } else {
      contentsPayload = promptText;
    }

    let response: any = null;
    let modelUsed = 'gemini-3.1-flash-lite';

    try {
      response = await client.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });
    } catch (primaryErr: any) {
      console.warn('gemini-3.1-flash-lite failed, falling back to gemini-3.8-flash:', primaryErr?.message);
      modelUsed = 'gemini-3.8-flash';
      response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });
    }

    const rawText = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        quickAnswer: rawText.slice(0, 200),
        keyPoints: [rawText],
        technicalDetail: rawText,
        category: 'General',
        confidence: 90,
      };
    }

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/gemini/assist:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate interview response from Gemini',
    });
  }
});

// 3. Multi-Provider API Proxy (OpenAI, OpenRouter, DeepSeek, Groq)
app.post('/api/ai/proxy', async (req, res) => {
  try {
    const { provider, apiKey, model, messages, temperature = 0.4 } = req.body;

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    // Determine target URL and headers based on provider
    let endpoint = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let resolvedModel = model;

    switch (provider) {
      case 'openai':
        endpoint = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        resolvedModel = model || 'gpt-4o-mini';
        break;
      case 'openrouter':
        endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = 'https://aistudio.google.com';
        headers['X-Title'] = 'StealthGhost Interview Copilot';
        resolvedModel = model || 'meta-llama/llama-3.3-70b-instruct:free';
        break;
      case 'deepseek':
        endpoint = 'https://api.deepseek.com/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        resolvedModel = model || 'deepseek-chat';
        break;
      case 'groq':
        endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        resolvedModel = model || 'llama-3.3-70b-versatile';
        break;
      default:
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    if (!apiKey) {
      return res.status(400).json({
        error: `API key required for ${provider}. Please enter your key in Settings.`,
      });
    }

    const externalRes = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!externalRes.ok) {
      const errText = await externalRes.text();
      return res.status(externalRes.status).json({
        error: `${provider} error (${externalRes.status}): ${errText}`,
      });
    }

    const data = await externalRes.json();
    const content = data.choices?.[0]?.message?.content;
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { quickAnswer: content, keyPoints: [content] };
    }

    return res.json({ success: true, data: parsed, raw: data });
  } catch (err: any) {
    console.error('Error in /api/ai/proxy:', err);
    return res.status(500).json({ error: err?.message || 'Proxy request failed' });
  }
});

// 4. Gemini Speech Synthesis (TTS) endpoint
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Call gemini-3.8-flash-lite-tts
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 600), // optimal speech length for whisper cue
              speechMetadata: {
                style: 'Calm, confident, articulate mentor whispering interview punchline',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(502).json({ error: 'No audio returned from Gemini TTS' });
    }

    return res.json({
      success: true,
      audioData: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/tts:', err);
    return res.status(500).json({ error: err?.message || 'Gemini TTS generation failed' });
  }
});

function generateFallbackSvgArchitecture(prompt: string, aspectRatio: string): string {
  const width = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 1000 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 1000 : 720;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    
    <!-- Grid lines -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.7" opacity="0.4"/>
    </pattern>
    <rect width="${width}" height="${height}" fill="url(#grid)" />

    <!-- Header -->
    <text x="40" y="55" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" letter-spacing="1">SYSTEM ARCHITECTURE BLUEPRINT</text>
    <text x="40" y="80" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="13">${prompt.replace(/[<>&]/g, '')}</text>

    <!-- Component 1: Clients -->
    <g transform="translate(60, 160)">
      <rect width="180" height="140" rx="12" fill="url(#cardGrad)" stroke="#38bdf8" stroke-width="1.5" filter="url(#glow)"/>
      <text x="90" y="32" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">CLIENT LAYER</text>
      <rect x="20" y="50" width="140" height="26" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="90" y="67" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">iOS / Android App</text>
      <rect x="20" y="86" width="140" height="26" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="90" y="103" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">Web / Desktop PWA</text>
    </g>

    <!-- Flow Arrow 1 -->
    <path d="M 240 230 L 320 230" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="4,4" fill="none"/>
    <polygon points="325,230 315,225 315,235" fill="#0ea5e9"/>
    <text x="280" y="220" fill="#38bdf8" font-family="monospace" font-size="10" text-anchor="middle">HTTPS / WSS</text>

    <!-- Component 2: API Gateway & Load Balancer -->
    <g transform="translate(330, 140)">
      <rect width="200" height="180" rx="12" fill="url(#cardGrad)" stroke="#818cf8" stroke-width="1.5" filter="url(#glow)"/>
      <text x="100" y="32" fill="#818cf8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">GATEWAY & LB</text>
      <rect x="20" y="50" width="160" height="30" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="100" y="70" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">Envoy Proxy / Geo-DNS</text>
      <rect x="20" y="90" width="160" height="30" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="100" y="110" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">Rate Limiter (Token Bucket)</text>
      <rect x="20" y="130" width="160" height="30" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="100" y="150" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">Auth & JWT Verifier</text>
    </g>

    <!-- Flow Arrow 2 -->
    <path d="M 530 230 L 610 230" stroke="#818cf8" stroke-width="2" stroke-dasharray="4,4" fill="none"/>
    <polygon points="615,230 605,225 605,235" fill="#818cf8"/>
    <text x="570" y="220" fill="#a5b4fc" font-family="monospace" font-size="10" text-anchor="middle">gRPC / mTLS</text>

    <!-- Component 3: Microservices Cluster -->
    <g transform="translate(620, 120)">
      <rect width="220" height="220" rx="12" fill="url(#cardGrad)" stroke="#34d399" stroke-width="1.5" filter="url(#glow)"/>
      <text x="110" y="32" fill="#34d399" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">CORE SERVICES</text>
      <rect x="20" y="50" width="180" height="34" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="110" y="72" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">Transaction Engine</text>
      <rect x="20" y="94" width="180" height="34" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="110" y="116" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">Notification / Event Worker</text>
      <rect x="20" y="138" width="180" height="34" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="110" y="160" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">Telemetry / Audit Log</text>
      <text x="110" y="200" fill="#10b981" font-family="monospace" font-size="10" text-anchor="middle">Autoscaling (K8s Pods)</text>
    </g>

    <!-- Flow Arrow 3 (to Cache & DB) -->
    <path d="M 840 200 L 920 180" stroke="#34d399" stroke-width="2" fill="none"/>
    <polygon points="925,178 915,175 917,185" fill="#34d399"/>
    <path d="M 840 260 L 920 280" stroke="#34d399" stroke-width="2" fill="none"/>
    <polygon points="925,282 917,275 915,285" fill="#34d399"/>

    <!-- Component 4: Cache Layer -->
    <g transform="translate(930, 110)">
      <rect width="220" height="120" rx="12" fill="url(#cardGrad)" stroke="#f59e0b" stroke-width="1.5" filter="url(#glow)"/>
      <text x="110" y="30" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">IN-MEMORY CACHE</text>
      <rect x="20" y="46" width="180" height="28" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="110" y="65" fill="#fde68a" font-family="monospace" font-size="11" text-anchor="middle">Redis Cluster (Sharded)</text>
      <text x="110" y="98" fill="#94a3b8" font-family="monospace" font-size="10" text-anchor="middle">Sub-millisecond Latency</text>
    </g>

    <!-- Component 5: Database Tier -->
    <g transform="translate(930, 260)">
      <rect width="220" height="140" rx="12" fill="url(#cardGrad)" stroke="#ec4899" stroke-width="1.5" filter="url(#glow)"/>
      <text x="110" y="30" fill="#ec4899" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">PERSISTENCE STORAGE</text>
      <rect x="20" y="46" width="180" height="28" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="110" y="65" fill="#fbcfe8" font-family="monospace" font-size="11" text-anchor="middle">PostgreSQL / Spanner Master</text>
      <rect x="20" y="82" width="180" height="28" rx="6" fill="#0f172a" stroke="#334155"/>
      <text x="110" y="101" fill="#cbd5e1" font-family="monospace" font-size="10" text-anchor="middle">Read Replicas & CDC</text>
      <text x="110" y="128" fill="#f43f5e" font-family="monospace" font-size="9" text-anchor="middle">ACID • Geo-Replication</text>
    </g>

    <!-- Footer Stats -->
    <rect x="40" y="${height - 70}" width="${width - 80}" height="45" rx="10" fill="#0f172a" stroke="#1e293b"/>
    <text x="60" y="${height - 42}" fill="#64748b" font-family="monospace" font-size="11">Metrics: 99.999% SLA • P99 Latency &lt; 8ms • Fault Tolerant Circuit Breaking</text>
    <text x="${width - 60}" y="${height - 42}" fill="#38bdf8" font-family="monospace" font-size="11" text-anchor="end">Model: ${prompt.slice(0, 30)}</text>
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// 5. System Architecture & Whiteboard Diagram Image Generation
app.post('/api/gemini/generate-image', async (req, res) => {
  const {
    prompt,
    model = 'gemini-3-pro-image-preview',
    aspectRatio = '16:9',
    imageSize = '1K',
  } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required for image generation.' });
  }

  const validAspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
  const chosenAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';
  const validSizes = ['1K', '2K', '4K'];
  const chosenSize = validSizes.includes(imageSize) ? imageSize : '1K';

  try {
    const response = await ai.models.generateContent({
      model: model || 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: `High-fidelity technical system architecture diagram or whiteboard interview diagram: ${prompt}. Professional dark-themed tech whiteboard, clear data flow arrows, microservices blocks, databases, caching layers, crisp readable labels.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: chosenAspectRatio as any,
          imageSize: chosenSize as any,
        },
      },
    });

    let imageUrl: string | null = null;
    let descriptionText = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        descriptionText += part.text;
      }
    }

    if (imageUrl) {
      return res.json({
        success: true,
        imageUrl,
        description: descriptionText,
        aspectRatio: chosenAspectRatio,
        imageSize: chosenSize,
      });
    }
  } catch (err: any) {
    console.warn('Gemini image generation model hit error or quota limit:', err?.message);
    // Graceful fallback to architectural SVG visualizer so applicant is never blocked
    const fallbackUrl = generateFallbackSvgArchitecture(prompt, chosenAspectRatio);
    return res.json({
      success: true,
      imageUrl: fallbackUrl,
      description: `Architectural blueprint generated. (Note: To use ${model} with full photorealistic output, configure a paid key in Settings).`,
      aspectRatio: chosenAspectRatio,
      imageSize: chosenSize,
      isFallback: true,
    });
  }

  // If no image was produced
  const fallbackUrl = generateFallbackSvgArchitecture(prompt, chosenAspectRatio);
  return res.json({
    success: true,
    imageUrl: fallbackUrl,
    description: 'System design architecture diagram synthesized.',
    aspectRatio: chosenAspectRatio,
    imageSize: chosenSize,
  });
});

// 6. Mobile Companion Sync Endpoints (QR Code Pair to Android / iOS)
app.post('/api/sync/update', (req, res) => {
  const { roomId, transcript, answer, historyItem } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: 'roomId is required' });
  }

  let room = syncRooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      lastUpdated: Date.now(),
      latestTranscript: transcript || '',
      latestAnswer: answer || null,
      history: [],
    };
    syncRooms.set(roomId, room);
  } else {
    room.lastUpdated = Date.now();
    if (transcript !== undefined) room.latestTranscript = transcript;
    if (answer !== undefined) room.latestAnswer = answer;
    if (historyItem) {
      room.history.unshift(historyItem);
      if (room.history.length > 50) room.history.pop();
    }
  }

  return res.json({ success: true, room });
});

app.get('/api/sync/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = syncRooms.get(roomId);
  if (!room) {
    return res.json({
      success: true,
      exists: false,
      room: {
        roomId,
        lastUpdated: Date.now(),
        latestTranscript: '',
        latestAnswer: null,
        history: [],
      },
    });
  }
  return res.json({ success: true, exists: true, room });
});

// Setup Vite middlewares in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StealthGhost AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
