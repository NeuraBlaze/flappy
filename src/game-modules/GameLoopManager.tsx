/**
 * ========================================
 * PHASE 5.1: GAME LOOP MANAGER
 * ========================================
 * 
 * Main game loop and timing management
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useEffect } from 'react';

// ===== GAME LOOP TYPES =====
export interface GameLoopData {
  isRunning: boolean;
  frameCount: number;
  fps: number;
  deltaTime: number;
  totalTime: number;
  lastFrameTime: number;
  averageFps: number;
  minFps: number;
  maxFps: number;
}

export interface GameLoopConfig {
  targetFPS: number;
  maxDeltaTime: number; // Cap delta time to prevent large jumps
  fpsUpdateInterval: number; // How often to update FPS display (ms)
  enableFpsTracking: boolean;
  autoStart: boolean;
}

export interface GameLoopManagerReturn {
  // Loop state
  loopData: GameLoopData;
  
  // Loop control
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  
  // Frame management
  requestFrame: (callback: (deltaTime: number, totalTime: number) => void) => void;
  cancelFrame: () => void;
  
  // Timing utilities
  getFrameRate: () => number;
  getDeltaTime: () => number;
  getTotalTime: () => number;
  resetTimer: () => void;
  
  // Performance monitoring
  getFpsStats: () => { current: number; average: number; min: number; max: number };
  resetFpsStats: () => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<GameLoopConfig>) => void;
  getConfig: () => GameLoopConfig;
}

// ===== DEFAULT CONFIGURATION =====
const DEFAULT_CONFIG: GameLoopConfig = {
  targetFPS: 60,
  maxDeltaTime: 50, // 50ms max delta to prevent large jumps
  fpsUpdateInterval: 1000, // Update FPS display every second
  enableFpsTracking: true,
  autoStart: false,
};

// ===== GAME LOOP MANAGER HOOK =====
export const useGameLoopManager = (
  initialConfig: Partial<GameLoopConfig> = {},
  updateCallback?: (deltaTime: number, totalTime: number) => void
): GameLoopManagerReturn => {
  
  // Configuration
  const config = useRef<GameLoopConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  
  // Loop state
  const rafId = useRef<number | null>(null);
  const isRunning = useRef<boolean>(false);
  const isPaused = useRef<boolean>(false);
  const startTime = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  
  // FPS tracking
  const fpsHistory = useRef<number[]>([]);
  const lastFpsUpdate = useRef<number>(0);
  const currentFps = useRef<number>(0);
  const minFps = useRef<number>(Infinity);
  const maxFps = useRef<number>(0);
  
  // Frame callback
  const frameCallback = useRef<((deltaTime: number, totalTime: number) => void) | null>(updateCallback || null);

  // ===== CORE LOOP FUNCTION =====
  const gameLoop = useCallback((currentTime: number) => {
    if (!isRunning.current || isPaused.current) {
      return;
    }

    // Initialize timing on first frame
    if (frameCount.current === 0) {
      startTime.current = currentTime;
      lastFrameTime.current = currentTime;
    }

    // Calculate delta time
    const rawDeltaTime = currentTime - lastFrameTime.current;
    const deltaTime = Math.min(rawDeltaTime, config.current.maxDeltaTime); // Cap delta time
    const totalTime = currentTime - startTime.current;

    // Update frame tracking
    frameCount.current++;
    lastFrameTime.current = currentTime;

    // FPS calculation
    if (config.current.enableFpsTracking && deltaTime > 0) {
      const instantFps = 1000 / rawDeltaTime;
      fpsHistory.current.push(instantFps);
      
      // Keep FPS history manageable
      if (fpsHistory.current.length > 60) {
        fpsHistory.current = fpsHistory.current.slice(-30);
      }

      // Update FPS display periodically
      if (currentTime - lastFpsUpdate.current >= config.current.fpsUpdateInterval) {
        if (fpsHistory.current.length > 0) {
          currentFps.current = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
          minFps.current = Math.min(minFps.current, currentFps.current);
          maxFps.current = Math.max(maxFps.current, currentFps.current);
        }
        lastFpsUpdate.current = currentTime;
      }
    }

    // Execute frame callback
    if (frameCallback.current) {
      try {
        frameCallback.current(deltaTime, totalTime);
      } catch (error) {
        console.error('Game loop callback error:', error);
        // Continue loop even if callback fails
      }
    }

    // Schedule next frame
    rafId.current = requestAnimationFrame(gameLoop);
  }, []);

  // ===== LOOP CONTROL =====
  const start = useCallback(() => {
    if (isRunning.current) {
      return; // Already running
    }

    isRunning.current = true;
    isPaused.current = false;
    frameCount.current = 0;
    fpsHistory.current = [];
    minFps.current = Infinity;
    maxFps.current = 0;
    
    console.log('🎮 Game loop started');
    rafId.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const stop = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    
    isRunning.current = false;
    isPaused.current = false;
    
    console.log('🛑 Game loop stopped');
  }, []);

  const pause = useCallback(() => {
    if (isRunning.current && !isPaused.current) {
      isPaused.current = true;
      console.log('⏸️ Game loop paused');
    }
  }, []);

  const resume = useCallback(() => {
    if (isRunning.current && isPaused.current) {
      isPaused.current = false;
      
      // Reset timing to prevent large delta jumps
      lastFrameTime.current = performance.now();
      
      console.log('▶️ Game loop resumed');
      rafId.current = requestAnimationFrame(gameLoop);
    }
  }, [gameLoop]);

  const restart = useCallback(() => {
    stop();
    setTimeout(start, 16); // Small delay to ensure clean restart
  }, [stop, start]);

  // ===== FRAME MANAGEMENT =====
  const requestFrame = useCallback((callback: (deltaTime: number, totalTime: number) => void) => {
    frameCallback.current = callback;
  }, []);

  const cancelFrame = useCallback(() => {
    frameCallback.current = null;
  }, []);

  // ===== TIMING UTILITIES =====
  const getFrameRate = useCallback((): number => {
    return currentFps.current;
  }, []);

  const getDeltaTime = useCallback((): number => {
    const currentTime = performance.now();
    return Math.min(currentTime - lastFrameTime.current, config.current.maxDeltaTime);
  }, []);

  const getTotalTime = useCallback((): number => {
    if (startTime.current === 0) return 0;
    return performance.now() - startTime.current;
  }, []);

  const resetTimer = useCallback(() => {
    startTime.current = performance.now();
    lastFrameTime.current = startTime.current;
    frameCount.current = 0;
  }, []);

  // ===== PERFORMANCE MONITORING =====
  const getFpsStats = useCallback(() => {
    const average = fpsHistory.current.length > 0 
      ? fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length 
      : 0;
    
    return {
      current: currentFps.current,
      average,
      min: minFps.current === Infinity ? 0 : minFps.current,
      max: maxFps.current,
    };
  }, []);

  const resetFpsStats = useCallback(() => {
    fpsHistory.current = [];
    currentFps.current = 0;
    minFps.current = Infinity;
    maxFps.current = 0;
    lastFpsUpdate.current = 0;
  }, []);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<GameLoopConfig>) => {
    config.current = { ...config.current, ...newConfig };
  }, []);

  const getConfig = useCallback((): GameLoopConfig => {
    return { ...config.current };
  }, []);

  // ===== COMPUTED LOOP DATA =====
  const loopData: GameLoopData = {
    isRunning: isRunning.current,
    frameCount: frameCount.current,
    fps: currentFps.current,
    deltaTime: getDeltaTime(),
    totalTime: getTotalTime(),
    lastFrameTime: lastFrameTime.current,
    averageFps: getFpsStats().average,
    minFps: getFpsStats().min,
    maxFps: getFpsStats().max,
  };

  // ===== CLEANUP ON UNMOUNT =====
  useEffect(() => {
    // Auto-start if configured
    if (config.current.autoStart) {
      start();
    }

    return () => {
      stop();
    };
  }, [start, stop]);

  return {
    loopData,
    start,
    stop,
    pause,
    resume,
    restart,
    requestFrame,
    cancelFrame,
    getFrameRate,
    getDeltaTime,
    getTotalTime,
    resetTimer,
    getFpsStats,
    resetFpsStats,
    updateConfig,
    getConfig,
  };
};

export default useGameLoopManager;