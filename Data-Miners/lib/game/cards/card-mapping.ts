import axios from "@/lib/axios"
import { ALL_CARDS, type GameCard, getCardById } from "./card-types"
import type { Card, Deck, CreateDeckRequest, UpdateDeckRequest, UserCard } from "@/lib/api-types"

// Dynamic mapping between frontend card IDs and backend card IDs
// Built by fetching cards from the backend and matching by name
let FRONTEND_TO_BACKEND: Record<string, number> = {}
let BACKEND_TO_FRONTEND: Record<number, string> = {}
let MAPPING_INITIALIZED = false

// Store unlocked card IDs (backend IDs)
let UNLOCKED_CARD_IDS: Set<number> = new Set()
let UNLOCKED_CARDS_INITIALIZED = false

// Initialize the mapping by fetching cards from the backend
export async function initializeCardMapping(force = false): Promise<void> {
  if (MAPPING_INITIALIZED && !force) {
    return
  }

  try {
    const response = await axios.get<Card[]>("/api/cards")
    const backendCards: Card[] = response.data

    // Build mapping by matching card names.
    FRONTEND_TO_BACKEND = {}
    BACKEND_TO_FRONTEND = {}

    for (const backendCard of backendCards) {
      const frontendCard = ALL_CARDS.find(
        (fc) => fc.name === backendCard.name
      )

      if (frontendCard) {
        FRONTEND_TO_BACKEND[frontendCard.id] = backendCard.id
        BACKEND_TO_FRONTEND[backendCard.id] = frontendCard.id
        // Keep backendId for existing card consumers while maps handle repeated lookups.
        frontendCard.backendId = backendCard.id
      } else if (process.env.NODE_ENV === "development") {
        console.warn(`[CardMapping] No frontend card found for backend card: ${backendCard.name}`)
      }
    }

    // Check for missing mappings
    for (const frontendCard of ALL_CARDS) {
      if (!FRONTEND_TO_BACKEND[frontendCard.id] && process.env.NODE_ENV === "development") {
        console.warn(`[CardMapping] No backend card found for frontend card: ${frontendCard.name}`)
      }
    }

    MAPPING_INITIALIZED = true
  } catch (error) {
    console.error("[CardMapping] Failed to initialize card mapping:", error)
    MAPPING_INITIALIZED = false
    throw error
  }
}

// Convert frontend card IDs to backend card IDs
export function toBackendCardIds(frontendIds: string[]): number[] {
  const result = frontendIds
    .map((id) => FRONTEND_TO_BACKEND[id] ?? getCardById(id)?.backendId)
    .filter((id): id is number => id !== undefined)
  
  if (result.length !== frontendIds.length && process.env.NODE_ENV === "development") {
    console.warn("[CardMapping] Some card IDs could not be mapped to backend IDs")
  }
  
  return result
}

// Convert backend card IDs to frontend card IDs
export function toFrontendCardIds(backendIds: number[]): string[] {
  const result = backendIds
    .map((id) => BACKEND_TO_FRONTEND[id])
    .filter((id): id is string => id !== undefined)
  
  if (result.length !== backendIds.length && process.env.NODE_ENV === "development") {
    console.warn("[CardMapping] Some card IDs could not be mapped to frontend IDs")
  }
  
  return result
}

// Get backend card ID for a frontend card
export function getBackendCardId(frontendId: string): number | undefined {
  return FRONTEND_TO_BACKEND[frontendId] ?? getCardById(frontendId)?.backendId
}

// Get frontend card ID for a backend card
export function getFrontendCardId(backendId: number): string | undefined {
  return BACKEND_TO_FRONTEND[backendId]
}

// Initialize unlocked cards by fetching from the profile API
export async function initializeUnlockedCards(force = false): Promise<void> {
  if (UNLOCKED_CARDS_INITIALIZED && !force) {
    return
  }

  try {
    const response = await axios.get<{ cards: UserCard[] }>("/api/profile")
    const userCards: UserCard[] = response.data.cards

    UNLOCKED_CARD_IDS = new Set()
    for (const userCard of userCards) {
      if (userCard.unlocked) {
        UNLOCKED_CARD_IDS.add(userCard.id)
      }
    }

    UNLOCKED_CARDS_INITIALIZED = true
  } catch (error) {
    console.error("[CardMapping] Failed to initialize unlocked cards:", error)
    UNLOCKED_CARDS_INITIALIZED = false
    throw error
  }
}

// Check if a card is unlocked by its backend ID
export function isCardUnlocked(backendId: number): boolean {
  return UNLOCKED_CARD_IDS.has(backendId)
}

// Check if a card is unlocked by its frontend ID
export function isFrontendCardUnlocked(frontendId: string): boolean {
  const backendId = FRONTEND_TO_BACKEND[frontendId] ?? getCardById(frontendId)?.backendId
  return backendId !== undefined && UNLOCKED_CARD_IDS.has(backendId)
}

// Get all unlocked frontend card IDs
export function getUnlockedFrontendCardIds(): string[] {
  return ALL_CARDS
    .filter((card) => {
      const backendId = FRONTEND_TO_BACKEND[card.id] ?? card.backendId
      return backendId !== undefined && UNLOCKED_CARD_IDS.has(backendId)
    })
    .map((card) => card.id)
}

// Get all unlocked GameCard objects
export function getUnlockedCards(): GameCard[] {
  return ALL_CARDS.filter((card) => {
    const backendId = FRONTEND_TO_BACKEND[card.id] ?? card.backendId
    return backendId !== undefined && UNLOCKED_CARD_IDS.has(backendId)
  })
}

// Deck API functions
export async function fetchDecks(): Promise<Deck[]> {
  const response = await axios.get<Deck[]>("/api/decks")
  return response.data
}

export async function createDeck(name: string, cardIds: string[]): Promise<Deck> {
  const backendCardIds = toBackendCardIds(cardIds)
  const response = await axios.post<Deck>("/api/decks", {
    name,
    card_ids: backendCardIds,
  } as CreateDeckRequest)
  return response.data
}

export async function updateDeck(deckId: number, name: string, cardIds: string[]): Promise<Deck> {
  const backendCardIds = toBackendCardIds(cardIds)
  const response = await axios.put<Deck>(`/api/decks/${deckId}`, {
    name,
    card_ids: backendCardIds,
  } as UpdateDeckRequest)
  return response.data
}

export async function deleteDeck(deckId: number): Promise<void> {
  await axios.delete<void>(`/api/decks/${deckId}`)
}
