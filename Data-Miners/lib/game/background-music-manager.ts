// Background Music Manager - Handles looping background music playback
// Supports wav format only with independent volume control from UI SFX

class BackgroundMusicManagerClass {
  private audioElement: HTMLAudioElement | null = null
  private volume = 0.7
  private enabled = true

  constructor() {
    this.initializeAudio()
  }

  private initializeAudio() {
    try {
      this.audioElement = new Audio()
      this.audioElement.loop = true
      this.audioElement.preload = "auto"
      this.audioElement.volume = this.volume
    } catch {
      if (process.env.NODE_ENV === "development") {
        console.error("[BackgroundMusicManager] Failed to initialize audio element")
      }
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.audioElement) {
      this.audioElement.volume = this.volume
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!this.audioElement) return

    if (enabled && this.audioElement.paused) {
      this.play()
    } else if (!enabled && !this.audioElement.paused) {
      this.pause()
    }
  }

  loadTrack(src: string) {
    if (!this.audioElement) return

    if (!src.toLowerCase().endsWith('.wav')) {
      if (process.env.NODE_ENV === "development") {
        console.error("[BackgroundMusicManager] Only .wav files are supported")
      }
      return
    }

    try {
      this.audioElement.src = src
      this.audioElement.load()
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[BackgroundMusicManager] Failed to load track:", e)
      }
    }
  }

  play() {
    if (!this.audioElement || !this.enabled) return

    try {
      const playPromise = this.audioElement.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.error("[BackgroundMusicManager] Play failed:", error)
          }
        })
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[BackgroundMusicManager] Error playing music:", e)
      }
    }
  }

  pause() {
    if (!this.audioElement) return

    try {
      this.audioElement.pause()
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[BackgroundMusicManager] Error pausing music:", e)
      }
    }
  }

  stop() {
    if (!this.audioElement) return

    try {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.error("[BackgroundMusicManager] Error stopping music:", e)
      }
    }
  }

  isPlaying(): boolean {
    return !!this.audioElement && !this.audioElement.paused
  }
}

// Export singleton instance
export const BackgroundMusicManager = new BackgroundMusicManagerClass()
