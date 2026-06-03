"use client"

import { useState, useCallback, useEffect } from "react"
import {
  X,
  Zap,
  Database,
  ChevronLeft,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react"
import { ALL_CARDS, MAX_DECK_SIZE, MIN_DECK_SIZE, type GameCard } from "@/lib/game/cards/card-types"
import { SoundManager } from "@/lib/game/sound-manager"
import {
  initializeCardMapping,
  fetchDecks,
  createDeck,
  updateDeck,
  deleteDeck,
  toFrontendCardIds,
} from "@/lib/game/cards/card-mapping"
import { getCardIcon } from "@/lib/game/icons"
import type { UserDeck } from "@/lib/game/cards/deck-types"

interface DeckEditorProps {
  onBack: () => void
  onDecksUpdated?: () => void
  initialDeckId?: number | null
}

function CompactCardTile({
  card,
  inDeck,
  dragging,
  onDragStart,
  onDragEnd,
  onClick,
  onRemove,
}: {
  card: GameCard
  inDeck: boolean
  dragging: boolean
  onDragStart: (e: React.DragEvent, card: GameCard) => void
  onDragEnd: () => void
  onClick: (card: GameCard) => void
  onRemove?: (cardId: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(card)}
      onMouseEnter={() => SoundManager.playHover()}
      className={`
        relative aspect-square ark-floppy p-1.5 flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing
        select-none transition-all duration-150 group border border-white/30 bg-white/5 text-white/60
        ${dragging ? "opacity-40 scale-95" : "hover:scale-[1.05] hover:z-10"}
        ${inDeck ? "ring-1 ring-inset ring-white/20" : ""}
      `}
    >

      {/* Icon */}
      {getCardIcon(card.iconType, "w-5 h-5 opacity-80")}

      {/* Energy cost */}
      <div className="absolute bottom-0.5 left-0.5 flex items-center gap-0.5">
        <Zap className="w-2 h-2 text-yellow-400" />
        <span className="font-mono text-[7px] text-yellow-400">{card.energyCost}</span>
      </div>

      {/* Remove button */}
      {inDeck && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(card.id)
          }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110"
          style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
        >
          <X className="w-2 h-2" />
        </button>
      )}
    </div>
  )
}

