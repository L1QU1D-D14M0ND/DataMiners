"use client"

import { useState, useEffect } from "react"
import { TechRegistry, type TechNode } from "@/lib/game/tech"
import { X, Zap, Factory, Antenna, Pickaxe, Database, Lock, Check, ChevronRight, Clock } from "lucide-react"
import { SoundManager } from "@/lib/game/sound-manager"
import { useSettingsMenuToggle } from "@/lib/hooks/use-settings-menu-toggle"

interface TechTreeModalProps {
  isOpen: boolean
  onClose: () => void
  currentData: number
  onUnlock: (nodeId: string, cost: number) => boolean
}

function getTechIcon(iconName: string, className: string) {
  switch (iconName) {
    case "zap":
      return <Zap className={className} />
    case "factory":
      return <Factory className={className} />
    case "antenna":
      return <Antenna className={className} />
    case "pickaxe":
      return <Pickaxe className={className} />
    case "database":
      return <Database className={className} />
    case "timer":
      return <Clock className={className} />
    default:
      return <Database className={className} />
  }
}

function getCategoryColor(category: TechNode["category"]): string {
  switch (category) {
    case "power":
      return "text-yellow-400 border-yellow-400/30"
    case "production":
      return "text-orange-400 border-orange-400/30"
    case "storage":
      return "text-cyan-400 border-cyan-400/30"
    case "special":
      return "text-purple-400 border-purple-400/30"
    default:
      return "text-white/80 border-white/20"
  }
}

export function TechTreeModal({ isOpen, onClose, currentData, onUnlock }: TechTreeModalProps) {
  const [nodes, setNodes] = useState<TechNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TechNode | null>(null)

  useEffect(() => {
    const updateNodes = () => {
      setNodes(TechRegistry.getAllNodes())
    }

    updateNodes()
    window.addEventListener("techRegistryChange", updateNodes)
    return () => window.removeEventListener("techRegistryChange", updateNodes)
  }, [])

  useSettingsMenuToggle(isOpen)

  const handleUnlock = (node: TechNode) => {
    const { canUnlock } = TechRegistry.canUnlock(node.id, currentData)
    if (canUnlock) {
      const success = onUnlock(node.id, node.dataCost)
      if (success) {
        if (TechRegistry.unlock(node.id)) {
          window.dispatchEvent(new CustomEvent("techUnlocked", { detail: { nodeId: node.id } }))
        }
        setNodes(TechRegistry.getAllNodes())
      }
    } else {
      SoundManager.playError()
    }
  }

  const handleClose = () => {
    SoundManager.playClick()
    onClose()
  }

  const handleSelectNode = (node: TechNode) => {
    SoundManager.playHover()
    setSelectedNode(node)
  }

  if (!isOpen) return null

  const categories: TechNode["category"][] = ["power", "production", "storage"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/85" onClick={handleClose} />

      <div className="relative ark-card scanlines w-full max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-purple-500/20 border border-purple-500/30"
              style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
            >
              <Database className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg text-white italic">Research Terminal</h2>
              <p className="text-[9px] sm:text-[10px] font-heading uppercase tracking-wider text-white/40 hidden sm:block">
                Alien Technology Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="ark-floppy px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2">
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
              <span className="font-mono text-xs sm:text-sm text-purple-400">{currentData}</span>
              <span className="text-[8px] sm:text-[9px] font-heading text-white/40 uppercase hidden xs:inline">Data</span>
            </div>

            <button onClick={handleClose} onMouseEnter={() => SoundManager.playHover()} className="p-1.5 sm:p-2 ark-button">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <div className="grid gap-4 sm:gap-6">
            {categories.map((category) => {
              const categoryNodes = nodes.filter((n) => n.category === category)
              if (categoryNodes.length === 0) return null

              return (
                <div key={category}>
                  <h3 className="text-[9px] sm:text-[10px] font-serif italic text-white/40 mb-2 sm:mb-3 uppercase tracking-widest">
                    {category} Systems
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                    {categoryNodes.map((node) => {
                      const isUnlocked = node.level > 0
                      const { canUnlock } = TechRegistry.canUnlock(node.id, currentData)
                      const categoryColors = getCategoryColor(category)

                      return (
                        <button
                          key={node.id}
                          onClick={() => handleSelectNode(node)}
                          className={`relative ark-floppy p-2.5 sm:p-3 pb-4 sm:pb-5 text-left transition-all ${
                            isUnlocked
                              ? "!border-green-500/40"
                              : selectedNode?.id === node.id
                                ? `${categoryColors}`
                                : "hover:border-white/30"
                          }`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0 border ${
                                isUnlocked ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10"
                              }`}
                              style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                            >
                              {isUnlocked ? (
                                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                              ) : (
                                getTechIcon(node.icon, `w-4 h-4 sm:w-5 sm:h-5 ${categoryColors.split(" ")[0]}`)
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <span
                                  className={`font-heading font-medium text-xs sm:text-sm uppercase tracking-wider ${
                                    isUnlocked ? "text-green-400" : "text-white/90"
                                  }`}
                                >
                                  {node.name}
                                </span>
                                {!isUnlocked && !canUnlock && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/30" />}
                              </div>
                              <p className="text-[9px] sm:text-[10px] text-white/50 mt-0.5 line-clamp-2">{node.description}</p>
                              {!isUnlocked && (
                                <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                                  <Database className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400" />
                                  <span
                                    className={`text-[9px] sm:text-[10px] font-mono ${
                                      currentData >= node.dataCost ? "text-purple-400" : "text-red-400"
                                    }`}
                                  >
                                    {node.dataCost}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Level indicator */}
                          <div className="absolute top-2 right-2 flex gap-0.5">
                            {Array.from({ length: node.maxLevel }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 ${i < node.level ? "bg-green-400" : "bg-white/20"}`}
                                style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                              />
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer - Selected node details */}
        {selectedNode && (
          <div className="border-t border-white/10 p-3 sm:p-4 bg-black/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {getTechIcon(selectedNode.icon, "w-4 h-4 sm:w-5 sm:h-5 text-white/60")}
                  <span className="font-heading font-medium text-sm sm:text-base text-white uppercase tracking-wider">
                    {selectedNode.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 bg-white/10 text-white/60 uppercase">
                    Lv.{selectedNode.level}/{selectedNode.maxLevel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/50 mt-1 line-clamp-2">{selectedNode.description}</p>
              </div>

              {selectedNode.level < selectedNode.maxLevel && (
                <button
                  onClick={() => handleUnlock(selectedNode)}
                  disabled={!TechRegistry.canUnlock(selectedNode.id, currentData).canUnlock}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 font-heading font-medium transition-all uppercase tracking-wider text-xs sm:text-sm w-full sm:w-auto justify-center ${
                    TechRegistry.canUnlock(selectedNode.id, currentData).canUnlock
                      ? "ark-button-gold"
                      : "ark-button opacity-40 cursor-not-allowed"
                  }`}
                  style={{
                    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                  }}
                >
                  <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="font-mono">{selectedNode.dataCost}</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Unlock</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
