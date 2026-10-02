import {
  AIProvider,
  ProviderConfig,
  OperatingMode,
  InterviewAnswer,
  ImageModel,
  ImageSize,
  AspectRatio,
  SpeedMode,
} from '../types';

export async function askInterviewCopilot(params: {
  question: string;
  context?: string;
  role?: string;
  mode?: OperatingMode;
  screenImageBase64?: string | null;
  activeProvider: ProviderConfig;
  skills?: string[];
  speedMode?: SpeedMode;
}): Promise<InterviewAnswer> {
  const { question, context, role, mode, screenImageBase64, activeProvider, skills = [], speedMode = 'turbo' } = params;

  if (activeProvider.provider === 'gemini_builtin' || activeProvider.provider === 'gemini_custom') {
    const res = await fetch('/api/gemini/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        context,
        role,
        mode,
        screenImageBase64,
        customApiKey: activeProvider.provider === 'gemini_custom' ? activeProvider.apiKey : null,
        skills,
        speedMode,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to reach AI service' }));
      throw new Error(err.error || 'Gemini Copilot request failed');
    }

    const json = await res.json();
    return {
      ...json.data,
      timestamp: Date.now(),
    };
  } else {
    // Other providers via /api/ai/proxy
    const systemPrompt = `You are StealthGhost AI, an elite real-time invisible interview copilot. Role: "${role}". Mode: "${mode}". Return strictly a JSON object with:
{
  "quickAnswer": "1-2 sentence spoken punchline",
  "keyPoints": ["3-5 punchy bullet points"],
  "technicalDetail": "Deep technical explanation and trade-offs",
  "codeSnippet": "code if applicable",
  "category": "Technical",
  "confidence": 95
}`;

    const res = await fetch('/api/ai/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: activeProvider.provider,
        apiKey: activeProvider.apiKey,
        model: activeProvider.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Provider proxy failed' }));
      throw new Error(err.error || `${activeProvider.provider} request failed`);
    }

    const json = await res.json();
    return {
      question,
      quickAnswer: json.data?.quickAnswer || 'No quick answer received',
      keyPoints: json.data?.keyPoints || [],
      technicalDetail: json.data?.technicalDetail || '',
      codeSnippet: json.data?.codeSnippet || '',
      starFramework: json.data?.starFramework,
      category: json.data?.category || 'General',
      confidence: json.data?.confidence || 90,
      timestamp: Date.now(),
    };
  }
}

export async function requestGeminiTTS(text: string, voiceName: string = 'Kore'): Promise<string> {
  const res = await fetch('/api/gemini/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Gemini TTS failed' }));
    throw new Error(err.error || 'Failed to generate voice');
  }

  const json = await res.json();
  return json.audioData;
}

export async function generateArchitectureDiagram(params: {
  prompt: string;
  model?: ImageModel;
  size?: ImageSize;
  aspectRatio?: AspectRatio;
}): Promise<{ imageUrl: string; description?: string }> {
  const res = await fetch('/api/gemini/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: params.prompt,
      model: params.model || 'gemini-3-pro-image-preview',
      imageSize: params.size || '1K',
      aspectRatio: params.aspectRatio || '16:9',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Image generation failed' }));
    throw new Error(err.error || 'Failed to generate system diagram');
  }

  const json = await res.json();
  return {
    imageUrl: json.imageUrl,
    description: json.description,
  };
}

export async function pushSyncUpdate(payload: {
  roomId: string;
  transcript?: string;
  answer?: any;
  historyItem?: any;
}) {
  try {
    await fetch('/api/sync/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Sync update warning:', err);
  }
}

export async function fetchRoomSyncState(roomId: string) {
  const res = await fetch(`/api/sync/room/${roomId}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.room;
}
