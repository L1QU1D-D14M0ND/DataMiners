"use client"

import { useState, useEffect, memo, useCallback, useRef } from "react"
import type {
  GameState,
  GameSettings,
  MatchResult,
  MatchResultOutcome,
  MatchReward,
  MatchStats,
  SelectedTool,
} from "@/lib/game/types"
import { BuildingRegistry, type BuildingDefinition } from "@/lib/game/buildings"
import { getCardIcon } from "@/lib/game/icons"
import { TechTreeModal } from "./tech-tree-modal"
import { CardHand } from "./card-hand"
import { SoundManager } from "@/lib/game/sound-manager"
import { SettingsModal } from "./settings-modal"
import { DataProgressBar } from "./data-progress-bar"
import { TopBar } from "./top-bar"
import { CardNotificationContainer } from "./card-notification"
import axios from "@/lib/axios"
import { getWebSocketClient, type GameStateUpdate, type CardUsageEvent, type MatchEndedEvent } from "@/lib/websocket-client"
import { Clock, Coins, Home, Maximize2, Signal, Star, Trophy, Trash2, Zap, ZoomIn, ZoomOut, AlertTriangle } from "lucide-react"

interface GameUIProps {
  gameState: GameState
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
  selectedTool: SelectedTool
  onToolChange: (tool: SelectedTool) => void
  onReturnToMenu?: () => void
  deckIds?: string[]
  matchId?: string
}

const WIN_REWARD: MatchReward = {
  experience: 50,
  credits: 100,
  rankScore: 5,
}

type MatchResultEventDetail = Partial<Omit<MatchResult, "playerStats" | "reward">> & {
  downloadSpeed?: number
  playerStats?: Partial<MatchStats>
  reward?: Partial<MatchReward>
}

type RewardResponse = {
  reward?: {
    experience?: number
    credits?: number
    rank_score?: number
    rankScore?: number
  }
}

const getRewardForOutcome = (outcome: MatchResultOutcome): MatchReward => {
  const multiplier = outcome === "win" ? 1 : 0.5

  return {
    experience: Math.floor(WIN_REWARD.experience * multiplier),
    credits: Math.floor(WIN_REWARD.credits * multiplier),
    rankScore: Math.floor(WIN_REWARD.rankScore * multiplier),
  }
}

const formatDuration = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

const formatNumber = (value: number) => new Intl.NumberFormat().format(value)


function FloppyToolButton({
  icon,
  label,
  shortcut,
  cost,
  level,
  maxLevel,
  selected,
  onClick,
  isDanger,
}: {
  icon: React.ReactNode
  label: string
  shortcut: string
  cost?: number
  level?: number
  maxLevel?: number
  selected: boolean
  onClick: () => void
  isDanger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`relative ark-floppy flex flex-col items-center gap-1 p-2 pb-4 transition-all duration-150 w-full ${
        selected ? "!bg-white/95 !border-white" : isDanger ? "hover:border-red-500/60" : "hover:border-white/40"
      }`}
    >
      <div className={`${selected ? "text-black" : isDanger ? "text-red-400" : "text-white/80"}`}>{icon}</div>
      <span className={`text-[9px] font-heading uppercase tracking-wider ${selected ? "text-black" : "text-white/60"}`}>
        {label}
      </span>
      {cost !== undefined && (
        <span className={`text-[8px] font-mono ${selected ? "text-black/60" : "text-white/40"}`}>{cost}m</span>
      )}
      <span className={`absolute bottom-1 text-[7px] font-mono ${selected ? "text-black/40" : "text-white/30"}`}>
        [{shortcut}]
      </span>
    </button>
  )
}

const FloppyToolButtonMemo = memo(FloppyToolButton)

function ResultStat({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className={`bg-black/30 border p-3 ${muted ? "border-white/10" : "border-white/15"}`}>
      <div className={`flex items-center gap-2 mb-2 ${muted ? "text-white/25" : "text-[#d4a853]"}`}>
        {icon}
        <span className="font-heading text-[10px] tracking-wider">{label}</span>
      </div>
      <div className={`font-mono text-sm ${muted ? "text-white/35" : "text-white/90"}`}>{value}</div>
    </div>
  )
}

