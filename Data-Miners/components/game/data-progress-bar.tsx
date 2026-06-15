"use client"

import { Database } from "lucide-react"

interface DataProgressBarProps {
  dataUploaded: number
  maxDataUploaded: number
}

export function DataProgressBar({ dataUploaded, maxDataUploaded }: DataProgressBarProps) {
  const dataProgress =
    maxDataUploaded > 0
      ? Math.min(100, Math.max(0, (dataUploaded / maxDataUploaded) * 100))
      : 0

  return (
    <div className="pointer-events-auto hidden sm:block">
      <div className="ark-card p-3 mx-auto max-w-md">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-ark-purple flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-serif italic text-foreground/50">DATA TRANSMISSION</span>
              <span className="text-[10px] font-mono text-ark-purple">
                {dataUploaded}/{maxDataUploaded}
              </span>
            </div>
            <div className="h-1.5 bg-foreground/10 overflow-hidden">
              <div
                className="h-full bg-ark-purple transition-all duration-300"
                style={{ width: `${dataProgress}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-mono text-ark-purple">{Math.round(dataProgress)}%</span>
        </div>
      </div>
    </div>
  )
}
