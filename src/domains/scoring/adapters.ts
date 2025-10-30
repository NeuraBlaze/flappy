/**
 * Scoring Domain Adapters
 * Concrete implementations for scoring functionality
 */

import { 
  AchievementPort, 
  ScorePort, 
  StatsPort, 
  LeaderboardPort,
  Achievement,
  GameStats,
  LeaderboardEntry,
  StatType
} from './ports';
import { 
  AchievementModel, 
  ScoreModel, 
  StatsModel, 
  LeaderboardModel 
} from './models';
import { DEFAULT_ACHIEVEMENTS } from '../../shared/constants/achievements.constants';

/**
 * Achievement Adapter - Manages achievement unlocking and progress
 */
export class AchievementAdapter implements AchievementPort {
  private achievementModel: AchievementModel;

  constructor() {
    this.achievementModel = new AchievementModel(DEFAULT_ACHIEVEMENTS);
  }

  getAchievements(): Achievement[] {
    return this.achievementModel.getAchievements();
  }

  unlockAchievement(id: string): boolean {
    return this.achievementModel.unlockAchievement(id);
  }

  checkAchievements(stats: GameStats): string[] {
    return this.achievementModel.checkAchievements(stats);
  }

  getUnlockedCount(): number {
    return this.achievementModel.getUnlockedCount();
  }
}

/**
 * Score Adapter - Manages score tracking and validation
 */
export class ScoreAdapter implements ScorePort {
  private scoreModel: ScoreModel;

  constructor() {
    this.scoreModel = new ScoreModel();
  }

  getCurrentScore(): number {
    return this.scoreModel.getCurrentScore();
  }

  getHighScore(): number {
    return this.scoreModel.getHighScore();
  }

  addScore(points: number): void {
    this.scoreModel.addScore(points);
  }

  resetScore(): void {
    this.scoreModel.resetScore();
  }

  updateHighScore(): boolean {
    return this.scoreModel.updateHighScore();
  }
}

/**
 * Stats Adapter - Manages game statistics tracking
 */
export class StatsAdapter implements StatsPort {
  private statsModel: StatsModel;

  constructor() {
    this.statsModel = new StatsModel();
  }

  getStats(): GameStats {
    return this.statsModel.getStats();
  }

  incrementStat(stat: StatType, value: number = 1): void {
    this.statsModel.incrementStat(stat, value);
  }

  resetStats(): void {
    this.statsModel.resetStats();
  }

  getStatValue(stat: StatType): number {
    return this.statsModel.getStatValue(stat);
  }
}

/**
 * Leaderboard Adapter - Manages leaderboard functionality
 */
export class LeaderboardAdapter implements LeaderboardPort {
  private leaderboardModel: LeaderboardModel;

  constructor() {
    this.leaderboardModel = new LeaderboardModel();
  }

  addScore(playerName: string, score: number): void {
    this.leaderboardModel.addScore(playerName, score);
  }

  getTopScores(limit: number = 10): LeaderboardEntry[] {
    return this.leaderboardModel.getTopScores(limit);
  }

  isHighScore(score: number): boolean {
    return this.leaderboardModel.isHighScore(score);
  }

  getCurrentRank(score: number): number {
    return this.leaderboardModel.getCurrentRank(score);
  }
}