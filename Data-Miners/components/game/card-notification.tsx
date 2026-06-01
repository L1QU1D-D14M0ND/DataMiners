"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import type { CardUsageEvent } from "@/lib/websocket-client"

interface CardNotificationProps {
  event: CardUsageEvent
  onDismiss: () => void
}

export function CardNotification({ event, onDismiss }: CardNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, 5000) // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className="ark-card scanlines p-3 flex items-center gap-3 border-l-4 border-l-red-500">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] text-white/60 uppercase tracking-wider">Opponent Used Card</span>
          <span className="text-sm text-white font-heading">{event.cardName}</span>
        </div>
      </div>
    </div>
  )
}

export function CardNotificationContainer() {
  const [notifications, setNotifications] = useState<CardUsageEvent[]>([])

  const addNotification = (event: CardUsageEvent) => {
    setNotifications((prev) => [...prev, event])
  }

  const removeNotification = (event: CardUsageEvent) => {
    setNotifications((prev) => prev.filter((e) => e !== event))
  }

  // This will be called by the game-ui component when a card usage event is received
  useEffect(() => {
    const handleCardUsed = (event: CustomEvent<CardUsageEvent>) => {
      addNotification(event.detail)
    }

    window.addEventListener("opponentCardUsed", handleCardUsed as EventListener)

    return () => {
      window.removeEventListener("opponentCardUsed", handleCardUsed as EventListener)
    }
  }, [])

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      {notifications.map((event) => (
        <div key={`${event.userId}-${event.cardId}-${event.timestamp}`} className="pointer-events-auto">
          <CardNotification event={event} onDismiss={() => removeNotification(event)} />
        </div>
      ))}
    </div>
  )
}
