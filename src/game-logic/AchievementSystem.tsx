// ===== 🏆 ACHIEVEMENT SYSTEM =====
// Achievement tracking and unlock management
// Separated from main game component for modularity

import { useState, useCallback, useEffect } from 'react';

// ===== INTERFACES =====
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
  // Progress tracking for incremental achievements
  progress?: number;
  maxProgress?: number;
}

export interface AchievementProgress {
  powerUpsUsed: number;
  shieldHits: number;
  rainbowModeUsed: boolean;
  firstFlight: boolean;
  // Game session stats for achievement checking
  sessionScore: number;
  sessionCoins: number;
  totalCoins: number;
}

export interface AchievementSystemConfig {
  // Achievement requirements
  coinCollectorThreshold: number;
  highFlyerThreshold: number;
  powerUserThreshold: number;
  shieldMasterThreshold: number;
  // Storage keys
  achievementsStorageKey: string;
  progressStorageKey: string;
  // Achievement notification settings
  showNotifications: boolean;
  notificationDuration: number;
}

export interface UseAchievementSystemReturn {
  // State
  achievements: Achievement[];
  progress: AchievementProgress;
  
  // Actions
  unlockAchievement: (id: string) => void;
  checkAchievements: () => void;
  updateProgress: (updates: Partial<AchievementProgress>) => void;
  resetProgress: () => void;
  
