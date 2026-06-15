"use client"

import { useCallback } from "react"
import { SoundManager } from "@/lib/game/sound-manager"

interface UseSoundInteractionsOptions {
  onClick?: () => void
  onHover?: () => void
}

/**
 * Wraps click and hover handlers with sound effects.
 * Reduces repetitive SoundManager.playClick() and SoundManager.playHover() calls.
 */
export function useSoundInteractions({
  onClick,
  onHover,
}: UseSoundInteractionsOptions = {}) {
  const handleClick = useCallback(() => {
    SoundManager.playClick()
    onClick?.()
  }, [onClick])

  const handleHover = useCallback(() => {
    SoundManager.playHover()
    onHover?.()
  }, [onHover])

  return { handleClick, handleHover }
}
