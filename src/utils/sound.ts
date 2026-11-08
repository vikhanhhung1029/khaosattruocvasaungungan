// Web Audio API Synthesizer and Web Speech API utilities

class SoundEffects {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Beep sound with frequency and duration
  playBeep(freq = 440, duration = 0.1, type: OscillatorType = 'sine') {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio might be blocked by browser policy until user interacts
    }
  }

  // Signal when reaction symbol appears
  playReactionSignal() {
    this.playBeep(784, 0.15, 'triangle'); // G5 note
  }

  // Success chime
  playSuccess() {
    this.playBeep(523.25, 0.1, 'sine'); // C5
    setTimeout(() => this.playBeep(659.25, 0.15, 'sine'), 100); // E5
  }

  // Error buzz
  playError() {
    this.playBeep(220, 0.2, 'sawtooth');
  }

  // Countdown tick
  playTick() {
    this.playBeep(600, 0.05, 'sine');
  }

  private alarmInterval: number | null = null;

  // Power nap timer alarm chime
  playAlarmChime() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.22, 'triangle'), i * 180);
    });
  }

  // Continuous alarm loop until explicitly stopped by user
  startAlarmLoop() {
    this.stopAlarmLoop();
    this.playAlarmChime();
    this.alarmInterval = window.setInterval(() => {
      this.playAlarmChime();
    }, 1400);
  }

  stopAlarmLoop() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  // Voice/speech synthesis removed as per request
  speakDigit(_digit: string) {
    // Disabled: No speech reading of digits
  }
}

export const soundFx = new SoundEffects();
