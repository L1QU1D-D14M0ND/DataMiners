import axios from "@/lib/axios"
import { ALL_CARDS, type GameCard, getCardById } from "./card-types"

export interface BackendDeck {
  id: number
  name: string
  card_ids: number[]
}

export interface BackendCard {
  id: number
  name: string
  experience_unlock: number | null
  credits_unlock: number | null
}

// Dynamic mapping between frontend card IDs and backend card IDs
// Built by fetching cards from the backend and matching by name
let FRONTEND_TO_BACKEND: Record<string, number> = {}
let BACKEND_TO_FRONTEND: Record<number, string> = {}
let MAPPING_INITIALIZED = false

// Initialize the mapping by fetching cards from the backend
export async function initializeCardMapping(force = false): Promise<void> {
  if (MAPPING_INITIALIZED && !force) {
    return
  }

  try {
    const response = await axios.get("/api/cards")
    const backendCards: BackendCard[] = response.data

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

// Deck API functions
export async function fetchDecks(): Promise<BackendDeck[]> {
  const response = await axios.get("/api/decks")
  return response.data
}

export async function createDeck(name: string, cardIds: string[]): Promise<BackendDeck> {
  const backendCardIds = toBackendCardIds(cardIds)
  const response = await axios.post("/api/decks", {
    name,
    card_ids: backendCardIds,
  })
  return response.data
}

export async function updateDeck(deckId: number, name: string, cardIds: string[]): Promise<BackendDeck> {
  const backendCardIds = toBackendCardIds(cardIds)
  const response = await axios.put(`/api/decks/${deckId}`, {
    name,
    card_ids: backendCardIds,
  })
  return response.data
}

export async function deleteDeck(deckId: number): Promise<void> {
  await axios.delete(`/api/decks/${deckId}`)
}
