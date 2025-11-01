// ===== ⚡ PERFORMANCE MANAGER =====
// Performance monitoring and optimization system
// Extracted from main game component for modularity

import { useState, useCallback, useRef, useEffect } from 'react';

// ===== INTERFACES =====
export interface PerformanceLevel {
  maxParticles: number;
  maxPowerUps: number;
  maxCoins: number;
  reducedEffects: boolean;
  simplifiedRendering: boolean;
  weatherIntensity: number;
}

export interface FPSData {
  current: number;
  average: number;
  min: number;
  max: number;
  samples: number[];
  target: number;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  jsHeapSizeUsed?: number;
  jsHeapSizeLimit?: number;
}

export interface HardwareInfo {
  cores: number;
  memory: number;
  isMobile: boolean;
  isOldBrowser: boolean;
  browserName: string;
  platform: string;
}

export interface PerformanceMetrics {
  fps: FPSData;
  memory: MemoryUsage;
  frameTime: number;
  renderTime: number;
  updateTime: number;
  drawCalls: number;
  particleCount: number;
  entityCount: number;
}

export interface PerformanceConfig {
  // FPS settings
  targetFPS: number;
  maxFPS: number;
  autoAdjustQuality: boolean;
  
  // Quality settings
  defaultQuality: 'minimal' | 'low' | 'medium' | 'high';
  allowQualityReduction: boolean;
  qualityAdjustmentThreshold: number; // FPS threshold for auto-adjustment
  
  // Monitoring settings
  enableMonitoring: boolean;
  sampleSize: number; // Number of FPS samples to keep
  monitoringInterval: number; // ms between performance checks
  
  // Memory settings
  memoryWarningThreshold: number; // MB
  memoryLimitThreshold: number; // MB
  enableMemoryOptimization: boolean;
}

export interface UsePerformanceManagerReturn {
  // Current state
  metrics: PerformanceMetrics;
  currentLevel: string;
  hardwareInfo: HardwareInfo;
  performanceConfig: PerformanceLevel;
  
  // FPS monitoring
  updateFPS: (deltaTime: number) => void;
  getFPSData: () => FPSData;
  resetFPSStats: () => void;
  
  // Performance level management
  setPerformanceLevel: (level: 'minimal' | 'low' | 'medium' | 'high') => void;
  autoDetectPerformanceLevel: () => 'minimal' | 'low' | 'medium' | 'high';
  adjustQualityBasedOnFPS: () => boolean; // Returns true if quality was changed
  
  // Memory monitoring
  updateMemoryUsage: () => void;
  getMemoryUsage: () => MemoryUsage;
  optimizeMemory: () => void;
  
  // Performance tracking
  startPerfTimer: (name: string) => void;
  endPerfTimer: (name: string) => number; // Returns elapsed time
  updateEntityCount: (particles: number, entities: number, drawCalls: number) => void;
  
  // Hardware detection
  detectHardware: () => HardwareInfo;
  isMobileBrowser: () => boolean;
  isLowEndDevice: () => boolean;
  
  // Configuration
  updateConfig: (newConfig: Partial<PerformanceConfig>) => void;
  getOptimalSettings: () => PerformanceLevel;
  
  // Utilities
  shouldReduceEffects: () => boolean;
  shouldSkipFrame: () => boolean;
  getPerformanceReport: () => string;
}

// ===== DEFAULT CONFIGURATIONS =====
const PERFORMANCE_LEVELS: Record<string, PerformanceLevel> = {
  // Kiváló teljesítmény - 120 FPS capable
  high: {
    maxParticles: 150,
    maxPowerUps: 8,
    maxCoins: 10,
    reducedEffects: false,
    simplifiedRendering: false,
    weatherIntensity: 1.0
  },
  
  // Jó teljesítmény - 60+ FPS
  medium: {
    maxParticles: 100,
    maxPowerUps: 6,
    maxCoins: 8,
    reducedEffects: false,
    simplifiedRendering: false,
    weatherIntensity: 0.8
  },
  
  // Közepes teljesítmény - 30+ FPS
  low: {
    maxParticles: 60,
    maxPowerUps: 5,
    maxCoins: 6,
    reducedEffects: true,
    simplifiedRendering: true,
    weatherIntensity: 0.6
  },
  
  // Gyenge teljesítmény - min. 15+ FPS
  minimal: {
    maxParticles: 40,
    maxPowerUps: 4,
    maxCoins: 5,
    reducedEffects: true,
    simplifiedRendering: true,
    weatherIntensity: 0.2
  }
};

