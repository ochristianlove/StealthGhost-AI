import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Code,
  Layers,
  Sparkles,
  Upload,
  Copy,
  Check,
  Play,
  FileText,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Volume2,
  Square,
} from 'lucide-react';
import { MockExamItem, ProviderConfig, TTSConfig } from '../types';
import { askInterviewCopilot } from '../services/apiService';
import { speechEngine } from '../utils/speech';

interface MockExamReaderProps {
  activeProvider: ProviderConfig;
  role: string;
  ttsConfig: TTSConfig;
}

const PRELOADED_EXAMS: MockExamItem[] = [
  {
    id: 'exam-1',
    title: 'LRU Cache with O(1) Get and Put',
    category: 'Algorithms',
    difficulty: 'Medium',
    question: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.
Implement the LRUCache class:
- LRUCache(int capacity) Initialize the LRU cache with positive size capacity.
- int get(int key) Return the value of the key if the key exists, otherwise return -1.
- void put(int key, int value) Update the value of the key if the key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity, evict the least recently used key.
Both operations must run in O(1) average time complexity.`,
    expectedKeyPoints: [
      'Use a Hash Map combined with a Doubly Linked List',
      'Hash Map provides O(1) key lookup to node reference',
      'Doubly Linked List allows O(1) node removal and insertion at head/tail',
      'Concurrency safety considerations (mutex locks or read-write locks)',
    ],
  },
  {
    id: 'exam-2',
    title: 'Design a Distributed Rate Limiter (Token Bucket / Sliding Window)',
    category: 'System Design',
    difficulty: 'Hard',
    question: `Design an API Rate Limiting service capable of handling 500,000 requests per second across a globally distributed microservices architecture.
Requirements:
1. Prevent DDoS and abusive clients (per IP, per API key, per user).
2. Ultra-low latency overhead (< 5ms).
3. Highly available and fault-tolerant during partial network partitions.
4. Compare Token Bucket vs Sliding Window Log vs Leaky Bucket algorithms.`,
    expectedKeyPoints: [
      'Sliding Window Counter algorithm using Redis sorted sets (ZADD/ZREMRANGEBYSCORE)',
      'Local in-memory proxy caching (Envoy/Nginx) with centralized Redis cluster fallback',
      'Redis Lua scripts to guarantee atomic check-and-increment operations',
      'Handling race conditions and Redis clock drift across regions',
    ],
  },
  {
    id: 'exam-3',
    title: 'React 19 Server Components & Concurrent Rendering',
    category: 'Frontend',
    difficulty: 'Hard',
    question: `In modern React architectures (React 19 / Next.js App Router), explain the fundamental architectural difference between React Server Components (RSC) and standard client-side SSR hydration.
How does the server payload stream to the browser without shipping JavaScript bundle code for server components? How are stateful interactions reconciled?`,
    expectedKeyPoints: [
      'RSC renders exclusively on the server into a specialized JSON-like virtual DOM stream',
      'Zero bundle size overhead for server-only libraries and dependencies',
      'SSR sends initial HTML plus full JS bundle for hydration; RSC streams component tree with slot markers',
      'Server Actions handle state mutations with automatic optimistic updates',
    ],
  },
  {
    id: 'exam-4',
    title: 'STAR Behavioral: Resolving a High-Severity Production Outage',
    category: 'Behavioral',
    difficulty: 'Medium',
    question: `Describe a situation where a critical system outage occurred under your watch. Walk through your triage process, stakeholder communication, technical resolution, and the post-mortem action items you instituted to prevent recurrence.`,
    expectedKeyPoints: [
      'Situation: Database connection pool exhaustion during peak flash sale',
      'Task: Restore system availability within SLA while preventing data corruption',
      'Action: Rolled back canary release, implemented circuit breakers, throttled non-critical queue consumers',
      'Result: Full recovery in 18 minutes, zero data loss, established automated chaos tests',
    ],
  },
];

export const MockExamReader: React.FC<MockExamReaderProps> = ({
  activeProvider,
  role,
  ttsConfig,
}) => {
  const [selectedExam, setSelectedExam] = useState<MockExamItem>(PRELOADED_EXAMS[0]);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [examResult, setExamResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return speechEngine.subscribeSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolveExam = async (item?: MockExamItem) => {
    const questionToSolve = item
      ? item.question
      : customQuestionText || selectedExam.question;
    const imageToSolve = item ? null : uploadedImageBase64;

    setIsSolving(true);
    setExamResult(null);

    try {
      const result = await askInterviewCopilot({
        question: questionToSolve,
        context: `Technical Mock Exam assessment for candidate applying for: ${role}`,
        role,
        mode: 'exam',
        screenImageBase64: imageToSolve,
        activeProvider,
      });

      setExamResult(result);
    } catch (err: any) {
      console.error(err);
      alert('Failed to solve exam: ' + err.message);
    } finally {
      setIsSolving(false);
    }
  };

  const speakText = (text: string) => {
    speechEngine.toggleSpeakWithConfig(text, ttsConfig);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          Technical Mock Exam & Assessment Reader
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Read, solve, and analyze real-world online assessments (LeetCode, HackerRank, CodeSignal, System Design). Upload test screenshots or pick from curated industry standards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Exam Question Bank & Custom Upload */}
        <div className="lg:col-span-5 space-y-5">
          {/* Preloaded Exams List */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Standard Mock Assessments
            </h2>
            <div className="space-y-2">
              {PRELOADED_EXAMS.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => {
                    setSelectedExam(exam);
                    setCustomQuestionText('');
                    setUploadedImageBase64(null);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedExam.id === exam.id && !customQuestionText && !uploadedImageBase64
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950/80 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-cyan-400">{exam.category}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        exam.difficulty === 'Hard'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {exam.difficulty}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs sm:text-sm text-slate-100">{exam.title}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* Upload / Custom Exam Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              Upload Exam Screenshot / Custom Problem
            </h2>

            <textarea
              value={customQuestionText}
              onChange={(e) => setCustomQuestionText(e.target.value)}
              placeholder="Or paste code prompt / exam problem text here..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            />

            {/* Image file selector */}
            <div className="flex items-center space-x-2">
              <label className="flex-1 cursor-pointer bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl p-2.5 text-center text-xs text-slate-300 flex items-center justify-center space-x-2 transition-colors">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>
                  {uploadedImageBase64 ? 'Replace Screenshot' : 'Upload Exam Image (PNG/JPG)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadedImageBase64 && (
                <button
                  onClick={() => setUploadedImageBase64(null)}
                  className="px-3 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {uploadedImageBase64 && (
              <div className="border border-cyan-500/30 rounded-xl overflow-hidden max-h-36">
                <img
                  src={uploadedImageBase64}
                  alt="Uploaded test paper"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <button
              onClick={() => handleSolveExam()}
              disabled={isSolving}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isSolving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing & Solving Exam...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Solve with Full Optimal Code & Proof</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Question Details & AI Solution */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Question Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                {selectedExam.category} Problem Statement
              </span>
              <span className="text-xs text-slate-400">
                Difficulty: {selectedExam.difficulty}
              </span>
            </div>

            <h2 className="text-base font-bold text-white">
              {customQuestionText ? 'Custom Assessment' : selectedExam.title}
            </h2>

            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs sm:text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
              {customQuestionText || selectedExam.question}
            </div>

            {/* Expected Core Principles */}
            {!customQuestionText && selectedExam.expectedKeyPoints && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Expected Candidate Knowledge Points:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {selectedExam.expectedKeyPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="bg-slate-950/70 border border-slate-800/70 rounded-lg p-2 text-xs text-slate-300 flex items-start space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Solved Solution Card */}
          {examResult && (
            <div className="bg-slate-900/80 border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Optimal Exam Solution & Proof
                </h3>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => speakText(examResult.quickAnswer)}
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                      isSpeaking
                        ? 'text-rose-400 bg-rose-500/20 border border-rose-500/30 animate-pulse'
                        : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                    }`}
                    title={isSpeaking ? 'Stop speaking' : 'Whisper solution punchline'}
                  >
                    {isSpeaking ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[10px] font-mono">Stop</span>
                      </>
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(examResult.codeSnippet || examResult.quickAnswer)}
                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Copy full code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Spoken Punchline */}
              <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                  Spoken Strategy / Opening Statement:
                </span>
                <p className="text-sm font-medium text-slate-100 leading-snug">
                  "{examResult.quickAnswer}"
                </p>
              </div>

              {/* Code Snippet */}
              {examResult.codeSnippet && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Production Solution Code (O(1) / Optimal Time & Space):
                  </span>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
                    <pre>{examResult.codeSnippet}</pre>
                  </div>
                </div>
              )}

              {/* Technical Detail & Complexity */}
              {examResult.technicalDetail && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                  <strong className="text-cyan-300 block">Algorithmic Complexity & Edge Cases:</strong>
                  <p className="leading-relaxed">{examResult.technicalDetail}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
