// ===== 💾 STORAGE MANAGER =====
// localStorage handling, data persistence, and save/load operations
// Extracted from main game component for modularity

import { useCallback, useRef, useEffect } from 'react';

// ===== INTERFACES =====
export interface StorageConfig {
  namespace: string;
  version: string;
  enableEncryption: boolean;
  enableCompression: boolean;
  enableBackup: boolean;
  maxBackupFiles: number;
  autoSave: boolean;
  autoSaveInterval: number; // ms
  enableVersionMigration: boolean;
}

export interface SaveData {
  version: string;
  timestamp: string;
  data: Record<string, any>;
  checksum?: string;
}

export interface StorageStats {
  totalKeys: number;
  totalSize: number; // bytes
  usedQuota: number; // percentage
  availableSpace: number; // bytes
  oldestEntry: string;
  newestEntry: string;
  keysWithNamespace: string[];
}

export interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
  version: string;
  description?: string;
}

export interface UseStorageManagerReturn {
  // Basic operations
  save: <T>(key: string, value: T) => boolean;
  load: <T>(key: string, defaultValue?: T) => T | undefined;
  remove: (key: string) => boolean;
  exists: (key: string) => boolean;
  clear: () => boolean;
  
  // Game-specific saves
  saveGameData: (data: GameSaveData) => boolean;
  loadGameData: () => GameSaveData | null;
  saveSettings: (settings: GameSettings) => boolean;
  loadSettings: () => GameSettings;
  saveAchievements: (achievements: Achievement[]) => boolean;
  loadAchievements: () => Achievement[];
  
  // Batch operations
  saveBatch: (data: Record<string, any>) => boolean;
  loadBatch: (keys: string[]) => Record<string, any>;
  
  // Backup and restore
  createBackup: (description?: string) => string | null;
  restoreBackup: (backupId: string) => boolean;
  listBackups: () => BackupInfo[];
  deleteBackup: (backupId: string) => boolean;
  
  // Data export/import
  exportData: (keys?: string[]) => string;
  importData: (data: string, overwrite?: boolean) => boolean;
  
  // Storage management
  getStats: () => StorageStats;
  cleanup: () => number; // Returns number of cleaned items
  getSize: (key?: string) => number; // bytes
  
  // Migration and versioning
  migrateData: (fromVersion: string, toVersion: string) => boolean;
  validateData: (key: string) => boolean;
  
  // Auto-save management
  enableAutoSave: (keys: string[], interval?: number) => void;
  disableAutoSave: () => void;
  forceAutoSave: () => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<StorageConfig>) => void;
  resetConfig: () => void;
  
  // Utilities
  isSupported: () => boolean;
  getNamespacedKey: (key: string) => string;
  formatSize: (bytes: number) => string;
}

// ===== GAME DATA TYPES =====
export interface GameSaveData {
  score: number;
  bestScore: number;
  coins: number;
  selectedBirdSkin: string;
  startingBiome: number;
  buttonPosition: 'left' | 'right';
  unlockedSkins: string[];
  achievements: Achievement[];
  speedSettings: SpeedSettings;
  playTime: number;
  gamesPlayed: number;
  lastPlayed: string;
}

export interface GameSettings {
  volume: number;
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  visualEffectsEnabled: boolean;
  showFPS: boolean;
  controlStyle: 'tap' | 'swipe' | 'keyboard';
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
  unlockedAt?: string;
}

export interface SpeedSettings {
  normal: number;
  slowMotion: number;
  rainbow: number;
  super: number;
  godMode: number;
}

// ===== DEFAULT CONFIGURATIONS =====
const defaultConfig: StorageConfig = {
  namespace: 'szenyo_madar',
  version: '1.0.0',
  enableEncryption: false,
  enableCompression: false,
  enableBackup: true,
  maxBackupFiles: 5,
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  enableVersionMigration: true,
};

const defaultGameData: GameSaveData = {
  score: 0,
  bestScore: 0,
  coins: 0,
  selectedBirdSkin: 'classic',
  startingBiome: 0,
  buttonPosition: 'left',
  unlockedSkins: ['classic'],
  achievements: [],
  speedSettings: {
    normal: 2.0,
    slowMotion: 1.0,
    rainbow: 3.0,
    super: 4.0,
    godMode: 2.5
  },
  playTime: 0,
  gamesPlayed: 0,
  lastPlayed: new Date().toISOString()
};

const defaultSettings: GameSettings = {
  volume: 0.7,
  musicEnabled: true,
  soundEffectsEnabled: true,
  visualEffectsEnabled: true,
  showFPS: false,
  controlStyle: 'tap',
  language: 'hu',
  theme: 'auto'
};

