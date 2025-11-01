// ===== 🚨 ERROR TRACKER =====
// Error logging and crash reporting system
// Extracted from main game component for modularity

import { useState, useCallback, useRef } from 'react';

// ===== INTERFACES =====
export interface GameError {
  id: string;
  timestamp: string;
  error: string;
  type: 'warning' | 'error' | 'critical' | 'crash';
  category: 'game' | 'rendering' | 'audio' | 'input' | 'network' | 'memory' | 'other';
  stackTrace?: string;
  userAgent: string;
  url: string;
}

export interface GameContext {
  gameState: string;
  score: number;
  level?: number;
  birdSkin?: string;
  biome?: string;
  abilities?: any;
  performance?: {
    fps: number;
    memory: number;
  };
  additionalInfo?: any;
}

export interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  warningCount: number;
  crashCount: number;
  recentErrors: number; // Last hour
  errorsByCategory: Record<string, number>;
  errorsByType: Record<string, number>;
}

export interface ErrorTrackerConfig {
  // Logging settings
  enableLogging: boolean;
  enableConsoleOutput: boolean;
  enableLocalStorage: boolean;
  enableCrashReporting: boolean;
  
  // Storage settings
  maxStoredErrors: number;
  storageKey: string;
  
  // Filtering settings
  minErrorLevel: 'warning' | 'error' | 'critical';
  enableStackTrace: boolean;
  
  // Auto-reporting settings
  autoReportCritical: boolean;
  reportingEndpoint?: string;
  reportingDelay: number; // ms
  
  // Performance settings
  maxErrorsPerMinute: number;
  enableRateLimiting: boolean;
}

export interface UseErrorTrackerReturn {
  // Current state
  errors: GameError[];
  lastError: string;
  stats: ErrorStats;
  
  // Error logging
  logError: (error: string, context?: Partial<GameContext>, type?: 'warning' | 'error' | 'critical' | 'crash', category?: 'game' | 'rendering' | 'audio' | 'input' | 'network' | 'memory' | 'other') => string;
  logWarning: (warning: string, context?: Partial<GameContext>) => string;
  logCritical: (error: string, context?: Partial<GameContext>) => string;
  logCrash: (error: string, context?: Partial<GameContext>) => string;
  
  // Error management
  clearErrors: () => void;
  clearError: (errorId: string) => void;
  getError: (errorId: string) => GameError | undefined;
  getErrorsByCategory: (category: string) => GameError[];
  getErrorsByType: (type: string) => GameError[];
  
  // Context management
  updateGameContext: (context: Partial<GameContext>) => void;
  getGameContext: () => GameContext;
  
  // Statistics
  getErrorStats: () => ErrorStats;
  getRecentErrors: (minutes?: number) => GameError[];
  getErrorHistory: () => GameError[];
  
  // Crash reporting
  generateCrashReport: (error?: GameError) => object;
  exportErrorLog: () => string;
  importErrorLog: (data: string) => boolean;
  
  // Utils
  isErrorRateLimited: () => boolean;
  shouldReportError: (type: string) => boolean;
  formatError: (error: GameError) => string;
  
  // Configuration
  updateConfig: (newConfig: Partial<ErrorTrackerConfig>) => void;
  resetConfig: () => void;
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: ErrorTrackerConfig = {
  enableLogging: true,
  enableConsoleOutput: true,
  enableLocalStorage: true,
  enableCrashReporting: true,
  maxStoredErrors: 50,
  storageKey: 'szenyo_madar_error_log',
  minErrorLevel: 'warning',
  enableStackTrace: true,
  autoReportCritical: true,
  reportingDelay: 1000,
  maxErrorsPerMinute: 20,
  enableRateLimiting: true,
};

// ===== UTILITY FUNCTIONS =====
const generateErrorId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

const getErrorLevel = (type: string): number => {
  const levels = { warning: 1, error: 2, critical: 3, crash: 4 };
  return levels[type as keyof typeof levels] || 0;
};

const loadStoredErrors = (storageKey: string): GameError[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load stored errors:', e);
    return [];
  }
};

const saveErrorsToStorage = (errors: GameError[], storageKey: string): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(errors));
  } catch (e) {
    console.warn('Failed to save errors to storage:', e);
  }
};

