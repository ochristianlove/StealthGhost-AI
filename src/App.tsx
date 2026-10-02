import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveCopilot } from './components/LiveCopilot';
import { MockExamReader } from './components/MockExamReader';
import { ArchitectureStudio } from './components/ArchitectureStudio';
import { AudioTTSStudio } from './components/AudioTTSStudio';
import { ApiProviderHub } from './components/ApiProviderHub';
import { MobileCompanionView } from './components/MobileCompanionView';
import { ScreenShareSafetyGuide } from './components/ScreenShareSafetyGuide';
import { StealthHUD } from './components/StealthHUD';
import { PanicDisguiseModal } from './components/PanicDisguiseModal';
import {
  loadProviders,
  saveProviders,
  loadActiveProvider,
  saveActiveProvider,
  loadTTSConfig,
  saveTTSConfig,
  loadRole,
  saveRole,
  loadStealthOpacity,
  saveStealthOpacity,
  getOrCreateRoomId,
} from './utils/storage';
import { InterviewAnswer, ProviderConfig, TTSConfig } from './types';
import { pipController } from './utils/pipController';
import { speechEngine } from './utils/speech';
import { fetchRoomSyncState } from './services/apiService';
import { Smartphone, Sparkles, Volume2, Shield } from 'lucide-react';

