"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, Users, X, Loader2 } from "lucide-react"
import { matchmakingApi, type QueueStatus } from "@/lib/matchmaking"
import { SoundManager } from "@/lib/game/sound-manager"

interface MatchmakingLobbyProps {
  onMatchFound: (matchId: string, gameSessionId: number) => void
  onCancel: () => void
  queueName?: string
}

export function MatchmakingLobby({ onMatchFound, onCancel, queueName = "default" }: MatchmakingLobbyProps) {
  const [status, setStatus] = useState<QueueStatus | null>(null)
  const [timeInQueue, setTimeInQueue] = useState(0)
  const [isLeaving, setIsLeaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Join queue on mount
  useEffect(() => {
    let mounted = true
    let pollInterval: NodeJS.Timeout | null = null

    const joinQueue = async () => {
      try {
        await matchmakingApi.joinQueue(queueName)
        SoundManager.playClick()
      } catch (err) {
        if (mounted) {
          setError("Failed to join matchmaking queue")
          console.error("Failed to join queue:", err)
        }
      }
    }

    joinQueue()

    // Poll for match status
    const pollStatus = async () => {
      try {
        const queueStatus = await matchmakingApi.getQueueStatus()
        if (!mounted) return

        setStatus(queueStatus)

        console.log("Queue status:", queueStatus)

        if (queueStatus.matched && queueStatus.match_data) {
          // Match found!
          console.log("Match found!", queueStatus.match_data)
          if (pollInterval) clearInterval(pollInterval)
          SoundManager.playSuccess()
          onMatchFound(queueStatus.match_data.match_id, queueStatus.match_data.game_session_id)
        } else if (!queueStatus.in_queue) {
          // No longer in queue (cancelled or expired)
          if (pollInterval) clearInterval(pollInterval)
          onCancel()
        }
      } catch (err) {
        if (mounted) {
          console.error("Failed to poll queue status:", err)
        }
      }
    }

    // Initial poll
    pollStatus()

    // Poll every 2 seconds
    pollInterval = setInterval(pollStatus, 2000)

    return () => {
      mounted = false
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [queueName, onMatchFound, onCancel])

  // Update time in queue
  useEffect(() => {
    if (!status?.in_queue) return

    const interval = setInterval(() => {
      setTimeInQueue((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [status?.in_queue])

  const handleLeaveQueue = useCallback(async () => {
    setIsLeaving(true)
    try {
      await matchmakingApi.leaveQueue()
      SoundManager.playClick()
      onCancel()
    } catch (err) {
      console.error("Failed to leave queue:", err)
      setError("Failed to leave queue")
      setIsLeaving(false)
    }
  }, [onCancel])

  if (error) {
    return (
      <div className="ark-card scanlines p-6 max-w-md mx-auto">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={onCancel} className="ark-button-gold px-4 py-2">
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ark-card scanlines p-8 max-w-md mx-auto">
      <div className="text-center">
        {/* Header */}
        <h2 className="font-heading text-2xl text-white mb-2 tracking-wider">FINDING TARGET</h2>
        <p className="text-white/60 text-sm mb-8">Searching for a planet with an alien monolith...</p>

        {/* Animated loader */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-yellow-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
          <div className="absolute inset-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-white/70" />
          </div>
        </div>

        {/* Queue info */}
        {status && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-white/70">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">
                {Math.floor(timeInQueue / 60)}:{(timeInQueue % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {status.skill_rating && (
              <div className="text-white/50 text-xs">
                Skill Rating: {status.skill_rating}
              </div>
            )}
          </div>
        )}

        {/* Cancel button */}
        <button
          onClick={handleLeaveQueue}
          disabled={isLeaving}
          className="ark-button flex items-center justify-center gap-2 px-6 py-3 w-full"
        >
          {isLeaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Leaving...</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              <span>Cancel Search</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
