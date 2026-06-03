/**
 * Format a duration (in seconds) as "M:SS".
 * Useful in game UIs for timers, queue counters, etc.
 */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toString().padStart(2, "0")
  return `${minutes}:${seconds}`
}