export default function App() {
  // Check if opened as mobile companion via QR link (?companion=true&room=xyz)
  const [isCompanionMode, setIsCompanionMode] = useState(false);
  const [companionRoomId, setCompanionRoomId] = useState('');
  const [companionRoomData, setCompanionRoomData] = useState<any>(null);

  // Core App State
  const [activeTab, setActiveTab] = useState<string>('copilot');
  const [providers, setProviders] = useState<Record<string, ProviderConfig>>(() =>
    loadProviders()
  );
  const [activeProviderKey, setActiveProviderKey] = useState<string>(() =>
    loadActiveProvider()
  );
  const [ttsConfig, setTTSConfig] = useState<TTSConfig>(() => loadTTSConfig());
  const [role, setRole] = useState<string>(() => loadRole());
  const [stealthOpacity, setStealthOpacity] = useState<number>(() =>
    loadStealthOpacity()
  );
  const [roomId] = useState<string>(() => getOrCreateRoomId());

  // Real-time Copilot & HUD State
  const [latestAnswer, setLatestAnswer] = useState<InterviewAnswer | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [pipActive, setPipActive] = useState<boolean>(false);
  const [isPanicActive, setIsPanicActive] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Subscribe to speechEngine speaking changes
  useEffect(() => {
    return speechEngine.subscribeSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // Parse companion mode from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isComp = urlParams.get('companion') === 'true';
      const rId = urlParams.get('room');
      if (isComp && rId) {
        setIsCompanionMode(true);
        setCompanionRoomId(rId);
      }
    }
  }, []);

  // Poll for companion data if in standalone mobile companion view
  useEffect(() => {
    if (!isCompanionMode || !companionRoomId) return;
    const interval = setInterval(async () => {
      const data = await fetchRoomSyncState(companionRoomId);
      if (data) setCompanionRoomData(data);
    }, 1200);
    return () => clearInterval(interval);
  }, [isCompanionMode, companionRoomId]);

  // Global Panic Key (Esc) Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPanicActive((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleUpdateProvider = (key: string, cfg: ProviderConfig) => {
    const updated = { ...providers, [key]: cfg };
    setProviders(updated);
    saveProviders(updated);
  };

  const handleSetActiveProvider = (key: string) => {
    setActiveProviderKey(key);
    saveActiveProvider(key);
  };

  const handleUpdateTTSConfig = (cfg: TTSConfig) => {
    setTTSConfig(cfg);
    saveTTSConfig(cfg);
  };

  const handleUpdateRole = (newRole: string) => {
    setRole(newRole);
    saveRole(newRole);
  };

  const handleUpdateStealthOpacity = (opacity: number) => {
    setStealthOpacity(opacity);
    saveStealthOpacity(opacity);
  };

  const handleLaunchPiP = async () => {
    try {
      const active = await pipController.togglePiP();
      setPipActive(active);
    } catch (err: any) {
      alert('Picture-in-Picture error: ' + err.message);
    }
  };

  const handleAnswerUpdated = (ans: InterviewAnswer) => {
    setLatestAnswer(ans);
    pipController.updateContent(ans, currentTranscript, isListening);
  };

  const handleTranscriptUpdated = (transcript: string, listening: boolean) => {
    setCurrentTranscript(transcript);
    setIsListening(listening);
    pipController.updateContent(latestAnswer, transcript, listening);
  };

  const handleSpeakPunchline = (text: string) => {
    speechEngine.toggleSpeakWithConfig(text, ttsConfig);
  };

  const handleStopSpeaking = () => {
    speechEngine.stopAllAudio();
  };

  // If viewed on mobile phone via QR companion link:
  if (isCompanionMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans flex flex-col justify-between">
        <div className="space-y-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-sm text-white">Stealth Companion</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE</span>
            </div>
          </div>

          {/* Transcript Bar */}
          {companionRoomData?.latestTranscript && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Interviewer Asked:
              </span>
              <p className="font-medium text-slate-100">{companionRoomData.latestTranscript}</p>
            </div>
          )}

          {/* Spoken Punchline */}
          {companionRoomData?.latestAnswer ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-cyan-950/60 to-slate-900 border-2 border-cyan-500/50 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    SAY THIS FIRST:
                  </span>
                  <button
                    onClick={() => handleSpeakPunchline(companionRoomData.latestAnswer.quickAnswer)}
                    className="p-1 bg-cyan-500/20 text-cyan-300 rounded"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-base font-bold text-white leading-relaxed tracking-wide">
                  "{companionRoomData.latestAnswer.quickAnswer}"
                </p>
              </div>

              {/* Bullet Points */}
              {companionRoomData.latestAnswer.keyPoints && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Strategic Bullet Points:
                  </span>
                  <div className="space-y-2">
                    {companionRoomData.latestAnswer.keyPoints.map((pt: string, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 flex items-start space-x-2.5"
                      >
                        <span className="text-cyan-400 font-mono font-bold text-xs">{i + 1}.</span>
                        <span className="leading-snug">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs space-y-3">
              <Smartphone className="w-10 h-10 text-cyan-400 mx-auto opacity-70 animate-pulse" />
              <p>Connected to session room <span className="font-mono text-cyan-300">{companionRoomId}</span>.</p>
              <p className="text-slate-500">
                Answers will automatically appear here as your laptop listens to the interview.
              </p>
            </div>
          )}
        </div>

        <div className="text-center py-3 text-[10px] text-slate-600 border-t border-slate-900">
          Undetectable Second Screen • 100% Screen Share Safe
        </div>
      </div>
    );
  }

  const activeProvider = providers[activeProviderKey] || providers['gemini_builtin'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Panic Disguise Mask */}
      {isPanicActive && (
        <PanicDisguiseModal onDismiss={() => setIsPanicActive(false)} />
      )}

      {/* Persistent Floating Stealth HUD (Teleprompter right under webcam/notch) */}
      <StealthHUD
        answer={latestAnswer}
        transcript={currentTranscript}
        isListening={isListening}
        opacity={stealthOpacity}
        onSpeak={handleSpeakPunchline}
        isSpeaking={isSpeaking}
        onStop={handleStopSpeaking}
      />

      {/* Main Top Navigation & Stealth Controls */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeProvider={activeProvider}
        stealthOpacity={stealthOpacity}
        setStealthOpacity={handleUpdateStealthOpacity}
        onLaunchPiP={handleLaunchPiP}
        pipActive={pipActive}
        onPanicDisguise={() => setIsPanicActive(true)}
        role={role}
        setRole={handleUpdateRole}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeTab === 'copilot' && (
          <LiveCopilot
            activeProvider={activeProvider}
            role={role}
            ttsConfig={ttsConfig}
            roomId={roomId}
            onAnswerUpdated={handleAnswerUpdated}
            onTranscriptUpdated={handleTranscriptUpdated}
          />
        )}

        {activeTab === 'mock_exam' && (
          <MockExamReader
            activeProvider={activeProvider}
            role={role}
            ttsConfig={ttsConfig}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureStudio />}

        {activeTab === 'voice_tts' && (
          <AudioTTSStudio
            ttsConfig={ttsConfig}
            onUpdateTTSConfig={handleUpdateTTSConfig}
          />
        )}

        {activeTab === 'api_hub' && (
          <ApiProviderHub
            providers={providers}
            activeProviderKey={activeProviderKey}
            onUpdateProvider={handleUpdateProvider}
            onSetActiveProvider={handleSetActiveProvider}
          />
        )}

        {activeTab === 'mobile_sync' && <MobileCompanionView roomId={roomId} />}

        {activeTab === 'stealth_guide' && (
          <ScreenShareSafetyGuide
            onTestPanic={() => setIsPanicActive(true)}
            onLaunchPiP={handleLaunchPiP}
          />
        )}
      </main>

      {/* Subtle Footer Bar */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-3 text-center text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <span>StealthGhost AI • Desktop, Android, iOS & Mac</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Active Engine: <strong className="text-cyan-400">{activeProvider.provider}</strong></span>
          <span>Ghost Opacity: <strong className="text-cyan-400">{Math.round(stealthOpacity * 100)}%</strong></span>
          <button
            onClick={() => setIsPanicActive(true)}
            className="hover:text-rose-400 underline transition-colors"
          >
            Emergency Disguise (Esc)
          </button>
        </div>
      </footer>
    </div>
  );
}
