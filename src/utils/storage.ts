import {
  ProviderConfig,
  TTSConfig,
  InterviewAnswer,
  GeneratedDiagram,
  CandidateSkill,
  SmartHearingConfig,
} from '../types';

const STORAGE_KEYS = {
  PROVIDERS: 'stealthghost_providers',
  ACTIVE_PROVIDER: 'stealthghost_active_provider',
  TTS: 'stealthghost_tts',
  ROLE: 'stealthghost_role',
  MODE: 'stealthghost_mode',
  ROOM_ID: 'stealthghost_room_id',
  HISTORY: 'stealthghost_history',
  DIAGRAMS: 'stealthghost_diagrams',
  STEALTH_OPACITY: 'stealthghost_opacity',
  SKILLS: 'stealthghost_skills',
  SMART_HEARING: 'stealthghost_smart_hearing',
};

export const defaultProviders: Record<string, ProviderConfig> = {
  gemini_builtin: {
    provider: 'gemini_builtin',
    apiKey: '',
    model: 'gemini-3.8-flash (Built-in Free)',
    isActive: true,
  },
  gemini_custom: {
    provider: 'gemini_custom',
    apiKey: '',
    model: 'gemini-3.8-flash',
    isActive: false,
  },
  openai: {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    isActive: false,
  },
  openrouter: {
    provider: 'openrouter',
    apiKey: '',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    isActive: false,
  },
  deepseek: {
    provider: 'deepseek',
    apiKey: '',
    model: 'deepseek-chat',
    isActive: false,
  },
  groq: {
    provider: 'groq',
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    isActive: false,
  },
};

export const defaultTTSConfig: TTSConfig = {
  engine: 'browser_free',
  voice: 'Google US English',
  rate: 1.05,
  pitch: 1.0,
  volume: 0.8,
  whisperMode: true,
  autoSpeakQuickAnswer: false,
};

export function loadProviders(): Record<string, ProviderConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROVIDERS);
    if (!raw) return defaultProviders;
    return { ...defaultProviders, ...JSON.parse(raw) };
  } catch {
    return defaultProviders;
  }
}

export function saveProviders(providers: Record<string, ProviderConfig>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
  } catch (e) {
    console.error('Error saving providers:', e);
  }
}

export function loadActiveProvider(): string {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROVIDER) || 'gemini_builtin';
}

export function saveActiveProvider(providerKey: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROVIDER, providerKey);
}

export function loadTTSConfig(): TTSConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TTS);
    if (!raw) return defaultTTSConfig;
    return { ...defaultTTSConfig, ...JSON.parse(raw) };
  } catch {
    return defaultTTSConfig;
  }
}

export function saveTTSConfig(cfg: TTSConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TTS, JSON.stringify(cfg));
  } catch (e) {
    console.error('Error saving TTS config:', e);
  }
}

export function loadRole(): string {
  return localStorage.getItem(STORAGE_KEYS.ROLE) || 'Senior Software Engineer / Full Stack';
}

export function saveRole(role: string): void {
  localStorage.setItem(STORAGE_KEYS.ROLE, role);
}

export function loadStealthOpacity(): number {
  const val = localStorage.getItem(STORAGE_KEYS.STEALTH_OPACITY);
  return val ? parseFloat(val) : 0.95;
}

export function saveStealthOpacity(opacity: number): void {
  localStorage.setItem(STORAGE_KEYS.STEALTH_OPACITY, opacity.toString());
}

export function getOrCreateRoomId(): string {
  let roomId = localStorage.getItem(STORAGE_KEYS.ROOM_ID);
  if (!roomId) {
    roomId = 'room-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(STORAGE_KEYS.ROOM_ID, roomId);
  }
  return roomId;
}

export function loadDiagrams(): GeneratedDiagram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DIAGRAMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDiagrams(diagrams: GeneratedDiagram[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DIAGRAMS, JSON.stringify(diagrams.slice(0, 20)));
  } catch (e) {
    console.error('Failed to save diagrams:', e);
  }
}

