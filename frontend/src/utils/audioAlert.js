/**
 * VisionDrive Automotive Audio Alert Service
 * Synthesizes a commercial-grade driver safety alert warning chime using Web Audio API.
 * No external dependencies or audio asset files required.
 */

class AudioAlertService {
  constructor() {
    this.ctx = null;
    this.isBlocked = false;
    this.listenersAttached = false;
  }

  getAudioContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    return this.ctx;
  }

  attachUserGestureListeners(onResumed) {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;

    const handleGesture = () => {
      this.resumeContext().then((resumed) => {
        if (resumed && onResumed) onResumed();
      });
      window.removeEventListener('click', handleGesture, true);
      window.removeEventListener('keydown', handleGesture, true);
      window.removeEventListener('touchstart', handleGesture, true);
    };

    window.addEventListener('click', handleGesture, true);
    window.addEventListener('keydown', handleGesture, true);
    window.addEventListener('touchstart', handleGesture, true);
  }

  async resumeContext() {
    const ctx = this.getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        this.isBlocked = false;
        return true;
      } catch (err) {
        this.isBlocked = true;
        return false;
      }
    }
    this.isBlocked = false;
    return true;
  }

  /**
   * Professional automotive warning chime:
   * Urgent 3-pulse safety tone (880Hz, 880Hz, 1100Hz) with smooth exponential envelope
   */
  async playHighRiskWarning() {
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      const resumed = await this.resumeContext();
      if (!resumed) {
        this.isBlocked = true;
        return false;
      }
    }

    try {
      const now = ctx.currentTime;
      // Pulse 1: 880 Hz (A5), duration 0.08s
      this.schedulePulse(ctx, 880, now, 0.08);
      // Pulse 2: 880 Hz (A5), duration 0.08s at +0.13s
      this.schedulePulse(ctx, 880, now + 0.13, 0.08);
      // Pulse 3: 1100 Hz (C#6) urgent accent, duration 0.15s at +0.26s
      this.schedulePulse(ctx, 1100, now + 0.26, 0.15);

      this.isBlocked = false;
      return true;
    } catch (err) {
      console.warn('[VisionDrive Audio] Audio playback prevented:', err);
      this.isBlocked = true;
      return false;
    }
  }

  schedulePulse(ctx, freq, startTime, duration) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth envelope: quick rise, short sustain, exponential decay to prevent speaker clicking
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.32, startTime + 0.015);
    gain.gain.setValueAtTime(0.32, startTime + duration - 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}

export const audioAlert = new AudioAlertService();
export default audioAlert;
