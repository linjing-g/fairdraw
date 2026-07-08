
class AudioService {
  private ctx: AudioContext | null = null;
  private musicInterval: number | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playTick() {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public startSpinMusic() {
    this.init();
    if (!this.ctx) return;

    // Classic bouncy Game Show melody (C Major)
    // C4, E4, G4, C5 rhythm
    const melody = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
    const bass = [130.81, 164.81, 196.00, 164.81];
    let step = 0;

    this.musicInterval = window.setInterval(() => {
        if (!this.ctx) return;
        
        // Melody Note
        const oscM = this.ctx.createOscillator();
        const gainM = this.ctx.createGain();
        oscM.type = 'sine';
        oscM.frequency.setValueAtTime(melody[step % melody.length], this.ctx.currentTime);
        gainM.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gainM.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        oscM.connect(gainM);
        gainM.connect(this.ctx.destination);
        oscM.start();
        oscM.stop(this.ctx.currentTime + 0.2);

        // Bass Note every 2 steps
        if (step % 2 === 0) {
          const oscB = this.ctx.createOscillator();
          const gainB = this.ctx.createGain();
          oscB.type = 'triangle';
          oscB.frequency.setValueAtTime(bass[(step / 2) % bass.length], this.ctx.currentTime);
          gainB.gain.setValueAtTime(0.08, this.ctx.currentTime);
          gainB.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
          oscB.connect(gainB);
          gainB.connect(this.ctx.destination);
          oscB.start();
          oscB.stop(this.ctx.currentTime + 0.4);
        }

        step++;
    }, 200); // More relaxed tempo
  }

  public stopSpinMusic() {
    if (this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public playWin() {
    this.init();
    if (!this.ctx) return;

    const chords = [523.25, 659.25, 783.99, 1046.50]; 
    chords.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0, this.ctx!.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.06, this.ctx!.currentTime + i * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.08);
        osc.stop(this.ctx!.currentTime + 2.5);
    });
  }
}

export const audioService = new AudioService();
