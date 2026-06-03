import type { TerrainType } from "../types"
import type { TileDefinition, TileStats } from "./tile-definition"
import { cloneTileStats } from "./tile-definition"
import { GameRegistry } from "../registry"
import { GrassTile } from "./grass"
import { RockTile } from "./rock"
import { WaterTile } from "./water"
import { SandTile } from "./sand"

export interface TileUpgrade {
  tileId: TerrainType
  statModifiers: Partial<TileStats>
}

class TileRegistryClass extends GameRegistry<TerrainType, TileDefinition> {
  constructor() {
    super("tileRegistryUpdate")
    this.registerTile(GrassTile)
    this.registerTile(RockTile)
    this.registerTile(WaterTile)
    this.registerTile(SandTile)
  }

  protected cloneItem(tile: TileDefinition): TileDefinition {
    return {
      ...tile,
      stats: cloneTileStats(tile.baseStats),
    }
  }

  registerTile(tile: TileDefinition): void {
    this.register(tile, tile.id)
  }

  getTile(id: TerrainType): TileDefinition | undefined {
    return this.get(id)
  }

  getAllTiles(): TileDefinition[] {
    return this.getAll()
  }

  getBuildableTiles(): TileDefinition[] {
    return this.getAllTiles().filter((tile) => tile.stats.buildable)
  }

  applyUpgrade(upgrade: TileUpgrade) {
    const tile = this.get(upgrade.tileId)
    if (!tile) return

    for (const key of Object.keys(upgrade.statModifiers) as Array<keyof TileStats>) {
      const value = upgrade.statModifiers[key]
      if (value !== undefined) {
        this.setTileStat(tile, key, value)
      }
    }

    this.emitChange()
  }

  private setTileStat<K extends keyof TileStats>(tile: TileDefinition, key: K, value: TileStats[K]) {
    tile.stats[key] = value
  }

  resetTile(id: TerrainType) {
    const tile = this.get(id)
    if (!tile) return

    tile.stats = cloneTileStats(tile.baseStats)
    this.emitChange()
  }

  resetAll() {
    this.items.forEach((tile) => {
      tile.stats = cloneTileStats(tile.baseStats)
    })
    this.emitChange()
  }

  isBuildable(id: TerrainType): boolean {
    const tile = this.get(id)
    return tile?.stats.buildable ?? false
  }

  getVisuals(id: TerrainType): TileDefinition["visuals"] | undefined {
    return this.get(id)?.visuals
  }
}

export const TileRegistry = new TileRegistryClass()
