import type { TerrainType } from "../types"
import type { TileDefinition, TileStats } from "./tile-definition"
import { cloneTileStats } from "./tile-definition"
import { GrassTile } from "./grass"
import { RockTile } from "./rock"
import { WaterTile } from "./water"
import { SandTile } from "./sand"

export interface TileUpgrade {
  tileId: TerrainType
  statModifiers: Partial<TileStats>
}

class TileRegistryClass {
  private tiles: Map<TerrainType, TileDefinition> = new Map()
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.registerDefaultTiles()
  }

  private registerDefaultTiles() {
    this.register(GrassTile)
    this.register(RockTile)
    this.register(WaterTile)
    this.register(SandTile)
  }

  register(tile: TileDefinition) {
    // Create a copy to avoid mutation issues
    this.tiles.set(tile.id, {
      ...tile,
      stats: cloneTileStats(tile.baseStats),
    })
  }

  getTile(id: TerrainType): TileDefinition | undefined {
    return this.tiles.get(id)
  }

  getAllTiles(): TileDefinition[] {
    return Array.from(this.tiles.values())
  }

  getBuildableTiles(): TileDefinition[] {
    return this.getAllTiles().filter((tile) => tile.stats.buildable)
  }

  /**
   * Apply an upgrade to a tile type (affects all tiles of this type)
   */
  applyUpgrade(upgrade: TileUpgrade) {
    const tile = this.tiles.get(upgrade.tileId)
    if (!tile) return

    for (const key of Object.keys(upgrade.statModifiers) as Array<keyof TileStats>) {
      const value = upgrade.statModifiers[key]
      if (value !== undefined) {
        this.setTileStat(tile, key, value)
      }
    }

    this.notifyListeners()
  }

  private setTileStat<K extends keyof TileStats>(tile: TileDefinition, key: K, value: TileStats[K]) {
    tile.stats[key] = value
  }

  /**
   * Reset a tile type to its base stats
   */
  resetTile(id: TerrainType) {
    const tile = this.tiles.get(id)
    if (!tile) return

    tile.stats = cloneTileStats(tile.baseStats)
    this.notifyListeners()
  }

  /**
   * Reset all tiles to their base stats
   */
  resetAll() {
    this.tiles.forEach((tile) => {
      tile.stats = cloneTileStats(tile.baseStats)
    })
    this.notifyListeners()
  }

  /**
   * Check if a terrain type is buildable
   */
  isBuildable(id: TerrainType): boolean {
    const tile = this.tiles.get(id)
    return tile?.stats.buildable ?? false
  }

  /**
   * Get the visual properties for a terrain type
   */
  getVisuals(id: TerrainType): TileDefinition["visuals"] | undefined {
    return this.tiles.get(id)?.visuals
  }

  /**
   * Subscribe to tile changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener())
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tileRegistryUpdate"))
    }
  }
}

export const TileRegistry = new TileRegistryClass()