const defaultConfig: PerformanceConfig = {
  targetFPS: 60,
  maxFPS: 120,
  autoAdjustQuality: true,
  defaultQuality: 'medium',
  allowQualityReduction: true,
  qualityAdjustmentThreshold: 45, // Reduce quality if FPS drops below 45
  enableMonitoring: true,
  sampleSize: 60, // 1 second of samples at 60 FPS
  monitoringInterval: 1000, // Check performance every second
  memoryWarningThreshold: 100, // MB
  memoryLimitThreshold: 200, // MB
  enableMemoryOptimization: true,
};

// ===== UTILITY FUNCTIONS =====
const detectHardwareInfo = (): HardwareInfo => {
  const ua = navigator.userAgent.toLowerCase();
  
  // Mobile detection
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  
  // Browser detection
  const isOldBrowser = ua.includes('msie') || ua.includes('trident');
  let browserName = 'Unknown';
  
  if (ua.includes('chrome')) browserName = 'Chrome';
  else if (ua.includes('firefox')) browserName = 'Firefox';
  else if (ua.includes('safari')) browserName = 'Safari';
  else if (ua.includes('edge')) browserName = 'Edge';
  else if (ua.includes('opera')) browserName = 'Opera';
  
  return {
    cores: navigator.hardwareConcurrency || 4,
    memory: (navigator as any).deviceMemory || 4,
    isMobile,
    isOldBrowser,
    browserName,
    platform: navigator.platform || 'Unknown'
  };
};

const getMemoryInfo = (): MemoryUsage => {
  const performance = (window as any).performance;
  
  if (performance && performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    const total = performance.memory.totalJSHeapSize / 1024 / 1024; // MB
    const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024; // MB
    
    return {
      used: Math.round(used),
      total: Math.round(total),
      percentage: Math.round((used / limit) * 100),
      jsHeapSizeUsed: performance.memory.usedJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    };
  }
  
  // Fallback if memory API not available
  return {
    used: 0,
    total: 0,
    percentage: 0
  };
};

