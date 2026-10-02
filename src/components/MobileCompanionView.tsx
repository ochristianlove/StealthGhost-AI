import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Wifi,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { fetchRoomSyncState, pushSyncUpdate } from '../services/apiService';
import { speechEngine } from '../utils/speech';
import { loadTTSConfig } from '../utils/storage';

interface MobileCompanionViewProps {
  roomId: string;
}

export const MobileCompanionView: React.FC<MobileCompanionViewProps> = ({ roomId }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [syncedState, setSyncedState] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [deviceUrl, setDeviceUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}?companion=true&room=${roomId}`;
      setDeviceUrl(url);

      QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0284c7',
          light: '#090d16',
        },
      })
        .then((data) => setQrDataUrl(data))
        .catch((e) => console.error('QR code generation error:', e));
    }
  }, [roomId]);

  // Periodic polling for room state
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(async () => {
      const room = await fetchRoomSyncState(roomId);
      if (room) {
        setSyncedState(room);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [roomId, isPolling]);

  const copyUrl = () => {
    navigator.clipboard.writeText(deviceUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speakAnswer = (text: string) => {
    speechEngine.speakWithConfig(text, loadTTSConfig());
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          Mobile Companion Mode (iOS & Android Second Screen)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          The ultimate 100% undetectable strategy. Scan the QR code with your iPhone or Android to beam real-time answers directly to your phone. Rest your phone right below your monitor for natural eye contact with zero risk during screen shares.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: QR Code & Pairing */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 text-center">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
              Scan with Phone Camera
            </span>

            {/* QR Image */}
            <div className="flex justify-center p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner max-w-[260px] mx-auto">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Companion QR Code"
                  className="w-56 h-56 rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-500">
                  Generating QR Code...
                </div>
              )}
            </div>

            {/* Pairing Code */}
            <div className="space-y-2">
              <div className="text-xs text-slate-400">
                Session Room ID:{' '}
                <span className="font-mono text-cyan-300 font-bold">{roomId}</span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={deviceUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 font-mono focus:outline-none"
                />
                <button
                  onClick={copyUrl}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 text-left flex items-start space-x-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Screen Share Footprint:</strong> Since the answers are displayed on your physical smartphone screen, meeting recording tools (Zoom, Teams, Meet) can never capture or detect your copilot.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Mirrored Companion Teleprompter */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 min-h-[460px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="font-bold text-sm text-white">Live Mirrored Companion Stream</h3>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>Syncing live every 1.5s</span>
              </div>
            </div>

            {syncedState?.latestAnswer ? (
              <div className="space-y-4 flex-1">
                {/* Transcript */}
                {syncedState.latestTranscript && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs">
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-0.5">
                      Interviewer Question:
                    </span>
                    <p className="text-slate-200 font-medium">{syncedState.latestTranscript}</p>
                  </div>
                )}

                {/* Spoken Punchline */}
                <div className="bg-gradient-to-r from-cyan-950/50 via-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      SAY THIS FIRST:
                    </span>
                    <button
                      onClick={() => speakAnswer(syncedState.latestAnswer.quickAnswer)}
                      className="text-cyan-300 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Speak
                    </button>
                  </div>
                  <p className="text-base font-semibold text-white leading-relaxed">
                    "{syncedState.latestAnswer.quickAnswer}"
                  </p>
                </div>

                {/* Key Points */}
                {syncedState.latestAnswer.keyPoints && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Strategic Points & Talking Cues:
                    </span>
                    <div className="space-y-1.5">
                      {syncedState.latestAnswer.keyPoints.map((pt: string, i: number) => (
                        <div
                          key={i}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 flex items-start space-x-2"
                        >
                          <span className="text-cyan-400 font-mono font-bold">{i + 1}.</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-200 text-sm">Waiting for Live Audio Feed</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Start listening or trigger a prompt in the <span className="text-cyan-300">Live Copilot</span> tab to see instant streaming cues appear here and on your paired smartphone.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
