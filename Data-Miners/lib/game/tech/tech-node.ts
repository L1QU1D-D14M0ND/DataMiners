import type { NumericBuildingStatKey } from "../buildings/building-definition"
import type { TerrainType } from "../types"

export interface TechNode {
  id: string
  name: string
  description: string
  icon: string
  category: "power" | "production" | "storage" | "special"

  // Cost in data to unlock
  dataCost: number

  // Current level and max
  level: number
  maxLevel: number

  // Prerequisites (other tech node IDs that must be unlocked first)
  prerequisites: string[]

  // What this tech modifies
  effects: TechEffect[]
}

export interface TechEffect {
  type: "building_stat" | "resource_cap" | "global_modifier" | "terrain_modifier"

  // For building_stat effects
  buildingId?: string
  statKey?: NumericBuildingStatKey
  value?: number
  isMultiplier?: boolean

  // For resource_cap effects
  resourceKey?: "maxEnergy" | "maxRawOre" | "maxBuildingMaterials" | "maxDataUploaded"
  flatBonus?: number

  // For global_modifier effects
  modifierKey?: string
  modifierValue?: number

  // For terrain_modifier effects
  terrainBuildingId?: string
  terrainType?: TerrainType
}

export function cloneTechNode(node: TechNode): TechNode {
  return {
    ...node,
    prerequisites: [...node.prerequisites],
    effects: node.effects.map((e) => ({ ...e })),
  }
}