export function DeckEditor({ onBack, onDecksUpdated, initialDeckId }: DeckEditorProps) {
  const [deck, setDeck] = useState<string[]>([])
  const [decks, setDecks] = useState<UserDeck[]>([])
  const [currentDeckId, setCurrentDeckId] = useState<number | null>(null)
  const [showNewDeckModal, setShowNewDeckModal] = useState(false)
  const [newDeckName, setNewDeckName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creatingDeck, setCreatingDeck] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dragCard, setDragCard] = useState<GameCard | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null)

  // Initialize card mapping and load decks
  useEffect(() => {
    async function init() {
      try {
        await initializeCardMapping(true)
        await loadDecks()
      } catch (error) {
        console.error("Failed to initialize deck editor:", error)
        setErrorMessage("Failed to load card data. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const loadDecks = async () => {
    try {
      setErrorMessage(null)
      const backendDecks = await fetchDecks()
      
      const userDecks: UserDeck[] = backendDecks.map((bd) => {
        const convertedCardIds = toFrontendCardIds(bd.card_ids)
        return {
          id: bd.id,
          name: bd.name,
          cardIds: convertedCardIds,
        }
      })
      setDecks(userDecks)

      if (userDecks.length > 0) {
        const deckToSelect = initialDeckId && userDecks.find((d) => d.id === initialDeckId)
          ? initialDeckId
          : userDecks[0].id
        selectDeck(deckToSelect, userDecks)
      } else {
        const newDeck = await createDeck("Default Deck", [])
        const userDeck: UserDeck = {
          id: newDeck.id,
          name: newDeck.name,
          cardIds: toFrontendCardIds(newDeck.card_ids),
        }
        setDecks([userDeck])
        selectDeck(userDeck.id, [userDeck])
      }
    } catch (error) {
      console.error("Failed to load decks:", error)
      setErrorMessage("Failed to load decks. Please refresh the page.")
    }
  }

  function selectDeck(deckId: number, sourceDecks = decks) {
    const selectedDeck = sourceDecks.find((d) => d.id === deckId)
    if (selectedDeck) {
      setCurrentDeckId(deckId)
      setDeck([...selectedDeck.cardIds])
      setSelectedCard(null)
      setErrorMessage(null)
    }
  }

  const saveCurrentDeck = async (): Promise<boolean> => {
    if (!currentDeckId) return true

    if (deck.length < MIN_DECK_SIZE) {
      setErrorMessage(`Deck must have at least ${MIN_DECK_SIZE} cards.`)
      SoundManager.playError()
      return false
    }

    setSaving(true)
    try {
      setErrorMessage(null)
      const currentDeck = decks.find((d) => d.id === currentDeckId)
      if (currentDeck) {
        await updateDeck(currentDeckId, currentDeck.name, deck)
        setDecks((prev) =>
          prev.map((d) => (d.id === currentDeckId ? { ...d, cardIds: deck } : d))
        )
        onDecksUpdated?.()
        SoundManager.playSuccess()
      }
      return true
    } catch (error) {
      console.error("Failed to save deck:", error)
      setErrorMessage("Failed to save deck. Please try again.")
      SoundManager.playError()
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDeck = async () => {
    const trimmedName = newDeckName.trim()
    if (!trimmedName) return

    setCreatingDeck(true)
    try {
      setErrorMessage(null)
      const newDeck = await createDeck(trimmedName, [])
      const userDeck: UserDeck = {
        id: newDeck.id,
        name: newDeck.name,
        cardIds: toFrontendCardIds(newDeck.card_ids),
      }
      const nextDecks = [...decks, userDeck]
      setDecks(nextDecks)
      setNewDeckName("")
      setShowNewDeckModal(false)
      selectDeck(userDeck.id, nextDecks)
      onDecksUpdated?.()
      SoundManager.playSuccess()
    } catch (error) {
      console.error("Failed to create deck:", error)
      setErrorMessage("Failed to create deck. Please try again.")
      SoundManager.playError()
    } finally {
      setCreatingDeck(false)
    }
  }

  const handleDeleteDeck = async (deckId: number) => {
    if (decks.length <= 1) {
      setErrorMessage("You must keep at least one deck.")
      SoundManager.playError()
      return
    }

    try {
      setErrorMessage(null)
      const remainingDecks = decks.filter((d) => d.id !== deckId)
      await deleteDeck(deckId)
      setDecks(remainingDecks)

      if (deckId === currentDeckId) {
        if (remainingDecks.length > 0) {
          selectDeck(remainingDecks[0].id, remainingDecks)
        }
      }
      onDecksUpdated?.()
      SoundManager.playDelete()
    } catch (error) {
      console.error("Failed to delete deck:", error)
      setErrorMessage("Failed to delete deck. Please try again.")
      SoundManager.playError()
    }
  }

  const handleClearDeck = () => {
    SoundManager.playClick()
    setDeck([])
  }

  const deckCards = deck.map((id) => ALL_CARDS.find((c) => c.id === id)).filter((c): c is GameCard => !!c)
  const availableCards = ALL_CARDS.filter((c) => !deck.includes(c.id))

  const handleDragStart = useCallback((e: React.DragEvent, card: GameCard) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("cardId", card.id)
    setDragCard(card)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragCard(null)
    setDragOver(false)
  }, [])

  const handleDeckDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOver(true)
  }, [])

  const handleDeckDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleDropIntoDeck = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const cardId = e.dataTransfer.getData("cardId")
      if (!cardId) return
      if (deck.includes(cardId)) return
      if (deck.length >= MAX_DECK_SIZE) {
        SoundManager.playError()
        return
      }
      SoundManager.playClick()
      const next = [...deck, cardId]
      setDeck(next)
    },
    [deck],
  )

  const handleClickAdd = useCallback(
    (card: GameCard) => {
      if (deck.includes(card.id)) {
        SoundManager.playError()
        return
      }
      if (deck.length >= MAX_DECK_SIZE) {
        SoundManager.playError()
        return
      }
      SoundManager.playClick()
      const next = [...deck, card.id]
      setDeck(next)
    },
    [deck],
  )

  const handleRemoveFromDeck = useCallback(
    (cardId: string) => {
      SoundManager.playClick()
      const next = deck.filter((id) => id !== cardId)
      setDeck(next)
    },
    [deck],
  )

  const handleSelectCard = useCallback((card: GameCard) => {
    SoundManager.playHover()
    setSelectedCard((prev) => (prev?.id === card.id ? null : card))
  }, [])

  const handleBack = async () => {
    SoundManager.playClick()
    const saved = await saveCurrentDeck()
    if (saved) {
      onDecksUpdated?.()
      onBack()
    }
  }

  const slotsRemaining = MAX_DECK_SIZE - deck.length

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#050508]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" />
          <div className="text-[#d4a853] font-mono text-sm tracking-widest uppercase animate-pulse">
            Loading Decks...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="slide-in-right flex flex-col gap-4 w-full max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="ark-card scanlines flex">
        <div className="p-4 border-b border-white/10 md:flex items-center justify-around w-full">
          <div className="flex items-center gap-4 m-2">
            <button
              onClick={handleBack}
              onMouseEnter={() => SoundManager.playHover()}
              className="ark-button p-2"
              aria-label="Back to main menu"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="font-heading text-base tracking-wider text-white/90">DECK CONSTRUCTOR</div>
              <div className="font-serif italic text-xs text-white/40">
                Build your tactical loadout
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 m-2">
            <select
              value={currentDeckId || ""}
              onChange={(e) => selectDeck(Number(e.target.value))}
              onMouseEnter={() => SoundManager.playHover()}
              className="bg-black/30 border border-white/20 px-4 py-2 text-sm text-white font-heading tracking-wider focus:outline-none focus:border-[#d4a853]/50 cursor-pointer min-w-[200px]"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#050508]">
                  {d.name} ({d.cardIds.length}/{MAX_DECK_SIZE})
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewDeckModal(true)}
              onMouseEnter={() => SoundManager.playHover()}
              className="ark-button p-2"
              title="Create new deck"
              aria-label="Create new deck"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearDeck}
              onMouseEnter={() => SoundManager.playHover()}
              className="ark-button p-2"
              title="Clear deck"
              aria-label="Clear deck"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={saveCurrentDeck}
              onMouseEnter={() => SoundManager.playHover()}
              disabled={saving}
              className="ark-button px-4 py-2 text-sm font-heading tracking-wider disabled:opacity-50"
            >
              {saving ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="ark-button ark-button-danger p-3 text-center text-sm">
          {errorMessage}
        </div>
      )}

      {/* Main content - two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column - Current Deck */}
        <div className="ark-card scanlines overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="font-heading text-sm tracking-wider text-white/90">CURRENT DECK</div>
              <div className={`font-mono text-xs ${deck.length < MIN_DECK_SIZE ? "text-red-400" : "text-[#d4a853]"}`}>
                {deck.length}/{MAX_DECK_SIZE} (min: {MIN_DECK_SIZE})
              </div>
            </div>
            <button
              onClick={() => {
                const currentDeck = decks.find((d) => d.id === currentDeckId)
                if (currentDeck && decks.length > 1) {
                  handleDeleteDeck(currentDeckId!)
                }
              }}
              onMouseEnter={() => SoundManager.playHover()}
              disabled={decks.length <= 1}
              className="ark-button p-2 disabled:opacity-50"
              title="Delete deck"
              aria-label="Delete current deck"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div
            onDragOver={handleDeckDragOver}
            onDragLeave={handleDeckDragLeave}
            onDrop={handleDropIntoDeck}
            className={`
              p-4 min-h-[300px] transition-colors
              ${dragOver ? "bg-[#d4a853]/10" : ""}
            `}
          >
            {deck.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-white/20">
                <div className="w-12 h-12 mb-3 opacity-20">
                  <Database className="w-full h-full" />
                </div>
                <span className="font-serif italic text-sm text-white/30">
                  {dragOver ? "Release to add card" : "Drag cards here or click to add"}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {deckCards.map((card) => (
                  <div key={card.id} className="relative group">
                    <CompactCardTile
                      card={card}
                      inDeck
                      dragging={dragCard?.id === card.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onClick={handleSelectCard}
                      onRemove={handleRemoveFromDeck}
                    />
                  </div>
                ))}
                {slotsRemaining > 0 &&
                  Array.from({ length: slotsRemaining }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="aspect-square border-2 border-dashed border-white/10 flex items-center justify-center opacity-30"
                    >
                      <Plus className="w-6 h-6 text-white/40" />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Card Details & Available Cards */}
        <div className="flex flex-col gap-4">
          {/* Card Detail Panel */}
          {selectedCard ? (
            <div className="ark-card scanlines overflow-hidden">
              <div className="p-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center ark-floppy bg-white/5">
                  {getCardIcon(selectedCard.iconType, "w-8 h-8 text-white/70")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-heading text-base tracking-wider text-white/90">{selectedCard.name}</span>
                    <span className="flex items-center gap-1 font-mono text-xs text-yellow-400">
                      <Zap className="w-3 h-3" />{selectedCard.energyCost}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{selectedCard.description}</p>
                  <div className="mt-3 flex gap-2">
                    {!deck.includes(selectedCard.id) && deck.length < MAX_DECK_SIZE && (
                      <button
                        onClick={() => handleClickAdd(selectedCard)}
                        onMouseEnter={() => SoundManager.playHover()}
                        className="ark-button px-3 py-1.5 text-xs font-heading tracking-wider"
                      >
                        ADD TO DECK
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="ark-button p-2 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="ark-card scanlines overflow-hidden">
              <div className="p-4 flex items-center justify-center h-24">
                <span className="font-serif italic text-sm text-white/30">Select a card to view details</span>
              </div>
            </div>
          )}

          {/* Available Cards */}
          <div className="ark-card scanlines overflow-hidden flex-1">
            <div className="p-4 border-b border-white/10">
              <span className="font-heading text-sm tracking-wider text-white/60 uppercase">
                Available Cards ({availableCards.length})
              </span>
            </div>
            <div className="p-4">
              {availableCards.length === 0 ? (
                <div className="text-center py-8">
                  <span className="font-serif italic text-sm text-white/30">All cards equipped</span>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {availableCards.map((card) => (
                    <CompactCardTile
                      key={card.id}
                      card={card}
                      inDeck={false}
                      dragging={dragCard?.id === card.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onClick={handleSelectCard}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New deck modal */}
      {showNewDeckModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="ark-card scanlines overflow-hidden w-full max-w-md mx-4">
            <div className="p-6">
              <div className="font-heading text-lg tracking-wider text-white/90 mb-4">NEW DECK</div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Enter deck name..."
                  className="flex-1 bg-black/30 border border-white/20 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#d4a853]/50"
                  maxLength={50}
                  autoFocus
                />
                <button
                  onClick={handleCreateDeck}
                  onMouseEnter={() => SoundManager.playHover()}
                  disabled={!newDeckName.trim() || creatingDeck}
                  className="ark-button px-6 py-3 text-sm font-heading tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingDeck ? "CREATING..." : "CREATE"}
                </button>
                <button
                  onClick={() => {
                    setShowNewDeckModal(false)
                    setNewDeckName("")
                  }}
                  onMouseEnter={() => SoundManager.playHover()}
                  className="ark-button px-6 py-3 text-sm font-heading tracking-wider"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
