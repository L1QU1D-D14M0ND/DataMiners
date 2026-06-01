"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { Play, Settings, Info, X, Volume2, VolumeX, Sun, Moon, ChevronRight, Layers, LogOut, Shield, Zap, User, Users } from "lucide-react"
import { getCardIcon } from "@/lib/game/icons"
import type { GameSettings } from "@/lib/game/types"
import { SoundManager } from "@/lib/game/sound-manager"
import { DeckEditor } from "@/components/game/deck-editor"
import {
  fetchDecks,
  initializeCardMapping,
  toFrontendCardIds,
} from "@/lib/game/cards/card-mapping"
import { ALL_CARDS } from "@/lib/game/cards/card-types"
import { ProfileModal } from "@/components/game/profile-modal"

interface UserProfile {
  id: number
  name: string
  email: string
  role: string
}

interface MainMenuProps {
  onStartGame: (deckIds: string[]) => void
  onStartMatchmaking: () => void
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
  onLogout: () => void
  user: UserProfile | null
  adminDashboardUrl?: string
}

type MenuScreen = "main" | "settings" | "decks" | "credits"

interface UserDeck {
  id: number
  name: string
  cardIds: string[]
}

export function MainMenu({ onStartGame, onStartMatchmaking, settings, onSettingsChange, onLogout, user, adminDashboardUrl }: MainMenuProps) {
  const [currentScreen, setCurrentScreen] = useState<MenuScreen>("main")
  const [decks, setDecks] = useState<UserDeck[]>([])
  const [equippedDeckId, setEquippedDeckId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)

  const loadDecks = useCallback(async () => {
    try {
      setErrorMessage(null)
      const backendDecks = await fetchDecks()
      const userDecks: UserDeck[] = backendDecks.map((bd) => ({
        id: bd.id,
        name: bd.name,
        cardIds: toFrontendCardIds(bd.card_ids),
      }))
      setDecks(userDecks)

      setEquippedDeckId((currentDeckId) => {
        if (currentDeckId && userDecks.some((deck) => deck.id === currentDeckId)) {
          return currentDeckId
        }

        return userDecks[0]?.id ?? null
      })
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load decks:", error)
      }
      setErrorMessage("Failed to load decks. Please refresh the page.")
    }
  }, [])

  // Initialize card mapping and load decks
  useEffect(() => {
    async function init() {
      try {
        await initializeCardMapping()
        await loadDecks()
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to initialize main menu:", error)
        }
        setErrorMessage("Failed to load card data. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [loadDecks])

  const handleEquipDeck = useCallback((deckId: number) => {
    SoundManager.playClick()
    setEquippedDeckId(deckId)
  }, [])

  const handleStartGame = useCallback(() => {
    const equippedDeck = decks.find((d) => d.id === equippedDeckId)
    SoundManager.playClick()
    onStartGame(equippedDeck ? equippedDeck.cardIds : [])
  }, [decks, equippedDeckId, onStartGame])

  // Sync sound settings
  useEffect(() => {
    SoundManager.setVolume(settings.volume)
    SoundManager.setEnabled(settings.soundEnabled)
  }, [settings.volume, settings.soundEnabled])

  return (
    <div className="fixed inset-0 bg-[#050508] flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Rotating corner reticles - smaller on mobile */}
        <svg className="absolute top-4 left-4 w-12 h-12 sm:top-6 sm:left-6 sm:w-16 sm:h-16 lg:w-32 lg:h-32 opacity-20 reticle-spin" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(212,168,83,0.3)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(212,168,83,0.2)" strokeWidth="0.5" />
        </svg>
        <svg className="absolute bottom-4 right-4 w-16 h-16 sm:bottom-6 sm:right-6 sm:w-20 sm:h-20 lg:w-40 lg:h-40 opacity-20 reticle-spin-reverse" viewBox="0 0 100 100">
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
            strokeDasharray="8 4"
          />
        </svg>

        {/* Data streams on sides - hidden on very small screens */}
        <div className="absolute left-4 top-0 bottom-0 w-px hidden sm:block">
          <div className="w-full h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent data-stream" />
          <div className="w-full h-20 bg-gradient-to-b from-transparent via-[#d4a853]/30 to-transparent data-stream-delayed" />
        </div>
        <div className="absolute right-4 top-0 bottom-0 w-px hidden sm:block">
          <div className="w-full h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent data-stream-delayed" />
          <div className="w-full h-20 bg-gradient-to-b from-transparent via-[#d4a853]/30 to-transparent data-stream" />
        </div>

        {/* Scanlines */}
        <div className="absolute inset-0 scanlines opacity-30" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full px-3 sm:px-4 overflow-y-auto py-6 sm:py-8 h-full">
        {currentScreen === "main" && (
          <MainMenuScreen
            onNavigate={setCurrentScreen}
            onStartGame={handleStartGame}
            onStartMatchmaking={onStartMatchmaking}
            onLogout={onLogout}
            decks={decks}
            equippedDeckId={equippedDeckId}
            onEquipDeck={handleEquipDeck}
            loading={loading}
            user={user}
            adminDashboardUrl={adminDashboardUrl}
            errorMessage={errorMessage}
            onShowProfile={() => setShowProfile(true)}
          />
        )}
        {currentScreen === "settings" && (
          <SettingsScreen
            settings={settings}
            onSettingsChange={onSettingsChange}
            onBack={() => setCurrentScreen("main")}
          />
        )}
        {currentScreen === "decks" && <DeckEditor onBack={() => setCurrentScreen("main")} onDecksUpdated={loadDecks} initialDeckId={equippedDeckId} />}
        {currentScreen === "credits" && <CreditsScreen onBack={() => setCurrentScreen("main")} />}
      </div>

      {/* Version number */}
      <div className="absolute bottom-4 left-4 font-mono text-[10px] text-white/20 tracking-widest">v0.1.0-alpha</div>

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  )
}

function MainMenuScreen({
  onNavigate,
  onStartGame,
  onStartMatchmaking,
  onLogout,
  decks,
  equippedDeckId,
  onEquipDeck,
  loading,
  user,
  adminDashboardUrl,
  errorMessage,
  onShowProfile,
}: {
  onNavigate: (screen: MenuScreen) => void
  onStartGame: () => void
  onStartMatchmaking: () => void
  onLogout: () => void
  decks: UserDeck[]
  equippedDeckId: number | null
  onEquipDeck: (deckId: number) => void
  loading: boolean
  user: UserProfile | null
  adminDashboardUrl?: string
  errorMessage: string | null
  onShowProfile: () => void
}) {
  const equippedDeck = decks.find((d) => d.id === equippedDeckId)

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 slide-in-left">
      {/* Logo / Title */}
      <div className="text-center mb-2 sm:mb-4">
        <div className="relative inline-block">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl tracking-[0.2em] sm:tracking-[0.3em] text-white/90 text-glow-white">DATA MINERS</h1>
          <div className="font-serif italic text-xs sm:text-sm lg:text-base text-[#d4a853] tracking-widest mt-1">
            DIRECTOR TERMINAL
          </div>
          {/* Decorative lines - hidden on very small screens */}
          <div className="absolute -left-6 sm:-left-8 top-1/2 w-4 sm:w-6 h-px bg-gradient-to-r from-transparent to-white/30 hidden xs:block" />
          <div className="absolute -right-6 sm:-right-8 top-1/2 w-4 sm:w-6 h-px bg-gradient-to-l from-transparent to-white/30 hidden xs:block" />
        </div>
      </div>

      {errorMessage && (
        <div className="ark-button ark-button-danger w-full max-w-xs p-3 text-center text-sm">
          {errorMessage}
        </div>
      )}

      {/* Deck Selector */}
      <div className="w-full max-w-xs">
        <div className="ark-card scanlines overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d4a853]" />
              <span className="font-heading text-xs tracking-wider text-white/90">LOADOUT</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate("decks")}
                onMouseEnter={() => SoundManager.playHover()}
                className="ark-button px-2 py-1 text-[10px] font-heading tracking-wider"
              >
                EDIT
              </button>
            </div>
          </div>
          <div className="p-3">
            {loading ? (
              <div className="text-center py-6">
                <div className="font-serif italic text-[11px] text-white/30">Loading decks...</div>
              </div>
            ) : decks.length === 0 ? (
              <div className="text-center py-6">
                <div className="font-serif italic text-[11px] text-white/30 mb-3">No decks available</div>
                <button
                  onClick={() => onNavigate("decks")}
                  onMouseEnter={() => SoundManager.playHover()}
                  className="ark-button px-4 py-2 text-xs font-heading tracking-wider"
                >
                  CREATE DECK
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Deck selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={equippedDeckId || ""}
                    onChange={(e) => onEquipDeck(Number(e.target.value))}
                    onMouseEnter={() => SoundManager.playHover()}
                    className="flex-1 bg-black/30 border border-white/20 px-3 py-2 text-xs text-white font-heading tracking-wider focus:outline-none focus:border-[#d4a853]/50 cursor-pointer"
                  >
                    {decks.map((deck) => (
                      <option key={deck.id} value={deck.id} className="bg-[#050508]">
                        {deck.name} ({deck.cardIds.length}/8)
                      </option>
                    ))}
                  </select>
                  <div className="font-mono text-[10px] text-white/40 px-2">
                    {decks.length} DECKS
                  </div>
                </div>

                {/* Equipped deck cards */}
                {equippedDeck && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-heading text-xs text-white/90">{equippedDeck.name}</div>
                      <div className="font-mono text-[10px] text-[#d4a853]">{equippedDeck.cardIds.length}/8</div>
                    </div>
                    {equippedDeck.cardIds.length > 0 ? (
                      <div className="grid grid-cols-4 gap-1.5">
                        {equippedDeck.cardIds.map((cardId) => {
                          const card = ALL_CARDS.find((c) => c.id === cardId)
                          if (!card) return null
                          return (
                            <div
                              key={cardId}
                              className="relative aspect-square bg-black/30 border border-white/20 flex items-center justify-center hover:border-[#d4a853]/50 transition-colors"
                              title={card.name}
                            >
                              {getCardIcon(card.iconType, "w-4 h-4 text-white/60")}
                              <div className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5">
                                <Zap className="w-2 h-2 text-yellow-400" />
                                <span className="font-mono text-[7px] text-yellow-400">{card.energyCost}</span>
                              </div>
                            </div>
                          )
                        })}
                        {Array.from({ length: 8 - equippedDeck.cardIds.length }).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="aspect-square border border-dashed border-white/10 flex items-center justify-center"
                          >
                            <div className="w-2 h-2 bg-white/10" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed border-white/10">
                        <div className="font-serif italic text-[10px] text-white/30">Empty deck - add cards in editor</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu buttons */}
      <div className="w-full max-w-xs flex flex-col gap-2 sm:gap-3">
        <MenuButton
          icon={<Play className="w-5 h-5" />}
          label="START OPERATION"
          sublabel={loading ? "Loading loadout" : equippedDeck ? `Using: ${equippedDeck.name}` : "No deck equipped"}
          onClick={onStartGame}
          primary
          disabled={loading || !equippedDeck}
        />
        <MenuButton
          icon={<Users className="w-5 h-5" />}
          label="PVP MATCHMAKING"
          sublabel="Start an operation with a rival"
          onClick={onStartMatchmaking}
          disabled={loading}
        />
        <MenuButton
          icon={<User className="w-5 h-5" />}
          label="PROFILE"
          sublabel="View cosmetics and sets"
          onClick={onShowProfile}
        />
        <MenuButton
          icon={<Settings className="w-5 h-5" />}
          label="SETTINGS"
          sublabel="System configuration"
          onClick={() => onNavigate("settings")}
        />
        <MenuButton
          icon={<Info className="w-5 h-5" />}
          label="CREDITS"
          sublabel="Development team"
          onClick={() => onNavigate("credits")}
        />
        <MenuButton
          icon={<LogOut className="w-5 h-5" />}
          label="LOGOUT"
          sublabel="Sign out session"
          onClick={onLogout}
        />
        {user?.role === "Administrator" && (
          <MenuButton
            icon={<Shield className="w-5 h-5" />}
            label="BACKEND DASHBOARD"
            sublabel="Admin panel access"
            onClick={() => {
              window.location.href = adminDashboardUrl ?? "http://localhost:8000/dashboard"
            }}
          />
        )}
      </div>

      {/* Bottom decoration */}
      <div className="flex items-center gap-4 mt-4">
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/20" />
        <div className="w-2 h-2 bg-[#d4a853]/50 rotate-45" />
        <div className="w-12 h-px bg-gradient-to-l from-transparent to-white/20" />
      </div>
    </div>
  )
}

function MenuButton({
  icon,
  label,
  sublabel,
  onClick,
  primary = false,
  disabled = false,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  onClick: () => void
  primary?: boolean
  disabled?: boolean
}) {
  const handleClick = () => {
    SoundManager.playClick()
    onClick()
  }

  const handleHover = () => {
    SoundManager.playHover()
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleHover}
      disabled={disabled}
      className={`
        group relative w-full ark-floppy p-3 sm:p-4 flex items-center gap-3 sm:gap-4 transition-all duration-200
        ${
          primary
            ? "border-[#d4a853]/50 hover:border-[#d4a853] hover:bg-[#d4a853]/10"
            : "hover:border-white/40 hover:bg-white/5"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div
        className={`
        flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center
        ${primary ? "text-[#d4a853]" : "text-white/60 group-hover:text-white/80"}
      `}
      >
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div
          className={`
          font-heading text-xs sm:text-sm tracking-wider truncate
          ${primary ? "text-[#d4a853]" : "text-white/90"}
        `}
        >
          {label}
        </div>
        <div className="font-serif italic text-[9px] sm:text-[10px] text-white/40 mt-0.5 truncate">{sublabel}</div>
      </div>
      <ChevronRight
        className={`
        w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1
        ${primary ? "text-[#d4a853]/60" : "text-white/30"}
      `}
      />
    </button>
  )
}

function SettingsScreen({
  settings,
  onSettingsChange,
  onBack,
}: {
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
  onBack: () => void
}) {
  const { theme, setTheme } = useTheme()
  
  const handleBack = () => {
    SoundManager.playClick()
    onBack()
  }

  const handleToggle = (key: keyof GameSettings, value: boolean) => {
    SoundManager.playClick()
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <div className="slide-in-right">
      <div className="ark-card scanlines overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-white/60" />
            <span className="font-heading text-sm tracking-wider text-white/90">SETTINGS</span>
          </div>
          <button onClick={handleBack} onMouseEnter={() => SoundManager.playHover()} className="ark-button p-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings content */}
        <div className="p-4 space-y-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-white/60" />
              ) : (
                <Sun className="w-4 h-4 text-white/60" />
              )}
              <div>
                <div className="font-heading text-xs tracking-wider text-white/80">DISPLAY MODE</div>
                <div className="font-serif italic text-[10px] text-white/40">Visual theme preference</div>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`
                relative w-12 h-6 transition-colors
                ${theme === "dark" ? "bg-[#d4a853]/30" : "bg-white/10"}
              `}
              style={{
                clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
              }}
            >
              <div
                className={`
                  absolute top-1 w-4 h-4 bg-[#d4a853] transition-all
                  ${theme === "dark" ? "left-7" : "left-1"}
                `}
                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.volume > 0 ? (
                  <Volume2 className="w-4 h-4 text-white/60" />
                ) : (
                  <VolumeX className="w-4 h-4 text-white/60" />
                )}
                <div>
                  <div className="font-heading text-xs tracking-wider text-white/80">AUDIO LEVEL</div>
                  <div className="font-serif italic text-[10px] text-white/40">Master volume control</div>
                </div>
              </div>
              <span className="font-mono text-sm text-[#d4a853]">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.volume}
              onChange={(e) => onSettingsChange({ ...settings, volume: Number.parseFloat(e.target.value) })}
              className="w-full h-1 cursor-pointer"
            />
          </div>

          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-white/60" />
              <div>
                <div className="font-heading text-xs tracking-wider text-white/80">SOUND EFFECTS</div>
                <div className="font-serif italic text-[10px] text-white/40">In-game audio feedback</div>
              </div>
            </div>
            <button
              onClick={() => handleToggle("soundEnabled", !settings.soundEnabled)}
              className={`
                relative w-12 h-6 transition-colors
                ${settings.soundEnabled ? "bg-[#d4a853]/30" : "bg-white/10"}
              `}
              style={{
                clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
              }}
            >
              <div
                className={`
                  absolute top-1 w-4 h-4 bg-[#d4a853] transition-all
                  ${settings.soundEnabled ? "left-7" : "left-1"}
                `}
                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



function CreditsScreen({ onBack }: { onBack: () => void }) {
  const credits = [
    { role: "Game Design", name: "Development Team" },
    { role: "Programming", name: "v0 AI Assistant" },
    { role: "Art Direction", name: "Arknights Inspired" },
    { role: "UI/UX Design", name: "Tactical Interface Lab" },
    { role: "Sound Design", name: "Web Audio API" },
  ]

  const handleBack = () => {
    SoundManager.playClick()
    onBack()
  }

  return (
    <div className="slide-in-right">
      <div className="ark-card scanlines overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-white/60" />
            <span className="font-heading text-sm tracking-wider text-white/90">CREDITS</span>
          </div>
          <button onClick={handleBack} onMouseEnter={() => SoundManager.playHover()} className="ark-button p-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Credits content */}
        <div className="p-4 space-y-4">
          <div className="text-center pb-4 border-b border-white/10">
            <div className="font-heading text-lg tracking-[0.2em] text-white/90">GRID</div>
            <div className="font-serif italic text-sm text-[#d4a853]">Power Command</div>
          </div>

          {credits.map((credit, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="font-serif italic text-xs text-white/50">{credit.role}</span>
              <span className="font-heading text-xs tracking-wider text-white/80">{credit.name}</span>
            </div>
          ))}

          <div className="text-center pt-4">
            <div className="font-mono text-[10px] text-white/30">Built with Next.js, Phaser 3, and TypeScript</div>
            <div className="font-mono text-[10px] text-white/20 mt-1">2024 - Open Source Project</div>
          </div>
        </div>
      </div>
    </div>
  )
}
