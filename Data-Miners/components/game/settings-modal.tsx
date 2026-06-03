"use client"

import type React from "react"
import { useTheme } from "next-themes"
import { Volume2, VolumeX, Sun, Moon, Home } from "lucide-react"
import { GameModal } from "./game-modal"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: {
    soundEnabled: boolean
    volume: number
  }
  onSettingsChange: (settings: SettingsModalProps["settings"]) => void
  onReturnToMenu?: () => void
  onReturnToMenuWithWarning?: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onReturnToMenu,
  onReturnToMenuWithWarning,
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme()

  return (
    <GameModal isOpen={isOpen} onClose={onClose} title="Settings" closeLabel="Close settings">
      <div className="p-4 space-y-6">
        {/* Dark mode toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="w-5 h-5 text-white/60" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-400" />
            )}
            <span className="text-sm font-heading uppercase tracking-wider text-white/80">Dark Mode</span>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`w-12 h-6 transition-colors ${theme === "dark" ? "bg-[#d4a853]" : "bg-white/20"}`}
            style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Toggle dark mode"
          >
            <div
              className={`w-4 h-4 bg-white transition-transform ${theme === "dark" ? "translate-x-6" : "translate-x-1"}`}
              style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0 50%)" }}
            />
          </button>
        </div>

        {/* Sound toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-white/60" />
            ) : (
              <VolumeX className="w-5 h-5 text-white/40" />
            )}
            <span className="text-sm font-heading uppercase tracking-wider text-white/80">Sound FX</span>
          </div>
          <button
            onClick={() => onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled })}
            className={`w-12 h-6 transition-colors ${settings.soundEnabled ? "bg-[#d4a853]" : "bg-white/20"}`}
            style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
            role="switch"
            aria-checked={settings.soundEnabled}
            aria-label="Toggle sound effects"
          >
            <div
              className={`w-4 h-4 bg-white transition-transform ${settings.soundEnabled ? "translate-x-6" : "translate-x-1"}`}
              style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0 50%)" }}
            />
          </button>
        </div>

        {/* Volume slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-heading uppercase tracking-wider text-white/80">Volume</span>
            <span className="font-mono text-sm text-[#d4a853]">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => onSettingsChange({ ...settings, volume: parseFloat(e.target.value) })}
            className="w-full h-2 cursor-pointer"
            disabled={!settings.soundEnabled}
            aria-label="Volume"
          />
        </div>

        {onReturnToMenu && (
          <>
            <div className="w-full h-px bg-white/10" />
            <button
              onClick={() => {
                onClose()
                onReturnToMenuWithWarning?.() || onReturnToMenu()
              }}
              className="w-full ark-button-danger flex items-center justify-center gap-3 p-3"
            >
              <Home className="w-5 h-5" />
              <span className="text-sm font-heading uppercase tracking-wider">Return to Main Menu</span>
            </button>
          </>
        )}
      </div>
    </GameModal>
  )
}
