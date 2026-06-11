import Phaser from 'phaser';

// BGM：程序生成 chiptune（square lead + triangle bass，16 步循環）。
// 不使用外部音樂資產（見 CREDITS.md）；SFX 由各 entity 經 scene.sound 播放。

interface Song {
  tempo: number; // BPM
  /** 16 步 MIDI 音高（null = 休止） */
  lead: (number | null)[];
  bass: (number | null)[];
}

const SONGS: Record<string, Song> = {
  'bgm-overworld': {
    tempo: 140,
    lead: [76, null, 76, null, 76, null, 72, 76, null, 79, null, null, 67, null, null, null],
    bass: [48, null, 52, null, 55, null, 52, null, 48, null, 52, null, 55, 57, 55, 52],
  },
  'bgm-underground': {
    tempo: 110,
    lead: [69, null, null, 72, null, null, 69, null, 67, null, 64, null, null, null, 62, null],
    bass: [45, null, 45, null, 41, null, 41, null, 43, null, 43, null, 45, null, 40, null],
  },
  'bgm-castle': {
    tempo: 126,
    lead: [69, null, 68, null, 69, null, 65, null, 64, null, 65, null, 61, null, 62, null],
    bass: [45, 45, null, 45, 44, 44, null, 44, 41, 41, null, 41, 45, null, 44, null],
  },
};

const midiToFreq = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

/** BGM 播放器：lookahead 排程，支援 hurry-up 變速 */
export class AudioSystem {
  private ctx?: AudioContext;
  private master?: GainNode;
  private timer?: Phaser.Time.TimerEvent;
  private song?: Song;
  private step = 0;
  private nextNoteTime = 0;
  private rate = 1;

  constructor(private scene: Phaser.Scene) {}

  playBgm(key: string): void {
    const song = SONGS[key];
    if (!song) {
      console.warn(`audio: 未知 BGM '${key}'`);
      return;
    }
    this.stopBgm();
    this.song = song;

    const sound = this.scene.sound;
    const start = (): void => this.startScheduler();
    // autoplay 限制：等首次互動解鎖 AudioContext
    if (sound instanceof Phaser.Sound.WebAudioSoundManager && sound.context.state === 'suspended') {
      sound.once(Phaser.Sound.Events.UNLOCKED, start);
    } else {
      start();
    }
  }

  /** 時間告急加速（rate 1.25） */
  setHurry(hurry: boolean): void {
    this.rate = hurry ? 1.25 : 1;
  }

  stopBgm(): void {
    this.timer?.remove();
    this.timer = undefined;
    this.master?.disconnect();
    this.master = undefined;
    this.step = 0;
  }

  private startScheduler(): void {
    const sound = this.scene.sound;
    if (!(sound instanceof Phaser.Sound.WebAudioSoundManager)) return; // no-audio mode
    this.ctx = sound.context;
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.06;
    this.master.connect(this.ctx.destination);
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // 每 80ms 排程未來 160ms 的音符
    this.timer = this.scene.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => this.schedule(),
    });
  }

  private schedule(): void {
    if (!this.ctx || !this.song || !this.master) return;
    const stepDur = 60 / this.song.tempo / 4 / this.rate;
    while (this.nextNoteTime < this.ctx.currentTime + 0.16) {
      const lead = this.song.lead[this.step % 16];
      const bass = this.song.bass[this.step % 16];
      if (lead != null) this.note(lead, this.nextNoteTime, stepDur * 0.9, 'square', 0.5);
      if (bass != null) this.note(bass, this.nextNoteTime, stepDur * 0.95, 'triangle', 0.8);
      this.nextNoteTime += stepDur;
      this.step += 1;
    }
  }

  private note(midi: number, at: number, dur: number, type: OscillatorType, vol: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = midiToFreq(midi);
    gain.gain.setValueAtTime(vol, at);
    gain.gain.exponentialRampToValueAtTime(0.01, at + dur);
    osc.connect(gain).connect(this.master);
    osc.start(at);
    osc.stop(at + dur);
  }
}
