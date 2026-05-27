export interface GameCard {
  id: string
  backendId?: number
  name: string
  shortName: string
  description: string
  iconType: string
  energyCost: number
  effect: string
}

// 20 game cards
export const ALL_CARDS: GameCard[] = [
  {
    id: "card_surge",
    name: "Power Surge",
    shortName: "SURGE",
    description: "Doubles energy output of all generators for 3 ticks.",
    iconType: "lightning",
    energyCost: 2,
    effect: "generator_output_x2_3t",
  },
  {
    id: "card_relay",
    name: "Signal Relay",
    shortName: "RELAY",
    description: "Extends pylon connection range by 2 tiles for 5 ticks.",
    iconType: "antenna",
    energyCost: 1,
    effect: "pylon_range_+2_5t",
  },
  {
    id: "card_overdrive",
    name: "Factory Overdrive",
    shortName: "OVRDRV",
    description: "Factory produces double materials for 4 ticks.",
    iconType: "factory",
    energyCost: 3,
    effect: "factory_output_x2_4t",
  },
  {
    id: "card_cache",
    name: "Data Cache",
    shortName: "CACHE",
    description: "Instantly uploads 50 units of data.",
    iconType: "database",
    energyCost: 4,
    effect: "data_+50",
  },
  {
    id: "card_reinforce",
    name: "Reinforced Grid",
    shortName: "REINF",
    description: "Halves energy loss from line losses for 6 ticks.",
    iconType: "shield",
    energyCost: 2,
    effect: "line_loss_x0.5_6t",
  },
  {
    id: "card_harvest",
    name: "Ore Harvest",
    shortName: "HARV",
    description: "All drills produce triple ore for 3 ticks.",
    iconType: "drill",
    energyCost: 3,
    effect: "drill_output_x3_3t",
  },
  {
    id: "card_uplink",
    name: "Deep Uplink",
    shortName: "UPLNK",
    description: "Activates all offline uplink nodes for 5 ticks.",
    iconType: "uplink",
    energyCost: 5,
    effect: "uplinks_force_active_5t",
  },
  {
    id: "card_cooldown",
    name: "System Cooldown",
    shortName: "COOL",
    description: "Reduces all build timers by 3 ticks immediately.",
    iconType: "clock",
    energyCost: 6,
    effect: "build_timer_-3",
  },
  {
    id: "card_quantum",
    name: "Quantum Processor",
    shortName: "QUANT",
    description: "Boosts processing speed by 50% for 4 ticks.",
    iconType: "cpu",
    energyCost: 4,
    effect: "processing_speed_x1.5_4t",
  },
  {
    id: "card_neural",
    name: "Neural Network",
    shortName: "NEURAL",
    description: "Auto-optimizes grid connections for 5 ticks.",
    iconType: "network",
    energyCost: 3,
    effect: "auto_optimize_5t",
  },
  {
    id: "card_cyber",
    name: "Cyber Shield",
    shortName: "SHIELD",
    description: "Blocks all cyber attacks for 3 ticks.",
    iconType: "shield",
    energyCost: 5,
    effect: "block_attacks_3t",
  },
  {
    id: "card_energy",
    name: "Energy Core",
    shortName: "CORE",
    description: "Generates 100 energy instantly.",
    iconType: "battery",
    energyCost: 0,
    effect: "energy_+100",
  },
  {
    id: "card_drone",
    name: "Mining Drone",
    shortName: "DRONE",
    description: "Deploys drone to mine 200 ore instantly.",
    iconType: "drone",
    energyCost: 4,
    effect: "ore_+200",
  },
  {
    id: "card_stream",
    name: "Data Stream",
    shortName: "STREAM",
    description: "Uploads 100 data instantly.",
    iconType: "upload",
    energyCost: 5,
    effect: "data_+100",
  },
  {
    id: "card_firewall",
    name: "Firewall Breach",
    shortName: "BREACH",
    description: "Disables enemy defenses for 4 ticks.",
    iconType: "lock",
    energyCost: 6,
    effect: "disable_defenses_4t",
  },
  {
    id: "card_resource",
    name: "Resource Cache",
    shortName: "CACHE",
    description: "Stores 50 of each resource for later use.",
    iconType: "box",
    energyCost: 3,
    effect: "store_resources_50",
  },
  {
    id: "card_tech",
    name: "Tech Upgrade",
    shortName: "UPGRADE",
    description: "Upgrades all buildings by 1 level instantly.",
    iconType: "arrow-up",
    energyCost: 8,
    effect: "upgrade_all_+1",
  },
  {
    id: "card_network",
    name: "Network Boost",
    shortName: "BOOST",
    description: "Increases data transfer rate by 100% for 5 ticks.",
    iconType: "signal",
    energyCost: 4,
    effect: "data_rate_x2_5t",
  },
  {
    id: "card_crystal",
    name: "Crystal Extractor",
    shortName: "XTRACT",
    description: "Extracts 300 crystals instantly.",
    iconType: "gem",
    energyCost: 5,
    effect: "crystals_+300",
  },
  {
    id: "card_digital",
    name: "Digital Fortress",
    shortName: "FORTRESS",
    description: "Makes all structures invulnerable for 2 ticks.",
    iconType: "castle",
    energyCost: 7,
    effect: "invulnerable_2t",
  },
]

// Deck storage key in localStorage (temporary until backend exists)
export const DECK_STORAGE_KEY = "grid_deck_v1"
export const MAX_DECK_SIZE = 8
export const MIN_DECK_SIZE = 4

export function loadDeck(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(DECK_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_DECK_SIZE) : []
  } catch {
    return []
  }
}

export function saveDeck(cardIds: string[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(cardIds.slice(0, MAX_DECK_SIZE)))
}

export function getCardById(id: string): GameCard | undefined {
  return ALL_CARDS.find((c) => c.id === id)
}

/** Fisher-Yates shuffle algorithm for unbiased randomization */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/** Draw `count` random cards from the provided deck IDs, no duplicates */
export function drawHand(count: number, deckIds?: string[]): GameCard[] {
  const deck = deckIds || loadDeck()
  if (deck.length === 0) return []
  const shuffled = fisherYatesShuffle(deck)
  return shuffled
    .slice(0, Math.min(count, shuffled.length))
    .map(getCardById)
    .filter((c): c is GameCard => c !== undefined)
}
