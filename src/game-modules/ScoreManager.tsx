/**
 * ========================================
 * PHASE 5.2: SCORE MANAGER
 * ========================================
 * 
 * Score tracking, achievements, and statistics system
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState, useEffect } from 'react';

// ===== SCORE TYPES =====
export interface ScoreData {
  current: number;
  best: number;
  session: number;
  total: number;
  
  // Detailed scoring
  obstaclesPassed: number;
  coinsCollected: number;
  powerUpsUsed: number;
  perfectRuns: number;
  
  // Time tracking
  sessionTime: number;
  totalPlayTime: number;
  averageScore: number;
  
  // Streaks
  currentStreak: number;
  bestStreak: number;
  deathlessStreak: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'score' | 'survival' | 'collection' | 'special';
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GameStats {
  // Game counts
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  
  // Performance
  averageScore: number;
  averageTime: number;
  bestTime: number;
  
  // Detailed stats
  totalJumps: number;
  totalDistance: number;
  totalCoins: number;
  totalDeaths: number;
  
  // Daily stats
  dailyPlays: number;
  dailyBest: number;
  dailyStreak: number;
  lastPlayDate: string;
}

export interface ScoreConfig {
  // Scoring settings
  obstaclePoints: number;
  coinPoints: number;
  distancePoints: number;
  timeBonus: boolean;
  
  // Multipliers
  streakMultiplier: number;
  difficultyMultiplier: number;
  powerUpMultiplier: number;
  
  // Achievement settings
  enableAchievements: boolean;
  notifyOnUnlock: boolean;
  
  // Persistence settings
  autoSave: boolean;
  saveInterval: number;
  
  // Debug settings
  showDetailedStats: boolean;
  logScoreChanges: boolean;
}

export interface ScoreManagerReturn {
  // Score data
  score: ScoreData;
  achievements: Achievement[];
  stats: GameStats;
  config: ScoreConfig;
  
  // Score operations
  addScore: (points: number, source?: string) => void;
  addObstacleScore: () => void;
  addCoinScore: (count?: number) => void;
  addDistanceScore: (distance: number) => void;
  addTimeBonus: (time: number) => void;
  
  // Game session management
  startGame: () => void;
  endGame: (finalScore?: number) => void;
  resetScore: () => void;
  resetSession: () => void;
  
  // Achievement system
  checkAchievements: () => Achievement[];
  unlockAchievement: (id: string) => boolean;
  getUnlockedAchievements: () => Achievement[];
  getAchievementProgress: (id: string) => number;
  
  // Statistics
  updateStats: (statUpdates: Partial<GameStats>) => void;
  getScoreRank: () => string;
  getSessionSummary: () => string;
  getAchievementSummary: () => string;
  
  // Data management
  saveData: () => void;
  loadData: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
  
  // Configuration
  updateConfig: (newConfig: Partial<ScoreConfig>) => void;
  getScoreInfo: () => string;
}

// ===== DEFAULT VALUES =====
const DEFAULT_SCORE_DATA: ScoreData = {
  current: 0,
  best: 0,
  session: 0,
  total: 0,
  obstaclesPassed: 0,
  coinsCollected: 0,
  powerUpsUsed: 0,
  perfectRuns: 0,
  sessionTime: 0,
  totalPlayTime: 0,
  averageScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  deathlessStreak: 0,
};

const DEFAULT_GAME_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  averageScore: 0,
  averageTime: 0,
  bestTime: 0,
  totalJumps: 0,
  totalDistance: 0,
  totalCoins: 0,
  totalDeaths: 0,
  dailyPlays: 0,
  dailyBest: 0,
  dailyStreak: 0,
  lastPlayDate: new Date().toDateString(),
};

const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  obstaclePoints: 1,
  coinPoints: 5,
  distancePoints: 0.1,
  timeBonus: false,
  streakMultiplier: 1.1,
  difficultyMultiplier: 1.0,
  powerUpMultiplier: 1.2,
  enableAchievements: true,
  notifyOnUnlock: true,
  autoSave: true,
  saveInterval: 10000, // 10 seconds
  showDetailedStats: false,
  logScoreChanges: false,
};

// ===== ACHIEVEMENTS DEFINITIONS =====
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_score',
    name: 'First Flight',
    description: 'Score your first point',
    category: 'score',
    requirement: 1,
    progress: 0,
    unlocked: false,
    icon: '🐣',
    rarity: 'common',
  },
  {
    id: 'score_10',
    name: 'Getting Started',
    description: 'Reach 10 points',
    category: 'score',
    requirement: 10,
    progress: 0,
    unlocked: false,
    icon: '🥉',
    rarity: 'common',
  },
  {
    id: 'score_50',
    name: 'Flying High',
    description: 'Reach 50 points',
    category: 'score',
    requirement: 50,
    progress: 0,
    unlocked: false,
    icon: '🥈',
    rarity: 'rare',
  },
  {
    id: 'score_100',
    name: 'Century Club',
    description: 'Reach 100 points',
    category: 'score',
    requirement: 100,
    progress: 0,
    unlocked: false,
    icon: '🥇',
    rarity: 'epic',
  },
  {
    id: 'coin_collector',
    name: 'Coin Collector',
    description: 'Collect 100 coins',
    category: 'collection',
    requirement: 100,
    progress: 0,
    unlocked: false,
    icon: '🪙',
    rarity: 'rare',
  },
  {
    id: 'survival_expert',
    name: 'Survival Expert',
    description: 'Survive for 60 seconds',
    category: 'survival',
    requirement: 60000, // 60 seconds in ms
    progress: 0,
    unlocked: false,
    icon: '⏱️',
    rarity: 'epic',
  },
  {
    id: 'perfect_run',
    name: 'Perfect Run',
    description: 'Complete a run without taking damage',
    category: 'special',
    requirement: 1,
    progress: 0,
    unlocked: false,
    icon: '✨',
    rarity: 'legendary',
  },
];

// ===== SCORE MANAGER HOOK =====
export const useScoreManager = (
  initialConfig: Partial<ScoreConfig> = {}
): ScoreManagerReturn => {
  
  // State
  const [score, setScore] = useState<ScoreData>(DEFAULT_SCORE_DATA);
  const [achievements, setAchievements] = useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [stats, setStats] = useState<GameStats>(DEFAULT_GAME_STATS);
  const [config, setConfig] = useState<ScoreConfig>({ ...DEFAULT_SCORE_CONFIG, ...initialConfig });
  
  // Internal tracking
  const gameStartTime = useRef<number>(0);
  const lastSave = useRef<number>(0);
  const scoreHistory = useRef<Array<{ score: number; timestamp: number; source: string }>>([]);

  // ===== STORAGE KEYS =====
  const STORAGE_KEYS = {
    score: 'flappybird_score_data',
    achievements: 'flappybird_achievements',
    stats: 'flappybird_stats',
    config: 'flappybird_score_config',
  };

  // ===== UTILITY FUNCTIONS =====
  const calculateMultiplier = useCallback((): number => {
    let multiplier = 1.0;
    
    // Streak multiplier
    if (score.currentStreak > 0) {
      multiplier *= Math.pow(config.streakMultiplier, score.currentStreak);
    }
    
    // Difficulty multiplier
    multiplier *= config.difficultyMultiplier;
    
    return Math.min(multiplier, 5.0); // Cap at 5x
  }, [score.currentStreak, config.streakMultiplier, config.difficultyMultiplier]);

  const logScoreChange = useCallback((points: number, source: string, total: number) => {
    if (config.logScoreChanges) {
      console.log(`📊 +${points} (${source}) → ${total} [x${calculateMultiplier().toFixed(2)}]`);
    }
    
    scoreHistory.current.push({
      score: points,
      timestamp: Date.now(),
      source,
    });
    
    // Keep only last 100 entries
    if (scoreHistory.current.length > 100) {
      scoreHistory.current = scoreHistory.current.slice(-100);
    }
  }, [config.logScoreChanges, calculateMultiplier]);

  // ===== SCORE OPERATIONS =====
  const addScore = useCallback((points: number, source: string = 'manual') => {
    const multiplier = calculateMultiplier();
    const finalPoints = Math.floor(points * multiplier);
    
    setScore(prev => {
      const newCurrent = prev.current + finalPoints;
      const newTotal = prev.total + finalPoints;
      const newBest = Math.max(prev.best, newCurrent);
      
      logScoreChange(finalPoints, source, newCurrent);
      
      return {
        ...prev,
        current: newCurrent,
        best: newBest,
        total: newTotal,
        averageScore: newTotal / Math.max(1, stats.gamesPlayed),
      };
    });
  }, [calculateMultiplier, logScoreChange, stats.gamesPlayed]);

  const addObstacleScore = useCallback(() => {
    addScore(config.obstaclePoints, 'obstacle');
    
    setScore(prev => ({
      ...prev,
      obstaclesPassed: prev.obstaclesPassed + 1,
      currentStreak: prev.currentStreak + 1,
    }));
  }, [config.obstaclePoints, addScore]);

  const addCoinScore = useCallback((count: number = 1) => {
    addScore(config.coinPoints * count, 'coin');
    
    setScore(prev => ({
      ...prev,
      coinsCollected: prev.coinsCollected + count,
    }));
  }, [config.coinPoints, addScore]);

  const addDistanceScore = useCallback((distance: number) => {
    if (config.distancePoints > 0) {
      addScore(distance * config.distancePoints, 'distance');
    }
  }, [config.distancePoints, addScore]);

  const addTimeBonus = useCallback((time: number) => {
    if (config.timeBonus) {
      const bonus = Math.floor(time / 1000); // 1 point per second
      addScore(bonus, 'time_bonus');
    }
  }, [config.timeBonus, addScore]);

  // ===== GAME SESSION MANAGEMENT =====
  const startGame = useCallback(() => {
    gameStartTime.current = Date.now();
    
    setScore(prev => ({
      ...prev,
      current: 0,
      currentStreak: 0,
    }));
    
    setStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      dailyPlays: prev.dailyPlays + 1,
    }));
    
    console.log('🎮 Game started - score tracking active');
  }, []);

  const endGame = useCallback((finalScore?: number) => {
    const sessionTime = Date.now() - gameStartTime.current;
    const gameScore = finalScore ?? score.current;
    
    setScore(prev => {
      const newBest = Math.max(prev.best, gameScore);
      const newBestStreak = Math.max(prev.bestStreak, prev.currentStreak);
      
      return {
        ...prev,
        session: prev.session + gameScore,
        sessionTime: prev.sessionTime + sessionTime,
        totalPlayTime: prev.totalPlayTime + sessionTime,
        bestStreak: newBestStreak,
        best: newBest,
      };
    });
    
    setStats(prev => ({
      ...prev,
      gamesLost: prev.gamesLost + 1,
      totalDeaths: prev.totalDeaths + 1,
      averageTime: (prev.averageTime * (prev.gamesPlayed - 1) + sessionTime) / prev.gamesPlayed,
      bestTime: Math.max(prev.bestTime, sessionTime),
      dailyBest: Math.max(prev.dailyBest, gameScore),
    }));
    
    // Check achievements
    checkAchievements();
    
    // Auto save
    if (config.autoSave) {
      saveData();
    }
    
    console.log(`🏁 Game ended - Score: ${gameScore}, Time: ${(sessionTime/1000).toFixed(1)}s`);
  }, [score.current, config.autoSave]);

  const resetScore = useCallback(() => {
    setScore(DEFAULT_SCORE_DATA);
    scoreHistory.current = [];
    console.log('🔄 Score reset');
  }, []);

  const resetSession = useCallback(() => {
    setScore(prev => ({
      ...prev,
      session: 0,
      sessionTime: 0,
    }));
    console.log('🔄 Session reset');
  }, []);

  // ===== ACHIEVEMENT SYSTEM =====
  const checkAchievements = useCallback((): Achievement[] => {
    if (!config.enableAchievements) return [];
    
    const newlyUnlocked: Achievement[] = [];
    
    setAchievements(prev => prev.map(achievement => {
      if (achievement.unlocked) return achievement;
      
      let progress = 0;
      
      switch (achievement.id) {
        case 'first_score':
        case 'score_10':
        case 'score_50':
        case 'score_100':
          progress = score.current;
          break;
        case 'coin_collector':
          progress = score.coinsCollected;
          break;
        case 'survival_expert':
          progress = score.sessionTime;
          break;
        case 'perfect_run':
          progress = score.perfectRuns;
          break;
      }
      
      const updatedAchievement = { ...achievement, progress };
      
      if (progress >= achievement.requirement && !achievement.unlocked) {
        updatedAchievement.unlocked = true;
        updatedAchievement.unlockedAt = Date.now();
        newlyUnlocked.push(updatedAchievement);
        
        if (config.notifyOnUnlock) {
          console.log(`🏆 Achievement Unlocked: ${achievement.name} - ${achievement.description}`);
        }
      }
      
      return updatedAchievement;
    }));
    
    return newlyUnlocked;
  }, [config.enableAchievements, config.notifyOnUnlock, score]);

  const unlockAchievement = useCallback((id: string): boolean => {
    let unlocked = false;
    
    setAchievements(prev => prev.map(achievement => {
      if (achievement.id === id && !achievement.unlocked) {
        unlocked = true;
        console.log(`🏆 Manual unlock: ${achievement.name}`);
        return {
          ...achievement,
          unlocked: true,
          unlockedAt: Date.now(),
          progress: achievement.requirement,
        };
      }
      return achievement;
    }));
    
    return unlocked;
  }, []);

  const getUnlockedAchievements = useCallback((): Achievement[] => {
    return achievements.filter(a => a.unlocked);
  }, [achievements]);

  const getAchievementProgress = useCallback((id: string): number => {
    const achievement = achievements.find(a => a.id === id);
    return achievement ? (achievement.progress / achievement.requirement) * 100 : 0;
  }, [achievements]);

  // ===== STATISTICS =====
  const updateStats = useCallback((statUpdates: Partial<GameStats>) => {
    setStats(prev => ({ ...prev, ...statUpdates }));
  }, []);

  const getScoreRank = useCallback((): string => {
    const current = score.current;
    if (current >= 100) return 'Legendary';
    if (current >= 50) return 'Expert';
    if (current >= 25) return 'Advanced';
    if (current >= 10) return 'Intermediate';
    if (current >= 1) return 'Beginner';
    return 'Rookie';
  }, [score.current]);

  const getSessionSummary = useCallback((): string => {
    return [
      `🎯 Score: ${score.current}`,
      `⭐ Best: ${score.best}`,
      `🔥 Streak: ${score.currentStreak}`,
      `⏱️ Time: ${(score.sessionTime / 1000).toFixed(1)}s`,
    ].join(' | ');
  }, [score]);

  const getAchievementSummary = useCallback((): string => {
    const unlocked = getUnlockedAchievements().length;
    const total = achievements.length;
    return `🏆 ${unlocked}/${total} achievements (${((unlocked/total)*100).toFixed(0)}%)`;
  }, [achievements.length, getUnlockedAchievements]);

  // ===== DATA MANAGEMENT =====
  const saveData = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.score, JSON.stringify(score));
      localStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify(achievements));
      localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
      localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
      lastSave.current = Date.now();
      console.log('💾 Score data saved');
    } catch (error) {
      console.error('❌ Failed to save score data:', error);
    }
  }, [score, achievements, stats, config, STORAGE_KEYS]);

  const loadData = useCallback(() => {
    try {
      const savedScore = localStorage.getItem(STORAGE_KEYS.score);
      const savedAchievements = localStorage.getItem(STORAGE_KEYS.achievements);
      const savedStats = localStorage.getItem(STORAGE_KEYS.stats);
      const savedConfig = localStorage.getItem(STORAGE_KEYS.config);
      
      if (savedScore) setScore(JSON.parse(savedScore));
      if (savedAchievements) setAchievements(JSON.parse(savedAchievements));
      if (savedStats) setStats(JSON.parse(savedStats));
      if (savedConfig) setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
      
      console.log('📁 Score data loaded');
    } catch (error) {
      console.error('❌ Failed to load score data:', error);
    }
  }, [STORAGE_KEYS]);

  const exportData = useCallback((): string => {
    return JSON.stringify({
      score,
      achievements,
      stats,
      config,
      exportedAt: Date.now(),
    });
  }, [score, achievements, stats, config]);

  const importData = useCallback((data: string): boolean => {
    try {
      const imported = JSON.parse(data);
      
      if (imported.score) setScore(imported.score);
      if (imported.achievements) setAchievements(imported.achievements);
      if (imported.stats) setStats(imported.stats);
      if (imported.config) setConfig(prev => ({ ...prev, ...imported.config }));
      
      console.log('📥 Data imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import data:', error);
      return false;
    }
  }, []);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<ScoreConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getScoreInfo = useCallback((): string => {
    return [
      `📊 ${score.current}/${score.best}`,
      `🎮 Games: ${stats.gamesPlayed}`,
      `🏆 Achievements: ${getUnlockedAchievements().length}/${achievements.length}`,
      `📈 Rank: ${getScoreRank()}`,
    ].join(' | ');
  }, [score, stats, achievements.length, getUnlockedAchievements, getScoreRank]);

  // ===== AUTO-SAVE EFFECT =====
  useEffect(() => {
    if (config.autoSave) {
      const interval = setInterval(() => {
        if (Date.now() - lastSave.current >= config.saveInterval) {
          saveData();
        }
      }, config.saveInterval);
      
      return () => clearInterval(interval);
    }
  }, [config.autoSave, config.saveInterval, saveData]);

  // ===== LOAD DATA ON MOUNT =====
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    score,
    achievements,
    stats,
    config,
    addScore,
    addObstacleScore,
    addCoinScore,
    addDistanceScore,
    addTimeBonus,
    startGame,
    endGame,
    resetScore,
    resetSession,
    checkAchievements,
    unlockAchievement,
    getUnlockedAchievements,
    getAchievementProgress,
    updateStats,
    getScoreRank,
    getSessionSummary,
    getAchievementSummary,
    saveData,
    loadData,
    exportData,
    importData,
    updateConfig,
    getScoreInfo,
  };
};

export default useScoreManager;