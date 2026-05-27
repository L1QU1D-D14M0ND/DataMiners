// Sound Manager - Generates UI sounds using Web Audio API
// No external audio files needed - creates sci-fi sounds programmatically

class SoundManagerClass {
  private audioContext: AudioContext | null = null
  private volume = 1
  private enabled = true
  private lastPlayTime = 0
  private readonly MIN_PLAY_INTERVAL = 30 // Minimum ms between same sound plays

  private getContext(): AudioContext | null {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext()
      }
      // Resume context if it's suspended (mobile browsers require user interaction)
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume()
      }
      return this.audioContext
    } catch {
      return null
    }
  }

  // Throttle rapid repeated sounds
  private canPlay(): boolean {
    const now = performance.now()
    if (now - this.lastPlayTime < this.MIN_PLAY_INTERVAL) {
      return false
    }
    this.lastPlayTime = now
    return true
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  // High-pitched chirp for hover
  playHover() {
    if (!this.enabled || this.volume === 0) return
    if (!this.canPlay()) return
    try {
      const ctx = this.getContext()
      if (!ctx) return
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(2400, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.05)

      gainNode.gain.setValueAtTime(0.03 * this.volume, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.05)
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[SoundManager] Error playing hover sound:", e)
      }
    }
  }

  // Mechanical click for button press
  playClick() {
    if (!this.enabled || this.volume === 0) return
    if (!this.canPlay()) return
    try {
      const ctx = this.getContext()
      if (!ctx) return
      
      // Main click tone
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      
      osc1.type = "square"
      osc1.frequency.setValueAtTime(800, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03)
      
      gain1.gain.setValueAtTime(0.08 * this.volume, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
      
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.06)

      // High frequency click component
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      
      osc2.type = "sine"
      osc2.frequency.setValueAtTime(1800, ctx.currentTime)
      
      gain2.gain.setValueAtTime(0.04 * this.volume, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)
      
      osc2.start(ctx.currentTime)
      osc2.stop(ctx.currentTime + 0.02)
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[SoundManager] Error playing click sound:", e)
      }
    }
  }

  // Success confirmation beep
  playSuccess() {
    if (!this.enabled || this.volume === 0) return
    if (!this.canPlay()) return
    try {
      const ctx = this.getContext()
      if (!ctx) return
      
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08)
      
      gain.gain.setValueAtTime(0.06 * this.volume, ctx.currentTime)
      gain.gain.setValueAtTime(0.06 * this.volume, ctx.currentTime + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[SoundManager] Error playing success sound:", e)
      }
    }
  }

  // Low buzz for error/denied
  playError() {
    if (!this.enabled || this.volume === 0) return
    if (!this.canPlay()) return
    try {
      const ctx = this.getContext()
      if (!ctx) return
      
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.1)
      
      gain.gain.setValueAtTime(0.1 * this.volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[SoundManager] Error playing error sound:", e)
      }
    }
  }

  // Building placed sound
  playBuild() {
    if (!this.enabled || this.volume === 0) return
    if (!this.canPlay()) return
    try {
      const ctx = this.getContext()
      if (!ctx) return
      
      // Thunk sound
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      
      osc1.type = "sine"
      osc1.frequency.setValueAtTime(200, ctx.currentTime)
      osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1)
      
      gain1.gain.setValueAtTime(0.12 * this.volume, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.15)

      // Confirmation chirp
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      
      osc2.type = "sine"
      osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.05)
      osc2.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.12)
      
      gain2.gain.setValueAtTime(0, ctx.currentTime)
      gain2.gain.setValueAtTime(0.05 * this.volume, ctx.currentTime + 0.05)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      
      osc2.start(ctx.currentTime)
      osc2.stop(ctx.currentTime + 0.15)
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[SoundManager] Error playing build sound:", e)
      }
    }
  }

  // Building deleted sound
  playDelete() {
    if (!this.enabled || this.volume === 0) return
    if (!this.canPlay()) return
    try {
      const ctx = this.getContext()
      if (!ctx) return
      
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15)
      
      gain.gain.setValueAtTime(0.08 * this.volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.15)
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[SoundManager] Error playing delete sound:", e)
      }
    }
  }

  // Tech unlock sound
  playUnlock() {
    if (!this.enabled || this.volume === 0) return
    if (!this.canPlay()) return
    try {
      const ctx = this.getContext()
      if (!ctx) return
      
      // Rising arpeggio
      const notes = [440, 554, 659, 880]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)
        
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.setValueAtTime(0.04 * this.volume, ctx.currentTime + i * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.15)
        
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + i * 0.08 + 0.15)
      })
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[SoundManager] Error playing unlock sound:", e)
      }
    }
  }
}

export const SoundManager = new SoundManagerClass()
