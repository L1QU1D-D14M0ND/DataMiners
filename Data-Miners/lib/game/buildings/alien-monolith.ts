import { createBuildingDefinition, type BuildingDefinition } from "./building-definition"

export const alienMonolithDefinition: BuildingDefinition = createBuildingDefinition({
  id: "monolith",
  name: "Alien Monolith",
  shortName: "MONOLITH",
  description:
    "A mysterious alien structure of unknown origin. Contains valuable data that can be uploaded via uplinks.",
  category: "special",

  baseStats: {
    energyOutput: 0,
    energyConsumption: 0,
    efficiency: 1,
    connectionRange: 0,
    buildingMaterialsCost: 0,
    rawOreCost: 0,
    energyCost: 0,
    materialsProduction: 0,
    oreProduction: 0,
    dataUploadRate: 0,
    upkeepOre: 0,
    upkeepMaterials: 0,
    allowedTerrain: ["grass", "rock", "sand"],
    requiredAdjacent: [],
    forbiddenAdjacent: [],
    level: 1,
    maxLevel: 1,
    size: 2,
  },

  visuals: {
    color: 0x8b00ff,
    iconType: "monolith",
    size: 56,
  },

  shortcut: null,
  deletable: false,
  placeable: false,
})
