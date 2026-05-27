import { createTileDefinition, type TileDefinition } from "./tile-definition"

export const SandTile: TileDefinition = createTileDefinition({
  id: "sand",
  name: "Sandy Ground",
  description: "Loose sandy terrain. Buildable but with slightly reduced power conductivity.",

  baseStats: {
    buildable: true,
    movementCost: 1.2,
    conductivity: 0.8,
    resourceGeneration: 0,
    resourceType: null,
  },

  visuals: {
    color: 0x8b7355,
    borderColor: 0x1a1a2e,
    borderAlpha: 0.5,
  },
})
