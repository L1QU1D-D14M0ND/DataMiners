import { createBuildingDefinition, type BuildingDefinition } from "./building-definition"

export const powerSourceDefinition: BuildingDefinition = createBuildingDefinition({
  id: "power_source",
  name: "Power Core",
  shortName: "CORE",
  description: "The central power source for your grid. Cannot be destroyed.",
  category: "power",

  baseStats: {
    energyOutput: 50,
    energyConsumption: 0,
    efficiency: 1,
    connectionRange: 1,
    buildingMaterialsCost: 0,
    rawOreCost: 0,
    energyCost: 0,
    materialsProduction: 0,
    oreProduction: 0,
    dataUploadRate: 0,
    upkeepOre: 0,
    upkeepMaterials: 0,
    allowedTerrain: ["grass"],
    requiredAdjacent: [],
    forbiddenAdjacent: [],
    level: 1,
    maxLevel: 5,
    size: 1,
  },

  visuals: {
    color: 0x00ff88,
    iconType: "lightning",
    size: 24,
  },

  shortcut: null,
  deletable: false,
  placeable: false,
})
