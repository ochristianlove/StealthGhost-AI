import React from 'react';
import { Terminal, Code, Folder, File, Play, Settings, RefreshCw, X } from 'lucide-react';

interface PanicDisguiseModalProps {
  onDismiss: () => void;
}

export const PanicDisguiseModal: React.FC<PanicDisguiseModalProps> = ({ onDismiss }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs flex flex-col select-none">
      {/* VS Code Title Bar */}
      <div className="h-8 bg-[#323233] border-b border-[#252526] px-3 flex items-center justify-between text-xs text-[#969696]">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-blue-400" />
          <span>algorithm_service.ts — project-core — Visual Studio Code</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onDismiss}
            className="text-[11px] text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded border border-transparent hover:border-slate-600 transition-colors"
            title="Exit Disguise Mode (or press Esc again)"
          >
            [Resume Session]
          </button>
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block"></span>
          </div>
        </div>
      </div>

      {/* Editor Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-56 bg-[#252526] border-r border-[#1e1e1e] p-2 space-y-3 hidden sm:block">
          <div className="text-[11px] font-bold text-[#bbbbbb] uppercase tracking-wider flex items-center gap-1">
            <Folder className="w-3.5 h-3.5 text-blue-400" />
            <span>Explorer</span>
          </div>
          <div className="space-y-1 text-slate-400 text-xs">
            <div className="flex items-center space-x-1.5 pl-2 text-slate-300">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>src</span>
            </div>
            <div className="flex items-center space-x-1.5 pl-5 text-blue-300 bg-[#37373d]/60 py-0.5 rounded">
              <File className="w-3.5 h-3.5 text-blue-400" />
              <span>algorithm_service.ts</span>
            </div>
            <div className="flex items-center space-x-1.5 pl-5">
              <File className="w-3.5 h-3.5 text-slate-400" />
              <span>cache_manager.ts</span>
            </div>
            <div className="flex items-center space-x-1.5 pl-5">
              <File className="w-3.5 h-3.5 text-slate-400" />
              <span>types.ts</span>
            </div>
            <div className="flex items-center space-x-1.5 pl-2">
              <File className="w-3.5 h-3.5 text-emerald-400" />
              <span>package.json</span>
            </div>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e]">
          {/* Editor Tabs */}
          <div className="h-8 bg-[#2d2d2d] flex items-center px-3 space-x-2 border-b border-[#1e1e1e]">
            <div className="bg-[#1e1e1e] text-[#ffffff] px-3 py-1 text-xs border-t-2 border-blue-500 flex items-center space-x-2">
              <span>algorithm_service.ts</span>
              <X className="w-3 h-3 text-slate-500 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Code Lines */}
          <div className="flex-1 p-4 overflow-auto space-y-1 leading-relaxed">
            <p className="text-[#6a9955]">// Production LRU Cache implementation with O(1) complexity</p>
            <p className="text-[#6a9955]">// Author: Senior Systems Engineer</p>
            <p>
              <span className="text-[#c586c0]">export class</span>{' '}
              <span className="text-[#4ec9b0]">LRUCacheNode</span>{' '}
              <span className="text-[#d4d4d4]">&#123;</span>
            </p>
            <p className="pl-4">
              <span className="text-[#9cdcfe]">key</span>: <span className="text-[#4ec9b0]">number</span>;
            </p>
            <p className="pl-4">
              <span className="text-[#9cdcfe]">value</span>: <span className="text-[#4ec9b0]">number</span>;
            </p>
            <p className="pl-4">
              <span className="text-[#9cdcfe]">prev</span>: <span className="text-[#4ec9b0]">LRUCacheNode | null</span> = <span className="text-[#569cd6]">null</span>;
            </p>
            <p className="pl-4">
              <span className="text-[#9cdcfe]">next</span>: <span className="text-[#4ec9b0]">LRUCacheNode | null</span> = <span className="text-[#569cd6]">null</span>;
            </p>
            <p className="pl-4">
              <span className="text-[#569cd6]">constructor</span>(<span className="text-[#9cdcfe]">key</span>: <span className="text-[#4ec9b0]">number</span>, <span className="text-[#9cdcfe]">value</span>: <span className="text-[#4ec9b0]">number</span>) &#123;
            </p>
            <p className="pl-8">
              <span className="text-[#569cd6]">this</span>.<span className="text-[#9cdcfe]">key</span> = <span className="text-[#9cdcfe]">key</span>;
            </p>
            <p className="pl-8">
              <span className="text-[#569cd6]">this</span>.<span className="text-[#9cdcfe]">value</span> = <span className="text-[#9cdcfe]">value</span>;
            </p>
            <p className="pl-4">&#125;</p>
            <p>&#125;</p>
            <br />
            <p>
              <span className="text-[#c586c0]">export class</span>{' '}
              <span className="text-[#4ec9b0]">DistributedCacheService</span> &#123;
            </p>
            <p className="pl-4">
              <span className="text-[#569cd6]">private</span> <span className="text-[#9cdcfe]">capacity</span>: <span className="text-[#4ec9b0]">number</span>;
            </p>
            <p className="pl-4">
              <span className="text-[#569cd6]">private</span> <span className="text-[#9cdcfe]">map</span>: <span className="text-[#4ec9b0]">Map&lt;number, LRUCacheNode&gt;</span>;
            </p>
            <p className="pl-4">
              <span className="text-[#569cd6]">constructor</span>(<span className="text-[#9cdcfe]">capacity</span>: <span className="text-[#4ec9b0]">number</span>) &#123;
            </p>
            <p className="pl-8">
              <span className="text-[#569cd6]">this</span>.<span className="text-[#9cdcfe]">capacity</span> = <span className="text-[#9cdcfe]">capacity</span>;
            </p>
            <p className="pl-8">
              <span className="text-[#569cd6]">this</span>.<span className="text-[#9cdcfe]">map</span> = <span className="text-[#569cd6]">new</span> <span className="text-[#4ec9b0]">Map</span>();
            </p>
            <p className="pl-4">&#125;</p>
            <p>&#125;</p>
          </div>

          {/* Fake Integrated Terminal */}
          <div className="h-32 bg-[#181818] border-t border-[#2b2b2b] p-3 text-[11px] font-mono text-[#cccccc] space-y-1">
            <div className="flex items-center space-x-2 text-slate-500 mb-1">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>TERMINAL — bash</span>
            </div>
            <p className="text-emerald-400">$ npm run test:unit</p>
            <p className="text-slate-400">PASS src/tests/algorithm_service.test.ts (14 tests passed, 0 failed)</p>
            <p className="text-slate-400">Time: 1.24s, estimated memory: 42MB</p>
            <p className="text-cyan-400">$ _</p>
          </div>
        </div>
      </div>

      {/* VS Code Status Bar */}
      <div className="h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-3">
          <span>main*</span>
          <span>TypeScript 5.4</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Ln 18, Col 4</span>
          <span>Spaces: 2</span>
          <button
            onClick={onDismiss}
            className="hover:underline font-bold text-white ml-2 bg-blue-700 px-1.5 rounded"
          >
            Click here or press Esc to return
          </button>
        </div>
      </div>
    </div>
  );
};
