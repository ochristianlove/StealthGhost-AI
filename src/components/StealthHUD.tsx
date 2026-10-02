import React, { useEffect, useRef, useState } from 'react';
import {
  Tv,
  EyeOff,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Sparkles,
  Move,
  Square,
} from 'lucide-react';
import { InterviewAnswer } from '../types';

interface StealthHUDProps {
  answer: InterviewAnswer | null;
  transcript: string;
  isListening: boolean;
  opacity: number;
  onSpeak: (text: string) => void;
  isSpeaking?: boolean;
  onStop?: () => void;
  onClose?: () => void;
}

export const StealthHUD: React.FC<StealthHUDProps> = ({
  answer,
  transcript,
  isListening,
  opacity,
  onSpeak,
  isSpeaking = false,
  onStop,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState<'top' | 'top_right' | 'bottom'>('top');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-2 left-1/2 -translate-x-1/2 w-[92vw] max-w-2xl';
      case 'top_right':
        return 'top-2 right-4 w-96';
      case 'bottom':
        return 'bottom-2 left-1/2 -translate-x-1/2 w-[92vw] max-w-2xl';
    }
  };

  if (!answer && !transcript && !isListening) {
    return null;
  }

  return (
    <div
      style={{ opacity }}
      className={`fixed ${getPositionClasses()} z-50 transition-all duration-200 pointer-events-auto`}
    >
      <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-950/50 overflow-hidden text-slate-100">
        {/* HUD Header Bar */}
        <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs select-none">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-semibold text-cyan-300 tracking-wide text-[11px] uppercase">
              Stealth Teleprompter
            </span>
            {isListening && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                Listening...
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* Dock Position Toggles */}
            <button
              onClick={() =>
                setPosition((prev) =>
                  prev === 'top' ? 'top_right' : prev === 'top_right' ? 'bottom' : 'top'
                )
              }
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Cycle Notch / Corner / Bottom Dock Position"
            >
              <Move className="w-3.5 h-3.5" />
            </button>

            {answer && (
              <button
                onClick={() => copyToClipboard(answer.quickAnswer)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                title="Copy Quick Answer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title={isMinimized ? 'Expand HUD' : 'Minimize HUD'}
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* HUD Body */}
        {!isMinimized && (
          <div className="p-3 space-y-2.5 max-h-[70vh] overflow-y-auto scrollbar-thin">
            {/* Live Hearing Transcript Banner */}
            {transcript && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-xs">
                <span className="text-slate-400 font-medium mr-1.5">Interviewer:</span>
                <span className="text-slate-200 italic font-sans">{transcript}</span>
              </div>
            )}

            {/* Answer Display */}
            {answer ? (
              <div className="space-y-2">
                {/* Spoken Quick Punchline */}
                <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/40 rounded-lg p-2.5 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      SAY THIS FIRST (PUNCHLINE):
                    </span>
                    <button
                      onClick={() => (isSpeaking && onStop ? onStop() : onSpeak(answer.quickAnswer))}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        isSpeaking
                          ? 'bg-rose-500/25 border border-rose-500/40 text-rose-300 animate-pulse'
                          : 'bg-cyan-500/20 text-cyan-300 hover:text-cyan-100 border border-cyan-500/30'
                      }`}
                      title={isSpeaking ? 'Stop whispering' : 'Whisper cue via earbud (press again to stop)'}
                    >
                      {isSpeaking ? (
                        <>
                          <Square className="w-2.5 h-2.5 fill-current text-rose-400" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-cyan-300" />
                          <span>Whisper</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm font-medium text-slate-100 leading-snug tracking-wide">
                    "{answer.quickAnswer}"
                  </p>
                </div>

                {/* Key Talking Points */}
                {answer.keyPoints && answer.keyPoints.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Core Trade-offs & Talking Points
                    </span>
                    <ul className="space-y-1">
                      {answer.keyPoints.map((pt, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-300 bg-slate-900/50 border border-slate-800/80 rounded px-2 py-1 flex items-start space-x-1.5"
                        >
                          <span className="text-cyan-400 font-mono text-[11px] font-bold">
                            {i + 1}.
                          </span>
                          <span className="leading-snug">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Code Snippet (if available) */}
                {answer.codeSnippet && answer.codeSnippet.trim() !== '' && (
                  <div className="bg-black/60 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                    <pre>{answer.codeSnippet}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-500">
                Listening for question or exam screenshot...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
