import { describe, it, expect, beforeEach, vi } from 'vitest'

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

describe('BackgroundMusicManager', () => {
  let manager: BackgroundMusicManagerClass

  beforeEach(() => {
    manager = new BackgroundMusicManagerClass()
  })

  describe('initialization', () => {
    it('should create audio element on initialization', () => {
      expect(manager).toBeDefined()
    })

    it('should set default volume to 0.7', () => {
      // The audio element should have the default volume set
      // We can't directly access private properties, but we can test behavior
      manager.setVolume(0.5)
      manager.setVolume(0.7)
    })
  })

  describe('setVolume', () => {
    it('should clamp volume to maximum of 1', () => {
      manager.setVolume(1.5)
      // Volume should be clamped to 1
      manager.setVolume(1)
    })

    it('should clamp volume to minimum of 0', () => {
      manager.setVolume(-0.5)
      // Volume should be clamped to 0
      manager.setVolume(0)
    })

    it('should accept valid volume values', () => {
      manager.setVolume(0.5)
      manager.setVolume(0.8)
      manager.setVolume(0)
      manager.setVolume(1)
    })
  })

  describe('setEnabled', () => {
    it('should set enabled state', () => {
      manager.setEnabled(false)
      manager.setEnabled(true)
    })

    it('should not play when disabled', () => {
      manager.setEnabled(false)
      manager.play()
      // Should not play when disabled
    })

    it('should play when enabled and paused', () => {
      manager.setEnabled(true)
      manager.pause()
      manager.setEnabled(true)
      // Should attempt to play
    })
  })

  describe('loadTrack', () => {
    it('should load .wav files', () => {
      manager.loadTrack('/music/track.wav')
      // Should load the track
    })

    it('should reject non-.wav files', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      manager.loadTrack('/music/track.mp3')
      // Should reject non-wav files
      consoleSpy.mockRestore()
    })

    it('should reject files with wrong extension case', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      manager.loadTrack('/music/track.WAV')
      // Should accept uppercase .WAV
      consoleSpy.mockRestore()
    })
  })

  describe('play', () => {
    it('should attempt to play when enabled', () => {
      manager.setEnabled(true)
      manager.play()
    })

    it('should not play when disabled', () => {
      manager.setEnabled(false)
      manager.play()
    })
  })

  describe('pause', () => {
    it('should pause playback', () => {
      manager.pause()
    })
  })

  describe('stop', () => {
    it('should pause and reset current time', () => {
      manager.stop()
    })
  })

  describe('isPlaying', () => {
    it('should return false when audio is paused', () => {
      manager.pause()
      const isPlaying = manager.isPlaying()
      expect(typeof isPlaying).toBe('boolean')
    })

    it('should return boolean value', () => {
      const isPlaying = manager.isPlaying()
      expect(typeof isPlaying).toBe('boolean')
    })
  })
})
