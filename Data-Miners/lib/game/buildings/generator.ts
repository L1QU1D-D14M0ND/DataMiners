import { createBuildingDefinition, type BuildingDefinition } from "./building-definition"

export const generatorDefinition: BuildingDefinition = createBuildingDefinition({
  id: "generator",
  name: "Hydro Generator",
  shortName: "HYDRO",
  description: "Harnesses water power to generate energy. Must be built on water.",
  category: "power",

  baseStats: {
    energyOutput: 15,
    energyConsumption: 0,
    efficiency: 1,
    connectionRange: 1,
    buildingMaterialsCost: 20,
    rawOreCost: 0,
    energyCost: 0,
    materialsProduction: 0,
    oreProduction: 0,
    dataUploadRate: 0,
    upkeepOre: 0,
    upkeepMaterials: 0,
    allowedTerrain: ["water"],
    requiredAdjacent: [],
    forbiddenAdjacent: [],
    level: 1,
    maxLevel: 5,
    size: 1,
  },

  visuals: {
    color: 0x00aaff,
    iconType: "circle",
    size: 20,
  },

  shortcut: "G",
  deletable: true,
  placeable: true,
})