// ===== CUSTOM HOOK =====
export function useErrorTracker(
  initialConfig: Partial<ErrorTrackerConfig> = {}
): UseErrorTrackerReturn {
  const config = useRef({ ...defaultConfig, ...initialConfig });
  
  // Load existing errors from localStorage
  const [errors, setErrors] = useState<GameError[]>(() => 
    config.current.enableLocalStorage ? loadStoredErrors(config.current.storageKey) : []
  );
  
  const [lastError, setLastError] = useState<string>('');
  const [gameContext, setGameContext] = useState<GameContext>({
    gameState: 'unknown',
    score: 0
  });
  
  // Rate limiting
  const errorCounts = useRef<Map<number, number>>(new Map()); // minute -> count
  const lastErrorTime = useRef<number>(0);
  
  // ===== ERROR LOGGING =====
  const logError = useCallback((
    error: string, 
    context: Partial<GameContext> = {}, 
    type: 'warning' | 'error' | 'critical' | 'crash' = 'error',
    category: 'game' | 'rendering' | 'audio' | 'input' | 'network' | 'memory' | 'other' = 'game'
  ): string => {
    if (!config.current.enableLogging) return '';
    
    // Check minimum error level
    const currentLevel = getErrorLevel(type);
    const minLevel = getErrorLevel(config.current.minErrorLevel);
    if (currentLevel < minLevel) return '';
    
    // Rate limiting check
    if (config.current.enableRateLimiting && isErrorRateLimited()) {
      console.warn('Error logging rate limited');
      return '';
    }
    
    const errorId = generateErrorId();
    const timestamp = getCurrentTimestamp();
    
    const gameError: GameError = {
      id: errorId,
      timestamp,
      error,
      type,
      category,
      stackTrace: config.current.enableStackTrace ? new Error().stack : undefined,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };
    
    // Update state
    setErrors(prev => {
      const newErrors = [...prev, gameError];
      const limitedErrors = newErrors.slice(-config.current.maxStoredErrors);
      
      // Save to localStorage
      if (config.current.enableLocalStorage) {
        saveErrorsToStorage(limitedErrors, config.current.storageKey);
      }
      
      return limitedErrors;
    });
    
    setLastError(error);
    
    // Console output
    if (config.current.enableConsoleOutput) {
      const logFunction = type === 'warning' ? console.warn : 
                         type === 'critical' || type === 'crash' ? console.error : console.error;
      
      logFunction('🚨 Game Error:', {
        id: errorId,
        type,
        category,
        error,
        context: { ...gameContext, ...context },
        timestamp
      });
    }
    
    // Auto-reporting for critical errors
    if (config.current.autoReportCritical && (type === 'critical' || type === 'crash')) {
      setTimeout(() => {
        reportCrash(gameError);
      }, config.current.reportingDelay);
    }
    
    // Update rate limiting
    if (config.current.enableRateLimiting) {
      updateRateLimiting();
    }
    
    return errorId;
  }, [gameContext]);
  
  const logWarning = useCallback((warning: string, context?: Partial<GameContext>): string => {
    return logError(warning, context, 'warning', 'game');
  }, [logError]);
  
  const logCritical = useCallback((error: string, context?: Partial<GameContext>): string => {
    return logError(error, context, 'critical', 'game');
  }, [logError]);
  
  const logCrash = useCallback((error: string, context?: Partial<GameContext>): string => {
    return logError(error, context, 'crash', 'game');
  }, [logError]);
  
  // ===== RATE LIMITING =====
  const isErrorRateLimited = useCallback((): boolean => {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const currentCount = errorCounts.current.get(currentMinute) || 0;
    
    return currentCount >= config.current.maxErrorsPerMinute;
  }, []);
  
  const updateRateLimiting = useCallback(() => {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    const currentCount = errorCounts.current.get(currentMinute) || 0;
    errorCounts.current.set(currentMinute, currentCount + 1);
    
    // Clean old entries (keep only last 10 minutes)
    for (const [minute] of errorCounts.current) {
      if (minute < currentMinute - 10) {
        errorCounts.current.delete(minute);
      }
    }
    
    lastErrorTime.current = now;
  }, []);
  
  // ===== ERROR MANAGEMENT =====
  const clearErrors = useCallback(() => {
    setErrors([]);
    setLastError('');
    if (config.current.enableLocalStorage) {
      localStorage.removeItem(config.current.storageKey);
    }
  }, []);
  
  const clearError = useCallback((errorId: string) => {
    setErrors(prev => {
      const filtered = prev.filter(e => e.id !== errorId);
      if (config.current.enableLocalStorage) {
        saveErrorsToStorage(filtered, config.current.storageKey);
      }
      return filtered;
    });
  }, []);
  
  const getError = useCallback((errorId: string): GameError | undefined => {
    return errors.find(e => e.id === errorId);
  }, [errors]);
  
  const getErrorsByCategory = useCallback((category: string): GameError[] => {
    return errors.filter(e => e.category === category);
  }, [errors]);
  
  const getErrorsByType = useCallback((type: string): GameError[] => {
    return errors.filter(e => e.type === type);
  }, [errors]);
  
  // ===== CONTEXT MANAGEMENT =====
  const updateGameContext = useCallback((context: Partial<GameContext>) => {
    setGameContext(prev => ({ ...prev, ...context }));
  }, []);
  
  const getGameContext = useCallback((): GameContext => {
    return gameContext;
  }, [gameContext]);
  
  // ===== STATISTICS =====
  const getErrorStats = useCallback((): ErrorStats => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrors = errors.filter(e => 
      new Date(e.timestamp).getTime() > oneHourAgo
    ).length;
    
    const errorsByCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const errorsByType = errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalErrors: errors.length,
      criticalErrors: errors.filter(e => e.type === 'critical' || e.type === 'crash').length,
      warningCount: errors.filter(e => e.type === 'warning').length,
      crashCount: errors.filter(e => e.type === 'crash').length,
      recentErrors,
      errorsByCategory,
      errorsByType
    };
  }, [errors]);
  
  const getRecentErrors = useCallback((minutes: number = 60): GameError[] => {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return errors.filter(e => new Date(e.timestamp).getTime() > cutoff);
  }, [errors]);
  
  const getErrorHistory = useCallback((): GameError[] => {
    return [...errors].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [errors]);
  
  // ===== CRASH REPORTING =====
  const generateCrashReport = useCallback((error?: GameError): object => {
    const stats = getErrorStats();
    const recentErrors = getRecentErrors(30); // Last 30 minutes
    
    return {
      gameVersion: '1.0.0',
      timestamp: getCurrentTimestamp(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      platform: navigator.platform,
      language: navigator.language,
      gameContext,
      specificError: error,
      errorStats: stats,
      recentErrors: recentErrors.slice(0, 10), // Last 10 errors
      performance: {
        memory: (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)
        } : null,
        timing: performance.timing ? {
          navigationStart: performance.timing.navigationStart,
          loadEventEnd: performance.timing.loadEventEnd,
          domContentLoaded: performance.timing.domContentLoadedEventEnd
        } : null
      }
    };
  }, [gameContext, getErrorStats, getRecentErrors]);
  
  const reportCrash = useCallback((error: GameError) => {
    const crashReport = generateCrashReport(error);
    
    if (config.current.enableConsoleOutput) {
      console.error('📤 Crash Report Generated:', crashReport);
    }
    
    // Here you would send to your crash reporting service
    if (config.current.reportingEndpoint) {
      fetch(config.current.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crashReport)
      }).catch(e => console.warn('Failed to send crash report:', e));
    }
  }, [generateCrashReport]);
  
  const exportErrorLog = useCallback((): string => {
    return JSON.stringify({
      exportedAt: getCurrentTimestamp(),
      errors,
      stats: getErrorStats(),
      config: config.current
    }, null, 2);
  }, [errors, getErrorStats]);
  
  const importErrorLog = useCallback((data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.errors && Array.isArray(parsed.errors)) {
        setErrors(parsed.errors.slice(-config.current.maxStoredErrors));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import error log:', e);
      return false;
    }
  }, []);
  
  // ===== UTILITIES =====
  const shouldReportError = useCallback((type: string): boolean => {
    return config.current.autoReportCritical && (type === 'critical' || type === 'crash');
  }, []);
  
  const formatError = useCallback((error: GameError): string => {
    return `[${error.timestamp}] ${error.type.toUpperCase()}: ${error.error} (${error.category})`;
  }, []);
  
  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<ErrorTrackerConfig>) => {
    config.current = { ...config.current, ...newConfig };
  }, []);
  
  const resetConfig = useCallback(() => {
    config.current = { ...defaultConfig };
  }, []);
  
  return {
    // Current state
    errors,
    lastError,
    stats: getErrorStats(),
    
    // Error logging
    logError,
    logWarning,
    logCritical,
    logCrash,
    
    // Error management
    clearErrors,
    clearError,
    getError,
    getErrorsByCategory,
    getErrorsByType,
    
    // Context management
    updateGameContext,
    getGameContext,
    
    // Statistics
    getErrorStats,
    getRecentErrors,
    getErrorHistory,
    
    // Crash reporting
    generateCrashReport,
    exportErrorLog,
    importErrorLog,
    
    // Utils
    isErrorRateLimited,
    shouldReportError,
    formatError,
    
    // Configuration
    updateConfig,
    resetConfig,
  };
}

// ===== COMPONENT EXPORT =====
export default useErrorTracker;