// Building definitions
export { powerSourceDefinition } from "./power-source"
export { generatorDefinition } from "./generator"
export { pylonDefinition } from "./pylon"
export { factoryDefinition } from "./factory"
export { drillDefinition } from "./drill"
export { alienMonolithDefinition } from "./alien-monolith"
export { uplinkDefinition } from "./uplink"

// Core types and utilities
export type { BuildingDefinition, BuildingStats, BuildingVisuals } from "./building-definition"
export { cloneStats, createBuildingDefinition } from "./building-definition"

// Registry
export { BuildingRegistry, getBuildingColors, getBuildingCosts } from "./building-registry"
export type { BuildingUpgrade, TechUpgrade } from "./building-registry"
