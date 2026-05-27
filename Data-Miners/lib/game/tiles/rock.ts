import { createTileDefinition, type TileDefinition } from "./tile-definition"

export const RockTile: TileDefinition = createTileDefinition({
  id: "rock",
  name: "Rocky Terrain",
  description: "Hard rocky ground. Buildable but may provide mineral resources in the future.",

  baseStats: {
    buildable: true,
    movementCost: 1.5,
    conductivity: 0.9,
    resourceGeneration: 0,
    resourceType: "iron",
  },

  visuals: {
    color: 0x4a4a4a,
    borderColor: 0x1a1a2e,
    borderAlpha: 0.5,
  },
})
