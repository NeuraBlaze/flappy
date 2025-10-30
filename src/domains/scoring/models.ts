/**
 * Scoring Domain - Models
 * Core scoring and achievement entities
 */

import { Achievement, GameStats, LeaderboardEntry, StatType, ProgressionPort, LevelUpResult, LevelReward } from './ports';

// Achievement system model
export class AchievementModel {
  private achievements: Achievement[];

  constructor(defaultAchievements: Achievement[]) {
    this.achievements = defaultAchievements.map(achievement => ({ ...achievement }));
  }

  getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  unlockAchievement(id: string): boolean {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      return true;
    }
    return false;
  }

  checkAchievements(stats: GameStats): string[] {
    const newlyUnlocked: string[] = [];
    
    this.achievements.forEach(achievement => {
      if (!achievement.unlocked) {
        const statValue = stats[achievement.requirement.type];
        if (statValue >= achievement.requirement.value) {
          achievement.unlocked = true;
          newlyUnlocked.push(achievement.id);
        }
      }
    });

    return newlyUnlocked;
  }

  getUnlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  isUnlocked(id: string): boolean {
    const achievement = this.achievements.find(a => a.id === id);
    return achievement ? achievement.unlocked : false;
  }
}

// Score management model
export class ScoreModel {
  private currentScore: number = 0;
  private highScore: number = 0;

  constructor(initialHighScore: number = 0) {
    this.highScore = initialHighScore;
  }

  getCurrentScore(): number {
    return this.currentScore;
  }

  getHighScore(): number {
    return this.highScore;
  }

  addScore(points: number): void {
    this.currentScore += points;
  }

  resetScore(): void {
    this.currentScore = 0;
  }

  updateHighScore(): boolean {
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      return true;
    }
    return false;
  }

  setHighScore(score: number): void {
    this.highScore = score;
  }
}

// Statistics tracking model
export class StatsModel {
  private stats: GameStats;

  constructor(initialStats?: Partial<GameStats>) {
    this.stats = {
      gamesPlayed: 0,
      totalScore: 0,
      highScore: 0,
      coinsCollected: 0,
      powerUpsUsed: 0,
      shieldActivations: 0,
      pipesCleared: 0,
      totalJumps: 0,
      totalPlayTime: 0,
      crashCount: 0,
      perfectRuns: 0,
      ...initialStats
    };
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  incrementStat(stat: StatType, value: number = 1): void {
    this.stats[stat] += value;
  }

  resetStats(): void {
    this.stats = {
      gamesPlayed: 0,
      totalScore: 0,
      highScore: this.stats.highScore, // Keep high score
      coinsCollected: 0,
      powerUpsUsed: 0,
      shieldActivations: 0,
      pipesCleared: 0,
      totalJumps: 0,
      totalPlayTime: 0,
      crashCount: 0,
      perfectRuns: 0
    };
  }

  getStatValue(stat: StatType): number {
    return this.stats[stat];
  }

  updateStat(stat: StatType, value: number): void {
    this.stats[stat] = value;
  }
}

// Leaderboard model
export class LeaderboardModel {
  private entries: LeaderboardEntry[] = [];
  private maxEntries: number = 10;

  constructor(maxEntries: number = 10) {
    this.maxEntries = maxEntries;
  }

  addScore(playerName: string, score: number): void {
    const newEntry: LeaderboardEntry = {
      rank: 0, // Will be calculated after sorting
      playerName,
      score,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      achievements: []
    };

    this.entries.push(newEntry);
    this.sortAndRank();
    
    // Keep only top entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
  }

  getTopScores(limit: number = this.maxEntries): LeaderboardEntry[] {
    return this.entries.slice(0, limit);
  }

  isHighScore(score: number): boolean {
    if (this.entries.length < this.maxEntries) return true;
    return score > this.entries[this.entries.length - 1].score;
  }

  getCurrentRank(score: number): number {
    let rank = 1;
    for (const entry of this.entries) {
      if (score <= entry.score) {
        rank++;
      } else {
        break;
      }
    }
    return rank;
  }

  private sortAndRank(): void {
    this.entries.sort((a, b) => b.score - a.score);
    this.entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
  }

  loadEntries(entries: LeaderboardEntry[]): void {
    this.entries = entries;
    this.sortAndRank();
  }
}

// Progression model
export class ProgressionModel implements ProgressionPort {
  private level: number = 1;
  private experience: number = 0;
  private readonly baseXpPerLevel = 100;
  private readonly xpMultiplier = 1.5;

  constructor(initialLevel: number = 1, initialXp: number = 0) {
    this.level = initialLevel;
    this.experience = initialXp;
  }

  getCurrentLevel(): number {
    return this.level;
  }

  getExperience(): number {
    return this.experience;
  }

  getExperienceToNextLevel(): number {
    const requiredXp = this.getRequiredXpForLevel(this.level + 1);
    const currentLevelXp = this.getRequiredXpForLevel(this.level);
    const progressXp = this.experience - currentLevelXp;
    return requiredXp - currentLevelXp - progressXp;
  }

  addExperience(xp: number): LevelUpResult {
    this.experience += xp;
    const oldLevel = this.level;
    
    // Check for level ups
    while (this.experience >= this.getRequiredXpForLevel(this.level + 1)) {
      this.level++;
    }

    const leveledUp = this.level > oldLevel;
    const rewards = leveledUp ? this.getLevelRewards(this.level) : [];

    return {
      leveledUp,
      newLevel: this.level,
      rewards
    };
  }

  getLevelRewards(level: number): LevelReward[] {
    const rewards: LevelReward[] = [];
    
    // Base rewards for every level
    rewards.push({
      type: 'coins',
      value: level * 50,
      description: `${level * 50} coins for reaching level ${level}!`
    });

    // Special rewards for milestone levels
    if (level % 5 === 0) {
      rewards.push({
        type: 'powerup',
        value: 'shield',
        description: 'Free shield power-up!'
      });
    }

    if (level % 10 === 0) {
      rewards.push({
        type: 'skin',
        value: `special_${Math.floor(level / 10)}`,
        description: `Unlocked special skin: Level ${level} Master!`
      });
    }

    return rewards;
  }

  private getRequiredXpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(this.baseXpPerLevel * Math.pow(this.xpMultiplier, level - 2));
  }
}