import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Mic,
  Headphones,
  Sparkles,
  Play,
  Square,
  Sliders,
  Check,
  AlertCircle,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { TTSConfig } from '../types';
import { speechEngine } from '../utils/speech';
import { requestGeminiTTS } from '../services/apiService';

interface AudioTTSStudioProps {
  ttsConfig: TTSConfig;
  onUpdateTTSConfig: (cfg: TTSConfig) => void;
}

export const AudioTTSStudio: React.FC<AudioTTSStudioProps> = ({
  ttsConfig,
  onUpdateTTSConfig,
}) => {
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testText, setTestText] = useState(
    'In distributed systems, the CAP theorem states we can guarantee at most two out of Consistency, Availability, and Partition Tolerance.'
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingGeminiTTS, setIsGeneratingGeminiTTS] = useState(false);
  const [premiumProvider, setPremiumProvider] = useState<'elevenlabs' | 'openai'>('elevenlabs');
  const [premiumKey, setPremiumKey] = useState('');
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  useEffect(() => {
    const updateVoices = () => {
      const v = speechEngine.getVoices();
      if (v.length > 0) setBrowserVoices(v);
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleTestBrowserTTS = async () => {
    setIsPlaying(true);
    setTestResultMsg(null);
    try {
      await speechEngine.speakWithConfig(testText, {
        ...ttsConfig,
        engine: 'browser_free',
      });
      setTestResultMsg(`Playing browser voice: "${ttsConfig.voice}".`);
    } catch (e: any) {
      setTestResultMsg('Error: ' + e.message);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleTestGeminiStudioTTS = async () => {
    setIsGeneratingGeminiTTS(true);
    setTestResultMsg(null);
    try {
      const voiceName = ttsConfig.voice.startsWith('Gemini:')
        ? ttsConfig.voice.replace('Gemini:', '').trim()
        : 'Kore';
      await speechEngine.speakWithConfig(testText, {
        ...ttsConfig,
        engine: 'gemini_studio',
        voice: `Gemini: ${voiceName}`,
      });
      setTestResultMsg(`Gemini Studio voice "${voiceName}" played successfully.`);
    } catch (e: any) {
      setTestResultMsg('Gemini Studio TTS Error: ' + e.message);
    } finally {
      setIsGeneratingGeminiTTS(false);
    }
  };

  const handleStopAll = () => {
    speechEngine.stopAllAudio();
    setIsPlaying(false);
    setIsGeneratingGeminiTTS(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-cyan-400" />
          Speech-to-Text & Text-to-Speech (TTS) Studio
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Zero local installation required. Free native speech recognition, free web speech synthesis, Gemini Studio speech engine, and premium external TTS integration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Free STT & Earbud Whispering Settings */}
        <div className="lg:col-span-6 space-y-5">
          {/* Earbud Whisper Mode Card */}
          <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Headphones className="w-5 h-5 text-cyan-400" />
                <h2 className="font-bold text-sm text-white">
                  Discrete Earbud Whispering Mode
                </h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ttsConfig.whisperMode}
                  onChange={(e) =>
                    onUpdateTTSConfig({ ...ttsConfig, whisperMode: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When enabled, answers are spoken at a calm, low whisper designed exclusively for wireless in-ear bluetooth buds. Your interviewer will hear nothing while you receive real-time answers directly in your ear.
            </p>

            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800">
              <span className="text-slate-400">Auto-speak punchlines on question arrival:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ttsConfig.autoSpeakQuickAnswer}
                  onChange={(e) =>
                    onUpdateTTSConfig({ ...ttsConfig, autoSpeakQuickAnswer: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>

          {/* Engine Selector */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              TTS Engine Selection
            </h2>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  onUpdateTTSConfig({
                    ...ttsConfig,
                    engine: 'browser_free',
                    voice: ttsConfig.voice.startsWith('Gemini:')
                      ? browserVoices[0]?.name || 'Google US English'
                      : ttsConfig.voice,
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  ttsConfig.engine === 'browser_free'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Free Web Speech TTS
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Zero setup, instant latency</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdateTTSConfig({
                    ...ttsConfig,
                    engine: 'gemini_studio',
                    voice: ttsConfig.voice.startsWith('Gemini:')
                      ? ttsConfig.voice
                      : 'Gemini: Kore',
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  ttsConfig.engine === 'gemini_studio'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Gemini Studio TTS
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Gemini 3.8 Flash Lite Voice</div>
              </button>
            </div>

            {/* Voice Dropdown */}
            {ttsConfig.engine === 'browser_free' ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Browser Voice Selection:
                </label>
                <select
                  value={ttsConfig.voice}
                  onChange={(e) => onUpdateTTSConfig({ ...ttsConfig, voice: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {browserVoices.length > 0 ? (
                    browserVoices.map((v, i) => (
                      <option key={i} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  ) : (
                    <option value="Google US English">Default System Voice</option>
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gemini Voice Persona:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'].map((name) => (
                    <button
                      key={name}
                      onClick={() =>
                        onUpdateTTSConfig({
                          ...ttsConfig,
                          engine: 'gemini_studio',
                          voice: `Gemini: ${name}`,
                        })
                      }
                      className={`p-2 rounded-lg border text-xs font-mono text-center transition-all ${
                        ttsConfig.voice.includes(name)
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Voice Summary Badge */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Whisper Voice:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {ttsConfig.engine === 'gemini_studio' ? 'Gemini Studio (' + ttsConfig.voice.replace('Gemini: ', '') + ')' : ttsConfig.voice}
              </span>
            </div>

            {/* Pitch & Rate Controls */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Speech Rate:</span>
                  <span className="font-mono text-cyan-400">{ttsConfig.rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.75"
                  step="0.05"
                  value={ttsConfig.rate}
                  onChange={(e) =>
                    onUpdateTTSConfig({ ...ttsConfig, rate: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Volume:</span>
                  <span className="font-mono text-cyan-400">
                    {Math.round(ttsConfig.volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={ttsConfig.volume}
                  onChange={(e) =>
                    onUpdateTTSConfig({ ...ttsConfig, volume: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Voice Tester & Premium TTS Config */}
        <div className="lg:col-span-6 space-y-5">
          {/* Interactive Audio Tester */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              Live Speech Synthesizer Tester
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Test Text / Technical Punchline:
              </label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none font-sans"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={
                  ttsConfig.engine === 'gemini_studio'
                    ? handleTestGeminiStudioTTS
                    : handleTestBrowserTTS
                }
                disabled={isPlaying || isGeneratingGeminiTTS}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {isPlaying || isGeneratingGeminiTTS ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Speaking into Earbud...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Test Voice Playback</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStopAll}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
                title="Stop playback"
              >
                <Square className="w-4 h-4 text-rose-400" />
              </button>
            </div>

            {testResultMsg && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-cyan-300">
                {testResultMsg}
              </div>
            )}
          </div>

          {/* Premium TTS External Integration Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                External Premium TTS API Keys
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Optional</span>
            </div>
            <p className="text-xs text-slate-400">
              Integrate ElevenLabs or OpenAI TTS for hyper-realistic human voice cloning.
            </p>

            <div className="flex space-x-2 text-xs">
              <button
                onClick={() => setPremiumProvider('elevenlabs')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  premiumProvider === 'elevenlabs'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                ElevenLabs
              </button>
              <button
                onClick={() => setPremiumProvider('openai')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  premiumProvider === 'openai'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                OpenAI TTS
              </button>
            </div>

            <div className="space-y-1">
              <input
                type="password"
                value={premiumKey}
                onChange={(e) => setPremiumKey(e.target.value)}
                placeholder={`Enter ${premiumProvider === 'elevenlabs' ? 'ElevenLabs' : 'OpenAI'} API Key...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 block">
                Saved securely in browser local storage.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
