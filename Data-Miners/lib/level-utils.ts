export interface LevelInfo {
  level: number
  xpIntoLevel: number
  xpForNext: number
  xpRemaining: number
  progress: number
}

/**
 * Calculate level information from total experience points.
 * Cumulative XP required to reach level L: 50 * sum_{k=1}^{L-1} k = 25 * L * (L-1)
 * XP to next level from current level L: 50 * L
 */
export function calculateLevelInfo(totalXP: number): LevelInfo {
  const xpTotalForLevel = (L: number) => 25 * L * (L - 1)

  let level = 1
  while (xpTotalForLevel(level + 1) <= totalXP) {
    level += 1
  }

  const xpIntoLevel = totalXP - xpTotalForLevel(level)
  const xpForNext = 50 * level
  const xpRemaining = Math.max(0, xpForNext - xpIntoLevel)
  const progress = xpForNext > 0 ? Math.min(1, Math.max(0, xpIntoLevel / xpForNext)) : 0

  return { level, xpIntoLevel, xpForNext, xpRemaining, progress }
}
