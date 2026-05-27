import type { ComponentType } from "react"
import {
  Zap,
  Antenna,
  Factory,
  Pickaxe,
  Satellite,
  Database,
  Shield,
  Clock,
  Box,
} from "lucide-react"

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  lightning: Zap,
  circle: Zap,
  triangle: Antenna,
  antenna: Antenna,
  factory: Factory,
  drill: Pickaxe,
  uplink: Satellite,
  database: Database,
  shield: Shield,
  clock: Clock,
}

export function getCardIcon(iconType: string, className: string) {
  const Icon = iconMap[iconType] || Box
  return <Icon className={className} />
}
