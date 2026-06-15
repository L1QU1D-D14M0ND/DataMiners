import type React from "react"

interface ResourceCardProps {
  icon: React.ReactNode
  label: string
  value: number
  max?: number
  suffix?: string
  variant?: "resource" | "opponent"
}

export function ResourceCard({
  icon,
  label,
  value,
  max,
  suffix,
  variant = "resource",
}: ResourceCardProps) {
  if (variant === "opponent") {
    return (
      <div className="flex items-center gap-2">
        <div className="opacity-60">{icon}</div>
        <div className="flex flex-col">
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
            {label}
          </span>
          <span className="font-mono text-sm text-white tabular-nums">{value}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="opacity-60">{icon}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-sm text-white tabular-nums">
          {String(value).padStart(3, " ")}
        </span>
        {max !== undefined && (
          <span className="font-mono text-[10px] text-white/40">/{max}</span>
        )}
        {suffix && <span className="font-mono text-[10px] text-white/40">{suffix}</span>}
      </div>
    </div>
  )
}