export const defaultCandidateSkills: CandidateSkill[] = [
  {
    id: 'skill-sys-design',
    name: 'System Design',
    category: 'systems',
    description: 'CAP, sharding, replication, microservices, Kafka, Redis, low latency',
    active: true,
    keywords: ['CAP theorem', 'horizontal scaling', 'distributed caching', 'sharding', 'event-driven'],
  },
  {
    id: 'skill-dsa',
    name: 'DSA & Algorithms',
    category: 'core',
    description: 'Big-O time/space, DP, graph BFS/DFS, two pointers, sliding window',
    active: true,
    keywords: ['time complexity', 'space complexity', 'O(1)', 'binary search', 'dynamic programming'],
  },
  {
    id: 'skill-react-fe',
    name: 'React 19 & Frontend',
    category: 'frontend',
    description: 'Server Components, concurrent rendering, virtual DOM, SSR hydration, Tailwind',
    active: true,
    keywords: ['React Server Components', 'memoization', 'custom hooks', 'hydration', 'bundle optimization'],
  },
  {
    id: 'skill-backend-go',
    name: 'Backend & Go/Node',
    category: 'backend',
    description: 'Goroutines, async I/O, REST, gRPC, ACID transactions, connection pools',
    active: true,
    keywords: ['goroutines', 'channels', 'gRPC', 'connection pooling', 'concurrency safe'],
  },
  {
    id: 'skill-cloud-devops',
    name: 'AWS & Cloud / DevOps',
    category: 'cloud',
    description: 'Kubernetes, Docker, ECS/EKS, Terraform, CI/CD, auto-scaling, cloud security',
    active: false,
    keywords: ['Kubernetes pods', 'Terraform', 'CI/CD pipeline', 'auto-scaling', 'IAM least-privilege'],
  },
  {
    id: 'skill-db-sql',
    name: 'SQL & Database Scaling',
    category: 'data',
    description: 'B-tree indexing, query execution plans, Postgres, Redis locks, migrations',
    active: true,
    keywords: ['B-Tree index', 'EXPLAIN ANALYZE', 'isolation levels', 'read replicas', 'WAL'],
  },
  {
    id: 'skill-star-behavioral',
    name: 'STAR Leadership',
    category: 'behavioral',
    description: 'Situation, Task, Action, Result framework with measurable business metrics',
    active: true,
    keywords: ['STAR method', 'stakeholder management', 'trade-offs', 'measurable impact', 'root cause'],
  },
  {
    id: 'skill-ai-llm',
    name: 'AI & LLM Architecture',
    category: 'systems',
    description: 'RAG, vector embeddings, chunking strategies, prompt engineering, agentic loops',
    active: false,
    keywords: ['RAG architecture', 'vector embeddings', 'semantic search', 'cosine similarity'],
  },
];

export const defaultSmartHearingConfig: SmartHearingConfig = {
  autoHearingEnabled: true,
  autoAnswerEnabled: true,
  silenceThresholdMs: 1200,
  smartFilterNoise: true,
  autoWhisperOnAnswer: false,
  speedMode: 'turbo',
};

export function loadSkills(): CandidateSkill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SKILLS);
    if (!raw) return defaultCandidateSkills;
    return JSON.parse(raw);
  } catch {
    return defaultCandidateSkills;
  }
}

export function saveSkills(skills: CandidateSkill[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SKILLS, JSON.stringify(skills));
  } catch (e) {
    console.error('Failed to save candidate skills:', e);
  }
}

export function loadSmartHearingConfig(): SmartHearingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SMART_HEARING);
    if (!raw) return defaultSmartHearingConfig;
    return { ...defaultSmartHearingConfig, ...JSON.parse(raw) };
  } catch {
    return defaultSmartHearingConfig;
  }
}

export function saveSmartHearingConfig(cfg: SmartHearingConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SMART_HEARING, JSON.stringify(cfg));
  } catch (e) {
    console.error('Failed to save smart hearing config:', e);
  }
}
