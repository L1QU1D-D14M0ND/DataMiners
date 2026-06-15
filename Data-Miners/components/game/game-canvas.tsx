"use client"

import { useEffect, useRef, useState } from "react"
import * as Phaser from "phaser"
import { GameScene } from "@/lib/game/scenes/game-scene"
import { GameUI } from "./game-ui"
import { BackgroundMusicManager } from "@/lib/game/background-music-manager"
import type { GameState, GameSettings, SelectedTool } from "@/lib/game/types"
import type { UserProfile } from "@/lib/api-types"

interface GameCanvasProps {
  onReturnToMenu?: () => void
  deckIds: string[]
  matchId?: string | null
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
  user: UserProfile | null
}

export default function GameCanvas({ onReturnToMenu, deckIds, matchId, settings, onSettingsChange, user }: GameCanvasProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedTool, setSelectedTool] = useState<SelectedTool | null>(null)
  const [cardWarning, setCardWarning] = useState<{ message: string; timestamp: number } | null>(null)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("gameSettingsUpdate", { detail: settings }))
  }, [settings])

  // Handle background music settings
  useEffect(() => {
    BackgroundMusicManager.setVolume(settings.musicVolume)
    BackgroundMusicManager.setEnabled(settings.musicEnabled)
  }, [settings.musicVolume, settings.musicEnabled])

  // Pass deck IDs to the game scene when they change
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("deckIdsUpdate", { detail: deckIds }))
  }, [deckIds])

  // Pass user information to the game scene when it changes
  useEffect(() => {
    console.log('[GameCanvas] User prop changed:', user)
    if (user) {
      console.log('[GameCanvas] Dispatching user update event:', user)
      window.dispatchEvent(new CustomEvent("userUpdate", { detail: user }))
    }
  }, [user])

  // Auto-dismiss card warning after 3 seconds
  useEffect(() => {
    if (cardWarning) {
      const timer = setTimeout(() => {
        setCardWarning(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [cardWarning])

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

    // Dispatch user update event after game is created
    if (user) {
      console.log('[GameCanvas] Dispatching user update event after game creation:', user)
      window.dispatchEvent(new CustomEvent("userUpdate", { detail: user }))
    }

    const handleStateUpdate = (event: Event) => setGameState((event as CustomEvent<GameState>).detail)
    window.addEventListener("gameStateUpdate", handleStateUpdate)

    const handleOpponentStateUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              opponentState: {
                downloadSpeed: detail.downloadSpeed,
                energyGenerated: detail.energyGenerated,
                updatedAt: detail.updatedAt,
              },
            }
          : prev
      )
    }
    window.addEventListener("opponentStateUpdate", handleOpponentStateUpdate)

    const handleCardUsedUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail
      console.log('[GameCanvas] Opponent used card:', detail.cardName)
      // Show warning message to player that opponent used a card
      setCardWarning({
        message: `Opponent used: ${detail.cardName}`,
        timestamp: Date.now()
      })
    }
    window.addEventListener("cardUsedUpdate", handleCardUsedUpdate)

    const handleMatchEndedUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail
      console.log('[GameCanvas] Match ended:', detail)
      // Dispatch proper game events to trigger win/lose screen
      const currentUserJson = localStorage.getItem('user')
      const currentUser = currentUserJson ? JSON.parse(currentUserJson) : null
      if (currentUser) {
        if (detail.winnerId === currentUser.id) {
          window.dispatchEvent(new CustomEvent('gameWon', {
            detail: {
              victoryMethod: 'Opponent Quit'
            }
          }))
        } else if (detail.loserId === currentUser.id) {
          // Player lost - dispatch gameLost event to show lose screen
          window.dispatchEvent(new CustomEvent('gameLost', {
            detail: {
              victoryMethod: 'Defeat'
            }
          }))
        }
      }
    }
    window.addEventListener("matchEndedUpdate", handleMatchEndedUpdate)

    const handleDeselect = () => setSelectedTool(null)
    window.addEventListener("deselectTool", handleDeselect)

    const handleKeyboardToolChange = (event: Event) =>
      setSelectedTool((event as CustomEvent<{ tool: SelectedTool }>).detail.tool)
    window.addEventListener("keyboardToolChange", handleKeyboardToolChange)

    return () => {
      window.removeEventListener("gameStateUpdate", handleStateUpdate)
      window.removeEventListener("opponentStateUpdate", handleOpponentStateUpdate)
      window.removeEventListener("cardUsedUpdate", handleCardUsedUpdate)
      window.removeEventListener("matchEndedUpdate", handleMatchEndedUpdate)
      window.removeEventListener("deselectTool", handleDeselect)
      window.removeEventListener("keyboardToolChange", handleKeyboardToolChange)
      gameRef.current?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-12 h-12 pointer-events-none opacity-20">
        <svg viewBox="0 0 48 48" className="w-full h-full text-foreground">
          <path d="M0 16 L0 0 L16 0" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute top-3 right-3 w-12 h-12 pointer-events-none opacity-20">
        <svg viewBox="0 0 48 48" className="w-full h-full text-foreground">
          <path d="M32 0 L48 0 L48 16" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute bottom-3 left-3 w-12 h-12 pointer-events-none opacity-20">
        <svg viewBox="0 0 48 48" className="w-full h-full text-foreground">
          <path d="M0 32 L0 48 L16 48" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute bottom-3 right-3 w-12 h-12 pointer-events-none opacity-20">
        <svg viewBox="0 0 48 48" className="w-full h-full text-foreground">
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
          <div ref={containerRef} className="overflow-hidden max-w-full max-h-full border border-border" style={{ touchAction: "manipulation" }} />
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
          matchId={matchId || undefined}
        />
      )}

      {/* Card usage warning - bottom left corner */}
      {cardWarning && (
        <div className="absolute bottom-20 left-6 z-50 animate-in slide-in-from-left fade-in duration-300">
          <div className="bg-red-950/90 border border-red-500/50 text-red-100 px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">{cardWarning.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
