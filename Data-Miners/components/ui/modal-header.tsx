import type React from "react"
import { X } from "lucide-react"
import { SoundManager } from "@/lib/game/sound-manager"

interface ModalHeaderProps {
  title: string
  headerExtra?: React.ReactNode
  onClose: () => void
  onCloseHover?: () => void
  closeLabel?: string
}

export function ModalHeader({
  title,
  headerExtra,
  onClose,
  onCloseHover,
  closeLabel = "Close",
}: ModalHeaderProps) {
  const handleClose = () => {
    SoundManager.playClick()
    onClose()
  }

  const handleCloseHover = () => {
    SoundManager.playHover()
    onCloseHover?.()
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      <h2 className="font-serif text-lg text-white italic">{title}</h2>
      <div className="flex items-center gap-3">
        {headerExtra}
        <button
          onClick={handleClose}
          onMouseEnter={handleCloseHover}
          className="p-2 ark-button"
          aria-label={closeLabel}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
