// API Response Types for Data Miners Frontend

// CSRF Protection
export interface CsrfCookieResponse {
  message?: string
}

// Authentication & User API
export interface UserResponse {
  user: UserProfile
}

export interface UserProfile {
  id: number
  name: string
  email: string
  role: string
  experience_points: number
  credits: number
  rank_score: number
  equipped_profile_picture?: {
    id: number
    name: string
    cosmetic_type: string
  }
  equipped_frame?: {
    id: number
    name: string
    cosmetic_type: string
  }
  equipped_card?: {
    id: number
    name: string
    cosmetic_type: string
  }
  equipped_title?: {
    id: number
    name: string
    cosmetic_type: string
  }
}

export interface LoginResponse {
  user: UserProfile
  redirect_to?: string
}

export interface RegisterResponse {
  user: UserProfile
}

export interface LogoutResponse {
  message: string
}

// Profile API
export interface ProfileResponse {
  user: UserProfile
  sets: CosmeticSet[]
  user_cosmetics: Cosmetic[]
}

export interface Cosmetic {
  id: number
  name: string
  experience_unlock: number | null
  credits_unlock: number | null
  unlocked: boolean
  cosmetic_type: {
    id: number
    name: string
  }
}

export interface CosmeticSet {
  id: number
  set_name: string
  cosmetics: Cosmetic[]
}

export interface EquippedCosmeticsRequest {
  equipped_profile_picture_id: number | null
  equipped_frame_id: number | null
  equipped_card_id: number | null
  equipped_title_id: number | null
}

export interface EquippedCosmeticsResponse {
  message: string
}

// Cards API
export interface Card {
  id: number
  name: string
  experience_unlock: number | null
  credits_unlock: number | null
}

export interface Deck {
  id: number
  name: string
  card_ids: number[]
}

export interface CreateDeckRequest {
  name: string
  card_ids: number[]
}

export interface UpdateDeckRequest {
  name: string
  card_ids: number[]
}

// Game Sessions API
export interface ReportMatchEndRequest {
  winner_id: number
  outcome: 'win' | 'loss'
  reporting_user_id: number
}

export interface ReportMatchEndResponse {
  message: string
}

export interface GameStateUpdateRequest {
  download_speed: number
  energy_generated: number
}

export interface GameStateUpdateResponse {
  message: string
}

export interface CardUsedRequest {
  card_id: string
  card_name: string
}

export interface CardUsedResponse {
  message: string
}

export interface ConcedeMatchResponse {
  message: string
}

// Game Results API
export interface GameResultRequest {
  match_id: string | null
  outcome: 'win' | 'loss'
  reporting_user_id: number | null
  stats: {
    time_elapsed_seconds: number
    energy_generated: number
    download_speed: number
  }
}

export interface GameResultReward {
  experience?: number
  credits?: number
  rank_score?: number
  rankScore?: number
}

export interface GameResultResponse {
  reward?: GameResultReward
  message?: string
}

// Matchmaking API
export interface MatchmakingPreferences {
  [key: string]: unknown
}

export interface MatchmakingQueue {
  id: number
  user_id: number
  queue_name: string
  skill_rating: number
  preferences: MatchmakingPreferences
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

export interface JoinQueueResponse {
  queue_id: number
  queue_name: string
  skill_rating: number
  expires_at: string
}

export interface LeaveQueueResponse {
  message: string
}

// WebSocket Event Types
export interface GameStateUpdate {
  matchId: string
  userId: number
  downloadSpeed: number
  energyGenerated: number
  timestamp: string
}

export interface CardUsageEvent {
  matchId: string
  userId: number
  cardId: string
  cardName: string
  timestamp: string
}

export interface MatchEndedEvent {
  matchId: string
  winnerId: number
  loserId: number
  timestamp: string
}
