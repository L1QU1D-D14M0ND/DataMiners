"use client"

import { User, Star, Trophy, Coins } from "lucide-react"
import { calculateLevelInfo } from "@/lib/level-utils"

export interface UserProfileData {
  id: number
  name: string
  email?: string
  experience_points?: number
  rank_score?: number
  credits?: number
  role?: string
}

interface UserProfileCardProps {
  user: UserProfileData | null
  label: string
  status?: "connected" | "connecting" | "waiting" | "unknown"
  showStats?: boolean
  compact?: boolean
}

export function UserProfileCard({ 
  user, 
  label, 
  status = "unknown",
  showStats = false,
  compact = false
}: UserProfileCardProps) {
  const levelInfo = user?.experience_points ? calculateLevelInfo(user.experience_points) : null

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case "connecting":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      case "waiting":
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />
      default:
        return <div className="w-2 h-2 bg-foreground/30 rounded-full" />
    }
  }

  if (compact) {
    return (
      <div className="ark-card p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-ark-gold/20 rounded-full flex items-center justify-center border border-ark-gold/30">
              <User className="w-5 h-5 text-ark-gold" />
            </div>
            <div>
              <div className="font-heading text-sm text-foreground/90">{user?.name || "Unknown"}</div>
              <div className="font-serif italic text-[10px] text-foreground/40">{label}</div>
            </div>
          </div>
          {getStatusIcon()}
        </div>
        {showStats && levelInfo && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="font-mono text-xs text-ark-gold">Lv {levelInfo.level}</span>
            {user?.rank_score !== undefined && (
              <>
                <Trophy className="w-3 h-3 text-yellow-400 ml-2" />
                <span className="font-mono text-xs text-ark-gold">{user.rank_score}</span>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="ark-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-ark-gold/20 rounded-full flex items-center justify-center border border-ark-gold/30">
          <User className="w-7 h-7 text-ark-gold" />
        </div>
        <div className="flex-1">
          <div className="font-heading text-base text-foreground/90">{user?.name || "Unknown"}</div>
          <div className="font-serif italic text-xs text-foreground/40">{label}</div>
        </div>
        {getStatusIcon()}
      </div>

      {showStats && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          {levelInfo && (
            <div className="bg-card border border-border p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Star className="w-3 h-3 text-ark-gold" />
                <span className="font-heading text-[10px] tracking-wider text-foreground/60">LEVEL</span>
              </div>
              <div className="font-mono text-sm text-foreground/90">Lv {levelInfo.level}</div>
            </div>
          )}
          {user?.rank_score !== undefined && (
            <div className="bg-card border border-border p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Trophy className="w-3 h-3 text-ark-gold" />
                <span className="font-heading text-[10px] tracking-wider text-foreground/60">RANK</span>
              </div>
              <div className="font-mono text-sm text-foreground/90">{user.rank_score}</div>
            </div>
          )}
          {user?.credits !== undefined && (
            <div className="bg-card border border-border p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Coins className="w-3 h-3 text-ark-gold" />
                <span className="font-heading text-[10px] tracking-wider text-foreground/60">CREDITS</span>
              </div>
              <div className="font-mono text-sm text-foreground/90">{user.credits}</div>
            </div>
          )}
          {levelInfo && (
            <div className="bg-card border border-border p-2">
              <div className="font-heading text-[10px] tracking-wider text-foreground/60 mb-1">XP PROGRESS</div>
              <div className="font-mono text-sm text-foreground/90">{Math.round(levelInfo.progress * 100)}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
