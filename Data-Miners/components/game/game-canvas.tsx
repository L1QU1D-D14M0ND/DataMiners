"use client"

import { useEffect, useRef, useState } from "react"
import * as Phaser from "phaser"
import { GameScene } from "@/lib/game/scenes/game-scene"
import { GameUI } from "./game-ui"
import type { GameState, GameSettings, SelectedTool } from "@/lib/game/types"

interface GameCanvasProps {
  onReturnToMenu?: () => void
  deckIds: string[]
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
}

export default function GameCanvas({ onReturnToMenu, deckIds, settings, onSettingsChange }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedTool, setSelectedTool] = useState<SelectedTool | null>(null)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("gameSettingsUpdate", { detail: settings }))
  }, [settings])

  // Pass deck IDs to the game scene when they change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("deckIdsUpdate", { detail: deckIds }))
  }, [deckIds])

  // Suppress benign ResizeObserver loop error (common with Phaser's scale system)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes("ResizeObserver loop")) {
        event.stopImmediatePropagation()
        event.preventDefault()
      }
    }
    window.addEventListener("error", handleError)
    return () => window.removeEventListener("error", handleError)
  }, [])

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelArt: true,
      backgroundColor: "#050505",
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    }

    gameRef.current = new Phaser.Game(config)

    const handleStateUpdate = (event: Event) => setGameState((event as CustomEvent<GameState>).detail)
    window.addEventListener("gameStateUpdate", handleStateUpdate)

    const handleDeselect = () => setSelectedTool(null)
    window.addEventListener("deselectTool", handleDeselect)

    const handleKeyboardToolChange = (event: Event) =>
      setSelectedTool((event as CustomEvent<{ tool: SelectedTool }>).detail.tool)
    window.addEventListener("keyboardToolChange", handleKeyboardToolChange)

    return () => {
      window.removeEventListener("gameStateUpdate", handleStateUpdate)
      window.removeEventListener("deselectTool", handleDeselect)
      window.removeEventListener("keyboardToolChange", handleKeyboardToolChange)
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-12 h-12 pointer-events-none opacity-20">
        <svg viewBox="0 0 48 48" className="w-full h-full text-white">
          <path d="M0 16 L0 0 L16 0" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute top-3 right-3 w-12 h-12 pointer-events-none opacity-20">
        <svg viewBox="0 0 48 48" className="w-full h-full text-white">
          <path d="M32 0 L48 0 L48 16" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute bottom-3 left-3 w-12 h-12 pointer-events-none opacity-20">
        <svg viewBox="0 0 48 48" className="w-full h-full text-white">
          <path d="M0 32 L0 48 L16 48" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute bottom-3 right-3 w-12 h-12 pointer-events-none opacity-20">
        <svg viewBox="0 0 48 48" className="w-full h-full text-white">
          <path d="M32 48 L48 48 L48 32" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Game canvas container */}
      <div className="absolute inset-0 flex items-center justify-center pt-12 pb-32 px-1 sm:pt-14 sm:pb-36 sm:px-2 lg:pt-16 lg:pb-24 lg:px-20">
        <div className="relative w-full h-full flex items-center justify-center">
          <div ref={containerRef} className="overflow-hidden max-w-full max-h-full border border-white/10" style={{ touchAction: "manipulation" }} />
          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.8) 100%)",
            }}
          />
        </div>
      </div>

      {/* UI overlay */}
      {gameState && (
        <GameUI
          gameState={gameState}
          settings={settings}
          onSettingsChange={onSettingsChange}
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
          onReturnToMenu={onReturnToMenu}
          deckIds={deckIds}
        />
      )}
    </div>
  )
}
