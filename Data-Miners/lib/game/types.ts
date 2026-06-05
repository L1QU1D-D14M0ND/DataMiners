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
  elapsedSeconds: number
  totalEnergyGenerated: number
  gameWon: boolean
  opponentState?: OpponentState
}

export interface OpponentState {
  downloadSpeed: number
  energyGenerated: number
  updatedAt: string
}

export type MatchResultOutcome = "win" | "loss"

export interface MatchReward {
  experience: number
  credits: number
  rankScore: number
}

export interface MatchStats {
  timeElapsedSeconds: number
  energyGenerated: number
  downloadSpeed: number
}

export interface MatchResult {
  outcome: MatchResultOutcome
  playerStats: MatchStats
  rivalStats: MatchStats | null
  reward: MatchReward
}

export type SelectedTool = BuildingType | "delete" | null

export interface GameSettings {
  volume: number
  soundEnabled: boolean
  musicVolume: number
  musicEnabled: boolean
}

export interface PathNode {
  x: number
  y: number
  g: number
  h: number
  f: number
  parent: PathNode | null
}
