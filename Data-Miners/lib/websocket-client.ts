import { io, Socket } from 'socket.io-client'
import type { GameStateUpdate, CardUsageEvent, MatchEndedEvent } from '@/lib/api-types'

export type GameStateCallback = (data: GameStateUpdate) => void
export type CardUsageCallback = (data: CardUsageEvent) => void
export type MatchEndedCallback = (data: MatchEndedEvent) => void

class WebSocketClient {
  private socket: Socket | null = null
  private currentMatchId: string | null = null
  private gameStateCallbacks: Set<GameStateCallback> = new Set()
  private cardUsageCallbacks: Set<CardUsageCallback> = new Set()
  private matchEndedCallbacks: Set<MatchEndedCallback> = new Set()

  connect(token: string): void {
    if (this.socket) {
      return
    }

    console.log('[WebSocket] Connecting to Socket.io server on port 6001')

    this.socket = io('http://127.0.0.1:6001', {
      auth: { token },
      transports: ['websocket'],
    })

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully')
    })

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error)
    })

    this.socket.on('opponent-state-update', (data: any) => {
      console.log('[WebSocket] Received opponent-state-update event:', data)
      const gameStateUpdate: GameStateUpdate = {
        matchId: this.currentMatchId || '',
        userId: data.userId,
        downloadSpeed: data.downloadSpeed,
        energyGenerated: data.energyGenerated,
        timestamp: data.timestamp,
      }
      this.gameStateCallbacks.forEach((callback) => callback(gameStateUpdate))
    })

    this.socket.on('card-used-update', (data: any) => {
      console.log('[WebSocket] Received card-used-update event:', data)
      const cardUsageEvent: CardUsageEvent = {
        matchId: this.currentMatchId || '',
        userId: data.userId,
        cardId: data.cardId,
        cardName: data.cardName,
        timestamp: data.timestamp,
      }
      this.cardUsageCallbacks.forEach((callback) => callback(cardUsageEvent))
    })

    this.socket.on('match-ended-update', (data: any) => {
      console.log('[WebSocket] Received match-ended-update event:', data)
      const matchEndedEvent: MatchEndedEvent = {
        matchId: data.matchId,
        winnerId: data.winnerId,
        loserId: data.loserId,
        timestamp: data.timestamp,
      }
      this.matchEndedCallbacks.forEach((callback) => callback(matchEndedEvent))
    })

    this.socket.on('sync-ready-update', (data: any) => {
      console.log('[WebSocket] Received sync-ready-update event:', data)
      // Treat this as an opponent state update for sync purposes
      const gameStateUpdate: GameStateUpdate = {
        matchId: this.currentMatchId || '',
        userId: data.userId,
        downloadSpeed: 0,
        energyGenerated: 0,
        timestamp: new Date().toISOString(),
      }
      this.gameStateCallbacks.forEach((callback) => callback(gameStateUpdate))
    })

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected')
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.currentMatchId = null
    this.gameStateCallbacks.clear()
    this.cardUsageCallbacks.clear()
    this.matchEndedCallbacks.clear()
  }

  joinMatch(matchId: string): boolean {
    if (!this.socket) {
      console.error('WebSocket not connected — real-time match events will not be received')
      return false
    }

    this.currentMatchId = matchId
    console.log('[WebSocket] Joining match:', matchId)

    this.socket.emit('join-match', matchId)

    console.log('[WebSocket] Successfully joined match')
    
    // Emit sync-ready to notify opponent we're ready
    console.log('[WebSocket] Emitting sync-ready event')
    this.socket.emit('sync-ready', { matchId, userId: this.currentMatchId })
    
    return true
  }

  leaveMatch(): void {
    if (!this.socket || !this.currentMatchId) {
      return
    }

    this.socket.emit('leave-match', this.currentMatchId)
    this.currentMatchId = null
  }

  sendOpponentState(userId: number, downloadSpeed: number, energyGenerated: number): void {
    if (this.socket && this.currentMatchId) {
      this.socket.emit('opponent-state', {
        matchId: this.currentMatchId,
        userId,
        downloadSpeed,
        energyGenerated,
      })
      console.log('[WebSocket] Sent opponent state')
    }
  }

  sendCardUsage(userId: number, cardId: string, cardName: string): void {
    if (this.socket && this.currentMatchId) {
      this.socket.emit('card-used', {
        matchId: this.currentMatchId,
        userId,
        cardId,
        cardName,
      })
      console.log('[WebSocket] Sent card usage:', cardName)
    }
  }

  sendMatchEnded(winnerId: number, loserId: number): void {
    if (this.socket && this.currentMatchId) {
      this.socket.emit('match-ended', {
        matchId: this.currentMatchId,
        winnerId,
        loserId,
      })
      console.log('[WebSocket] Sent match ended')
    }
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
    return this.socket !== null && this.socket.connected
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
