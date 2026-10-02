/**
 * Speech Recognition and Speech Synthesis Utilities
 * Multi-platform support: Chrome, Safari (Mac/iOS), Edge, Android Webview
 */

// Extend window for webkit speech recognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export class SpeechEngine {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscriptCallback: ((text: string, isFinal: boolean) => void) | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isSpeakingAudio: boolean = false;
  private onSpeakingChangeCallbacks: Set<(speaking: boolean) => void> = new Set();

  constructor() {
    this.initRecognition();
  }

  public subscribeSpeakingChange(callback: (speaking: boolean) => void): () => void {
    this.onSpeakingChangeCallbacks.add(callback);
    callback(this.isSpeaking());
    return () => {
      this.onSpeakingChangeCallbacks.delete(callback);
    };
  }

  private notifySpeaking(speaking: boolean) {
    this.isSpeakingAudio = speaking;
    this.onSpeakingChangeCallbacks.forEach((cb) => {
      try {
        cb(speaking);
      } catch (e) {
        // ignore
      }
    });
  }

  public isSpeaking(): boolean {
    const isBrowserSpeaking =
      typeof window !== 'undefined' &&
      !!window.speechSynthesis &&
      window.speechSynthesis.speaking;
    const isAudioElemPlaying =
      !!this.currentAudioElement &&
      !this.currentAudioElement.paused &&
      !this.currentAudioElement.ended;
    return this.isSpeakingAudio || isBrowserSpeaking || isAudioElemPlaying;
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (this.onTranscriptCallback) {
            if (finalTranscript.trim()) {
              this.onTranscriptCallback(finalTranscript.trim(), true);
            } else if (interimTranscript.trim()) {
              this.onTranscriptCallback(interimTranscript.trim(), false);
            }
          }
        };

        this.recognition.onerror = (event: any) => {
          // Ignore normal aborts
          if (event.error === 'no-speech' || event.error === 'aborted') return;
          console.warn('Speech recognition warning:', event.error);
        };

        this.recognition.onend = () => {
          // If still marked as listening, restart automatically
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              // Ignore already started errors
            }
          }
        };
      } catch (err) {
        console.warn('Could not initialize speech recognition:', err);
      }
    }
  }

  public isSupported(): boolean {
    return Boolean(
      typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }

  public setLanguage(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public startListening(callback: (text: string, isFinal: boolean) => void): boolean {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) return false;
    }

    this.onTranscriptCallback = callback;
    this.isListening = true;

    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Recognition start exception:', e);
      return false;
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public stopAllAudio() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    this.notifySpeaking(false);
  }

  // --- Toggle Speak / Stop Helper ---
  public async toggleSpeakWithConfig(
    text: string,
    config: {
      engine?: 'browser_free' | 'gemini_studio' | 'elevenlabs';
      voice?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      whisperMode?: boolean;
    }
  ): Promise<boolean> {
    if (this.isSpeaking()) {
      this.stopAllAudio();
      return false; // Stopped
    } else {
      await this.speakWithConfig(text, config);
      return true; // Started speaking
    }
  }

  // --- TTS: Browser Web Speech Synthesis (100% Free) ---
  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }

  // --- TTS: Universal Voice Dispatcher (Browser Free or Gemini Studio) ---
  public async speakWithConfig(
    text: string,
    config: {
      engine?: 'browser_free' | 'gemini_studio' | 'elevenlabs';
      voice?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      whisperMode?: boolean;
    }
  ): Promise<void> {
    this.stopAllAudio();
    this.notifySpeaking(true);

    const isGemini =
      config.engine === 'gemini_studio' ||
      (config.voice && config.voice.toLowerCase().includes('gemini'));

    if (isGemini) {
      try {
        const rawVoice = (config.voice || 'Kore')
          .replace(/^Gemini:\s*/i, '')
          .trim();
        const validVoices = ['Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'];
        const voiceName = validVoices.includes(rawVoice) ? rawVoice : 'Kore';

        const res = await fetch('/api/gemini/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceName }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.audioData) {
            const vol = config.whisperMode ? 0.4 : config.volume ?? 0.8;
            await this.playAudioDataUrl(json.audioData, vol);
            return;
          }
        }
      } catch (err) {
        console.warn('Gemini Studio TTS failed, falling back to browser synthesis:', err);
      }
    }

    // Default to browser speech synthesis
    await this.speakBrowser(text, {
      voiceName: config.voice,
      rate: config.rate,
      pitch: config.pitch,
      volume: config.volume,
      whisperMode: config.whisperMode,
    });
  }

  public speakBrowser(
    text: string,
    options: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
      whisperMode?: boolean;
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        return reject(new Error('Browser speech synthesis not supported'));
      }

      this.stopAllAudio();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1.05;
      utterance.pitch = options.whisperMode ? 0.85 : options.pitch ?? 1.0;
      utterance.volume = options.whisperMode ? 0.35 : options.volume ?? 0.8;

      const executeSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (options.voiceName && voices.length > 0) {
          const cleanName = options.voiceName
            .replace(/^Gemini:\s*/i, '')
            .trim()
            .toLowerCase();

          // 1. Exact match by name or voiceURI
          let matched = voices.find(
            (v) =>
              v.name.toLowerCase() === cleanName ||
              v.voiceURI.toLowerCase() === cleanName
          );

          // 2. Contains match
          if (!matched) {
            matched = voices.find((v) =>
              v.name.toLowerCase().includes(cleanName)
            );
          }

          // 3. Fallback to matching language
          if (!matched && cleanName.includes('(')) {
            const langCode = cleanName.split('(')[1]?.replace(')', '').trim();
            if (langCode) {
              matched = voices.find((v) =>
                v.lang.toLowerCase().startsWith(langCode.toLowerCase())
              );
            }
          }

          if (matched) {
            utterance.voice = matched;
            utterance.lang = matched.lang;
          }
        }

        utterance.onend = () => {
          this.notifySpeaking(false);
          resolve();
        };
        utterance.onerror = (e) => {
          this.notifySpeaking(false);
          reject(e);
        };

        window.speechSynthesis.speak(utterance);
      };

      const initialVoices = window.speechSynthesis.getVoices();
      if (initialVoices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          executeSpeak();
        };
        // Safety timeout if onvoiceschanged doesn't trigger
        setTimeout(() => executeSpeak(), 150);
      } else {
        executeSpeak();
      }
    });
  }

  // --- TTS: Play Gemini Audio Data URL ---
  public playAudioDataUrl(audioUrl: string, volume: number = 0.8): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopAllAudio();
      this.notifySpeaking(true);

      const audio = new Audio(audioUrl);
      audio.volume = Math.max(0.1, Math.min(1.0, volume));
      this.currentAudioElement = audio;

      audio.onended = () => {
        this.currentAudioElement = null;
        this.notifySpeaking(false);
        resolve();
      };
      audio.onerror = (err) => {
        this.currentAudioElement = null;
        this.notifySpeaking(false);
        reject(err);
      };

      audio.play().catch((err) => {
        this.notifySpeaking(false);
        reject(err);
      });
    });
  }
}

export const speechEngine = new SpeechEngine();
