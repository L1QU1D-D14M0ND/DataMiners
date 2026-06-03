"use client"

import { useEffect } from "react"

/**
 * Dispatches `settingsMenuToggle` events so the game scene can block
 * input while an overlay is open.
 *
 * Previously duplicated in GameUI and TechTreeModal.
 */
export function useSettingsMenuToggle(isOpen: boolean) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("settingsMenuToggle", { detail: { isOpen } }))

    return () => {
      window.dispatchEvent(new CustomEvent("settingsMenuToggle", { detail: { isOpen: false } }))
    }
  }, [isOpen])
}
