"use client"

import { useEffect } from "react"
import { SoundManager } from "@/lib/game/sound-manager"
import type { GameSettings } from "@/lib/game/types"

/**
 * Keeps the SoundManager in sync with the current game settings.
 * Previously duplicated across GameUI and MainMenu.
 */
export function useSoundSettings(settings: GameSettings) {
  useEffect(() => {
    SoundManager.setVolume(settings.volume)
    SoundManager.setEnabled(settings.soundEnabled)
  }, [settings.volume, settings.soundEnabled])
}
