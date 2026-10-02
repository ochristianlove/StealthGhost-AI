import React from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Smartphone,
  EyeOff,
  Tv,
  Headphones,
  Lock,
} from 'lucide-react';
import { ScreenSharePreviewTester } from './ScreenSharePreviewTester';

interface ScreenShareSafetyGuideProps {
  onTestPanic: () => void;
  onLaunchPiP: () => void;
}

export const ScreenShareSafetyGuide: React.FC<ScreenShareSafetyGuideProps> = ({
  onTestPanic,
  onLaunchPiP,
}) => {
  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Undetectable Screen Sharing & Stealth Architecture Guide
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Master the four battle-tested strategies to ensure your interview assistant and mock exam reader are 100% invisible across Zoom, Google Meet, Microsoft Teams, and Webex.
        </p>
      </div>

      {/* Live Screen Share Detector & Preview Simulator */}
      <ScreenSharePreviewTester />

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pillar 1 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            1
          </div>
          <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            Window Sharing vs Full Desktop Sharing
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            When your interviewer requests screen sharing (e.g. for coding or presenting), <strong>never share "Entire Screen"</strong>. Always choose <strong>"Window"</strong> and pick your coding IDE (VS Code) or terminal.
          </p>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1">
            <strong className="text-emerald-400 block text-[11px]">THE RESULT:</strong>
            The interviewers only see your code editor. Any floating teleprompters, browser tabs, or notes on your desktop remain 100% hidden.
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            2
          </div>
          <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            Picture-in-Picture (PiP) Window Isolation
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Modern operating systems (macOS, Windows 11, Linux) treat PiP windows as decoupled system overlays. When you launch the <strong>Stealth PiP Copilot</strong>, it stays on top of your full-screen apps but is strictly excluded from application window shares.
          </p>
          <button
            onClick={onLaunchPiP}
            className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs py-2 rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5" />
            Test Launch Picture-in-Picture
          </button>
        </div>

        {/* Pillar 3 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            3
          </div>
          <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            Dual-Device Physical Separation (Mobile Phone)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            If an aggressive proctoring software or interviewer requires full desktop sharing, use the <strong>Mobile Companion QR Sync</strong>. Open the app on your laptop to capture mic/audio, and beam the live cues to your smartphone resting just below your webcam.
          </p>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero software footprint on the screen-shared machine. 100% fail-safe.</span>
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            4
          </div>
          <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-rose-400" />
            Instant Panic Disguise Mask (`Esc` Key)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            If someone walks into your room or an interviewer asks you to stop sharing and show your browser, press the <strong>Esc</strong> key. The entire application instantly transforms into a realistic VS Code editor with boilerplate code.
          </p>
          <button
            onClick={onTestPanic}
            className="w-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs py-2 rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <EyeOff className="w-3.5 h-3.5 text-rose-400" />
            Test Panic Disguise Screen
          </button>
        </div>
      </div>

      {/* Windows Testing & Setup Guide */}
      <div className="bg-slate-900/80 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            WIN
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">
              How to Test on a Windows Computer (Windows 10 / 11)
            </h3>
            <p className="text-xs text-slate-400">
              Complete step-by-step walkthrough to test all features on Microsoft Windows.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>Step 1: Test Screen Problem Capture</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              On Windows, press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono text-[11px]">Win + Shift + S</kbd> to snip any coding or exam question on your screen. Then switch to this app and press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono text-[11px]">Ctrl + V</kbd> or click <strong>"Paste Snip"</strong>.
            </p>
            <span className="text-[10px] text-emerald-400 block font-mono">
              Result: The question image is instantly sent to AI and solved in &lt; 2s.
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>Step 2: Test PiP Window on Windows</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Click the <strong>"PiP Always-on-Top"</strong> button in the top navigation bar. Windows will spawn a native floating overlay player. Drag it anywhere over your code editor.
            </p>
            <span className="text-[10px] text-emerald-400 block font-mono">
              Result: PiP stays pinned on top of all windows without getting hidden.
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>Step 3: Test Undetectable Zoom / Teams Share</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              In Zoom or MS Teams, click <em>Share Screen</em>. Choose <strong>"Window"</strong> and select only your VS Code or terminal window. Do NOT choose "Screen 1".
            </p>
            <span className="text-[10px] text-emerald-400 block font-mono">
              Result: The interviewer only sees your code; your PiP and browser stay invisible.
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>Step 4: Test the Windows Panic Key</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Press the <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-rose-300 font-mono text-[11px]">Esc</kbd> key on your Windows keyboard. The screen will instantly transform into an authentic VS Code editor.
            </p>
            <span className="text-[10px] text-emerald-400 block font-mono">
              Result: Immediate disguise if an interviewer asks to view your browser.
            </span>
          </div>
        </div>
      </div>

      {/* Pre-Interview Safety Checklist */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          Pre-Interview Stealth Checklist
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Connect discrete wireless earbud for whisper cues</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Position HUD directly below your webcam for direct eye contact</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Adjust Ghost Opacity to ~60% to blend into your wallpaper</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Keep phone on silent stand with QR Companion loaded</span>
          </div>
        </div>
      </div>
    </div>
  );
};