export function GameUI({
  gameState,
  settings,
  onSettingsChange,
  selectedTool,
  onToolChange,
  onReturnToMenu,
  deckIds,
  matchId,
}: GameUIProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showTechTree, setShowTechTree] = useState(false)
  const [placeableBuildings, setPlaceableBuildings] = useState<BuildingDefinition[]>([])
  const [zoomLevel, setZoomLevel] = useState({ zoom: 1, min: 0.5, max: 2 })
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [rewardStatus, setRewardStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle")
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [isConceding, setIsConceding] = useState(false)
  const [concedeError, setConcedeError] = useState<string | null>(null)
  const gameStateRef = useRef<GameState | null>(gameState)
  const matchResultRef = useRef<MatchResult | null>(null)

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  const persistMatchResult = useCallback(async (result: MatchResult) => {
    setRewardStatus("saving")

    try {
      const response = await axios.post<RewardResponse>("/api/game-results", {
        outcome: result.outcome,
        stats: {
          time_elapsed_seconds: result.playerStats.timeElapsedSeconds,
          energy_generated: result.playerStats.energyGenerated,
          download_speed: result.playerStats.downloadSpeed,
        },
      })

      const backendReward = response.data.reward
      const syncedReward: MatchReward = {
        experience: backendReward?.experience ?? result.reward.experience,
        credits: backendReward?.credits ?? result.reward.credits,
        rankScore: backendReward?.rankScore ?? backendReward?.rank_score ?? result.reward.rankScore,
      }

      setMatchResult((currentResult) =>
        currentResult ? { ...currentResult, reward: syncedReward } : currentResult,
      )
      setRewardStatus("saved")
    } catch (error) {
      console.error("Failed to persist match result:", error)
      setRewardStatus("failed")
    }
  }, [])

  const handleConcede = useCallback(async () => {
    if (!matchId) return

    setIsConceding(true)
    setConcedeError(null)
    try {
      await axios.post(`/api/game-sessions/${matchId}/concede`)
      SoundManager.playClick()
      onReturnToMenu?.()
    } catch (error) {
      console.error("Failed to concede match:", error)
      setConcedeError("Failed to concede. Please try again.")
      setIsConceding(false)
    }
  }, [matchId, onReturnToMenu])

  const handleReturnToMenuWithWarning = useCallback(() => {
    if (matchId) {
      setShowExitWarning(true)
    } else {
      onReturnToMenu?.()
    }
  }, [matchId, onReturnToMenu])

  // Sync sound settings
  useEffect(() => {
    SoundManager.setVolume(settings.volume)
    SoundManager.setEnabled(settings.soundEnabled)
  }, [settings.volume, settings.soundEnabled])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("settingsMenuToggle", { detail: { isOpen: showSettings } }))

    return () => {
      window.dispatchEvent(new CustomEvent("settingsMenuToggle", { detail: { isOpen: false } }))
    }
  }, [showSettings])

  useEffect(() => {
    setPlaceableBuildings(BuildingRegistry.getPlaceableBuildings())

    const handleRegistryChange = () => {
      setPlaceableBuildings(BuildingRegistry.getPlaceableBuildings())
    }
    window.addEventListener("buildingRegistryChange", handleRegistryChange)

    const handleZoomUpdate = (event: Event) => {
      setZoomLevel((event as CustomEvent<{ zoom: number; min: number; max: number }>).detail)
    }
    window.addEventListener("zoomLevelUpdate", handleZoomUpdate)

    // Listen for match ended event from WebSocket
    const wsClient = getWebSocketClient()
    const handleMatchEnded = (data: MatchEndedEvent) => {
      if (matchResultRef.current) return

      // Get current user ID from localStorage
      const userData = localStorage.getItem('user')
      if (!userData) return

      const user = JSON.parse(userData)
      const isLoser = user.id === data.loserId

      if (isLoser && matchId === data.matchId) {
        const currentGameState = gameStateRef.current
        const result: MatchResult = {
          outcome: "loss",
          playerStats: {
            timeElapsedSeconds: currentGameState?.elapsedSeconds ?? 0,
            energyGenerated: currentGameState?.totalEnergyGenerated ?? 0,
            downloadSpeed: currentGameState?.downloadSpeed ?? 0,
          },
          rivalStats: null,
          reward: getRewardForOutcome("loss"),
        }

        matchResultRef.current = result
        setMatchResult(result)
        SoundManager.playUnlock()
        persistMatchResult(result)
      }
    }

    const unsubscribeMatchEnded = wsClient.onMatchEnded(handleMatchEnded)

    const openMatchResult = (event: Event, fallbackOutcome: MatchResultOutcome) => {
      if (matchResultRef.current) return

      const detail = (event as CustomEvent<MatchResultEventDetail>).detail ?? {}
      const currentGameState = gameStateRef.current
      const outcome = detail.outcome ?? fallbackOutcome
      const reward = {
        ...getRewardForOutcome(outcome),
        ...detail.reward,
      }
      const playerStats: MatchStats = {
        timeElapsedSeconds: detail.playerStats?.timeElapsedSeconds ?? currentGameState?.elapsedSeconds ?? 0,
        energyGenerated: detail.playerStats?.energyGenerated ?? currentGameState?.totalEnergyGenerated ?? 0,
        downloadSpeed:
          detail.playerStats?.downloadSpeed ?? detail.downloadSpeed ?? currentGameState?.downloadSpeed ?? 0,
      }
      const result: MatchResult = {
        outcome,
        playerStats,
        rivalStats: detail.rivalStats ?? null,
        reward,
      }

      matchResultRef.current = result
      setMatchResult(result)
      SoundManager.playUnlock()
      persistMatchResult(result)
    }

    const handleGameWon = (event: Event) => openMatchResult(event, "win")
    const handleGameLost = (event: Event) => openMatchResult(event, "loss")
    window.addEventListener("gameWon", handleGameWon)
    window.addEventListener("gameLost", handleGameLost)

    return () => {
      window.removeEventListener("buildingRegistryChange", handleRegistryChange)
      window.removeEventListener("zoomLevelUpdate", handleZoomUpdate)
      window.removeEventListener("gameWon", handleGameWon)
      window.removeEventListener("gameLost", handleGameLost)
      unsubscribeMatchEnded()
    }
  }, [persistMatchResult])

  // WebSocket integration for PvP
  useEffect(() => {
    if (!matchId) return

    const wsClient = getWebSocketClient()

    // Get auth token from localStorage or axios
    const token = localStorage.getItem('token') || ''

    // Connect to WebSocket
    wsClient.connect(token)

    // Join the match channel
    wsClient.joinMatch(matchId)

    // Set matchId in game scene
    window.dispatchEvent(new CustomEvent('setMatchId', {
      detail: { matchId }
    }))

    // Listen for game state changes from opponent
    const unsubscribeGameState = wsClient.onGameStateChange((data: GameStateUpdate) => {
      // Update opponent state in game state
      window.dispatchEvent(new CustomEvent('opponentStateUpdate', {
        detail: {
          downloadSpeed: data.downloadSpeed,
          energyGenerated: data.energyGenerated,
          updatedAt: data.timestamp,
        }
      }))
    })

    // Listen for card usage from opponent
    const unsubscribeCardUsed = wsClient.onCardUsed((data: CardUsageEvent) => {
      // Dispatch event for notification
      window.dispatchEvent(new CustomEvent('opponentCardUsed', {
        detail: data
      }))
    })

    return () => {
      unsubscribeGameState()
      unsubscribeCardUsed()
      wsClient.leaveMatch()
      // Don't disconnect here as other components might be using it
    }
  }, [matchId])


  const handleToolSelect = (tool: SelectedTool) => {
    SoundManager.playClick()
    const newTool = selectedTool === tool ? null : tool
    onToolChange(newTool)
    window.dispatchEvent(new CustomEvent("toolChange", { detail: { tool: newTool } }))
  }

  const handleZoomIn = () => window.dispatchEvent(new CustomEvent("zoomIn"))
  const handleZoomOut = () => window.dispatchEvent(new CustomEvent("zoomOut"))
  const handleZoomReset = () => window.dispatchEvent(new CustomEvent("zoomReset"))

  const handleTechUnlock = (nodeId: string, cost: number): boolean => {
    if (gameState.resources.dataUploaded >= cost) {
      SoundManager.playUnlock()
      window.dispatchEvent(new CustomEvent("spendData", { detail: { amount: cost, nodeId } }))
      return true
    }
    SoundManager.playError()
    return false
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
      <CardNotificationContainer />
      <TopBar gameState={gameState} onShowTechTree={() => setShowTechTree(true)} onShowSettings={() => setShowSettings(true)} />

      {/* Middle section with sidebars */}
      <div className="flex-1 flex items-center justify-between px-2 sm:px-3 min-h-0 overflow-hidden">
        <div className="pointer-events-auto slide-in-left self-center">
          <div className="ark-card scanlines overflow-hidden">
            <div className="p-2 lg:p-3 flex flex-row lg:flex-col gap-1 lg:gap-2">
              {placeableBuildings.map((building) => (
                <FloppyToolButtonMemo
                  key={building.id}
                  icon={getCardIcon(building.visuals.iconType, "w-4 h-4 lg:w-5 lg:h-5")}
                  label={building.shortName}
                  shortcut={building.shortcut || ""}
                  cost={building.stats.buildingMaterialsCost}
                  level={building.stats.level}
                  maxLevel={building.stats.maxLevel}
                  selected={selectedTool === building.id}
                  onClick={() => handleToolSelect(building.id as SelectedTool)}
                />
              ))}

              <div className="w-px h-6 lg:w-full lg:h-px bg-white/10 my-0 lg:my-1" />

              <FloppyToolButtonMemo
                icon={<Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />}
                label="DEL"
                shortcut="X"
                selected={selectedTool === "delete"}
                onClick={() => handleToolSelect("delete")}
                isDanger
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-auto slide-in-right self-center">
          <div className="ark-card scanlines overflow-hidden">
            <div className="p-2 lg:p-3 flex flex-row lg:flex-col gap-1 lg:gap-2 items-center">
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel.zoom >= zoomLevel.max}
                className="ark-button p-1.5 lg:p-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-3 h-3 lg:w-4 lg:h-4" />
              </button>

              <span className="font-mono text-[10px] lg:text-[11px] text-[#d4a853] w-8 text-center">
                {Math.round(zoomLevel.zoom * 100)}%
              </span>

              <button
                onClick={handleZoomOut}
                disabled={zoomLevel.zoom <= zoomLevel.min}
                className="ark-button p-1.5 lg:p-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-3 h-3 lg:w-4 lg:h-4" />
              </button>

              <div className="w-px h-6 lg:w-full lg:h-px bg-white/10 my-0 lg:my-1" />

              <button onClick={handleZoomReset} className="ark-button p-1.5 lg:p-2">
                <Maximize2 className="w-3 h-3 lg:w-4 lg:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex-shrink-0 p-2 sm:p-4 flex flex-col gap-2">
        {/* Card hand */}
        <div className="flex justify-center">
          <CardHand deckIds={deckIds} />
        </div>

        <DataProgressBar
          dataUploaded={gameState.resources.dataUploaded}
          maxDataUploaded={gameState.resources.maxDataUploaded}
        />
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
        onReturnToMenu={onReturnToMenu}
        onReturnToMenuWithWarning={handleReturnToMenuWithWarning}
      />

      {/* Tech Tree Modal */}
      <TechTreeModal
        isOpen={showTechTree}
        onClose={() => setShowTechTree(false)}
        currentData={gameState.resources.dataUploaded}
        onUnlock={handleTechUnlock}
      />

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto z-50">
          <div className="ark-card scanlines w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="font-heading text-lg text-white tracking-wider">ABANDON MATCH?</h2>
            </div>
            <p className="text-white/70 text-sm mb-6">
              You are currently in a PvP match. Leaving now will count as a concession and you will lose the match.
            </p>
            {concedeError && (
              <p className="text-red-400 text-xs mb-4">{concedeError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitWarning(false)}
                className="flex-1 ark-button p-3 text-sm font-heading tracking-wider"
              >
                CANCEL
              </button>
              <button
                onClick={handleConcede}
                disabled={isConceding}
                className="flex-1 ark-button-danger p-3 text-sm font-heading tracking-wider flex items-center justify-center gap-2"
              >
                {isConceding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>CONCEDING...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>CONCEDE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Result Modal */}
      {matchResult && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto z-50">
          <div className="ark-card scanlines w-[min(92vw,760px)] max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-[#d4a853] text-3xl sm:text-4xl font-heading tracking-wider">
                  {matchResult.outcome === "win" ? "VICTORY" : "DEFEAT"}
                </div>
                <div className="text-white/60 text-xs sm:text-sm mt-1">
                  {matchResult.outcome === "win"
                    ? "Alien data secured and uploaded to your network."
                    : "Operation ended. Partial compensation has been credited."}
                </div>
              </div>
              <div className="font-mono text-[10px] text-white/40 sm:text-right">
                {rewardStatus === "saving" && "SYNCING REWARDS"}
                {rewardStatus === "saved" && "REWARDS APPLIED"}
                {rewardStatus === "failed" && "REWARD SYNC FAILED"}
                {rewardStatus === "idle" && "RESULT READY"}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-5">
              <div className="border border-white/10 bg-black/20 p-4">
                <div className="font-heading text-xs tracking-wider text-white/80 mb-3">YOUR OPERATION</div>
                <div className="grid grid-cols-2 gap-3">
                  <ResultStat
                    icon={<Clock className="w-4 h-4" />}
                    label="TIME"
                    value={formatDuration(matchResult.playerStats.timeElapsedSeconds)}
                  />
                  <ResultStat
                    icon={<Zap className="w-4 h-4" />}
                    label="ENERGY"
                    value={formatNumber(matchResult.playerStats.energyGenerated)}
                  />
                  <ResultStat
                    icon={<Signal className="w-4 h-4" />}
                    label="DOWNLOAD"
                    value={`${matchResult.playerStats.downloadSpeed} MB/s`}
                  />
                  <ResultStat
                    icon={<Trophy className="w-4 h-4" />}
                    label="RESULT"
                    value={matchResult.outcome === "win" ? "WIN" : "LOSS"}
                  />
                </div>
              </div>

              <div className="border border-white/10 bg-black/20 p-4">
                <div className="font-heading text-xs tracking-wider text-white/80 mb-3">RIVAL OPERATION</div>
                <div className="grid grid-cols-2 gap-3">
                  <ResultStat
                    icon={<Clock className="w-4 h-4" />}
                    label="TIME"
                    value={
                      matchResult.rivalStats ? formatDuration(matchResult.rivalStats.timeElapsedSeconds) : "--:--"
                    }
                    muted={!matchResult.rivalStats}
                  />
                  <ResultStat
                    icon={<Zap className="w-4 h-4" />}
                    label="ENERGY"
                    value={matchResult.rivalStats ? formatNumber(matchResult.rivalStats.energyGenerated) : "--"}
                    muted={!matchResult.rivalStats}
                  />
                  <ResultStat
                    icon={<Signal className="w-4 h-4" />}
                    label="DOWNLOAD"
                    value={matchResult.rivalStats ? `${matchResult.rivalStats.downloadSpeed} MB/s` : "-- MB/s"}
                    muted={!matchResult.rivalStats}
                  />
                  <ResultStat icon={<Trophy className="w-4 h-4" />} label="RESULT" value="PENDING" muted />
                </div>
              </div>
            </div>

            <div className="border border-[#d4a853]/25 bg-[#d4a853]/5 p-4 mb-5">
              <div className="font-heading text-xs tracking-wider text-[#d4a853] mb-3">REWARDS</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ResultStat
                  icon={<Star className="w-4 h-4" />}
                  label="EXPERIENCE"
                  value={`+${matchResult.reward.experience}`}
                />
                <ResultStat
                  icon={<Coins className="w-4 h-4" />}
                  label="CREDITS"
                  value={`+${matchResult.reward.credits}`}
                />
                <ResultStat
                  icon={<Trophy className="w-4 h-4" />}
                  label="RANK SCORE"
                  value={`+${matchResult.reward.rankScore}`}
                />
              </div>
            </div>

            <button
              onClick={() => {
                setMatchResult(null)
                matchResultRef.current = null
                onReturnToMenu?.()
              }}
              className="ark-button-gold w-full flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              RETURN TO MENU
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
