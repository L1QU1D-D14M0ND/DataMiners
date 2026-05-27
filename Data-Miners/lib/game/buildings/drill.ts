import { createBuildingDefinition, type BuildingDefinition } from "./building-definition"

export const drillDefinition: BuildingDefinition = createBuildingDefinition({
  id: "drill",
  name: "Ore Drill",
  shortName: "Drill",
  description: "Extracts raw ore from sand and rock deposits. Requires power to operate.",
  category: "consumer",

  baseStats: {
    energyOutput: 0,
    energyConsumption: 5,
    efficiency: 1.0,
    connectionRange: 1,
    buildingMaterialsCost: 12,
    rawOreCost: 0,
    energyCost: 0,
    materialsProduction: 0,
    oreProduction: 4,
    dataUploadRate: 0,
    upkeepOre: 0,
    upkeepMaterials: 0,
    allowedTerrain: ["sand", "rock"],
    requiredAdjacent: [],
    forbiddenAdjacent: [],
    level: 1,
    maxLevel: 5,
    size: 1,
  },

  visuals: {
    color: 0xb8860b,
    iconType: "drill",
    size: 24,
  },

  shortcut: "R",
  deletable: true,
  placeable: true,
})
