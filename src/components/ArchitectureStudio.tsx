import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Download,
  Copy,
  Check,
  Maximize2,
  RefreshCw,
  Image as ImageIcon,
  Sliders,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { AspectRatio, GeneratedDiagram, ImageModel, ImageSize } from '../types';
import { generateArchitectureDiagram } from '../services/apiService';
import { loadDiagrams, saveDiagrams } from '../utils/storage';

const QUICK_SYSTEM_DESIGN_PROMPTS = [
  {
    title: 'Distributed Rate Limiter with Redis & Envoy',
    prompt:
      'Detailed clean dark-theme system architecture diagram of a high-throughput distributed rate limiter with client, API Gateway Envoy, Redis sliding-window cluster, fallback in-memory cache, and monitoring.',
  },
  {
    title: 'Global URL Shortener (TinyURL Architecture)',
    prompt:
      'High-level technical system design flowchart for a scalable URL shortener: DNS, Geo-DNS Load Balancer, Web Tier, KGS (Key Generation Service), Redis Cache, NoSQL / Cassandra Sharded Database, and Analytics pipeline.',
  },
  {
    title: 'Real-time Chat with WebSockets & Redis Pub/Sub',
    prompt:
      'Architecture diagram for a real-time messaging platform: Mobile/Web clients, WebSocket Gateway cluster, Redis Pub/Sub bus, Cassandra for message history, S3 for media storage, and Push Notification service.',
  },
  {
    title: 'Event-Driven E-Commerce Checkout Pipeline',
    prompt:
      'Microservices architecture diagram for high-volume payment processing: Order Service, Apache Kafka event stream, Payment Gateway with idempotency key, Inventory Service, and Dead Letter Queue (DLQ).',
  },
];

export const ArchitectureStudio: React.FC = () => {
  const [prompt, setPrompt] = useState(QUICK_SYSTEM_DESIGN_PROMPTS[0].prompt);
  const [model, setModel] = useState<ImageModel>('gemini-3-pro-image-preview');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentDiagram, setCurrentDiagram] = useState<GeneratedDiagram | null>(null);
  const [gallery, setGallery] = useState<GeneratedDiagram[]>(() => loadDiagrams());
  const [copied, setCopied] = useState(false);

  const ASPECT_RATIOS: AspectRatio[] = [
    '1:1',
    '2:3',
    '3:2',
    '3:4',
    '4:3',
    '9:16',
    '16:9',
    '21:9',
  ];

  const IMAGE_SIZES: ImageSize[] = ['1K', '2K', '4K'];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Please enter a description for the architecture diagram.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const result = await generateArchitectureDiagram({
        prompt,
        model,
        size: imageSize,
        aspectRatio,
      });

      const newDiagram: GeneratedDiagram = {
        id: 'diag-' + Date.now(),
        prompt,
        imageUrl: result.imageUrl,
        description: result.description,
        model,
        size: imageSize,
        aspectRatio,
        timestamp: Date.now(),
      };

      setCurrentDiagram(newDiagram);
      const updatedGallery = [newDiagram, ...gallery];
      setGallery(updatedGallery);
      saveDiagrams(updatedGallery);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Image generation failed. Verify API configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imgUrl: string, name: string) => {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `${name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          System Design Architecture & Whiteboard Visualizer
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Generate production-grade architecture blueprints, whiteboard interview topologies, and distributed system flowcharts in real time using Gemini image models.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Diagram Generator Controls
            </h2>

            {/* Model Selector Affordance */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Gemini Model:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setModel('gemini-3-pro-image-preview')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    model === 'gemini-3-pro-image-preview'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-mono text-[11px] font-bold">gemini-3-pro-image-preview</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Studio-Quality Whiteboard</div>
                </button>

                <button
                  type="button"
                  onClick={() => setModel('gemini-3.1-flash-image-preview')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    model === 'gemini-3.1-flash-image-preview'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-mono text-[11px] font-bold">gemini-3.1-flash-image-preview</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">High-Speed Prototyping</div>
                </button>
              </div>
            </div>

            {/* Image Size Affordance (1K, 2K, 4K) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Output Resolution / Image Size:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setImageSize(sz)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all text-center ${
                      imageSize === sz
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sz} Resolution
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Affordance (1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Aspect Ratio:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setAspectRatio(ar)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono text-center transition-all ${
                      aspectRatio === ar
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Textarea */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                System Topology & Architecture Description:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Describe components, data flow, queues, databases, and caches..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Architecture Diagram...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Architecture Diagram</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Starter Templates */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Interview Whiteboard Templates
            </span>
            <div className="space-y-1.5">
              {QUICK_SYSTEM_DESIGN_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(item.prompt)}
                  className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/60 text-slate-300 text-xs transition-colors flex items-center justify-between"
                >
                  <span className="truncate mr-2 font-medium">{item.title}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Use</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output & Gallery */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Generated Diagram Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col min-h-[460px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Visual Blueprint Preview</h3>
              </div>

              {currentDiagram && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {currentDiagram.size} • {currentDiagram.aspectRatio}
                  </span>
                  <button
                    onClick={() => handleDownload(currentDiagram.imageUrl, 'system_architecture')}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download PNG</span>
                  </button>
                </div>
              )}
            </div>

            {currentDiagram ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black/40 flex-1 flex items-center justify-center p-2">
                  <img
                    src={currentDiagram.imageUrl}
                    alt={currentDiagram.prompt}
                    className="max-h-[500px] w-auto object-contain rounded-lg shadow-2xl"
                  />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
                  <strong className="text-cyan-400 block text-[11px] mb-1">PROMPT:</strong>
                  <p className="font-mono text-slate-300">{currentDiagram.prompt}</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-200 text-sm">No Diagram Generated Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Select a template on the left or customize your model (gemini-3-pro-image-preview / gemini-3.1-flash-image-preview), resolution, and aspect ratio to build a system design whiteboard.
                </p>
              </div>
            )}
          </div>

          {/* Past Generated Diagrams History */}
          {gallery.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Session Architecture Blueprints ({gallery.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentDiagram(item)}
                    className="group relative border border-slate-800 hover:border-cyan-500/50 rounded-xl overflow-hidden cursor-pointer transition-all bg-black/40"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="p-1.5 bg-slate-950/90 text-[10px] text-slate-300 truncate font-mono">
                      {item.size} • {item.aspectRatio}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
