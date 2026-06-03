import type { TerrainType } from "../types"
import { createDefinitionFactory } from "../registry"

/**
 * Base interface for all tile definitions
 * Stats can be modified during gameplay
 */
export interface TileStats {
  // Movement and placement
  buildable: boolean
  movementCost: number // For future pathfinding (1 = normal, higher = slower)

  // Energy transmission
  conductivity: number // How well power lines work over this tile (0-1)

  // Resource generation (for future features)
  resourceGeneration: number
  resourceType: string | null
}

export interface TileVisuals {
  color: number
  borderColor: number
  borderAlpha: number
}

export interface TileDefinition {
  id: TerrainType
  name: string
  description: string

  // Base stats (immutable reference)
  baseStats: TileStats

  // Current stats (can be modified)
  stats: TileStats

  // Visual representation
  visuals: TileVisuals
}

/**
 * Creates a deep copy of tile stats
 */
export function cloneTileStats(stats: TileStats): TileStats {
  return { ...stats }
}

/**
 * Creates a tile definition with current stats initialized from base stats
 */
export const createTileDefinition = createDefinitionFactory<TileStats, TileDefinition>(cloneTileStats)
