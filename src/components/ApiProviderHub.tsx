import React, { useState } from 'react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Sparkles,
} from 'lucide-react';
import { AIProvider, ProviderConfig } from '../types';
import { askInterviewCopilot } from '../services/apiService';

interface ApiProviderHubProps {
  providers: Record<string, ProviderConfig>;
  activeProviderKey: string;
  onUpdateProvider: (key: string, cfg: ProviderConfig) => void;
  onSetActiveProvider: (key: string) => void;
}

interface ProviderMeta {
  key: AIProvider;
  name: string;
  badge: string;
  description: string;
  getKeyUrl: string;
  defaultModel: string;
  availableModels: string[];
  isFreeAvailable: boolean;
}

const PROVIDER_METADATA: ProviderMeta[] = [
  {
    key: 'gemini_builtin',
    name: 'Gemini 3.8 Flash (Built-in Free)',
    badge: '100% Free & Ready',
    description:
      'Zero configuration required. Powered by Google AI Studio server-side backend with sub-second latency.',
    getKeyUrl: 'https://aistudio.google.com/',
    defaultModel: 'gemini-3.8-flash',
    availableModels: ['gemini-3.8-flash', 'gemini-3.1-pro-preview'],
    isFreeAvailable: true,
  },
  {
    key: 'openrouter',
    name: 'OpenRouter (Includes Free Tier)',
    badge: 'Free & Universal',
    description:
      'Universal API hub with access to free hosted models (Llama 3.3 70B Free, Mistral Nemo Free, Qwen).',
    getKeyUrl: 'https://openrouter.ai/keys',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    availableModels: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
    ],
    isFreeAvailable: true,
  },
  {
    key: 'groq',
    name: 'Groq Cloud (Free Ultra-Fast Tier)',
    badge: 'Fastest Latency',
    description:
      'Ultra-fast LPU inference (500+ tokens/sec). Offers generous free tier API keys for instant interview responses.',
    getKeyUrl: 'https://console.groq.com/keys',
    defaultModel: 'llama-3.3-70b-versatile',
    availableModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    isFreeAvailable: true,
  },
  {
    key: 'deepseek',
    name: 'DeepSeek AI (V3 & R1 Reasoning)',
    badge: 'Coding Specialist',
    description:
      'Exceptional algorithmic reasoning and coding performance at an ultra-low price point.',
    getKeyUrl: 'https://platform.deepseek.com/',
    defaultModel: 'deepseek-chat',
    availableModels: ['deepseek-chat', 'deepseek-reasoner'],
    isFreeAvailable: false,
  },
  {
    key: 'openai',
    name: 'OpenAI (ChatGPT GPT-4o)',
    badge: 'Industry Standard',
    description:
      'Official OpenAI API key for GPT-4o, GPT-4o-mini, and ChatGPT reasoning models.',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o-mini',
    availableModels: ['gpt-4o-mini', 'gpt-4o', 'o1-mini'],
    isFreeAvailable: false,
  },
  {
    key: 'gemini_custom',
    name: 'Google Gemini (Custom User Key)',
    badge: 'Custom Quota',
    description:
      'Enter your own personal Google AI Studio API key for dedicated rate limits and higher concurrency.',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    defaultModel: 'gemini-3.8-flash',
    availableModels: ['gemini-3.8-flash', 'gemini-3.1-pro-preview'],
    isFreeAvailable: true,
  },
];

export const ApiProviderHub: React.FC<ApiProviderHubProps> = ({
  providers,
  activeProviderKey,
  onUpdateProvider,
  onSetActiveProvider,
}) => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string; latency?: number }>
  >({});

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestConnection = async (providerKey: string) => {
    const config = providers[providerKey];
    if (!config) return;

    if (
      providerKey !== 'gemini_builtin' &&
      !config.apiKey &&
      providerKey !== 'openrouter'
    ) {
      setTestResults((prev) => ({
        ...prev,
        [providerKey]: {
          success: false,
          message: 'Please enter an API key first.',
        },
      }));
      return;
    }

    setTestingKey(providerKey);
    const start = Date.now();

    try {
      await askInterviewCopilot({
        question: 'Say "Connection successful" in one sentence.',
        activeProvider: config,
      });

      const latency = Date.now() - start;
      setTestResults((prev) => ({
        ...prev,
        [providerKey]: {
          success: true,
          message: `Connected! Response received in ${latency}ms.`,
          latency,
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerKey]: {
          success: false,
          message: err.message || 'Connection test failed. Check key validity.',
        },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-cyan-400" />
          API Provider & Free Key Configuration Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Switch seamlessly between the built-in free Gemini engine, popular free tiers (OpenRouter, Groq), and your private keys for OpenAI, DeepSeek, and ChatGPT. Keys stay strictly in your browser storage.
        </p>
      </div>

      {/* Grid of Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PROVIDER_METADATA.map((meta) => {
          const config = providers[meta.key] || {
            provider: meta.key,
            apiKey: '',
            model: meta.defaultModel,
            isActive: false,
          };
          const isActive = activeProviderKey === meta.key;
          const isTesting = testingKey === meta.key;
          const testRes = testResults[meta.key];
          const isMasked = !showKeys[meta.key];

          return (
            <div
              key={meta.key}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all backdrop-blur-sm ${
                isActive
                  ? 'bg-slate-900/90 border-cyan-500/60 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                {/* Header with Active Toggle */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-1">
                      {meta.badge}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100">{meta.name}</h3>
                  </div>

                  <button
                    onClick={() => onSetActiveProvider(meta.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isActive ? 'ACTIVE' : 'ACTIVATE'}
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[38px]">
                  {meta.description}
                </p>

                {/* API Key Input (if not built-in) */}
                {meta.key !== 'gemini_builtin' ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>API Key:</span>
                      <a
                        href={meta.getKeyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-0.5 text-[10px]"
                      >
                        Get Key <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type={isMasked ? 'password' : 'text'}
                        value={config.apiKey}
                        onChange={(e) =>
                          onUpdateProvider(meta.key, {
                            ...config,
                            apiKey: e.target.value,
                          })
                        }
                        placeholder={
                          meta.key === 'openrouter'
                            ? 'sk-or-v1-... (or leave empty for some free models)'
                            : 'Enter API Key...'
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-9 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(meta.key)}
                        className="absolute right-2.5 text-slate-500 hover:text-slate-300"
                        title={isMasked ? 'Show Key' : 'Hide Key'}
                      >
                        {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center space-x-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Pre-configured with zero setup required. Ready now.</span>
                  </div>
                )}

                {/* Model Selector */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Model Choice:</label>
                  <select
                    value={config.model}
                    onChange={(e) =>
                      onUpdateProvider(meta.key, {
                        ...config,
                        model: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  >
                    {meta.availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card Footer: Connection Test */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection(meta.key)}
                  disabled={isTesting}
                  className="w-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium py-1.5 rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing Connection...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Test Latency & Key</span>
                    </>
                  )}
                </button>

                {testRes && (
                  <div
                    className={`text-[11px] p-2 rounded-lg flex items-center space-x-1.5 ${
                      testRes.success
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {testRes.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="leading-tight">{testRes.message}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
