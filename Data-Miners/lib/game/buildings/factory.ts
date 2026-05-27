import { createBuildingDefinition, type BuildingDefinition } from "./building-definition"

export const factoryDefinition: BuildingDefinition = createBuildingDefinition({
  id: "factory",
  name: "Factory",
  shortName: "FAC",
  description: "Converts raw ore into building materials when powered.",
  category: "consumer",

  baseStats: {
    energyOutput: 0,
    energyConsumption: 8,
    efficiency: 1,
    connectionRange: 1,
    buildingMaterialsCost: 15,
    rawOreCost: 0,
    energyCost: 0,
    materialsProduction: 5,
    oreProduction: 0,
    dataUploadRate: 0,
    upkeepOre: 10,
    upkeepMaterials: 0,
    allowedTerrain: ["grass"],
    requiredAdjacent: [],
    forbiddenAdjacent: [],
    level: 1,
    maxLevel: 5,
    size: 1,
  },

  visuals: {
    color: 0xff6644,
    iconType: "factory",
    size: 20,
  },

  shortcut: "F",
  deletable: true,
  placeable: true,
})
