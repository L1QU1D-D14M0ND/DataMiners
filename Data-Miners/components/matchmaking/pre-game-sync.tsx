"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff, CheckCircle, Clock } from "lucide-react"
import { getWebSocketClient } from "@/lib/websocket-client"
import axios from "@/lib/axios"
import type { UserProfile } from "@/lib/api-types"
import { UserProfileCard, type UserProfileData } from "@/components/game/user-profile-card"

interface PreGameSyncProps {
  matchId: string
  currentUser: UserProfile
  onSyncComplete: () => void
}

interface OpponentProfile {
  id: number
  name: string
  email: string
}

export function PreGameSync({ matchId, currentUser, onSyncComplete }: PreGameSyncProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [opponentConnected, setOpponentConnected] = useState(false)
  const [syncing, setSyncing] = useState(true)
  const [syncProgress, setSyncProgress] = useState(0)
  const [opponent, setOpponent] = useState<OpponentProfile | null>(null)
  const [fetchingOpponent, setFetchingOpponent] = useState(true)

  useEffect(() => {
    const fetchOpponentProfile = async () => {
      try {
        const response = await axios.get<{ opponent: OpponentProfile }>(`/api/game-sessions/${matchId}/info`)
        setOpponent(response.data.opponent)
        console.log('[PreGameSync] Fetched opponent profile:', response.data.opponent)
      } catch (error) {
        console.error('[PreGameSync] Failed to fetch opponent profile:', error)
      } finally {
        setFetchingOpponent(false)
      }
    }

    fetchOpponentProfile()
  }, [matchId])

  useEffect(() => {
    const wsClient = getWebSocketClient()
    
    console.log('[PreGameSync] Setting up sync logic')
    console.log('[PreGameSync] WebSocket client connected:', wsClient.isConnected())
    console.log('[PreGameSync] Current matchId:', matchId)
    
    // Check if already connected
    if (wsClient.isConnected()) {
      setIsConnected(true)
      setSyncProgress(50)
      console.log('[PreGameSync] WebSocket already connected, set progress to 50%')
    }

    // Listen for connection status
    const handleConnect = () => {
      console.log('[PreGameSync] WebSocket connected event received')
      setIsConnected(true)
      setSyncProgress(50)
    }

    const handleDisconnect = () => {
      console.log('[PreGameSync] WebSocket disconnected event received')
      setIsConnected(false)
      setOpponentConnected(false)
    }

    // Listen for opponent state updates to verify they're connected
    const handleOpponentState = (data: any) => {
      console.log('[PreGameSync] Opponent state received - opponent is connected', data)
      setOpponentConnected(true)
      setSyncProgress(100)
      
      // Wait a moment then proceed to game
      setTimeout(() => {
        setSyncing(false)
        onSyncComplete()
      }, 1500)
    }

    // Set up event listeners
    console.log('[PreGameSync] Setting up game state change listener')
    const unsubscribeGameState = wsClient.onGameStateChange(handleOpponentState)
    console.log('[PreGameSync] Game state change listener set up')

    // If already connected, wait for opponent state
    if (wsClient.isConnected()) {
      console.log('[PreGameSync] WebSocket already connected, waiting for opponent state...')
    } else {
      console.log('[PreGameSync] WebSocket not connected yet, will wait for connection...')
    }

    return () => {
      console.log('[PreGameSync] Cleaning up event listeners')
      unsubscribeGameState()
    }
  }, [matchId, onSyncComplete])

  // Separate effect to handle WebSocket connection changes
  useEffect(() => {
    const wsClient = getWebSocketClient()
    
    const checkConnection = () => {
      const connected = wsClient.isConnected()
      console.log('[PreGameSync] Checking WebSocket connection status:', connected)
      if (connected && !isConnected) {
        setIsConnected(true)
        setSyncProgress(50)
        console.log('[PreGameSync] WebSocket connected, set progress to 50%')
        
        // Re-emit sync-ready when connection is established
        const userJson = localStorage.getItem('user')
        const user = userJson ? JSON.parse(userJson) : null
        if (user && matchId) {
          console.log('[PreGameSync] Re-emitting sync-ready event after connection')
          wsClient.sendOpponentState(user.id, 0, 0) // Send initial state to trigger sync
        }
      }
    }

    // Check immediately
    checkConnection()

    // Poll for connection status
    const interval = setInterval(checkConnection, 500)

    return () => {
      clearInterval(interval)
    }
  }, [isConnected])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading text-ark-gold mb-2 tracking-wider">MATCH SYNC</h1>
          <p className="text-foreground/60 text-sm">Establishing real-time connection with opponent</p>
        </div>

        {/* User profiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Current user */}
          <UserProfileCard
            user={{
              id: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
            }}
            label="YOU"
            status={isConnected ? "connected" : "connecting"}
            compact
          />

          {/* Opponent */}
          <UserProfileCard
            user={opponent ? {
              id: opponent.id,
              name: opponent.name,
              email: opponent.email,
            } : null}
            label="OPPONENT"
            status={opponentConnected ? "connected" : "waiting"}
            compact
          />
        </div>

        {/* Sync progress */}
        <div className="ark-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-xs tracking-wider text-foreground/80">CONNECTION STATUS</span>
            <span className="font-mono text-xs text-ark-gold">{syncProgress}%</span>
          </div>
          <div className="w-full bg-card h-2 rounded overflow-hidden">
            <div
              className="bg-ark-gold h-2 rounded transition-all duration-500"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {isConnected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-500" />
              )}
              <span className={isConnected ? "text-green-500 font-serif italic text-xs" : "text-white/60 font-serif italic text-xs"}>
                Your connection established
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {opponentConnected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-500" />
              )}
              <span className={opponentConnected ? "text-green-500 font-serif italic text-xs" : "text-white/60 font-serif italic text-xs"}>
                Opponent connection established
              </span>
            </div>
          </div>
        </div>

        {/* Status message */}
        <div className="text-center">
          {syncing ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-[#d4a853] border-t-transparent rounded-full animate-spin" />
              <p className="font-serif italic text-white/60 text-sm">Synchronizing with opponent...</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <p className="font-serif italic text-green-500 text-sm">Sync complete! Starting game...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
