"use client"

import { useState, useCallback, useEffect, useRef, TouchEvent } from "react"
import {
  Zap,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react"
import { drawHand, type GameCard, getCardById } from "@/lib/game/cards/card-types"
import { SoundManager } from "@/lib/game/sound-manager"
import { getCardIcon } from "@/lib/game/icons"

const HAND_SIZE = 4

interface CardHandProps {
  /** Deck IDs to draw cards from */
  deckIds?: string[]
}

interface ActiveCardTooltipProps {
  card: GameCard
  onUseCard: (card: GameCard) => void
  onHover: () => void
}

function ActiveCardTooltip({ card, onUseCard, onHover }: ActiveCardTooltipProps) {
  return (
    <div className="ark-card scanlines px-3 py-2 max-w-[280px] sm:max-w-[320px] mx-auto slide-in-top">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 opacity-70">
          {getCardIcon(card.iconType, "w-5 h-5 sm:w-6 sm:h-6 text-white")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[11px] sm:text-[12px] tracking-wider text-white/90 uppercase truncate">
            {card.name}
          </div>
          <p className="text-[10px] sm:text-[11px] text-white/50 leading-relaxed mt-0.5">{card.description}</p>
        </div>
      </div>
      <button
        onClick={() => onUseCard(card)}
        onMouseEnter={onHover}
        className="mt-2 w-full ark-button-gold flex items-center justify-center gap-2 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-heading uppercase tracking-wider"
      >
        <Play className="w-3 h-3 sm:w-4 sm:h-4" />
        Use Card
      </button>
    </div>
  )
}

export function CardHand({ deckIds }: CardHandProps) {
  const [hand, setHand] = useState<GameCard[]>(() => drawHand(HAND_SIZE, deckIds))
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const handleCardClick = useCallback((card: GameCard) => {
    SoundManager.playClick()
    setActiveCard((prev) => (prev === card.id ? null : card.id))
  }, [])

  const handleUseCard = useCallback((card: GameCard) => {
    SoundManager.playClick()
    
    // Remove card from hand
    setHand(prevHand => {
      const newHand = prevHand.filter(c => c.id !== card.id)
      
      // Draw a random card from deck that's not currently in hand
      const deck = deckIds || []
      const currentHandIds = newHand.map(c => c.id)
      const availableCards = deck.filter(id => !currentHandIds.includes(id))
      
      if (availableCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCards.length)
        const newCardId = availableCards[randomIndex]
        const newCard = getCardById(newCardId)
        
        if (newCard) {
          return [...newHand, newCard]
        }
      }
      
      return newHand
    })
    
    setActiveCard(null)
  }, [deckIds])

  const handleHover = useCallback(() => SoundManager.playHover(), [])

  const toggleCollapse = useCallback(() => {
    SoundManager.playClick()
    setCollapsed((v) => !v)
  }, [])

  // Touch gesture handling
  const handleTouchStart = useCallback((e: TouchEvent, card: GameCard) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    setTouchEnd({ x: touch.clientX, y: touch.clientY })
  }, [])

  const handleTouchEnd = useCallback((card: GameCard) => {
    if (!touchStart || !touchEnd) return

    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y
    const minSwipeDistance = 50

    // Swipe up to use card
    if (deltaY < -minSwipeDistance && Math.abs(deltaX) < minSwipeDistance) {
      handleUseCard(card)
    }
    // Swipe down to collapse/expand
    else if (deltaY > minSwipeDistance && Math.abs(deltaX) < minSwipeDistance) {
      toggleCollapse()
    }
    // Swipe left/right to navigate cards
    else if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      const currentIndex = hand.findIndex(c => c.id === card.id)
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous card
        handleCardClick(hand[currentIndex - 1])
      } else if (deltaX < 0 && currentIndex < hand.length - 1) {
        // Swipe left - go to next card
        handleCardClick(hand[currentIndex + 1])
      }
    }
    // Tap to select/deselect
    else {
      handleCardClick(card)
    }

    setTouchStart(null)
    setTouchEnd(null)
  }, [touchStart, touchEnd, hand, handleUseCard, toggleCollapse, handleCardClick])

  useEffect(() => {
    setActiveCard(null)
    setHand(drawHand(HAND_SIZE, deckIds))
  }, [deckIds])

  if (hand.length === 0) return null

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1">
      {/* Active card detail tooltip */}
      {(() => {
        const card = hand.find((c) => c.id === activeCard)
        return card ? <ActiveCardTooltip card={card} onUseCard={handleUseCard} onHover={handleHover} /> : null
      })()}

      {/* Hand container */}
      <div className="ark-card scanlines overflow-hidden">
        {/* Header row */}
        <div className="flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 border-b border-white/10">
          <span className="font-serif italic text-[10px] sm:text-[11px] text-white/40 tracking-wider">CARD HAND</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] sm:text-[11px] text-white/30">{hand.length}/{HAND_SIZE}</span>
            <button
              onClick={toggleCollapse}
              onMouseEnter={handleHover}
              className="ark-button p-1.5 sm:p-2"
            >
              {collapsed ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* Cards */}
        {!collapsed && (
          <div className="flex gap-1.5 sm:gap-2 p-2 sm:p-3">
            {hand.map((card) => {
              const isActive = activeCard === card.id
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  onTouchStart={(e) => handleTouchStart(e, card)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(card)}
                  onMouseEnter={handleHover}
                  className={`
                    relative ark-floppy flex flex-col items-center gap-1 p-2 pb-4 sm:p-2.5 sm:pb-5
                    w-16 sm:w-20 md:w-24 transition-all duration-150 select-none border border-white/25 touch-manipulation
                    ${isActive
                      ? "!bg-white/15 -translate-y-1 scale-105 z-10"
                      : "hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95"
                    }
                  `}
                >

                  {/* Icon */}
                  <div className={`${isActive ? "text-white" : "text-white/70"}`}>
                    {getCardIcon(card.iconType, "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7")}
                  </div>

                  {/* Short name */}
                  <div
                    className={`
                      font-heading text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-wider text-center leading-tight truncate w-full px-1
                      ${isActive ? "text-white" : "text-white/70"}
                    `}
                  >
                    {card.shortName}
                  </div>

                  {/* Energy cost */}
                  <div className="absolute bottom-1 left-1 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />
                    <span className="font-mono text-[8px] sm:text-[9px] text-yellow-400">{card.energyCost}</span>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 border border-white/40 pointer-events-none" />
                  )}
                </button>
              )
            })}

            {/* Empty slots */}
            {Array.from({ length: HAND_SIZE - hand.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-16 sm:w-20 md:w-24 ark-floppy flex items-center justify-center py-4 sm:py-5 border-dashed opacity-20"
              >
                <span className="font-mono text-[10px] sm:text-[11px] text-white/40">—</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
