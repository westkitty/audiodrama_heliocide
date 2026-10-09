/**
 * Sound Engine: Web Audio API procedural soundscapes, acoustic filters,
 * sound effects, and voice playback staging for the HELIOCIDE audio drama.
 */

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // Ambient oscillator & noise nodes
  private currentAmbientType: string | null = null;
  private ambientNodes: (AudioNode | number)[] = [];
  private ambientVolume = 0.08;
  private voiceVolume = 1.0;
  private sfxVolume = 0.45;
  private isMuted = false;

  private currentVoiceSource: AudioBufferSourceNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master voice gain
      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(this.voiceVolume, this.ctx.currentTime);
      this.voiceGain.connect(this.ctx.destination);

      // Ambient drone gain (warm and gentle)
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
      this.ambientGain.connect(this.ctx.destination);

      // Sound FX gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(ambient: number, voice: number, sfx: number) {
    this.ambientVolume = Math.min(0.2, ambient);
    this.voiceVolume = voice;
    this.sfxVolume = Math.min(0.6, sfx);

    if (this.ctx) {
      const t = this.ctx.currentTime;
      if (this.ambientGain) this.ambientGain.gain.setTargetAtTime(this.isMuted ? 0 : this.ambientVolume, t, 0.05);
      if (this.voiceGain) this.voiceGain.gain.setTargetAtTime(this.isMuted ? 0 : this.voiceVolume, t, 0.05);
      if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this.isMuted ? 0 : this.sfxVolume, t, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.setVolumes(this.ambientVolume, this.voiceVolume, this.sfxVolume);
  }

  // --- AMBIENT SOUNDSCAPES (Cinematic, warm, gentle) ---
  public setAmbient(type: string) {
    this.init();
    if (!this.ctx || !this.ambientGain) return;
    if (this.currentAmbientType === type) return;

    this.stopAmbient();
    this.currentAmbientType = type;

    switch (type) {
      case 'shelter_coil':
        // Warm soft fifths pad (gentle sine waves)
        this.createDrone(220, 'sine', 0.04);
        this.createDrone(330, 'sine', 0.025);
        break;

      case 'station_hum':
        // Pressurized smooth cabin presence
        this.createDrone(174.6, 'sine', 0.035);
        this.createDrone(261.6, 'sine', 0.02);
        break;

      case 'tactical_ops':
        // Subtle ambient harmonic tension
        this.createDrone(196, 'sine', 0.03);
        this.createDrone(293.6, 'sine', 0.02);
        break;

      case 'gate_void':
        // Gentle cosmic shimmer
        this.createDrone(261.6, 'sine', 0.03);
        this.createDrone(392, 'sine', 0.02);
        break;

      case 'extraction_pulse':
        // Soft atmospheric pulse
        this.createDrone(164.8, 'sine', 0.035);
        this.createDrone(246.9, 'sine', 0.02);
        break;

      case 'cascade_darkness':
        // Minor reflective texture
        this.createDrone(220, 'sine', 0.03);
        this.createDrone(261.6, 'sine', 0.02);
        break;

      case 'terrace_night':
      default:
        // Solitary quiet night drone
        this.createDrone(220, 'sine', 0.025);
        this.createDrone(440, 'sine', 0.015);
        break;
    }
  }

  private createDrone(freq: number, type: OscillatorType, gainVal: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(gainVal, this.ctx.currentTime + 1.5);

    osc.connect(g);
    g.connect(this.ambientGain);
    osc.start();

    this.ambientNodes.push(osc, g);
  }

  public stopAmbient() {
    for (const node of this.ambientNodes) {
      if (typeof node === 'object' && 'stop' in node) {
        try {
          (node as AudioScheduledSourceNode).stop();
        } catch {}
      }
    }
    this.ambientNodes = [];
    this.currentAmbientType = null;
  }

  // --- SOUND EFFECTS (Polite, smooth, cinematic) ---
  public playSoundFx(cue: string) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    switch (cue) {
      case 'coil_click': {
        // Soft metallic ping
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.1);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.12);
        break;
      }

      case 'lance_strike': {
        // Gentle energetic sci-fi sweep
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.4);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.5);
        break;
      }

      case 'word_stream_shock': {
        // Soft reality chime
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.exponentialRampToValueAtTime(261.63, t + 0.6);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.7);
        break;
      }

      case 'extraction_implosion': {
        // Soft cinematic resonant descent
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.8);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.9);
        break;
      }

      case 'alert_alarm': {
        // Polite 2-tone chime
        [0, 0.15].forEach((delay, idx) => {
          if (!this.ctx || !this.sfxGain) return;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(idx === 1 ? 880 : 660, t + delay);
          g.gain.setValueAtTime(0.15, t + delay);
          g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.12);
          osc.connect(g);
          g.connect(this.sfxGain);
          osc.start(t + delay);
          osc.stop(t + delay + 0.12);
        });
        break;
      }

      case 'hull_breach': {
        // Gentle acoustic presence
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(140, t + 0.5);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.6);
        break;
      }

      case 'transfer_ping': {
        // Clean high harmonic chime
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, t); // C6
        osc.frequency.exponentialRampToValueAtTime(1318.5, t + 0.1);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }
    }
  }

  // --- VOICE PLAYBACK & STAGING ---
  public async playVoiceBuffer(
    arrayBuffer: ArrayBuffer,
    effectType: 'none' | 'radio' | 'shard_god' | 'word_streaming' | 'station' = 'none',
    onEnded?: () => void
  ): Promise<void> {
    this.init();
    if (!this.ctx || !this.voiceGain) return;

    this.stopCurrentVoice();

    try {
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;
      this.currentVoiceSource = source;

      // Acoustic filter graph based on character role
      let finalNode: AudioNode = source;

      if (effectType === 'radio') {
        // Radio comms filter: bandpass 400Hz - 3200Hz + subtle warmth
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.4, this.ctx.currentTime);

        source.connect(filter);
        finalNode = filter;
      } else if (effectType === 'shard_god') {
        // Shard-God azure resonance: sub-octave warmth + wide presence
        const presence = this.ctx.createBiquadFilter();
        presence.type = 'peaking';
        presence.frequency.setValueAtTime(2400, this.ctx.currentTime);
        presence.gain.setValueAtTime(2.5, this.ctx.currentTime);

        const low = this.ctx.createBiquadFilter();
        low.type = 'lowshelf';
        low.frequency.setValueAtTime(180, this.ctx.currentTime);
        low.gain.setValueAtTime(3.5, this.ctx.currentTime);

        source.connect(presence);
        presence.connect(low);
        finalNode = low;
      } else if (effectType === 'station') {
        // Station acoustics: light presence
        const room = this.ctx.createBiquadFilter();
        room.type = 'peaking';
        room.frequency.setValueAtTime(1200, this.ctx.currentTime);
        room.gain.setValueAtTime(1.5, this.ctx.currentTime);

        source.connect(room);
        finalNode = room;
      }

      finalNode.connect(this.voiceGain);

      source.onended = () => {
        if (this.currentVoiceSource === source) {
          this.currentVoiceSource = null;
        }
        if (onEnded) onEnded();
      };

      source.start();
    } catch (err) {
      console.error('Failed to decode or play audio buffer:', err);
      if (onEnded) onEnded();
    }
  }

  public stopCurrentVoice() {
    if (this.currentVoiceSource) {
      try {
        this.currentVoiceSource.stop();
      } catch {}
      this.currentVoiceSource = null;
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }
}

export const soundEngine = new SoundEngine();
