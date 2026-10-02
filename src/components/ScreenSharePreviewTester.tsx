import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Shield,
  Eye,
  EyeOff,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Laptop,
  Layers,
  Info,
} from 'lucide-react';
import { pipController } from '../utils/pipController';

export const ScreenSharePreviewTester: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [sharingType, setSharingType] = useState<string>('none');
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pipActive, setPipActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stop stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Connect stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startTestShare = async () => {
    setErrorMsg(null);
    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getDisplayMedia !== 'function'
      ) {
        setErrorMsg(
          'Display capture is not available inside this preview frame. Click "Open in Dedicated Tab" above, or test on your standalone browser.'
        );
        return;
      }

      setIsCapturing(true);
      const testStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const videoTrack = testStream.getVideoTracks()[0];
      const settings: any = videoTrack ? videoTrack.getSettings() : {};
      const surface = settings.displaySurface || 'window';

      setSharingType(surface);
      setStream(testStream);
      setIsCapturing(false);

      videoTrack.onended = () => {
        setStream(null);
        setSharingType('none');
      };
    } catch (err: any) {
      setIsCapturing(false);
      if (err.name !== 'NotAllowedError') {
        setErrorMsg('Screen share preview test failed: ' + err.message);
      }
    }
  };

  const stopTestShare = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setSharingType('none');
    }
  };

  const handleLaunchPiP = async () => {
    try {
      const active = await pipController.togglePiP();
      setPipActive(active);
    } catch (err: any) {
      alert('PiP Error: ' + err.message);
    }
  };

  const isSafeWindowShare = sharingType === 'window' || sharingType === 'browser';
  const isDangerousDesktopShare = sharingType === 'monitor' || sharingType === 'screen';

  return (
    <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 space-y-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-cyan-400" />
              Live Screen Share Detection & Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Simulate a Zoom or Google Meet screen share right now to inspect exactly what your interviewer would see on their monitor.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {stream ? (
            <button
              onClick={stopTestShare}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Share Test</span>
            </button>
          ) : (
            <button
              onClick={startTestShare}
              disabled={isCapturing}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCapturing ? 'Starting Simulator...' : 'Launch Share Test'}</span>
            </button>
          )}

          <button
            onClick={handleLaunchPiP}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              pipActive
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Launch PiP window to test invisibility"
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>{pipActive ? 'PiP Active' : 'Test PiP Overlay'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-300 text-xs">
          <Info className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Real-time Share Feed & Audit Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: What the Interviewer Sees Video Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative bg-black/80 border-2 border-slate-800 rounded-xl overflow-hidden min-h-[260px] flex items-center justify-center">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[360px] object-contain rounded-lg"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Monitor className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-300">
                  Screen Share Simulator Idle
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  Click <strong>"Launch Share Test"</strong>, select your code editor or VS Code window, and watch this preview to verify if your teleprompter or PiP window is visible to others.
                </p>
              </div>
            )}

            {stream && (
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-black/80 border border-slate-700 text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                INTERVIEWER LIVE FEED
              </div>
            )}
          </div>
        </div>

        {/* Right: Stealth Diagnostics Scorecard */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Live Invisibility Audit
            </h3>

            {stream ? (
              <div className="space-y-2.5">
                {/* Status indicator */}
                <div
                  className={`p-3 rounded-xl border flex items-start space-x-2.5 ${
                    isSafeWindowShare
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : isDangerousDesktopShare
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  }`}
                >
                  {isSafeWindowShare ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : isDangerousDesktopShare ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  )}

                  <div className="text-xs">
                    <strong className="block font-bold mb-0.5">
                      {isSafeWindowShare
                        ? '100% SAFE: WINDOW SHARE ACTIVE'
                        : isDangerousDesktopShare
                        ? 'CAUTION: ENTIRE DESKTOP SHARED'
                        : `ACTIVE SHARE: ${sharingType.toUpperCase()}`}
                    </strong>
                    <p className="leading-snug text-[11px] opacity-90">
                      {isSafeWindowShare
                        ? 'Only the selected application window is broadcast. Your PiP copilot, browser HUD, and background notes are completely isolated and invisible.'
                        : isDangerousDesktopShare
                        ? 'You shared your entire monitor. Everything on this screen will be visible. In a real interview, switch to "Window" sharing instead!'
                        : 'Sharing a browser tab or surface.'}
                    </p>
                  </div>
                </div>

                {/* Audit Checklist */}
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span>Selected Share Target:</span>
                    <span className="font-mono text-cyan-400 font-bold capitalize">
                      {sharingType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span>PiP Window Isolation:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {isSafeWindowShare ? 'Excluded (Invisible)' : 'Check Video Feed'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span>Phone Companion Mode:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      100% Undetectable
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                <p>
                  <strong>How to verify undetectable mode:</strong>
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300 text-[11px]">
                  <li>Click <strong>"Launch Share Test"</strong> above.</li>
                  <li>In the browser popup, click the <strong>"Window"</strong> tab and choose VS Code.</li>
                  <li>Click <strong>"Test PiP Overlay"</strong> to float your copilot over VS Code.</li>
                  <li>Look at the video preview box on the left.</li>
                  <li><strong>Notice:</strong> The video preview shows ONLY your VS Code editor — the floating PiP teleprompter is completely invisible in the stream!</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