// ===== CUSTOM HOOK =====
export function usePerformanceManager(
  config: Partial<PerformanceConfig> = {}
): UsePerformanceManagerReturn {
  const finalConfig = useRef({ ...defaultConfig, ...config });
  const hardwareInfo = useRef(detectHardwareInfo());
  
  // Performance state
  const [currentLevel, setCurrentLevel] = useState<string>(() => {
    return autoDetectInitialLevel(hardwareInfo.current);
  });
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: {
      current: 60,
      average: 60,
      min: 60,
      max: 60,
      samples: [],
      target: finalConfig.current.targetFPS
    },
    memory: getMemoryInfo(),
    frameTime: 16.67,
    renderTime: 0,
    updateTime: 0,
    drawCalls: 0,
    particleCount: 0,
    entityCount: 0
  });
  
  // Performance timers
  const perfTimers = useRef<Map<string, number>>(new Map());
  
  // ===== INITIAL PERFORMANCE DETECTION =====
  function autoDetectInitialLevel(hardware: HardwareInfo): string {
    const { cores, memory, isMobile, isOldBrowser } = hardware;
    
    if (isOldBrowser || cores < 2) return 'minimal';
    
    if (isMobile) {
      // Modern mobiles can handle 60+ FPS
      return cores >= 6 && memory >= 4 ? 'high' : 'medium';
    }
    
    // Desktop performance levels
    if (cores < 4 || memory < 4) return 'low';
    if (cores < 8 || memory < 8) return 'medium';
    return 'high'; // Modern desktop = high performance
  }
  
  // ===== FPS MONITORING =====
  const updateFPS = useCallback((deltaTime: number) => {
    if (!finalConfig.current.enableMonitoring) return;
    
    const currentFPS = deltaTime > 0 ? Math.round(1000 / deltaTime) : 0;
    
    setMetrics(prev => {
      const newSamples = [...prev.fps.samples, currentFPS];
      if (newSamples.length > finalConfig.current.sampleSize) {
        newSamples.shift();
      }
      
      const average = newSamples.reduce((a, b) => a + b, 0) / newSamples.length;
      const min = Math.min(...newSamples);
      const max = Math.max(...newSamples);
      
      return {
        ...prev,
        fps: {
          ...prev.fps,
          current: currentFPS,
          average: Math.round(average),
          min,
          max,
          samples: newSamples
        },
        frameTime: deltaTime
      };
    });
  }, []);
  
  const resetFPSStats = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      fps: {
        ...prev.fps,
        samples: [],
        min: prev.fps.current,
        max: prev.fps.current,
        average: prev.fps.current
      }
    }));
  }, []);
  
  // ===== PERFORMANCE LEVEL MANAGEMENT =====
  const setPerformanceLevel = useCallback((level: 'minimal' | 'low' | 'medium' | 'high') => {
    setCurrentLevel(level);
  }, []);
  
  const autoDetectPerformanceLevel = useCallback((): 'minimal' | 'low' | 'medium' | 'high' => {
    return autoDetectInitialLevel(hardwareInfo.current) as 'minimal' | 'low' | 'medium' | 'high';
  }, []);
  
  const adjustQualityBasedOnFPS = useCallback((): boolean => {
    if (!finalConfig.current.autoAdjustQuality || !finalConfig.current.allowQualityReduction) {
      return false;
    }
    
    const avgFPS = metrics.fps.average;
    const threshold = finalConfig.current.qualityAdjustmentThreshold;
    
    if (avgFPS < threshold && currentLevel !== 'minimal') {
      // Reduce quality
      const levels = ['high', 'medium', 'low', 'minimal'];
      const currentIndex = levels.indexOf(currentLevel);
      if (currentIndex < levels.length - 1) {
        setCurrentLevel(levels[currentIndex + 1]);
        return true;
      }
    } else if (avgFPS > threshold + 15 && currentLevel !== 'high') {
      // Increase quality if FPS is significantly above threshold
      const levels = ['minimal', 'low', 'medium', 'high'];
      const currentIndex = levels.indexOf(currentLevel);
      if (currentIndex < levels.length - 1) {
        setCurrentLevel(levels[currentIndex + 1]);
        return true;
      }
    }
    
    return false;
  }, [metrics.fps.average, currentLevel]);
  
  // ===== MEMORY MONITORING =====
  const updateMemoryUsage = useCallback(() => {
    const memoryUsage = getMemoryInfo();
    setMetrics(prev => ({
      ...prev,
      memory: memoryUsage
    }));
  }, []);
  
  const optimizeMemory = useCallback(() => {
    if (finalConfig.current.enableMemoryOptimization) {
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Update memory usage after optimization attempt
      updateMemoryUsage();
    }
  }, [updateMemoryUsage]);
  
  // ===== PERFORMANCE TIMERS =====
  const startPerfTimer = useCallback((name: string) => {
    perfTimers.current.set(name, performance.now());
  }, []);
  
  const endPerfTimer = useCallback((name: string): number => {
    const startTime = perfTimers.current.get(name);
    if (startTime) {
      const elapsed = performance.now() - startTime;
      perfTimers.current.delete(name);
      
      // Update metrics based on timer name
      if (name === 'render') {
        setMetrics(prev => ({ ...prev, renderTime: elapsed }));
      } else if (name === 'update') {
        setMetrics(prev => ({ ...prev, updateTime: elapsed }));
      }
      
      return elapsed;
    }
    return 0;
  }, []);
  
  const updateEntityCount = useCallback((particles: number, entities: number, drawCalls: number) => {
    setMetrics(prev => ({
      ...prev,
      particleCount: particles,
      entityCount: entities,
      drawCalls
    }));
  }, []);
  
  // ===== UTILITIES =====
  const shouldReduceEffects = useCallback((): boolean => {
    const level = PERFORMANCE_LEVELS[currentLevel];
    return level.reducedEffects || metrics.fps.average < 30;
  }, [currentLevel, metrics.fps.average]);
  
  const shouldSkipFrame = useCallback((): boolean => {
    return metrics.fps.current < 15; // Skip frame if FPS is critically low
  }, [metrics.fps.current]);
  
  const getPerformanceReport = useCallback((): string => {
    const { fps, memory, frameTime, renderTime, updateTime, particleCount, entityCount } = metrics;
    
    return `Performance Report:
FPS: ${fps.current} (avg: ${fps.average}, min: ${fps.min}, max: ${fps.max})
Frame Time: ${frameTime.toFixed(2)}ms
Render Time: ${renderTime.toFixed(2)}ms
Update Time: ${updateTime.toFixed(2)}ms
Memory: ${memory.used}MB / ${memory.total}MB (${memory.percentage}%)
Entities: ${entityCount} (${particleCount} particles)
Quality Level: ${currentLevel}
Hardware: ${hardwareInfo.current.cores} cores, ${hardwareInfo.current.memory}GB RAM
Platform: ${hardwareInfo.current.platform} (${hardwareInfo.current.browserName})`;
  }, [metrics, currentLevel]);
  
  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<PerformanceConfig>) => {
    finalConfig.current = { ...finalConfig.current, ...newConfig };
  }, []);
  
  const getOptimalSettings = useCallback((): PerformanceLevel => {
    return PERFORMANCE_LEVELS[currentLevel];
  }, [currentLevel]);
  
  // ===== AUTO-MONITORING =====
  useEffect(() => {
    if (!finalConfig.current.enableMonitoring) return;
    
    const interval = setInterval(() => {
      updateMemoryUsage();
      
      // Auto-adjust quality if enabled
      if (finalConfig.current.autoAdjustQuality) {
        adjustQualityBasedOnFPS();
      }
      
      // Memory optimization if threshold exceeded
      if (metrics.memory.used > finalConfig.current.memoryWarningThreshold) {
        optimizeMemory();
      }
    }, finalConfig.current.monitoringInterval);
    
    return () => clearInterval(interval);
  }, [updateMemoryUsage, adjustQualityBasedOnFPS, optimizeMemory, metrics.memory.used]);
  
  return {
    // Current state
    metrics,
    currentLevel,
    hardwareInfo: hardwareInfo.current,
    performanceConfig: PERFORMANCE_LEVELS[currentLevel],
    
    // FPS monitoring
    updateFPS,
    getFPSData: () => metrics.fps,
    resetFPSStats,
    
    // Performance level management
    setPerformanceLevel,
    autoDetectPerformanceLevel,
    adjustQualityBasedOnFPS,
    
    // Memory monitoring
    updateMemoryUsage,
    getMemoryUsage: () => metrics.memory,
    optimizeMemory,
    
    // Performance tracking
    startPerfTimer,
    endPerfTimer,
    updateEntityCount,
    
    // Hardware detection
    detectHardware: () => hardwareInfo.current,
    isMobileBrowser: () => hardwareInfo.current.isMobile,
    isLowEndDevice: () => hardwareInfo.current.cores < 4 || hardwareInfo.current.memory < 4,
    
    // Configuration
    updateConfig,
    getOptimalSettings,
    
    // Utilities
    shouldReduceEffects,
    shouldSkipFrame,
    getPerformanceReport,
  };
}

// ===== COMPONENT EXPORT =====
export default usePerformanceManager;