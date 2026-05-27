import type { TechNode, TechEffect } from "./tech-node"
import { cloneTechNode } from "./tech-node"
import { allTechNodes } from "./tech-nodes"
import { BuildingRegistry } from "../buildings"

class TechRegistryClass {
  private nodes: Map<string, TechNode> = new Map()
  private globalModifiers: Map<string, number> = new Map()
  private resourceBonuses: Map<string, number> = new Map()

  constructor() {
    this.reset()
  }

  reset() {
    this.nodes.clear()
    this.globalModifiers.clear()
    this.resourceBonuses.clear()
    BuildingRegistry.resetAll()

    for (const node of allTechNodes) {
      this.nodes.set(node.id, cloneTechNode(node))
    }
  }

  getNode(id: string): TechNode | undefined {
    return this.nodes.get(id)
  }

  getAllNodes(): TechNode[] {
    return Array.from(this.nodes.values())
  }

  getNodesByCategory(category: TechNode["category"]): TechNode[] {
    return this.getAllNodes().filter((n) => n.category === category)
  }

  isUnlocked(nodeId: string): boolean {
    const node = this.nodes.get(nodeId)
    return node ? node.level > 0 : false
  }

  canUnlock(nodeId: string, currentData: number): { canUnlock: boolean; reason?: string } {
    const node = this.nodes.get(nodeId)
    if (!node) return { canUnlock: false, reason: "Tech not found" }

    if (node.level >= node.maxLevel) {
      return { canUnlock: false, reason: "Already at max level" }
    }

    if (currentData < node.dataCost) {
      return { canUnlock: false, reason: `Need ${node.dataCost} data` }
    }

    // Check prerequisites
    for (const prereqId of node.prerequisites) {
      if (!this.isUnlocked(prereqId)) {
        const prereq = this.nodes.get(prereqId)
        return { canUnlock: false, reason: `Requires: ${prereq?.name || prereqId}` }
      }
    }

    return { canUnlock: true }
  }

  unlock(nodeId: string): boolean {
    const node = this.nodes.get(nodeId)
    if (!node || node.level >= node.maxLevel) return false

    node.level++

    // Apply effects
    for (const effect of node.effects) {
      this.applyEffect(effect)
    }

    this.emitChange()
    return true
  }

  private applyEffect(effect: TechEffect) {
    switch (effect.type) {
      case "building_stat":
        if (effect.buildingId && effect.statKey && effect.value !== undefined) {
          BuildingRegistry.applyUpgrade({
            id: `tech_${effect.buildingId}_${effect.statKey}`,
            name: "Tech Upgrade",
            description: "",
            buildingId: effect.buildingId,
            upgrades: [
              {
                statKey: effect.statKey,
                value: effect.value,
                isMultiplier: effect.isMultiplier,
              },
            ],
            buildingMaterialsCost: 0,
            energyCost: 0,
            requiredLevel: 0,
          })
        }
        break

      case "resource_cap":
        if (effect.resourceKey && effect.flatBonus) {
          const current = this.resourceBonuses.get(effect.resourceKey) || 0
          this.resourceBonuses.set(effect.resourceKey, current + effect.flatBonus)
        }
        break

      case "global_modifier":
        if (effect.modifierKey && effect.modifierValue !== undefined) {
          const current = this.globalModifiers.get(effect.modifierKey) || 0
          this.globalModifiers.set(effect.modifierKey, current + effect.modifierValue)
        }
        break
    }
  }

  getGlobalModifier(key: string): number {
    return this.globalModifiers.get(key) || 0
  }

  getResourceBonus(key: string): number {
    return this.resourceBonuses.get(key) || 0
  }

  private emitChange() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("techRegistryChange"))
    }
  }
}

export const TechRegistry = new TechRegistryClass()
