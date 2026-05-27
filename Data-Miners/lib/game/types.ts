export type TerrainType = "grass" | "rock" | "water" | "sand" | "monolith" | "uplink"

export type BuildingType = "generator" | "pylon" | "factory" | "power_source" | "drill" | "monolith" | "uplink"

export interface TileData {
  x: number
  y: number
  terrainType: TerrainType
  building: BuildingType | null
  isPowered: boolean
  buildable: boolean
}

export interface Building {
  id: string
  type: BuildingType
  tileX: number
  tileY: number
  energyOutput: number
  energyConsumption: number
  isPowered: boolean
  isActive: boolean
  efficiency: number
  connectionRange: number
  materialsProduction: number
  size: number
  buildTime: number
  buildProgress: number
}

export interface EnergyFlow {
  generation: number
  consumption: number
  lineLoss: number
  netPower: number
}

export interface Resources {
  energy: number
  maxEnergy: number
  rawOre: number
  maxRawOre: number
  buildingMaterials: number
  maxBuildingMaterials: number
  dataUploaded: number
  maxDataUploaded: number
}

export interface GameState {
  tick: number
  resources: Resources
  energyFlow: EnergyFlow
  connectedBuildings: number
  buildings: Building[]
  materialsPerTick: number
  downloadSpeed: number
  gameWon: boolean
}

export type SelectedTool = BuildingType | "delete" | null

export interface GameSettings {
  volume: number
  soundEnabled: boolean
}

export interface PathNode {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: PathNode | null
}
