import { createBuildingDefinition, type BuildingDefinition } from "./building-definition"

export const uplinkDefinition: BuildingDefinition = createBuildingDefinition({
  id: "uplink",
  name: "Data Uplink",
  shortName: "UPLINK",
  description: "Uploads data from an adjacent Alien Monolith. Consumes significant power.",
  category: "special",

  baseStats: {
    energyOutput: 0,
    energyConsumption: 25,
    efficiency: 1,
    connectionRange: 1,
    buildingMaterialsCost: 30,
    rawOreCost: 0,
    energyCost: 0,
    materialsProduction: 0,
    oreProduction: 0,
    dataUploadRate: 2,
    upkeepOre: 0,
    upkeepMaterials: 0,
    allowedTerrain: ["grass", "rock", "sand"],
    requiredAdjacent: ["monolith"],
    forbiddenAdjacent: [],
    level: 1,
    maxLevel: 5,
    size: 1,
  },

  visuals: {
    color: 0x00ffff,
    iconType: "uplink",
    size: 24,
  },

  shortcut: "U",
  deletable: true,
  placeable: true,
})
