import axios from "@/lib/axios"
import type {
  MatchmakingQueue,
  MatchData,
  QueueStatus,
  JoinQueueResponse,
  LeaveQueueResponse,
  MatchmakingPreferences
} from "@/lib/api-types"

export const matchmakingApi = {
  /**
   * Join a matchmaking queue
   */
  async joinQueue(queueName: string, skillRating?: number, preferences?: MatchmakingPreferences) {
    const response = await axios.post<JoinQueueResponse>('/api/matchmaking/join', {
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
    const response = await axios.post<LeaveQueueResponse>('/api/matchmaking/leave')
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
