/**
 * Scoring Domain - Ports (Interfaces)
 * Handles achievements, leaderboards, and progression
 */

// Achievement system
export interface AchievementPort {
  getAchievements(): Achievement[];
  unlockAchievement(id: string): boolean;
  checkAchievements(stats: GameStats): string[];
  getUnlockedCount(): number;
}

// Score management
export interface ScorePort {
  getCurrentScore(): number;
  getHighScore(): number;
  addScore(points: number): void;
  resetScore(): void;
  updateHighScore(): boolean;
}

// Statistics tracking
export interface StatsPort {
  getStats(): GameStats;
  incrementStat(stat: StatType, value?: number): void;
  resetStats(): void;
  getStatValue(stat: StatType): number;
}

// Leaderboard system
export interface LeaderboardPort {
  addScore(playerName: string, score: number): void;
  getTopScores(limit?: number): LeaderboardEntry[];
  isHighScore(score: number): boolean;
  getCurrentRank(score: number): number;
}

// Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requirement: {
    type: StatType;
    value: number;
  };
  reward?: {
    coins?: number;
    powerUp?: string;
  };
}

export interface GameStats {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
  coinsCollected: number;
  powerUpsUsed: number;
  shieldActivations: number;
  pipesCleared: number;
  totalJumps: number;
  totalPlayTime: number; // in seconds
  crashCount: number;
  perfectRuns: number; // runs without crashes
}

export type StatType = keyof GameStats;

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  date: string;
  achievements?: string[];
}

// Progression system
export interface ProgressionPort {
  getCurrentLevel(): number;
  getExperience(): number;
  getExperienceToNextLevel(): number;
  addExperience(xp: number): LevelUpResult;
  getLevelRewards(level: number): LevelReward[];
}

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
  rewards: LevelReward[];
}

export interface LevelReward {
  type: 'coins' | 'powerup' | 'skin' | 'achievement';
  value: string | number;
  description: string;
}