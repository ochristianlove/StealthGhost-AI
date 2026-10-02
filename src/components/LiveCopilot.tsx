import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Camera,
  Play,
  Square,
  Copy,
  Check,
  Volume2,
  Tv,
  History,
  Send,
  RefreshCw,
  Code,
  Layers,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Clipboard,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { InterviewAnswer, OperatingMode, ProviderConfig, TTSConfig, CandidateSkill, SmartHearingConfig } from '../types';
import { askInterviewCopilot, pushSyncUpdate } from '../services/apiService';
import { speechEngine } from '../utils/speech';
import { isInterviewQuestion, isFillerOrNoise } from '../utils/smartHearing';
import { loadSkills, saveSkills, loadSmartHearingConfig, saveSmartHearingConfig } from '../utils/storage';
import { CandidateSkillsBar } from './CandidateSkillsBar';
import { SmartHearingControls } from './SmartHearingControls';

interface LiveCopilotProps {
  activeProvider: ProviderConfig;
  role: string;
  ttsConfig: TTSConfig;
  roomId: string;
  onAnswerUpdated: (answer: InterviewAnswer) => void;
  onTranscriptUpdated: (transcript: string, isListening: boolean) => void;
}

export const LiveCopilot: React.FC<LiveCopilotProps> = ({
  activeProvider,
  role,
  ttsConfig,
  roomId,
  onAnswerUpdated,
  onTranscriptUpdated,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [questionInput, setQuestionInput] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [operatingMode, setOperatingMode] = useState<OperatingMode>('concise');
  const [isLoading, setIsLoading] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState<InterviewAnswer | null>(null);
  const [sessionHistory, setSessionHistory] = useState<InterviewAnswer[]>([]);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'answer' | 'history'>('answer');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [skills, setSkills] = useState<CandidateSkill[]>(() => loadSkills());
  const [smartHearingConfig, setSmartHearingConfig] = useState<SmartHearingConfig>(() =>
    loadSmartHearingConfig()
  );
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [hasDetectedQuestion, setHasDetectedQuestion] = useState(false);

  // Subscribe to speechEngine speaking changes
  useEffect(() => {
    return speechEngine.subscribeSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef<string>('');

  const clearSilenceTimers = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownSeconds(null);
  };

  const handleUpdateSmartHearingConfig = (newCfg: SmartHearingConfig) => {
    setSmartHearingConfig(newCfg);
    saveSmartHearingConfig(newCfg);
  };

  const handleToggleSkill = (skillId: string) => {
    const updated = skills.map((s) => (s.id === skillId ? { ...s, active: !s.active } : s));
    setSkills(updated);
    saveSkills(updated);
  };

  const handleAddCustomSkill = (name: string) => {
    const newSkill: CandidateSkill = {
      id: 'custom-' + Date.now(),
      name,
      category: 'custom',
      description: `Custom expertise in ${name}`,
      active: true,
      keywords: [name],
    };
    const updated = [newSkill, ...skills];
    setSkills(updated);
    saveSkills(updated);
  };

  // Toggle Live Microphone Listening
  const toggleListening = () => {
    if (isListening) {
      clearSilenceTimers();
      speechEngine.stopListening();
      setIsListening(false);
      setHasDetectedQuestion(false);
      onTranscriptUpdated('', false);
    } else {
      clearSilenceTimers();
      const ok = speechEngine.startListening((text, isFinal) => {
        const clean = text.trim();
        setCurrentTranscript(clean);
        latestTranscriptRef.current = clean;
        onTranscriptUpdated(clean, true);

        // Smart Hearing & Question Intent Classifier
        const isQ = isInterviewQuestion(clean, smartHearingConfig.smartFilterNoise);
        setHasDetectedQuestion(isQ);

        // If Auto Fast Answering is turned on and it's a qualifying question
        if (smartHearingConfig.autoAnswerEnabled && isQ && clean.length > 8) {
          clearSilenceTimers();

          const totalMs = smartHearingConfig.silenceThresholdMs || 1200;
          let remainingMs = totalMs;
          setCountdownSeconds(parseFloat((remainingMs / 1000).toFixed(1)));

          countdownIntervalRef.current = setInterval(() => {
            remainingMs -= 100;
            if (remainingMs <= 0) {
              clearSilenceTimers();
              handleAnalyzeQuestion(clean);
            } else {
              setCountdownSeconds(parseFloat((remainingMs / 1000).toFixed(1)));
            }
          }, 100);
        }
      });

      if (ok) {
        setIsListening(true);
        setErrorMsg(null);
      } else {
        setErrorMsg('Microphone permission denied or speech recognition unavailable in this browser.');
      }
    }
  };

  const handleForceAnswerNow = () => {
    const qToAnswer = (currentTranscript || latestTranscriptRef.current || questionInput).trim();
    clearSilenceTimers();
    if (qToAnswer) {
      handleAnalyzeQuestion(qToAnswer);
    }
  };

  // Screen / Mock Exam Window Capture via getDisplayMedia with fallback to Clipboard / File
  const captureScreenQuestion = async () => {
    try {
      setErrorMsg(null);

      // Check if getDisplayMedia is supported in current context (e.g. desktop top-level tab)
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getDisplayMedia !== 'function'
      ) {
        setErrorMsg(
          'Direct screen capture is restricted in this embedded frame or browser. Use "Paste Screenshot (Ctrl+V)" or open this app in a dedicated tab.'
        );
        // Attempt clipboard read if available
        await pasteFromClipboard();
        return;
      }

      setIsCapturingScreen(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' } as any,
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Wait a tick for video frame to load
      await new Promise((r) => setTimeout(r, 400));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImageBase64(dataUrl);

        // Auto analyze question from screen
        handleAnalyzeQuestion(
          questionInput || 'Please solve this exam / interview question from the screen.',
          dataUrl
        );
      }

      // Stop stream tracks
      stream.getTracks().forEach((track) => track.stop());
      setIsCapturingScreen(false);
    } catch (err: any) {
      setIsCapturingScreen(false);
      if (err.name !== 'NotAllowedError') {
        setErrorMsg(
          err.message?.includes('not a function')
            ? 'Screen capture API not supported in embedded frame. Press Ctrl+V (or Win+Shift+S on Windows) to paste a screenshot instantly.'
            : 'Could not capture screen: ' + err.message
        );
      }
    }
  };

  // Direct Clipboard Paste Helper (Win + Shift + S on Windows -> Ctrl + V)
  const pasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              setCapturedImageBase64(dataUrl);
              setErrorMsg(null);
              handleAnalyzeQuestion(
                questionInput || 'Please solve this exam / interview question from the screenshot.',
                dataUrl
              );
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      setErrorMsg(
        'No image found in clipboard. Press Win + Shift + S on Windows to capture any exam question, then press Ctrl + V here.'
      );
    } catch (e: any) {
      setErrorMsg(
        'Clipboard access requires clicking or pressing Ctrl+V. Press Win + Shift + S, then Ctrl + V.'
      );
    }
  };

  // Global Paste Event Listener (Win + Shift + S on Windows -> Ctrl + V anywhere)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              setCapturedImageBase64(dataUrl);
              setErrorMsg(null);
              handleAnalyzeQuestion(
                questionInput || 'Solve this interview problem from the pasted screenshot.',
                dataUrl
              );
            };
            reader.readAsDataURL(blob);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [questionInput, additionalContext, operatingMode, activeProvider]);

  const handleAnalyzeQuestion = async (customQ?: string, customImg?: string | null) => {
    const q = (customQ || questionInput || currentTranscript).trim();
    const img = customImg !== undefined ? customImg : capturedImageBase64;

    if (!q && !img) {
      setErrorMsg('Please speak, type a question, or capture a screen question.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const activeSkillNames = skills.filter((s) => s.active).map((s) => s.name);

      const result = await askInterviewCopilot({
        question: q,
        context: additionalContext,
        role,
        mode: operatingMode,
        screenImageBase64: img,
        activeProvider,
        skills: activeSkillNames,
        speedMode: smartHearingConfig.speedMode,
      });

      setLatestAnswer(result);
      onAnswerUpdated(result);
      setSessionHistory((prev) => [result, ...prev]);

      // Push to sync room for iOS / Android mobile companion
      pushSyncUpdate({
        roomId,
        transcript: q,
        answer: result,
        historyItem: {
          id: 'item-' + Date.now(),
          timestamp: Date.now(),
          question: q,
          answer: result.quickAnswer,
        },
      });

      // If auto-speak or auto-whisper is enabled
      const shouldWhisper =
        smartHearingConfig.autoWhisperOnAnswer || ttsConfig.autoSpeakQuickAnswer;
      if (shouldWhisper && result.quickAnswer) {
        speechEngine.speakWithConfig(result.quickAnswer, ttsConfig);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate guidance. Check your API settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    speechEngine.toggleSpeakWithConfig(text, ttsConfig);
  };

  const copyAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
      {/* 1. Smart Hearing & Instant Auto-Answering Controls */}
      <SmartHearingControls
        config={smartHearingConfig}
        onChangeConfig={handleUpdateSmartHearingConfig}
        isListening={isListening}
        onToggleListening={toggleListening}
        countdownSeconds={countdownSeconds}
        onForceAnswerNow={handleForceAnswerNow}
        isAnalyzing={isLoading}
        hasDetectedQuestion={hasDetectedQuestion}
      />

      {/* 2. Candidate Verified Skills & Domain Grounding Bar */}
      <CandidateSkillsBar
        skills={skills}
        onToggleSkill={handleToggleSkill}
        onAddCustomSkill={handleAddCustomSkill}
      />

      {/* Top Banner: Quick Capture & Modes Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Live Interview Copilot
            </h1>
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              • Instant Answers &amp; Earbud Cues
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Screen OCR Snap Button */}
            <button
              onClick={captureScreenQuestion}
              disabled={isCapturingScreen}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
              title="Capture screen window (requires standalone browser tab on Windows/Mac)"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isCapturingScreen ? 'Capturing...' : 'Snap Screen'}</span>
            </button>

            {/* Paste Screenshot Button (Win + Shift + S on Windows -> Ctrl + V) */}
            <button
              onClick={pasteFromClipboard}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all shadow-sm"
              title="Paste screenshot from clipboard. On Windows press Win+Shift+S to snip, then click here or press Ctrl+V."
            >
              <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Paste Snip (Ctrl+V)</span>
            </button>

            {/* Image File Upload Selector */}
            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result as string;
                      setCapturedImageBase64(dataUrl);
                      setErrorMsg(null);
                      handleAnalyzeQuestion(
                        questionInput || 'Solve this interview problem from the uploaded screenshot.',
                        dataUrl
                      );
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>

            {/* Operating Mode Filter */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
              {(
                [
                  { id: 'concise', label: 'Concise' },
                  { id: 'star', label: 'STAR Story' },
                  { id: 'deep_technical', label: 'Deep Tech' },
                  { id: 'code', label: 'Algorithms' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setOperatingMode(m.id)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    operatingMode === m.id
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Audio Transcript Ticker */}
        {isListening && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-medium shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                HEARING:
              </span>
              <div className="truncate text-slate-300 font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/60 flex-1">
                {currentTranscript || 'Waiting for interviewer to speak...'}
              </div>
            </div>

            {hasDetectedQuestion && countdownSeconds !== null && (
              <div className="flex items-center space-x-2 shrink-0">
                <span className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
                  Auto-Answering in {countdownSeconds}s
                </span>
                <button
                  onClick={handleForceAnswerNow}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm"
                >
                  Answer Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error notification if any */}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Input & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Manual Question Input & Screen Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                Question / Prompt Input
              </span>
              <span className="text-[11px] text-slate-500">Auto-triggers on mic silence</span>
            </div>

            <textarea
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="Paste interview question, mock exam problem, or speak into microphone..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none font-sans"
            />

            {/* Optional screenshot thumbnail */}
            {capturedImageBase64 && (
              <div className="relative border border-slate-700/80 rounded-xl overflow-hidden group">
                <img
                  src={capturedImageBase64}
                  alt="Captured Screen Problem"
                  className="w-full max-h-36 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setCapturedImageBase64(null)}
                    className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded text-xs"
                  >
                    Remove Image
                  </button>
                </div>
                <div className="absolute bottom-1 left-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded text-cyan-300 font-mono">
                  Screen Image Attached
                </div>
              </div>
            )}

            {/* Context / Candidate Profile */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Candidate Context / Resume Edge (optional):
              </label>
              <input
                type="text"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g. 7 yrs React & Go, led migration to Kafka, scaled to 5M DAU"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => handleAnalyzeQuestion()}
                disabled={isLoading}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Instant Cue</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Mock Scenarios & Prompts */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Trigger Prompts
            </span>
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {[
                'Tell me about a time you resolved a major production outage.',
                'Design a distributed rate limiter for a multi-tenant API.',
                'How does React 19 concurrent mode handle hydration mismatch?',
                'Explain how you would optimize an N+1 query problem with high QPS.',
                'Walk me through the LRU Cache algorithm and time complexity.',
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestionInput(p);
                    handleAnalyzeQuestion(p);
                  }}
                  className="text-left text-slate-300 hover:text-cyan-300 hover:bg-slate-800/70 p-2 rounded-lg transition-colors border border-slate-800/50 flex items-center justify-between text-xs"
                >
                  <span className="truncate mr-2 font-medium">{p}</span>
                  <ArrowRight className="w-3 h-3 shrink-0 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Teleprompter Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4 min-h-[460px] flex flex-col">
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('answer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'answer'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Current Guidance
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Session History ({sessionHistory.length})</span>
                </button>
              </div>

              {latestAnswer && activeTab === 'answer' && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => speakText(latestAnswer.quickAnswer)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isSpeaking
                        ? 'text-rose-400 bg-rose-500/20 animate-pulse'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                    }`}
                    title={isSpeaking ? 'Stop speech' : 'Whisper quick answer'}
                  >
                    {isSpeaking ? <Square className="w-4 h-4 fill-current" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyAnswer(latestAnswer.quickAnswer)}
                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Copy Answer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Answer Display */}
            {activeTab === 'answer' ? (
              latestAnswer ? (
                <div className="space-y-4 flex-1">
                  {/* Category, Speed Mode & Confidence Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-[11px] bg-slate-800 border border-slate-700 text-cyan-300 font-semibold">
                        {latestAnswer.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                        ⚡ {smartHearingConfig.speedMode === 'turbo' ? 'Turbo Fast' : 'Balanced'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        TTS: <strong className="text-cyan-400">{ttsConfig.engine === 'gemini_studio' ? 'Gemini Studio' : 'Local Browser'}</strong> ({ttsConfig.voice})
                      </span>
                    </div>
                    <span className="text-emerald-400 font-mono text-xs font-semibold">
                      Confidence: {latestAnswer.confidence}%
                    </span>
                  </div>

                  {/* 1. Quick Spoken Punchline Box */}
                  <div className="bg-gradient-to-br from-cyan-950/40 via-blue-950/20 to-slate-900 border-2 border-cyan-500/40 rounded-xl p-4 shadow-lg shadow-cyan-950/40">
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        SPOKEN OPENING PUNCHLINE (Say This First):
                      </span>
                      <button
                        onClick={() => speakText(latestAnswer.quickAnswer)}
                        className={`text-[11px] font-mono flex items-center gap-1 px-2 py-0.5 rounded transition-all ${
                          isSpeaking
                            ? 'bg-rose-500/25 border border-rose-500/40 text-rose-300 animate-pulse'
                            : 'text-cyan-300 hover:text-cyan-100 bg-cyan-500/20 border border-cyan-500/30'
                        }`}
                        title={isSpeaking ? 'Stop speaking' : 'Whisper cue (click again to stop)'}
                      >
                        {isSpeaking ? (
                          <>
                            <Square className="w-3 h-3 fill-current text-rose-400" />
                            <span>Stop Whisper</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Earbud Cue</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-base font-semibold text-slate-100 leading-relaxed tracking-wide">
                      "{latestAnswer.quickAnswer}"
                    </p>
                  </div>

                  {/* 2. Key Talking Points */}
                  {latestAnswer.keyPoints && latestAnswer.keyPoints.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Strategic Bullet Points & Metrics
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {latestAnswer.keyPoints.map((pt, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs sm:text-sm text-slate-200 flex items-start space-x-2.5"
                          >
                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center shrink-0 font-bold">
                              {idx + 1}
                            </span>
                            <span className="leading-snug">{pt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. STAR Framework breakdown (if behavioral) */}
                  {latestAnswer.starFramework && (
                    <div className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3 space-y-2 text-xs">
                      <h4 className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
                        STAR Method Architecture
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-slate-300">
                        <div className="bg-slate-900/60 p-2 rounded">
                          <strong className="text-cyan-400 block text-[10px]">SITUATION:</strong>
                          {latestAnswer.starFramework.situation}
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded">
                          <strong className="text-cyan-400 block text-[10px]">TASK:</strong>
                          {latestAnswer.starFramework.task}
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded">
                          <strong className="text-cyan-400 block text-[10px]">ACTION:</strong>
                          {latestAnswer.starFramework.action}
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded">
                          <strong className="text-emerald-400 block text-[10px]">RESULT:</strong>
                          {latestAnswer.starFramework.result}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Code Snippet & Algorithmic complexity */}
                  {latestAnswer.codeSnippet && latestAnswer.codeSnippet.trim() !== '' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono flex items-center gap-1">
                          <Code className="w-3.5 h-3.5 text-emerald-400" />
                          Optimal Solution Code
                        </span>
                        <button
                          onClick={() => copyAnswer(latestAnswer.codeSnippet!)}
                          className="hover:text-white text-[11px]"
                        >
                          Copy Code
                        </button>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                        <pre>{latestAnswer.codeSnippet}</pre>
                      </div>
                    </div>
                  )}

                  {/* 5. Deep Technical Detail */}
                  {latestAnswer.technicalDetail && (
                    <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 text-xs text-slate-400 leading-relaxed">
                      <strong className="text-slate-300 block mb-1">Deep Architecture & Trade-offs:</strong>
                      {latestAnswer.technicalDetail}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-200 text-sm">
                    Awaiting Question or Audio Feed
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Turn on <span className="text-cyan-300">Live Hearing</span>, click <span className="text-cyan-300">Snap Screen Question</span>, or pick a prompt to test your undetectable copilot.
                  </p>
                </div>
              )
            ) : (
              /* Session History View */
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                {sessionHistory.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500">
                    No questions answered in this session yet.
                  </div>
                ) : (
                  sessionHistory.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setLatestAnswer(item);
                        setActiveTab('answer');
                      }}
                      className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-cyan-400">{item.category}</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {item.question}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 italic">
                        "{item.quickAnswer}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
