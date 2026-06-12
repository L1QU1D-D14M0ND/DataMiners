import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import type { GameStateUpdate, CardUsageEvent, MatchEndedEvent } from '@/lib/api-types'

declare global {
  interface Window {
    Echo?: Echo<any>
    Pusher?: typeof Pusher
  }
}

export type GameStateCallback = (data: GameStateUpdate) => void
export type CardUsageCallback = (data: CardUsageEvent) => void
export type MatchEndedCallback = (data: MatchEndedEvent) => void

class WebSocketClient {
  private echo: Echo<any> | null = null
  private currentMatchId: string | null = null
  private gameStateCallbacks: Set<GameStateCallback> = new Set()
  private cardUsageCallbacks: Set<CardUsageCallback> = new Set()
  private matchEndedCallbacks: Set<MatchEndedCallback> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      window.Pusher = Pusher
    }
  }

  connect(token: string): void {
    if (this.echo) {
      return
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

    this.echo = new Echo({
      broadcaster: 'pusher',
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || 'app-key',
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
      wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || backendUrl.replace(/^https?:\/\//, ''),
      wsPort: process.env.NEXT_PUBLIC_PUSHER_PORT ? parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT) : 6001,
      wssPort: process.env.NEXT_PUBLIC_PUSHER_PORT ? parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT) : 6001,
      forceTLS: process.env.NEXT_PUBLIC_PUSHER_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${backendUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
      disableStats: true,
    })
  }

  disconnect(): void {
    if (this.echo) {
      this.echo.disconnect()
      this.echo = null
    }
    this.currentMatchId = null
    this.gameStateCallbacks.clear()
    this.cardUsageCallbacks.clear()
    this.matchEndedCallbacks.clear()
  }

  joinMatch(matchId: string): boolean {
    if (!this.echo) {
      console.error('WebSocket not connected — real-time match events will not be received')
      return false
    }

    this.currentMatchId = matchId

    // Subscribe to the private match channel
    const channel = this.echo.private(`match.${matchId}`)

    // Listen for game state changes
    channel.listen('.game.state.changed', (data: GameStateUpdate) => {
      this.gameStateCallbacks.forEach((callback) => callback(data))
    })

    // Listen for card usage events
    channel.listen('.card.used', (data: CardUsageEvent) => {
      this.cardUsageCallbacks.forEach((callback) => callback(data))
    })

    // Listen for match ended events
    channel.listen('.match.ended', (data: MatchEndedEvent) => {
      this.matchEndedCallbacks.forEach((callback) => callback(data))
    })

    return true
  }

  leaveMatch(): void {
    if (!this.echo || !this.currentMatchId) {
      return
    }

    this.echo.leave(`match.${this.currentMatchId}`)
    this.currentMatchId = null
  }

  onGameStateChange(callback: GameStateCallback): () => void {
    this.gameStateCallbacks.add(callback)
    return () => this.gameStateCallbacks.delete(callback)
  }

  onCardUsed(callback: CardUsageCallback): () => void {
    this.cardUsageCallbacks.add(callback)
    return () => this.cardUsageCallbacks.delete(callback)
  }

  onMatchEnded(callback: MatchEndedCallback): () => void {
    this.matchEndedCallbacks.add(callback)
    return () => this.matchEndedCallbacks.delete(callback)
  }

  isConnected(): boolean {
    return this.echo !== null
  }

  isInMatch(): boolean {
    return this.currentMatchId !== null
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null

export const getWebSocketClient = (): WebSocketClient => {
  if (!wsClient) {
    wsClient = new WebSocketClient()
  }
  return wsClient
}

export default WebSocketClient
