export type AIProvider = 'gemini_builtin' | 'gemini_custom' | 'openai' | 'openrouter' | 'deepseek' | 'groq';

export type OperatingMode = 'concise' | 'star' | 'deep_technical' | 'code' | 'exam';

export type SpeedMode = 'turbo' | 'balanced' | 'comprehensive';

export interface SmartHearingConfig {
  autoHearingEnabled: boolean; // Continuous smart speech listening
  autoAnswerEnabled: boolean; // Auto-trigger AI answer as soon as question ends
  silenceThresholdMs: number; // e.g. 1000 (Turbo), 1400 (Fast), 1800 (Relaxed)
  smartFilterNoise: boolean; // Filter small talk/fillers ("yeah", "okay", "uh huh")
  autoWhisperOnAnswer: boolean; // Automatically whisper punchline into earbud immediately
  speedMode: SpeedMode; // 'turbo' (< 800ms punchlines) vs 'balanced' vs 'comprehensive'
}

export interface CandidateSkill {
  id: string;
  name: string;
  category: 'core' | 'frontend' | 'backend' | 'systems' | 'cloud' | 'data' | 'behavioral' | 'custom';
  description: string;
  active: boolean;
  keywords?: string[];
}

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  isActive: boolean;
}

export interface InterviewAnswer {
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
  timestamp: number;
}

export interface MockExamItem {
  id: string;
  title: string;
  category: 'Algorithms' | 'System Design' | 'Behavioral' | 'Frontend' | 'Architecture';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  starterCode?: string;
  expectedKeyPoints: string[];
}

export interface TTSConfig {
  engine: 'browser_free' | 'gemini_studio' | 'elevenlabs';
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  whisperMode: boolean; // low volume or earbud focus
  autoSpeakQuickAnswer: boolean;
  apiKey?: string;
}

export type ImageModel = 'gemini-3-pro-image-preview' | 'gemini-3.1-flash-image-preview';
export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export interface GeneratedDiagram {
  id: string;
  prompt: string;
  imageUrl: string;
  description?: string;
  model: ImageModel;
  size: ImageSize;
  aspectRatio: AspectRatio;
  timestamp: number;
}
