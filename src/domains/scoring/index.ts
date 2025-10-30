/**
 * Scoring Domain - Main Exports
 */

export * from './ports';
export * from './models';
export * from './adapters';

// Re-export commonly used items for convenience
export { 
  AchievementAdapter,
  ScoreAdapter,
  StatsAdapter,
  LeaderboardAdapter
} from './adapters';

export type {
  Achievement,
  GameStats,
  LeaderboardEntry,
  StatType,
  AchievementPort,
  ScorePort,
  StatsPort,
  LeaderboardPort
} from './ports';