  // Utilities
  isAchievementUnlocked: (id: string) => boolean;
  getAchievementProgress: (id: string) => number;
  unlockAllAchievements: () => void; // Debug function
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: AchievementSystemConfig = {
  coinCollectorThreshold: 50,
  highFlyerThreshold: 20,
  powerUserThreshold: 10,
  shieldMasterThreshold: 5,
  achievementsStorageKey: "szenyo_madar_achievements",
  progressStorageKey: "szenyo_madar_achievement_progress",
  showNotifications: true,
  notificationDuration: 3000,
};

// ===== DEFAULT ACHIEVEMENTS =====
const defaultAchievements: Achievement[] = [
  { 
    id: 'first_flight', 
    name: 'Első Repülés', 
    description: 'Repülj először!', 
    unlocked: false, 
    icon: '🐣' 
  },
  { 
    id: 'coin_collector', 
    name: 'Érme Gyűjtő', 
    description: 'Gyűjts 50 érmét!', 
    unlocked: false, 
    icon: '💰',
    progress: 0,
    maxProgress: 50
  },
  { 
    id: 'high_flyer', 
    name: 'Magas Repülő', 
    description: 'Érj el 20 pontot!', 
    unlocked: false, 
    icon: '🚀',
    progress: 0,
    maxProgress: 20
  },
  { 
    id: 'power_user', 
    name: 'Power Felhasználó', 
    description: 'Használj 10 power-upot!', 
    unlocked: false, 
    icon: '⚡',
    progress: 0,
    maxProgress: 10
  },
  { 
    id: 'shield_master', 
    name: 'Pajzs Mester', 
    description: 'Túlélj 5 ütközést pajzzsal!', 
    unlocked: false, 
    icon: '🛡️',
    progress: 0,
    maxProgress: 5
  },
  { 
    id: 'rainbow_rider', 
    name: 'Szivárvány Lovas', 
    description: 'Használd a rainbow mode-ot!', 
    unlocked: false, 
    icon: '🌈' 
  }
];

// ===== DEFAULT PROGRESS =====
const defaultProgress: AchievementProgress = {
  powerUpsUsed: 0,
  shieldHits: 0,
  rainbowModeUsed: false,
  firstFlight: false,
  sessionScore: 0,
  sessionCoins: 0,
  totalCoins: 0,
};

// ===== CUSTOM HOOK =====
export function useAchievementSystem(
  config: Partial<AchievementSystemConfig> = {}
): UseAchievementSystemReturn {
  const finalConfig = { ...defaultConfig, ...config };
  
  // ===== STATE =====
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem(finalConfig.achievementsStorageKey);
    return saved ? JSON.parse(saved) : defaultAchievements;
  });
  
  const [progress, setProgress] = useState<AchievementProgress>(() => {
    const saved = localStorage.getItem(finalConfig.progressStorageKey);
    return saved ? JSON.parse(saved) : defaultProgress;
  });
  
  // ===== PERSISTENCE =====
  useEffect(() => {
    localStorage.setItem(finalConfig.achievementsStorageKey, JSON.stringify(achievements));
  }, [achievements, finalConfig.achievementsStorageKey]);
  
  useEffect(() => {
    localStorage.setItem(finalConfig.progressStorageKey, JSON.stringify(progress));
  }, [progress, finalConfig.progressStorageKey]);
  
  // ===== ACTIONS =====
  const unlockAchievement = useCallback((id: string) => {
    setAchievements(prev => {
      const updated = prev.map(ach => 
        ach.id === id && !ach.unlocked ? { ...ach, unlocked: true } : ach
      );
      return updated;
    });
  }, []);
  
  const updateProgress = useCallback((updates: Partial<AchievementProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);
  
  const resetProgress = useCallback(() => {
    setProgress(defaultProgress);
  }, []);
  
  const checkAchievements = useCallback(() => {
    // First Flight - triggered when game starts
    if (progress.firstFlight && !isAchievementUnlocked('first_flight')) {
      unlockAchievement('first_flight');
    }
    
    // Coin Collector - collect 50 coins total
    if (progress.totalCoins >= finalConfig.coinCollectorThreshold && !isAchievementUnlocked('coin_collector')) {
      unlockAchievement('coin_collector');
    }
    
    // High Flyer - reach score of 20
    if (progress.sessionScore >= finalConfig.highFlyerThreshold && !isAchievementUnlocked('high_flyer')) {
      unlockAchievement('high_flyer');
    }
    
    // Power User - use 10 power-ups
    if (progress.powerUpsUsed >= finalConfig.powerUserThreshold && !isAchievementUnlocked('power_user')) {
      unlockAchievement('power_user');
    }
    
    // Shield Master - survive 5 hits with shield
    if (progress.shieldHits >= finalConfig.shieldMasterThreshold && !isAchievementUnlocked('shield_master')) {
      unlockAchievement('shield_master');
    }
    
    // Rainbow Rider - use rainbow mode
    if (progress.rainbowModeUsed && !isAchievementUnlocked('rainbow_rider')) {
      unlockAchievement('rainbow_rider');
    }
    
    // Update progress in achievements for UI display
    setAchievements(prev => prev.map(ach => {
      switch (ach.id) {
        case 'coin_collector':
          return { ...ach, progress: Math.min(progress.totalCoins, ach.maxProgress || 50) };
        case 'high_flyer':
          return { ...ach, progress: Math.min(progress.sessionScore, ach.maxProgress || 20) };
        case 'power_user':
          return { ...ach, progress: Math.min(progress.powerUpsUsed, ach.maxProgress || 10) };
        case 'shield_master':
          return { ...ach, progress: Math.min(progress.shieldHits, ach.maxProgress || 5) };
        default:
          return ach;
      }
    }));
  }, [progress, finalConfig, unlockAchievement]);
  
  // ===== UTILITIES =====
  const isAchievementUnlocked = useCallback((id: string): boolean => {
    return achievements.find(ach => ach.id === id)?.unlocked || false;
  }, [achievements]);
  
  const getAchievementProgress = useCallback((id: string): number => {
    const achievement = achievements.find(ach => ach.id === id);
    if (!achievement || !achievement.maxProgress) return 0;
    return (achievement.progress || 0) / achievement.maxProgress;
  }, [achievements]);
  
  const unlockAllAchievements = useCallback(() => {
    setAchievements(prev => prev.map(ach => ({ ...ach, unlocked: true })));
  }, []);
  
  // ===== AUTO CHECK ACHIEVEMENTS =====
  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);
  
  return {
    // State
    achievements,
    progress,
    
    // Actions
    unlockAchievement,
    checkAchievements,
    updateProgress,
    resetProgress,
    
    // Utilities
    isAchievementUnlocked,
    getAchievementProgress,
    unlockAllAchievements,
  };
}

// ===== COMPONENT EXPORT =====
export default useAchievementSystem;