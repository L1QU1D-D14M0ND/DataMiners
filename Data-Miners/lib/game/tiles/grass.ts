import { createTileDefinition, type TileDefinition } from "./tile-definition"

export const GrassTile: TileDefinition = createTileDefinition({
  id: "grass",
  name: "Grassland",
  description: "Fertile land suitable for building. Standard terrain with no bonuses or penalties.",

  baseStats: {
    buildable: true,
    movementCost: 1,
    conductivity: 1,
    resourceGeneration: 0,
    resourceType: null,
  },

  visuals: {
    color: 0x2d5a27,
    borderColor: 0x1a1a2e,
    borderAlpha: 0.5,
  },
})
