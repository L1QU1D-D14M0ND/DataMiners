import type { TechNode } from "./tech-node"

export const pylonRangeNode: TechNode = {
  id: "pylon_range_1",
  name: "Extended Relay",
  description: "Increase pylon connection range by 1 tile",
  icon: "antenna",
  category: "power",
  dataCost: 50,
  level: 0,
  maxLevel: 1,
  prerequisites: [],
  effects: [
    {
      type: "building_stat",
      buildingId: "pylon",
      statKey: "connectionRange",
      value: 1,
      isMultiplier: false,
    },
  ],
}

export const factoryEfficiencyNode: TechNode = {
  id: "factory_efficiency_1",
  name: "Efficient Smelting",
  description: "Reduce factory ore upkeep by 1",
  icon: "factory",
  category: "production",
  dataCost: 50,
  level: 0,
  maxLevel: 1,
  prerequisites: [],
  effects: [
    {
      type: "building_stat",
      buildingId: "factory",
      statKey: "upkeepOre",
      value: -1,
      isMultiplier: false,
    },
  ],
}

export const powerSourceRangeNode: TechNode = {
  id: "power_source_range_1",
  name: "Core Amplifier",
  description: "Increase power source connection range by 1 tile",
  icon: "zap",
  category: "power",
  dataCost: 50,
  level: 0,
  maxLevel: 1,
  prerequisites: [],
  effects: [
    {
      type: "building_stat",
      buildingId: "power_source",
      statKey: "connectionRange",
      value: 1,
      isMultiplier: false,
    },
  ],
}

export const drillRockBonusNode: TechNode = {
  id: "drill_rock_bonus_1",
  name: "Deep Mining",
  description: "Drills on rock produce 50% more ore",
  icon: "pickaxe",
  category: "production",
  dataCost: 50,
  level: 0,
  maxLevel: 1,
  prerequisites: [],
  effects: [
    {
      type: "global_modifier",
      modifierKey: "drillRockBonus",
      modifierValue: 0.5,
    },
  ],
}

export const storageCapacityNode: TechNode = {
  id: "storage_capacity_1",
  name: "Expanded Reserves",
  description: "Increase ore and material storage by 250",
  icon: "database",
  category: "storage",
  dataCost: 50,
  level: 0,
  maxLevel: 1,
  prerequisites: [],
  effects: [
    {
      type: "resource_cap",
      resourceKey: "maxRawOre",
      flatBonus: 250,
    },
    {
      type: "resource_cap",
      resourceKey: "maxBuildingMaterials",
      flatBonus: 250,
    },
  ],
}

export const buildTimeReductionNode: TechNode = {
  id: "build_time_reduction_1",
  name: "Rapid Assembly",
  description: "Reduce build time by 50% for all buildings",
  icon: "timer",
  category: "production",
  dataCost: 100,
  level: 0,
  maxLevel: 1,
  prerequisites: ["factory_efficiency_1"], // Requires a T1 node first
  effects: [
    {
      type: "global_modifier",
      modifierKey: "buildTimeMultiplier",
      modifierValue: 0.5, // 50% reduction means multiply by 0.5
    },
  ],
}

export const allTechNodes: TechNode[] = [
  pylonRangeNode,
  factoryEfficiencyNode,
  powerSourceRangeNode,
  drillRockBonusNode,
  storageCapacityNode,
  buildTimeReductionNode, // Added to list
]
