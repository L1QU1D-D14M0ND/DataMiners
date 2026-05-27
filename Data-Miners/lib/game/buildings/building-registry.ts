import type { BuildingDefinition, BuildingStats, NumericBuildingStatKey } from "./building-definition"
import { cloneStats } from "./building-definition"
import { powerSourceDefinition } from "./power-source"
import { generatorDefinition } from "./generator"
import { pylonDefinition } from "./pylon"
import { factoryDefinition } from "./factory" // Import factoryDefinition instead of consumerDefinition
import { drillDefinition } from "./drill"
import { alienMonolithDefinition } from "./alien-monolith"
import { uplinkDefinition } from "./uplink"

export type BuildingUpgrade = {
  statKey: NumericBuildingStatKey
  value: number
  isMultiplier?: boolean // If true, multiply instead of add
}

export type TechUpgrade = {
  id: string
  name: string
  description: string
  buildingId: string
  upgrades: BuildingUpgrade[]
  buildingMaterialsCost: number
  energyCost: number
  requiredLevel: number
}

/**
 * Central registry for all buildings
 * Supports runtime stat modifications via upgrades
 */
class BuildingRegistryClass {
  private buildings: Map<string, BuildingDefinition> = new Map()
  private appliedUpgrades: Set<string> = new Set()

  constructor() {
    this.registerBuilding(powerSourceDefinition)
    this.registerBuilding(generatorDefinition)
    this.registerBuilding(pylonDefinition)
    this.registerBuilding(factoryDefinition) // Register factoryDefinition instead of consumerDefinition
    this.registerBuilding(drillDefinition)
    this.registerBuilding(alienMonolithDefinition)
    this.registerBuilding(uplinkDefinition)
  }

  registerBuilding(definition: BuildingDefinition): void {
    // Create a deep copy to avoid mutation issues
    const copy: BuildingDefinition = {
      ...definition,
      baseStats: cloneStats(definition.baseStats),
      stats: cloneStats(definition.baseStats),
    }
    this.buildings.set(definition.id, copy)
  }

  getBuilding(id: string): BuildingDefinition | undefined {
    return this.buildings.get(id)
  }

  getAllBuildings(): BuildingDefinition[] {
    return Array.from(this.buildings.values())
  }

  getPlaceableBuildings(): BuildingDefinition[] {
    return this.getAllBuildings().filter((b) => b.placeable)
  }

  getBuildingsByCategory(category: BuildingDefinition["category"]): BuildingDefinition[] {
    return this.getAllBuildings().filter((b) => b.category === category)
  }

  /**
   * Apply an upgrade to a building's stats
   */
  applyUpgrade(upgrade: TechUpgrade): boolean {
    if (this.appliedUpgrades.has(upgrade.id)) {
      return false // Already applied
    }

    const building = this.buildings.get(upgrade.buildingId)
    if (!building) {
      return false
    }

    for (const u of upgrade.upgrades) {
      const currentValue = building.stats[u.statKey]
      building.stats[u.statKey] = u.isMultiplier ? currentValue * u.value : currentValue + u.value
    }

    // Increment level
    if (building.stats.level < building.stats.maxLevel) {
      building.stats.level++
    }

    this.appliedUpgrades.add(upgrade.id)
    this.emitChange()
    return true
  }

  /**
   * Reset a building's stats to base values
   */
  resetBuilding(buildingId: string): void {
    const building = this.buildings.get(buildingId)
    if (building) {
      building.stats = cloneStats(building.baseStats)
    }
  }

  /**
   * Reset all buildings to base values
   */
  resetAll(): void {
    for (const building of this.buildings.values()) {
      building.stats = cloneStats(building.baseStats)
    }
    this.appliedUpgrades.clear()
    this.emitChange()
  }

  /**
   * Check if an upgrade has been applied
   */
  hasUpgrade(upgradeId: string): boolean {
    return this.appliedUpgrades.has(upgradeId)
  }

  /**
   * Get current stat value for a building
   */
  getStat<K extends keyof BuildingStats>(buildingId: string, statKey: K): BuildingStats[K] | undefined {
    return this.buildings.get(buildingId)?.stats[statKey]
  }

  /**
   * Emit a change event for UI updates
   */
  private emitChange(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("buildingRegistryChange"))
    }
  }
}

// Singleton instance
export const BuildingRegistry = new BuildingRegistryClass()

// Helper to get building colors map (for backward compatibility)
export function getBuildingColors(): Record<string, number> {
  const colors: Record<string, number> = {}
  for (const building of BuildingRegistry.getAllBuildings()) {
    colors[building.id] = building.visuals.color
  }
  return colors
}

// Helper to get building costs map (for backward compatibility)
export function getBuildingCosts(): Record<string, number> {
  const costs: Record<string, number> = {}
  for (const building of BuildingRegistry.getAllBuildings()) {
    costs[building.id] = building.stats.buildingMaterialsCost
  }
  return costs
}
