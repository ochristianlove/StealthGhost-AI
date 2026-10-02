/**
 * Picture-in-Picture Controller for Stealth Interviewing
 * Renders real-time hints and answers into a native OS PiP window.
 * PiP windows stay floating on top and are NOT included in single-window screen shares!
 */

import { InterviewAnswer } from '../types';

export class PiPController {
  private canvas: HTMLCanvasElement | null = null;
  private video: HTMLVideoElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private currentAnswer: InterviewAnswer | null = null;
  private currentTranscript: string = '';
  private isListening: boolean = false;
  private isActive: boolean = false;

  constructor() {
    this.initElements();
  }

  private initElements() {
    if (typeof window === 'undefined') return;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 360;
    this.ctx = this.canvas.getContext('2d');

    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.autoplay = true;
    this.video.playsInline = true;

    // Listen for leave picture in picture
    this.video.addEventListener('leavepictureinpicture', () => {
      this.isActive = false;
      this.stopRenderLoop();
    });
  }

  public updateContent(answer: InterviewAnswer | null, transcript: string, isListening: boolean) {
    this.currentAnswer = answer;
    this.currentTranscript = transcript;
    this.isListening = isListening;
    this.render();
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Subtle header
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, 44);

    // Brand / Status
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('STEALTH COPILOT (PiP)', 16, 28);

    if (this.isListening) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(w - 90, 24, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = '#34d399';
      ctx.fillText('LIVE MIC', w - 78, 28);
    }

    let y = 65;

    // If there is an active transcript
    if (this.currentTranscript) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 12px system-ui, sans-serif';
      const truncated = this.currentTranscript.length > 80 ? this.currentTranscript.slice(0, 77) + '...' : this.currentTranscript;
      ctx.fillText(`Hearing: "${truncated}"`, 16, y);
      y += 24;
    }

    if (this.currentAnswer) {
      // Punchline Box
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(16, y, w - 32, 2);
      y += 14;

      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('SPOKEN PUNCHLINE:', 16, y);
      y += 18;

      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#f8fafc';
      const words = this.currentAnswer.quickAnswer.split(' ');
      let line = '';
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > w - 40) {
          ctx.fillText(line, 16, y);
          line = word + ' ';
          y += 20;
          if (y > 170) break;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 16, y);
      y += 24;

      // Key bullet points
      if (this.currentAnswer.keyPoints && this.currentAnswer.keyPoints.length > 0) {
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('KEY POINTS:', 16, y);
        y += 18;

        ctx.font = '13px system-ui, sans-serif';
        ctx.fillStyle = '#cbd5e1';

        for (let i = 0; i < Math.min(3, this.currentAnswer.keyPoints.length); i++) {
          const pt = this.currentAnswer.keyPoints[i];
          const text = `${i + 1}. ${pt.length > 68 ? pt.slice(0, 65) + '...' : pt}`;
          ctx.fillText(text, 16, y);
          y += 20;
        }
      }
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('Listening for question... Speaking will trigger guidance.', 16, y + 30);
    }
  }

  private startRenderLoop() {
    const loop = () => {
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private stopRenderLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public async togglePiP(): Promise<boolean> {
    if (!this.video || !this.canvas) return false;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        this.isActive = false;
        this.stopRenderLoop();
        return false;
      }

      // Initial render
      this.render();

      // Create stream from canvas
      const stream = (this.canvas as any).captureStream ? (this.canvas as any).captureStream(15) : null;
      if (!stream) {
        throw new Error('Canvas captureStream not supported in this browser');
      }

      this.video.srcObject = stream;
      await this.video.play();
      await this.video.requestPictureInPicture();

      this.isActive = true;
      this.startRenderLoop();
      return true;
    } catch (err) {
      console.warn('PiP launch error:', err);
      throw err;
    }
  }

  public isPiPActive(): boolean {
    return this.isActive && Boolean(document.pictureInPictureElement);
  }
}

export const pipController = new PiPController();
