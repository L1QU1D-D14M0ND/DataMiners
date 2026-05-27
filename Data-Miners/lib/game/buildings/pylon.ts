import { createBuildingDefinition, type BuildingDefinition } from "./building-definition"

export const pylonDefinition: BuildingDefinition = createBuildingDefinition({
  id: "pylon",
  name: "Transmission Pylon",
  shortName: "PYL",
  description: "Extends your power network with increased connection range.",
  category: "transmission",

  baseStats: {
    energyOutput: 0,
    energyConsumption: 1,
    efficiency: 1,
    connectionRange: 2,
    buildingMaterialsCost: 8,
    rawOreCost: 0,
    energyCost: 0,
    materialsProduction: 0,
    oreProduction: 0,
    dataUploadRate: 0,
    upkeepOre: 0,
    upkeepMaterials: 0,
    allowedTerrain: ["grass", "sand"],
    requiredAdjacent: [],
    forbiddenAdjacent: [],
    level: 1,
    maxLevel: 5,
    size: 1,
  },

  visuals: {
    color: 0x4488ff,
    iconType: "triangle",
    size: 20,
  },

  shortcut: "P",
  deletable: true,
  placeable: true,
})
