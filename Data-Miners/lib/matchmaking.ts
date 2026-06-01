import axios from "@/lib/axios"

export interface MatchmakingQueue {
  id: number
  user_id: number
  queue_name: string
  skill_rating: number
  preferences: Record<string, any>
  status: 'waiting' | 'matched' | 'cancelled'
  expires_at: string
  created_at: string
  matched_at?: string
}

export interface MatchData {
  match_id: string
  game_session_id: number
  queue_name: string
  players: Array<{
    user_id: number
    skill_rating: number
  }>
  created_at: string
}

export interface QueueStatus {
  in_queue: boolean
  matched?: boolean
  queue_id?: number
  queue_name?: string
  skill_rating?: number
  expires_at?: string
  time_in_queue?: number
  match_data?: MatchData
}

export const matchmakingApi = {
  /**
   * Join a matchmaking queue
   */
  async joinQueue(queueName: string, skillRating?: number, preferences?: Record<string, any>) {
    const response = await axios.post<{ queue_id: number; queue_name: string; skill_rating: number; expires_at: string }>('/api/matchmaking/join', {
      queue_name: queueName,
      skill_rating: skillRating,
      preferences: preferences,
    })
    return response.data
  },

  /**
   * Leave the matchmaking queue
   */
  async leaveQueue() {
    const response = await axios.post<{ message: string }>('/api/matchmaking/leave')
    return response.data
  },

  /**
   * Get current queue status
   */
  async getQueueStatus(): Promise<QueueStatus> {
    const response = await axios.get<QueueStatus>('/api/matchmaking/status')
    return response.data
  },

  /**
   * Poll for match status (for long-polling implementation)
   */
  async pollForMatch(queueId: number): Promise<QueueStatus> {
    const response = await axios.get<QueueStatus>('/api/matchmaking/status')
    return response.data
  },
}
