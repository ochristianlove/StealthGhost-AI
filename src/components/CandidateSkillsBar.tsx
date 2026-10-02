import React, { useState } from 'react';
import {
  Code,
  Sparkles,
  Plus,
  X,
  Check,
  Zap,
  Sliders,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CandidateSkill } from '../types';

interface CandidateSkillsBarProps {
  skills: CandidateSkill[];
  onToggleSkill: (skillId: string) => void;
  onAddCustomSkill: (skillName: string) => void;
  onRemoveSkill?: (skillId: string) => void;
}

export const CandidateSkillsBar: React.FC<CandidateSkillsBarProps> = ({
  skills,
  onToggleSkill,
  onAddCustomSkill,
  onRemoveSkill,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const activeSkillsCount = skills.filter((s) => s.active).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillText.trim()) return;
    onAddCustomSkill(newSkillText.trim());
    setNewSkillText('');
    setIsAdding(false);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 sm:p-4 backdrop-blur-md space-y-3">
      {/* Top Header / Counter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Candidate Expertise Skills
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold">
                {activeSkillsCount} Active Grounding
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Copilot tailors opening punchlines, code paradigms, and tradeoffs to your active skills.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center space-x-1 text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
          >
            <Plus className="w-3 h-3 text-cyan-400" />
            <span>Add Skill</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <span className="text-[11px]">Less</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span className="text-[11px]">All ({skills.length})</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Skill Mini Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newSkillText}
            onChange={(e) => setNewSkillText(e.target.value)}
            placeholder="e.g. GraphQL, Kubernetes, Rust, Kafka, Redis, Microfrontends..."
            className="flex-1 bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Skill Toggle Chips Grid */}
      <div className="flex flex-wrap gap-1.5">
        {(isExpanded ? skills : skills.slice(0, 6)).map((skill) => (
          <button
            key={skill.id}
            onClick={() => onToggleSkill(skill.id)}
            className={`group flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs transition-all border ${
              skill.active
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm shadow-cyan-950'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
            }`}
            title={skill.description}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                skill.active ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="font-medium text-[11px]">{skill.name}</span>
            {skill.active && <Check className="w-3 h-3 text-cyan-400 ml-0.5" />}
          </button>
        ))}

        {!isExpanded && skills.length > 6 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-500 hover:text-slate-300"
          >
            +{skills.length - 6} more
          </button>
        )}
      </div>
    </div>
  );
};
