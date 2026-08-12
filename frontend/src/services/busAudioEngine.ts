// Web Audio API Bus Sound Synthesizer & Music Engine

class BusAudioEngine {
  private audioCtx: AudioContext | null = null;

  // Music audio player nodes
  private musicAudioElement: HTMLAudioElement | null = null;
  private musicSourceNode: MediaElementAudioSourceNode | null = null;
  private cassetteFilterNode: BiquadFilterNode | null = null;
  private musicGainNode: GainNode | null = null;

  public isInitialized: boolean = false;
  public isTapeEffectOn: boolean = true;
  public musicVolume: number = 0.8;

  constructor() {
    // Lazy audio context setup on user gesture
  }

  public init() {
    if (this.isInitialized) return;
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioCtxClass();

    this.setupMusicPlayer();
    this.isInitialized = true;
  }

  private setupMusicPlayer() {
    if (!this.audioCtx) return;
    this.musicAudioElement = new Audio();
    this.musicAudioElement.crossOrigin = 'anonymous';

    try {
      this.musicSourceNode = this.audioCtx.createMediaElementSource(this.musicAudioElement);

      // Cassette tape warmth low-pass filter (90s car cassette frequency response ~3.5kHz cutoff)
      this.cassetteFilterNode = this.audioCtx.createBiquadFilter();
      this.cassetteFilterNode.type = 'lowpass';
      this.cassetteFilterNode.frequency.setValueAtTime(3400, this.audioCtx.currentTime);
      this.cassetteFilterNode.Q.setValueAtTime(1.2, this.audioCtx.currentTime);

      this.musicGainNode = this.audioCtx.createGain();
      this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.audioCtx.currentTime);

      if (this.isTapeEffectOn) {
        this.musicSourceNode.connect(this.cassetteFilterNode);
        this.cassetteFilterNode.connect(this.musicGainNode);
      } else {
        this.musicSourceNode.connect(this.musicGainNode);
      }
      this.musicGainNode.connect(this.audioCtx.destination);
    } catch {
      // Fallback if media source node fails
    }
  }

  public toggleTapeEffect(enable: boolean) {
    this.isTapeEffectOn = enable;
    if (!this.musicSourceNode || !this.cassetteFilterNode || !this.musicGainNode) return;

    this.musicSourceNode.disconnect();
    if (enable) {
      this.musicSourceNode.connect(this.cassetteFilterNode);
      this.cassetteFilterNode.connect(this.musicGainNode);
    } else {
      this.musicSourceNode.connect(this.musicGainNode);
    }
  }

  public startEngine() {
    // Engine sound is played natively by new bus.mp4 video
  }

  public stopEngine() {
    // Engine sound is managed by WindshieldCanvas
  }

  public setSpeed() {
    // No-op
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = vol;
    if (this.musicAudioElement) {
      this.musicAudioElement.volume = vol;
    }
    if (this.musicGainNode && this.audioCtx) {
      this.musicGainNode.gain.setTargetAtTime(vol, this.audioCtx.currentTime, 0.1);
    }
  }

  public playPressureHorn() {
    // No-op
  }

  public playWhistle() {
    // No-op
  }

  public playTrack(audioUrl: string): Promise<boolean> {
    if (!this.isInitialized) this.init();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.musicAudioElement) {
      let targetUrl = audioUrl;
      if (audioUrl && audioUrl.startsWith('/uploads')) {
        targetUrl = window.location.origin + audioUrl;
      }

      this.musicAudioElement.src = targetUrl;

      return this.musicAudioElement.play()
        .then(() => true)
        .catch((err) => {
          console.error("Audio playback error:", err, "Target URL:", targetUrl);
          return false;
        });
    }
    return Promise.resolve(false);
  }

  public pauseTrack() {
    if (this.musicAudioElement) {
      this.musicAudioElement.pause();
    }
  }

  public getCurrentTime(): number {
    return this.musicAudioElement ? this.musicAudioElement.currentTime || 0 : 0;
  }

  public getDuration(): number {
    return (this.musicAudioElement && !isNaN(this.musicAudioElement.duration)) ? this.musicAudioElement.duration : 0;
  }

  public seek(timeSeconds: number) {
    if (this.musicAudioElement && !isNaN(timeSeconds)) {
      this.musicAudioElement.currentTime = timeSeconds;
    }
  }
}

export const audioEngine = new BusAudioEngine();
