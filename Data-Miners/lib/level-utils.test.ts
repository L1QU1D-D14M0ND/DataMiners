import { describe, it, expect } from 'vitest'
import { calculateLevelInfo, LevelInfo } from './level-utils'

describe('calculateLevelInfo', () => {
  describe('level 1 calculations', () => {
    it('should return level 1 for 0 XP', () => {
      const result = calculateLevelInfo(0)
      expect(result.level).toBe(1)
      expect(result.xpIntoLevel).toBe(0)
      expect(result.xpForNext).toBe(50)
      expect(result.xpRemaining).toBe(50)
      expect(result.progress).toBe(0)
    })

    it('should return level 1 for 25 XP', () => {
      const result = calculateLevelInfo(25)
      expect(result.level).toBe(1)
      expect(result.xpIntoLevel).toBe(25)
      expect(result.xpForNext).toBe(50)
      expect(result.xpRemaining).toBe(25)
      expect(result.progress).toBe(0.5)
    })

    it('should return level 1 for 49 XP', () => {
      const result = calculateLevelInfo(49)
      expect(result.level).toBe(1)
      expect(result.xpIntoLevel).toBe(49)
      expect(result.xpForNext).toBe(50)
      expect(result.xpRemaining).toBe(1)
      expect(result.progress).toBe(0.98)
    })
  })

  describe('level 2 calculations', () => {
    it('should return level 2 for 50 XP (exact threshold)', () => {
      const result = calculateLevelInfo(50)
      expect(result.level).toBe(2)
      expect(result.xpIntoLevel).toBe(0)
      expect(result.xpForNext).toBe(100)
      expect(result.xpRemaining).toBe(100)
      expect(result.progress).toBe(0)
    })

    it('should return level 2 for 75 XP', () => {
      const result = calculateLevelInfo(75)
      expect(result.level).toBe(2)
      expect(result.xpIntoLevel).toBe(25)
      expect(result.xpForNext).toBe(100)
      expect(result.xpRemaining).toBe(75)
      expect(result.progress).toBe(0.25)
    })

    it('should return level 2 for 149 XP', () => {
      const result = calculateLevelInfo(149)
      expect(result.level).toBe(2)
      expect(result.xpIntoLevel).toBe(99)
      expect(result.xpForNext).toBe(100)
      expect(result.xpRemaining).toBe(1)
      expect(result.progress).toBe(0.99)
    })
  })

  describe('level 3 calculations', () => {
    it('should return level 3 for 150 XP (exact threshold)', () => {
      const result = calculateLevelInfo(150)
      expect(result.level).toBe(3)
      expect(result.xpIntoLevel).toBe(0)
      expect(result.xpForNext).toBe(150)
      expect(result.xpRemaining).toBe(150)
      expect(result.progress).toBe(0)
    })

    it('should return level 3 for 200 XP', () => {
      const result = calculateLevelInfo(200)
      expect(result.level).toBe(3)
      expect(result.xpIntoLevel).toBe(50)
      expect(result.xpForNext).toBe(150)
      expect(result.xpRemaining).toBe(100)
      expect(result.progress).toBeCloseTo(0.333, 3)
    })
  })

  describe('level 4 calculations', () => {
    it('should return level 4 for 300 XP (exact threshold)', () => {
      const result = calculateLevelInfo(300)
      expect(result.level).toBe(4)
      expect(result.xpIntoLevel).toBe(0)
      expect(result.xpForNext).toBe(200)
      expect(result.xpRemaining).toBe(200)
      expect(result.progress).toBe(0)
    })
  })

  describe('level 5 calculations', () => {
    it('should return level 5 for 500 XP (exact threshold)', () => {
      const result = calculateLevelInfo(500)
      expect(result.level).toBe(5)
      expect(result.xpIntoLevel).toBe(0)
      expect(result.xpForNext).toBe(250)
      expect(result.xpRemaining).toBe(250)
      expect(result.progress).toBe(0)
    })
  })

  describe('level 10 calculations', () => {
    it('should return level 10 for 2250 XP (exact threshold)', () => {
      const result = calculateLevelInfo(2250)
      expect(result.level).toBe(10)
      expect(result.xpIntoLevel).toBe(0)
      expect(result.xpForNext).toBe(500)
      expect(result.xpRemaining).toBe(500)
      expect(result.progress).toBe(0)
    })
  })

  describe('progress calculations', () => {
    it('should clamp progress to 0 when xpIntoLevel is 0', () => {
      const result = calculateLevelInfo(50)
      expect(result.progress).toBe(0)
    })

    it('should clamp progress to 1 when xpIntoLevel equals xpForNext', () => {
      const result = calculateLevelInfo(149)
      expect(result.progress).toBeLessThanOrEqual(1)
    })

    it('should calculate progress correctly as fraction', () => {
      const result = calculateLevelInfo(100)
      expect(result.progress).toBeCloseTo(0.5, 3)
    })
  })

  describe('edge cases', () => {
    it('should handle negative XP', () => {
      const result = calculateLevelInfo(-10)
      expect(result.level).toBe(1)
      expect(result.xpIntoLevel).toBe(-10)
      expect(result.xpRemaining).toBe(60)
      expect(result.progress).toBe(0)
    })

    it('should handle very large XP values', () => {
      const result = calculateLevelInfo(10000)
      expect(result.level).toBeGreaterThan(10)
      expect(result.xpForNext).toBeGreaterThan(0)
      expect(result.progress).toBeGreaterThanOrEqual(0)
      expect(result.progress).toBeLessThanOrEqual(1)
    })

    it('should handle decimal XP values', () => {
      const result = calculateLevelInfo(25.5)
      expect(result.level).toBe(1)
      expect(result.xpIntoLevel).toBe(25.5)
      expect(result.progress).toBeCloseTo(0.51, 2)
    })
  })

  describe('formula validation', () => {
    it('should follow the formula: XP to reach level L = 25 * L * (L-1)', () => {
      // Level 1: 25 * 1 * 0 = 0
      expect(calculateLevelInfo(0).level).toBe(1)
      
      // Level 2: 25 * 2 * 1 = 50
      expect(calculateLevelInfo(50).level).toBe(2)
      
      // Level 3: 25 * 3 * 2 = 150
      expect(calculateLevelInfo(150).level).toBe(3)
      
      // Level 4: 25 * 4 * 3 = 300
      expect(calculateLevelInfo(300).level).toBe(4)
      
      // Level 5: 25 * 5 * 4 = 500
      expect(calculateLevelInfo(500).level).toBe(5)
    })

    it('should calculate XP to next level as 50 * current level', () => {
      expect(calculateLevelInfo(0).xpForNext).toBe(50)    // Level 1
      expect(calculateLevelInfo(50).xpForNext).toBe(100)  // Level 2
      expect(calculateLevelInfo(150).xpForNext).toBe(150) // Level 3
      expect(calculateLevelInfo(300).xpForNext).toBe(200) // Level 4
      expect(calculateLevelInfo(500).xpForNext).toBe(250) // Level 5
    })
  })

  describe('return type', () => {
    it('should return LevelInfo interface with all required fields', () => {
      const result = calculateLevelInfo(100)
      expect(result).toHaveProperty('level')
      expect(result).toHaveProperty('xpIntoLevel')
      expect(result).toHaveProperty('xpForNext')
      expect(result).toHaveProperty('xpRemaining')
      expect(result).toHaveProperty('progress')
    })

    it('should return correct types for all fields', () => {
      const result = calculateLevelInfo(100)
      expect(typeof result.level).toBe('number')
      expect(typeof result.xpIntoLevel).toBe('number')
      expect(typeof result.xpForNext).toBe('number')
      expect(typeof result.xpRemaining).toBe('number')
      expect(typeof result.progress).toBe('number')
    })
  })
})
