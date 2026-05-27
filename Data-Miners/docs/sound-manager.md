# Sound Manager Documentation

## Overview

The Sound Manager is a self-contained audio system that generates UI sound effects programmatically using the **Web Audio API**. It requires no external audio files or third-party libraries — all sounds are synthesized in real-time using oscillators and gain nodes.

## Library Used

**Web Audio API** (Native Browser API)
- Built into all modern browsers
- No npm packages or external dependencies required
- Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

## Architecture

The SoundManager is implemented as a singleton class exported from `lib/game/sound-manager.ts`. It lazily initializes an `AudioContext` on first use and handles mobile browser requirements (suspended context states).

```
┌─────────────────────────────────────────────────────────┐
│                    SoundManagerClass                     │
├─────────────────────────────────────────────────────────┤
│  audioContext: AudioContext | null                       │
│  volume: number (0-1)                                    │
│  enabled: boolean                                        │
│  lastPlayTime: number (throttling)                       │
├─────────────────────────────────────────────────────────┤
│  setVolume(vol)      - Set master volume                 │
│  setEnabled(bool)    - Enable/disable all sounds         │
│  playHover()         - High-pitched chirp                │
│  playClick()         - Mechanical click                  │
│  playSuccess()       - Confirmation beep                 │
│  playError()         - Low buzz / denied tone            │
│  playBuild()         - Building placed thunk             │
│  playDelete()        - Building removed sweep            │
│  playUnlock()        - Tech unlock arpeggio              │
└─────────────────────────────────────────────────────────┘
```

## Sound Generation Technique

Each sound is created by:
1. Creating one or more `OscillatorNode` instances
2. Connecting them through `GainNode` for volume control
3. Scheduling frequency and gain changes over time
4. Auto-stopping after the sound duration

### Oscillator Types Used
- `sine` — Clean, pure tones (hover, success, unlock)
- `square` — Harsh, digital clicks (click)
- `sawtooth` — Buzzy, aggressive tones (error, delete)

### Example: Hover Sound
```typescript
oscillator.type = "sine"
oscillator.frequency.setValueAtTime(2400, ctx.currentTime)
oscillator.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.05)

gainNode.gain.setValueAtTime(0.03 * this.volume, ctx.currentTime)
gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
```

This creates a 50ms rising chirp from 2400Hz to 3200Hz that fades out quickly.

## Usage

```typescript
import { SoundManager } from "@/lib/game/sound-manager"

// Configure
SoundManager.setVolume(0.8)     // 80% volume
SoundManager.setEnabled(true)   // Enable sounds

// Play sounds
SoundManager.playHover()   // On mouse enter
SoundManager.playClick()   // On button click
SoundManager.playError()   // On invalid action
SoundManager.playBuild()   // On building placed
SoundManager.playDelete()  // On building removed
SoundManager.playUnlock()  // On tech unlocked
SoundManager.playSuccess() // On success confirmation
```

## Mobile Considerations

- The AudioContext may start in a `suspended` state on mobile browsers
- The manager automatically calls `audioContext.resume()` on each sound play
- Sounds will only work after user interaction (browser security requirement)

## Throttling

A `MIN_PLAY_INTERVAL` of 30ms prevents rapid repeated sounds from stacking up and causing audio glitches when the user hovers quickly over multiple elements.

## Error Handling

All sound methods are wrapped in try-catch blocks. If the AudioContext is unavailable (e.g., older browsers, server-side rendering), the methods fail silently without throwing errors.
