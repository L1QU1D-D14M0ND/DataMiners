import { createTileDefinition, type TileDefinition } from "./tile-definition"

export const WaterTile: TileDefinition = createTileDefinition({
  id: "water",
  name: "Water",
  description: "Deep water that cannot be built on. Blocks construction and power lines.",

  baseStats: {
    buildable: false,
    movementCost: Number.POSITIVE_INFINITY,
    conductivity: 0,
    resourceGeneration: 0,
    resourceType: null,
  },

  visuals: {
    color: 0x1a4d7a,
    borderColor: 0x1a1a2e,
    borderAlpha: 0.5,
  },
})
