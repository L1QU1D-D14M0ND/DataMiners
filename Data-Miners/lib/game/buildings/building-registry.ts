import type { BuildingDefinition, BuildingStats, NumericBuildingStatKey } from "./building-definition"
import { cloneStats } from "./building-definition"
import { GameRegistry } from "../registry"
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
class BuildingRegistryClass extends GameRegistry<string, BuildingDefinition> {
  private appliedUpgrades: Set<string> = new Set()

  constructor() {
    super("buildingRegistryChange")
    this.registerBuilding(powerSourceDefinition)
    this.registerBuilding(generatorDefinition)
    this.registerBuilding(pylonDefinition)
    this.registerBuilding(factoryDefinition)
    this.registerBuilding(drillDefinition)
    this.registerBuilding(alienMonolithDefinition)
    this.registerBuilding(uplinkDefinition)
  }

  protected cloneItem(definition: BuildingDefinition): BuildingDefinition {
    return {
      ...definition,
      baseStats: cloneStats(definition.baseStats),
      stats: cloneStats(definition.baseStats),
    }
  }

  registerBuilding(definition: BuildingDefinition): void {
    this.register(definition, definition.id)
  }

  getBuilding(id: string): BuildingDefinition | undefined {
    return this.get(id)
  }

  getAllBuildings(): BuildingDefinition[] {
    return this.getAll()
  }

  getPlaceableBuildings(): BuildingDefinition[] {
    return this.getAllBuildings().filter((b) => b.placeable)
  }

  getBuildingsByCategory(category: BuildingDefinition["category"]): BuildingDefinition[] {
    return this.getAllBuildings().filter((b) => b.category === category)
  }

  applyUpgrade(upgrade: TechUpgrade): boolean {
    if (this.appliedUpgrades.has(upgrade.id)) {
      return false
    }

    const building = this.get(upgrade.buildingId)
    if (!building) {
      return false
    }

    for (const u of upgrade.upgrades) {
      const currentValue = building.stats[u.statKey]
      building.stats[u.statKey] = u.isMultiplier ? currentValue * u.value : currentValue + u.value
    }

    if (building.stats.level < building.stats.maxLevel) {
      building.stats.level++
    }

    this.appliedUpgrades.add(upgrade.id)
    this.emitChange()
    return true
  }

  resetBuilding(buildingId: string): void {
    const building = this.get(buildingId)
    if (building) {
      building.stats = cloneStats(building.baseStats)
    }
  }

  resetAll(): void {
    for (const building of this.items.values()) {
      building.stats = cloneStats(building.baseStats)
    }
    this.appliedUpgrades.clear()
    this.emitChange()
  }

  hasUpgrade(upgradeId: string): boolean {
    return this.appliedUpgrades.has(upgradeId)
  }

  getStat<K extends keyof BuildingStats>(buildingId: string, statKey: K): BuildingStats[K] | undefined {
    return this.get(buildingId)?.stats[statKey]
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
