"use client"

import type { ReactNode } from "react"
import { X } from "lucide-react"

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  /** Extra elements rendered to the right of the title (before the close button). */
  headerExtra?: ReactNode
  /** Tailwind max-width class for the card, e.g. "max-w-sm" */
  maxWidth?: string
  /** Additional classes on the outer card wrapper */
  className?: string
  children: ReactNode
  closeLabel?: string
  onCloseHover?: () => void
  backdropClass?: string
}

export function GameModal({
  isOpen,
  onClose,
  title,
  headerExtra,
  maxWidth = "max-w-sm",
  className = "",
  children,
  closeLabel = "Close",
  onCloseHover,
  backdropClass = "bg-black/80",
}: GameModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      <div className={`absolute inset-0 ${backdropClass}`} onClick={onClose} />

      <div
        className={`relative ark-card scanlines w-full ${maxWidth} overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="font-serif text-lg text-white italic">{title}</h2>
          <div className="flex items-center gap-3">
            {headerExtra}
            <button
              onClick={onClose}
              onMouseEnter={onCloseHover}
              className="p-2 ark-button"
              aria-label={closeLabel}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
