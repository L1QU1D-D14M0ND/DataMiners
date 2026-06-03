import type { TerrainType } from "../types"
import { createDefinitionFactory } from "../registry"

/**
 * Base interface for all building definitions
 * All stats can be upgraded via the tech tree
 */
export interface BuildingStats {
  // Energy stats
  energyOutput: number
  energyConsumption: number
  efficiency: number

  // Connection stats
  connectionRange: number

  // Cost stats
  buildingMaterialsCost: number
  rawOreCost: number
  energyCost: number

  materialsProduction: number
  oreProduction: number
  dataUploadRate: number

  upkeepOre: number
  upkeepMaterials: number

  // Placement restrictions
  allowedTerrain: TerrainType[]
  requiredAdjacent: string[] // Building type IDs that must be adjacent
  forbiddenAdjacent: string[] // Building type IDs that cannot be adjacent

  // Upgrade level (for tech tree)
  level: number
  maxLevel: number

  size: number
}

export type NumericBuildingStatKey = {
  [K in keyof BuildingStats]: BuildingStats[K] extends number ? K : never
}[keyof BuildingStats]

export interface BuildingVisuals {
  color: number
  iconType: "lightning" | "circle" | "triangle" | "factory" | "drill" | "uplink" | "monolith" | "custom"
  size: number
}

export interface BuildingDefinition {
  id: string
  name: string
  shortName: string // For UI display
  description: string
  category: "power" | "transmission" | "consumer" | "special"

  // Base stats (can be modified by upgrades)
  baseStats: BuildingStats

  // Current stats (after upgrades applied)
  stats: BuildingStats

  // Visual representation
  visuals: BuildingVisuals

  // Keyboard shortcut
  shortcut: string | null

  // Whether this building can be deleted
  deletable: boolean

  // Whether this building can be placed by player
  placeable: boolean
}

/**
 * Creates a deep copy of building stats
 */
export function cloneStats(stats: BuildingStats): BuildingStats {
  return {
    ...stats,
    allowedTerrain: [...stats.allowedTerrain],
    requiredAdjacent: [...stats.requiredAdjacent],
    forbiddenAdjacent: [...stats.forbiddenAdjacent],
  }
}

/**
 * Creates a building definition with current stats initialized from base stats
 */
export const createBuildingDefinition = createDefinitionFactory<BuildingStats, BuildingDefinition>(cloneStats)
