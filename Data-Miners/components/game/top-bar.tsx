"use client"

import type React from "react"
import { Zap, Activity, Clock, Settings, Hammer, Gem, Database, FlaskConical, Users } from "lucide-react"
import type { GameState } from "@/lib/game/types"

interface TacticalResourceCardProps {
  icon: React.ReactNode
  label: string
  value: number
  max?: number
  suffix?: string
}

function TacticalResourceCard({ icon, label, value, max, suffix }: TacticalResourceCardProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="opacity-60">{icon}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-sm text-white tabular-nums">{String(value).padStart(3, " ")}</span>
        {max !== undefined && <span className="font-mono text-[10px] text-white/40">/{max}</span>}
        {suffix && <span className="font-mono text-[10px] text-white/40">{suffix}</span>}
      </div>
    </div>
  )
}

interface OpponentInfoCardProps {
  icon: React.ReactNode
  label: string
  value: string
}

function OpponentInfoCard({ icon, label, value }: OpponentInfoCardProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="opacity-60">{icon}</div>
      <div className="flex flex-col">
        <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
        <span className="font-mono text-sm text-white tabular-nums">{value}</span>
      </div>
    </div>
  )
}

interface TopBarProps {
  gameState: GameState
  onShowTechTree: () => void
  onShowSettings: () => void
}

export function TopBar({ gameState, onShowTechTree, onShowSettings }: TopBarProps) {
  const powerStatus = gameState.energyFlow.netPower >= 0 ? "stable" : "critical"

  return (
    <div className="flex-shrink-0 slide-in-top">
      <div className="ark-topbar mx-2 sm:mx-4 mt-2 sm:mt-3">
        <div className="ark-topbar-content px-4 py-2 flex items-center justify-between">
          {/* Left: Status in serif font */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 ${powerStatus === "stable" ? "status-online" : "status-danger pulse-tactical"}`}
              />
              <span className="font-serif text-sm sm:text-base font-medium text-white/90 tracking-wide italic">
                UPLINK STATUS
              </span>
              <span
                className={`font-heading text-xs uppercase tracking-widest ${
                  powerStatus === "stable" ? "text-green-400" : "text-red-400"
                }`}
              >
                [{powerStatus}]
              </span>
            </div>
          </div>

          {/* Right: Resources separated by vertical lines */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Always visible: Power and Net */}
            <TacticalResourceCard
              icon={<Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />}
              label="PWR"
              value={gameState.resources.energy}
              max={gameState.resources.maxEnergy}
            />

            <div className="ark-divider h-4 sm:h-6" />

            <TacticalResourceCard
              icon={<Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />}
              label="NET"
              value={gameState.energyFlow.netPower}
              suffix="/t"
            />

            {/* Medium screens: Show Materials */}
            <div className="ark-divider h-4 sm:h-6 hidden sm:block" />

            <div className="hidden sm:block">
              <TacticalResourceCard
                icon={<Hammer className="w-3.5 h-3.5 text-slate-300" />}
                label="MAT"
                value={gameState.resources.buildingMaterials}
                max={gameState.resources.maxBuildingMaterials}
              />
            </div>

            {/* Large screens: Show all resources */}
            <div className="ark-divider hidden lg:block" />

            <div className="hidden lg:flex items-center gap-3">
              <TacticalResourceCard
                icon={<Gem className="w-3.5 h-3.5 text-orange-400" />}
                label="ORE"
                value={gameState.resources.rawOre}
                max={gameState.resources.maxRawOre}
              />

              <div className="ark-divider" />

              <TacticalResourceCard
                icon={<Database className="w-3.5 h-3.5 text-purple-400" />}
                label="DATA"
                value={gameState.resources.dataUploaded}
                max={gameState.resources.maxDataUploaded}
              />

              <div className="ark-divider" />

              <OpponentInfoCard
                icon={<Users className="w-3.5 h-3.5 text-red-400" />}
                label="OPPONENT"
                value="N/A"
              />
            </div>

            <div className="ark-divider h-4 sm:h-6 hidden sm:block" />

            {/* Cycle counter - hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              <span className="font-mono text-xs sm:text-sm text-white tabular-nums">
                {String(gameState.tick).padStart(4, "0")}
              </span>
            </div>

            <div className="ark-divider h-4 sm:h-6" />

            {/* Action buttons */}
            <button
              onClick={onShowTechTree}
              className="pointer-events-auto ark-button-gold p-1.5 sm:p-2 group"
              aria-label="Tech Tree"
            >
              <FlaskConical className="w-4 h-4" />
            </button>

            <button
              onClick={onShowSettings}
              className="pointer-events-auto ark-button p-1.5 sm:p-2 group"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