// ===== UTILITY FUNCTIONS =====
const isLocalStorageSupported = (): boolean => {
  try {
    const test = 'localStorage_test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

const calculateSize = (value: any): number => {
  return new Blob([JSON.stringify(value)]).size;
};

const generateChecksum = (data: string): string => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

const compressString = (str: string): string => {
  // Simple compression (could be improved with actual compression library)
  return btoa(encodeURIComponent(str));
};

const decompressString = (str: string): string => {
  try {
    return decodeURIComponent(atob(str));
  } catch (e) {
    return str; // Return original if decompression fails
  }
};

// ===== CUSTOM HOOK =====
export function useStorageManager(
  config: Partial<StorageConfig> = {}
): UseStorageManagerReturn {
  const finalConfig = useRef({ ...defaultConfig, ...config });
  const autoSaveInterval = useRef<number | null>(null);
  const autoSaveKeys = useRef<string[]>([]);
  
  // Check localStorage support
  const isSupported = useCallback((): boolean => {
    return isLocalStorageSupported();
  }, []);
  
  // ===== KEY MANAGEMENT =====
  const getNamespacedKey = useCallback((key: string): string => {
    return `${finalConfig.current.namespace}_${key}`;
  }, []);
  
  // ===== BASIC OPERATIONS =====
  const save = useCallback(<T,>(key: string, value: T): boolean => {
    if (!isSupported()) return false;
    
    try {
      const namespacedKey = getNamespacedKey(key);
      const timestamp = new Date().toISOString();
      
      const saveData: SaveData = {
        version: finalConfig.current.version,
        timestamp,
        data: { [key]: value }
      };
      
      let serialized = JSON.stringify(saveData);
      
      // Add checksum if enabled
      if (finalConfig.current.enableEncryption) {
        saveData.checksum = generateChecksum(serialized);
        serialized = JSON.stringify(saveData);
      }
      
      // Compress if enabled
      if (finalConfig.current.enableCompression) {
        serialized = compressString(serialized);
      }
      
      localStorage.setItem(namespacedKey, serialized);
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  }, [getNamespacedKey, isSupported]);
  
  const load = useCallback(<T,>(key: string, defaultValue?: T): T | undefined => {
    if (!isSupported()) return defaultValue;
    
    try {
      const namespacedKey = getNamespacedKey(key);
      const stored = localStorage.getItem(namespacedKey);
      
      if (!stored) return defaultValue;
      
      let parsed = stored;
      
      // Decompress if needed
      if (finalConfig.current.enableCompression) {
        parsed = decompressString(stored);
      }
      
      const saveData: SaveData = JSON.parse(parsed);
      
      // Validate checksum if enabled
      if (finalConfig.current.enableEncryption && saveData.checksum) {
        const dataWithoutChecksum = { ...saveData };
        delete dataWithoutChecksum.checksum;
        const expectedChecksum = generateChecksum(JSON.stringify(dataWithoutChecksum));
        
        if (saveData.checksum !== expectedChecksum) {
          console.warn('Data integrity check failed for key:', key);
          return defaultValue;
        }
      }
      
      return saveData.data[key] as T;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  }, [getNamespacedKey, isSupported]);
  
  const remove = useCallback((key: string): boolean => {
    if (!isSupported()) return false;
    
    try {
      const namespacedKey = getNamespacedKey(key);
      localStorage.removeItem(namespacedKey);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  }, [getNamespacedKey, isSupported]);
  
  const exists = useCallback((key: string): boolean => {
    if (!isSupported()) return false;
    
    const namespacedKey = getNamespacedKey(key);
    return localStorage.getItem(namespacedKey) !== null;
  }, [getNamespacedKey, isSupported]);
  
  const clear = useCallback((): boolean => {
    if (!isSupported()) return false;
    
    try {
      const keysToRemove = [];
      const prefix = `${finalConfig.current.namespace}_`;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }, [isSupported]);
  
  // ===== GAME-SPECIFIC OPERATIONS =====
  const saveGameData = useCallback((data: GameSaveData): boolean => {
    return save('game_data', data);
  }, [save]);
  
  const loadGameData = useCallback((): GameSaveData | null => {
    return load('game_data', defaultGameData) || null;
  }, [load]);
  
  const saveSettings = useCallback((settings: GameSettings): boolean => {
    return save('settings', settings);
  }, [save]);
  
  const loadSettings = useCallback((): GameSettings => {
    return load('settings', defaultSettings) || defaultSettings;
  }, [load]);
  
  const saveAchievements = useCallback((achievements: Achievement[]): boolean => {
    return save('achievements', achievements);
  }, [save]);
  
  const loadAchievements = useCallback((): Achievement[] => {
    return load('achievements', []) || [];
  }, [load]);
  
  // ===== BATCH OPERATIONS =====
  const saveBatch = useCallback((data: Record<string, any>): boolean => {
    try {
      Object.entries(data).forEach(([key, value]) => {
        save(key, value);
      });
      return true;
    } catch (e) {
      console.error('Batch save error:', e);
      return false;
    }
  }, [save]);
  
  const loadBatch = useCallback((keys: string[]): Record<string, any> => {
    const result: Record<string, any> = {};
    
    keys.forEach(key => {
      const value = load(key);
      if (value !== undefined) {
        result[key] = value;
      }
    });
    
    return result;
  }, [load]);
  
  // ===== BACKUP OPERATIONS =====
  const createBackup = useCallback((description?: string): string | null => {
    if (!isSupported() || !finalConfig.current.enableBackup) return null;
    
    try {
      const backupId = `backup_${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Collect all namespaced data
      const backupData: Record<string, any> = {};
      const prefix = `${finalConfig.current.namespace}_`;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const originalKey = key.replace(prefix, '');
          backupData[originalKey] = load(originalKey);
        }
      }
      
      const backup = {
        id: backupId,
        timestamp,
        version: finalConfig.current.version,
        description: description || `Auto backup ${timestamp}`,
        data: backupData
      };
      
      save(`backup_${backupId}`, backup);
      
      // Cleanup old backups
      const backups = listBackups();
      if (backups.length > finalConfig.current.maxBackupFiles) {
        const oldest = backups.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        for (let i = 0; i < backups.length - finalConfig.current.maxBackupFiles; i++) {
          deleteBackup(oldest[i].id);
        }
      }
      
      return backupId;
    } catch (e) {
      console.error('Backup creation error:', e);
      return null;
    }
  }, [isSupported, save, load, finalConfig]);
  
  const restoreBackup = useCallback((backupId: string): boolean => {
    try {
      const backup = load(`backup_${backupId}`) as any;
      if (!backup || !backup.data) return false;
      
      // Clear current data
      clear();
      
      // Restore backup data
      return saveBatch(backup.data);
    } catch (e) {
      console.error('Backup restore error:', e);
      return false;
    }
  }, [load, clear, saveBatch]);
  
  const listBackups = useCallback((): BackupInfo[] => {
    const backups: BackupInfo[] = [];
    const prefix = `${finalConfig.current.namespace}_backup_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const backupData = load(key.replace(`${finalConfig.current.namespace}_`, '')) as any;
          if (backupData && backupData.id) {
            backups.push({
              id: backupData.id,
              timestamp: backupData.timestamp,
              size: calculateSize(backupData),
              version: backupData.version,
              description: backupData.description
            });
          }
        } catch (e) {
          console.warn('Failed to parse backup:', key);
        }
      }
    }
    
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [load, finalConfig]);
  
  const deleteBackup = useCallback((backupId: string): boolean => {
    return remove(`backup_${backupId}`);
  }, [remove]);
  
  // ===== EXPORT/IMPORT =====
  const exportData = useCallback((keys?: string[]): string => {
    const exportData: Record<string, any> = {};
    
    if (keys) {
      keys.forEach(key => {
        const value = load(key);
        if (value !== undefined) {
          exportData[key] = value;
        }
      });
    } else {
      // Export all namespaced data
      const prefix = `${finalConfig.current.namespace}_`;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const originalKey = key.replace(prefix, '');
          exportData[originalKey] = load(originalKey);
        }
      }
    }
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      version: finalConfig.current.version,
      namespace: finalConfig.current.namespace,
      data: exportData
    }, null, 2);
  }, [load, finalConfig]);
  
  const importData = useCallback((data: string, overwrite: boolean = false): boolean => {
    try {
      const parsed = JSON.parse(data);
      
      if (!parsed.data || typeof parsed.data !== 'object') {
        return false;
      }
      
      if (!overwrite) {
        // Only import non-existing keys
        Object.entries(parsed.data).forEach(([key, value]) => {
          if (!exists(key)) {
            save(key, value);
          }
        });
      } else {
        // Overwrite all data
        saveBatch(parsed.data);
      }
      
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }, [exists, save, saveBatch]);
  
  // ===== STORAGE STATISTICS =====
  const getStats = useCallback((): StorageStats => {
    const stats: StorageStats = {
      totalKeys: 0,
      totalSize: 0,
      usedQuota: 0,
      availableSpace: 0,
      oldestEntry: '',
      newestEntry: '',
      keysWithNamespace: []
    };
    
    const prefix = `${finalConfig.current.namespace}_`;
    let oldestTime = Infinity;
    let newestTime = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        stats.totalKeys++;
        stats.keysWithNamespace.push(key);
        
        const value = localStorage.getItem(key);
        if (value) {
          stats.totalSize += calculateSize(value);
          
          try {
            const parsed = JSON.parse(value);
            if (parsed.timestamp) {
              const time = new Date(parsed.timestamp).getTime();
              if (time < oldestTime) {
                oldestTime = time;
                stats.oldestEntry = key;
              }
              if (time > newestTime) {
                newestTime = time;
                stats.newestEntry = key;
              }
            }
          } catch (e) {
            // Ignore parsing errors for timestamp extraction
          }
        }
      }
    }
    
    // Estimate quota usage (localStorage typically has 5-10MB limit)
    const estimatedQuota = 5 * 1024 * 1024; // 5MB
    stats.usedQuota = Math.round((stats.totalSize / estimatedQuota) * 100);
    stats.availableSpace = Math.max(0, estimatedQuota - stats.totalSize);
    
    return stats;
  }, [finalConfig]);
  
  const cleanup = useCallback((): number => {
    let cleanedCount = 0;
    const stats = getStats();
    
    // Remove orphaned or corrupted entries
    stats.keysWithNamespace.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          JSON.parse(value); // Test if valid JSON
        }
      } catch (e) {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });
    
    return cleanedCount;
  }, [getStats]);
  
  const getSize = useCallback((key?: string): number => {
    if (key) {
      const namespacedKey = getNamespacedKey(key);
      const value = localStorage.getItem(namespacedKey);
      return value ? calculateSize(value) : 0;
    } else {
      return getStats().totalSize;
    }
  }, [getNamespacedKey, getStats]);
  
  // ===== AUTO-SAVE =====
  const enableAutoSave = useCallback((keys: string[], interval?: number) => {
    autoSaveKeys.current = keys;
    
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
    }
    
    const saveInterval = interval || finalConfig.current.autoSaveInterval;
    autoSaveInterval.current = setInterval(() => {
      keys.forEach(key => {
        const data = load(key);
        if (data !== undefined) {
          save(key, data);
        }
      });
    }, saveInterval);
  }, [save, load]);
  
  const disableAutoSave = useCallback(() => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
      autoSaveInterval.current = null;
    }
    autoSaveKeys.current = [];
  }, []);
  
  const forceAutoSave = useCallback(() => {
    autoSaveKeys.current.forEach(key => {
      const data = load(key);
      if (data !== undefined) {
        save(key, data);
      }
    });
  }, [save, load]);
  
  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<StorageConfig>) => {
    finalConfig.current = { ...finalConfig.current, ...newConfig };
  }, []);
  
  const resetConfig = useCallback(() => {
    finalConfig.current = { ...defaultConfig };
  }, []);
  
  // ===== UTILITIES =====
  const formatSize = useCallback((bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }, []);
  
  const migrateData = useCallback((fromVersion: string, toVersion: string): boolean => {
    // Implementation would depend on specific migration needs
    console.log(`Migration from ${fromVersion} to ${toVersion} not implemented`);
    return false;
  }, []);
  
  const validateData = useCallback((key: string): boolean => {
    try {
      const data = load(key);
      return data !== undefined;
    } catch (e) {
      return false;
    }
  }, [load]);
  
  // ===== CLEANUP ON UNMOUNT =====
  useEffect(() => {
    return () => {
      disableAutoSave();
    };
  }, [disableAutoSave]);
  
  return {
    // Basic operations
    save,
    load,
    remove,
    exists,
    clear,
    
    // Game-specific saves
    saveGameData,
    loadGameData,
    saveSettings,
    loadSettings,
    saveAchievements,
    loadAchievements,
    
    // Batch operations
    saveBatch,
    loadBatch,
    
    // Backup and restore
    createBackup,
    restoreBackup,
    listBackups,
    deleteBackup,
    
    // Data export/import
    exportData,
    importData,
    
    // Storage management
    getStats,
    cleanup,
    getSize,
    
    // Migration and versioning
    migrateData,
    validateData,
    
    // Auto-save management
    enableAutoSave,
    disableAutoSave,
    forceAutoSave,
    
    // Configuration
    updateConfig,
    resetConfig,
    
    // Utilities
    isSupported,
    getNamespacedKey,
    formatSize,
  };
}

// ===== COMPONENT EXPORT =====
export default useStorageManager;