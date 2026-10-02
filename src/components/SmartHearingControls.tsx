import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Zap,
  Sliders,
  Volume2,
  Headphones,
  Check,
  AlertCircle,
  Clock,
  Radio,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { SmartHearingConfig, SpeedMode } from '../types';

interface SmartHearingControlsProps {
  config: SmartHearingConfig;
  onChangeConfig: (newCfg: SmartHearingConfig) => void;
  isListening: boolean;
  onToggleListening: () => void;
  countdownSeconds: number | null;
  onForceAnswerNow: () => void;
  isAnalyzing: boolean;
  hasDetectedQuestion: boolean;
}

export const SmartHearingControls: React.FC<SmartHearingControlsProps> = ({
  config,
  onChangeConfig,
  isListening,
  onToggleListening,
  countdownSeconds,
  onForceAnswerNow,
  isAnalyzing,
  hasDetectedQuestion,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
      {/* Top Main Bar: Status & Primary Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Hearing Status & Radar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleListening}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isListening
                ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
            }`}
          >
            {isListening ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <MicOff className="w-4 h-4" />
                <span>Stop Hearing</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Start Smart Hearing</span>
              </>
            )}
          </button>

          {/* Live Audio Activity / Detection Badge */}
          <div className="flex items-center space-x-2 text-xs">
            {isListening ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-[11px] font-semibold">
                  {hasDetectedQuestion ? 'Question Detected' : 'Listening to Interviewer...'}
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">Microphone idle</span>
            )}
          </div>
        </div>

        {/* Right: Auto Fast Answering & Speed Mode Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Countdown / Force Answer Button */}
          {countdownSeconds !== null && !isAnalyzing && (
            <button
              onClick={onForceAnswerNow}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 animate-pulse"
              title="Skip silence wait and generate answer right now"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Answer Now ({countdownSeconds}s)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {/* Auto Answer Toggle */}
          <button
            onClick={() =>
              onChangeConfig({ ...config, autoAnswerEnabled: !config.autoAnswerEnabled })
            }
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              config.autoAnswerEnabled
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Automatically triggers AI answers when interviewer stops talking"
          >
            <Zap className={`w-3.5 h-3.5 ${config.autoAnswerEnabled ? 'text-cyan-400 fill-current' : ''}`} />
            <span>Auto Answering: {config.autoAnswerEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Speed Preset Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-[11px]">
            <button
              onClick={() => onChangeConfig({ ...config, speedMode: 'turbo', silenceThresholdMs: 900 })}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                config.speedMode === 'turbo'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Turbo Mode: Sub-second punchlines & 900ms silence auto-trigger"
            >
              ⚡ Turbo (&lt;1s)
            </button>
            <button
              onClick={() => onChangeConfig({ ...config, speedMode: 'balanced', silenceThresholdMs: 1400 })}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                config.speedMode === 'balanced'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Fast: 1.4s silence auto-trigger"
            >
              Fast (1.4s)
            </button>
          </div>

          {/* Auto Whisper into Earbud Toggle */}
          <button
            onClick={() =>
              onChangeConfig({ ...config, autoWhisperOnAnswer: !config.autoWhisperOnAnswer })
            }
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              config.autoWhisperOnAnswer
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Automatically speaks punchline into your earbud without pressing Whisper"
          >
            <Headphones className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Earbud Whisper:</span>
            <span>{config.autoWhisperOnAnswer ? 'ON' : 'OFF'}</span>
          </button>

          {/* Quick Settings Gear */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Smart hearing settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Advanced Hearing Settings */}
      {showSettings && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Silence Detection Threshold */}
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Silence Wait Threshold:</span>
                <span className="font-mono text-cyan-400 font-bold">{config.silenceThresholdMs}ms</span>
              </div>
              <input
                type="range"
                min="600"
                max="2500"
                step="100"
                value={config.silenceThresholdMs}
                onChange={(e) =>
                  onChangeConfig({ ...config, silenceThresholdMs: parseInt(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <span className="text-[10px] text-slate-500">Lower = faster answers; Higher = waits for long pauses</span>
            </div>

            {/* Smart Noise & Small-talk Filter */}
            <div className="flex flex-col justify-between">
              <span className="text-slate-400">Interviewer Small-talk Filter:</span>
              <label className="flex items-center space-x-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={config.smartFilterNoise}
                  onChange={(e) =>
                    onChangeConfig({ ...config, smartFilterNoise: e.target.checked })
                  }
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 bg-slate-900"
                />
                <span className="text-[11px] text-slate-300">
                  Filter "yeah", "ok", "can you hear me"
                </span>
              </label>
            </div>

            {/* Continuous Smart Re-connect */}
            <div className="flex flex-col justify-between">
              <span className="text-slate-400">Continuous Smart Reconnect:</span>
              <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Auto-restarts when browser cuts stream</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
