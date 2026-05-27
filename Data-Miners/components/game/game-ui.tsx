"use client"

import { useState, useEffect, memo } from "react"
import type { GameState, GameSettings, SelectedTool } from "@/lib/game/types"
import { BuildingRegistry, type BuildingDefinition } from "@/lib/game/buildings"
import { getCardIcon } from "@/lib/game/icons"
import { TechTreeModal } from "./tech-tree-modal"
import { CardHand } from "./card-hand"
import { SoundManager } from "@/lib/game/sound-manager"
import { SettingsModal } from "./settings-modal"
import { DataProgressBar } from "./data-progress-bar"
import { TopBar } from "./top-bar"
import { Trash2, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface GameUIProps {
  gameState: GameState
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
  selectedTool: SelectedTool
  onToolChange: (tool: SelectedTool) => void
  onReturnToMenu?: () => void
  deckIds?: string[]
}


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
      {level !== undefined && maxLevel !== undefined && (
        <div className="absolute top-1 right-1 flex gap-0.5">
          {Array.from({ length: maxLevel }).map((_, i) => (
            <div
              key={i}
              className={`w-1 h-1 ${
                i < level ? (selected ? "bg-black" : "bg-[#d4a853]") : selected ? "bg-black/20" : "bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </button>
  )
}

const FloppyToolButtonMemo = memo(FloppyToolButton)

export function GameUI({
  gameState,
  settings,
  onSettingsChange,
  selectedTool,
  onToolChange,
  onReturnToMenu,
  deckIds,
}: GameUIProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showTechTree, setShowTechTree] = useState(false)
  const [placeableBuildings, setPlaceableBuildings] = useState<BuildingDefinition[]>([])
  const [zoomLevel, setZoomLevel] = useState({ zoom: 1, min: 0.5, max: 2 })
  const [showWinModal, setShowWinModal] = useState(false)
  const [finalDownloadSpeed, setFinalDownloadSpeed] = useState(0)

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

    const handleGameWon = (event: Event) => {
      const { downloadSpeed } = (event as CustomEvent<{ downloadSpeed: number }>).detail
      setFinalDownloadSpeed(downloadSpeed)
      setShowWinModal(true)
      SoundManager.playUnlock()
    }
    window.addEventListener("gameWon", handleGameWon)

    return () => {
      window.removeEventListener("buildingRegistryChange", handleRegistryChange)
      window.removeEventListener("zoomLevelUpdate", handleZoomUpdate)
      window.removeEventListener("gameWon", handleGameWon)
    }
  }, [])


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
      />

      {/* Tech Tree Modal */}
      <TechTreeModal
        isOpen={showTechTree}
        onClose={() => setShowTechTree(false)}
        currentData={gameState.resources.dataUploaded}
        onUnlock={handleTechUnlock}
      />

      {/* Win Modal */}
      {showWinModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-auto z-50">
          <div className="ark-card scanlines p-8 max-w-md text-center">
            <div className="text-[#d4a853] text-4xl font-heading mb-4">VICTORY</div>
            <div className="text-white/80 text-sm mb-6">
              You have successfully established a download speed of {finalDownloadSpeed} MB/s from the Alien Monolith!
            </div>
            <div className="text-white/60 text-xs mb-6">
              The alien data has been secured and uploaded to your network.
            </div>
            <button
              onClick={() => {
                setShowWinModal(false)
                onReturnToMenu?.()
              }}
              className="ark-button-gold w-full"
            >
              RETURN TO MENU
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
