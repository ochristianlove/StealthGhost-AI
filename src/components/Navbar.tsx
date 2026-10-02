import React from 'react';
import {
  Shield,
  Mic,
  BookOpen,
  Layers,
  Volume2,
  Key,
  Smartphone,
  HelpCircle,
  EyeOff,
  Tv,
  CheckCircle2,
  Monitor,
} from 'lucide-react';
import { ProviderConfig } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeProvider: ProviderConfig;
  stealthOpacity: number;
  setStealthOpacity: (opacity: number) => void;
  onLaunchPiP: () => void;
  pipActive: boolean;
  onPanicDisguise: () => void;
  role: string;
  setRole: (role: string) => void;
}

export const ROLES = [
  'Senior Software Engineer / Full Stack',
  'Distributed Systems & Cloud Architect',
  'Frontend Architect / React Lead',
  'DevOps, SRE & Platform Engineer',
  'AI / Machine Learning Engineer',
  'Technical Product Manager',
  'Engineering Manager / Leadership',
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeProvider,
  stealthOpacity,
  setStealthOpacity,
  onLaunchPiP,
  pipActive,
  onPanicDisguise,
  role,
  setRole,
}) => {
  const tabs = [
    { id: 'copilot', label: 'Live Copilot', icon: Mic, badge: 'Realtime' },
    { id: 'mock_exam', label: 'Mock Exam Reader', icon: BookOpen, badge: 'Vision' },
    { id: 'architecture', label: 'Architecture & Whiteboard', icon: Layers, badge: 'Image Gen' },
    { id: 'voice_tts', label: 'Voice & Whispering', icon: Volume2 },
    { id: 'api_hub', label: 'API Keys & Models', icon: Key },
    { id: 'mobile_sync', label: 'Mobile Sync', icon: Smartphone, badge: 'iOS/Android' },
    { id: 'stealth_guide', label: 'Screen Share Test & Stealth', icon: Monitor, badge: 'Simulator' },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner with Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Stealth Status */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-100 text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                StealthGhost <span className="text-cyan-400 font-medium">Copilot</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                Undetectable HUD
              </span>
            </div>
          </div>
        </div>

        {/* Role Selector & Quick Provider Badge */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Target Role:</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 text-slate-200 text-xs rounded-md px-2.5 py-1 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 rounded-md px-2.5 py-1 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px] text-cyan-300">
              {activeProvider.provider === 'gemini_builtin'
                ? 'Gemini 3.8 Flash (Free)'
                : activeProvider.provider.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Stealth Quick Actions */}
        <div className="flex items-center space-x-2">
          {/* Opacity slider for floating HUD */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-400">
            <span className="text-[11px]">Ghost Opacity:</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={stealthOpacity}
              onChange={(e) => setStealthOpacity(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              title="Adjust background opacity for overlay stealth"
            />
            <span className="font-mono text-[10px] text-cyan-400 w-7 text-right">
              {Math.round(stealthOpacity * 100)}%
            </span>
          </div>

          {/* Picture in Picture Button (OS Floating, excluded from shared window) */}
          <button
            onClick={onLaunchPiP}
            className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              pipActive
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Launch native Picture-in-Picture window (always-on-top, not shared in Zoom/Teams window share)"
          >
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline font-medium">PiP Always-on-Top</span>
          </button>

          {/* Instant Panic / Disguise Button */}
          <button
            onClick={onPanicDisguise}
            className="flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors"
            title="Emergency Disguise (or press 'Esc') - disguises window as a code editor or note"
          >
            <EyeOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-medium">Panic (Esc)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center space-x-1 overflow-x-auto scrollbar-none py-1.5 border-t border-slate-900">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-cyan-400/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
