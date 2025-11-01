/**
 * ========================================
 * PHASE 5.1: WORLD MANAGER
 * ========================================
 * 
 * World parameters and physics constants management
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState } from 'react';

// ===== WORLD TYPES =====
export interface WorldParameters {
  // World dimensions (virtual coordinates)
  w: number;           // width
  h: number;           // height
  
  // Physics constants
  gravity: number;     // gravitational acceleration
  jumpPower: number;   // bird jump force
  gameSpeed: number;   // overall game speed multiplier
  
  // Obstacle parameters
  pipeW: number;       // pipe width
  pipeGap: number;     // gap between pipes
  pipeSpawnRate: number; // spawn frequency
  
  // Bird parameters
  birdSize: number;    // bird radius
  birdMaxSpeed: number; // maximum fall speed
  
  // Power-up parameters
  powerUpSpawnRate: number;
  coinSpawnRate: number;
  
  // Visual parameters
  parallaxSpeed: number;
  particleCount: number;
}

export interface WorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  groundY: number;
  ceilingY: number;
}

export interface WorldConfig {
  // Difficulty scaling
  difficultyScaling: boolean;
  maxDifficulty: number;
  difficultyRate: number;
  
  // Physics presets
  physicsPreset: 'normal' | 'easy' | 'hard' | 'insane' | 'custom';
  
  // World size scaling
  autoScale: boolean;
  minScale: number;
  maxScale: number;
  
  // Debug options
  showBounds: boolean;
  showGrid: boolean;
  enablePhysicsDebug: boolean;
}

export interface WorldManagerReturn {
  // World data
  world: WorldParameters;
  bounds: WorldBounds;
  config: WorldConfig;
  
  // World queries
  isInBounds: (x: number, y: number) => boolean;
  isOnGround: (y: number, tolerance?: number) => boolean;
  isBelowGround: (y: number) => boolean;
  isAboveCeiling: (y: number) => boolean;
  
  // World transformations
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  screenToWorld: (x: number, y: number) => { x: number; y: number };
  scaleToWorld: (value: number) => number;
  scaleToScreen: (value: number) => number;
  
  // World updates
  updateWorldSize: (width: number, height: number) => void;
  updatePhysics: (params: Partial<WorldParameters>) => void;
  setPhysicsPreset: (preset: 'normal' | 'easy' | 'hard' | 'insane') => void;
  resetPhysics: () => void;
  
  // Difficulty scaling
  updateDifficulty: (score: number) => void;
  getDifficultyMultiplier: () => number;
  resetDifficulty: () => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<WorldConfig>) => void;
  getWorldInfo: () => string;
}

// ===== DEFAULT WORLD PARAMETERS =====
const DEFAULT_WORLD: WorldParameters = {
  w: 320,           // virtual world width
  h: 480,           // virtual world height
  gravity: 0.119,   // gravity acceleration
  jumpPower: -3.83, // bird jump power (negative = upward)
  gameSpeed: 1.0,   // game speed multiplier
  pipeW: 40,        // pipe width
  pipeGap: 100,     // gap between top and bottom pipes
  pipeSpawnRate: 0.01, // pipe spawn probability per frame
  birdSize: 12,     // bird collision radius
  birdMaxSpeed: 8.0, // maximum bird fall speed
  powerUpSpawnRate: 0.002, // power-up spawn probability
  coinSpawnRate: 0.005,    // coin spawn probability
  parallaxSpeed: 0.5,      // background scroll speed
  particleCount: 50,       // max particles
};

const DEFAULT_CONFIG: WorldConfig = {
  difficultyScaling: true,
  maxDifficulty: 3.0,
  difficultyRate: 0.01, // difficulty increase per point
  physicsPreset: 'normal',
  autoScale: true,
  minScale: 0.5,
  maxScale: 2.0,
  showBounds: false,
  showGrid: false,
  enablePhysicsDebug: false,
};

// ===== PHYSICS PRESETS =====
const PHYSICS_PRESETS: Record<string, Partial<WorldParameters>> = {
  easy: {
    gravity: 0.08,
    jumpPower: -4.2,
    pipeGap: 120,
    gameSpeed: 0.8,
    birdMaxSpeed: 6.0,
  },
  normal: {
    gravity: 0.119,
    jumpPower: -3.83,
    pipeGap: 100,
    gameSpeed: 1.0,
    birdMaxSpeed: 8.0,
  },
  hard: {
    gravity: 0.15,
    jumpPower: -3.5,
    pipeGap: 80,
    gameSpeed: 1.3,
    birdMaxSpeed: 10.0,
  },
  insane: {
    gravity: 0.2,
    jumpPower: -3.2,
    pipeGap: 60,
    gameSpeed: 1.8,
    birdMaxSpeed: 12.0,
  },
};

// ===== WORLD MANAGER HOOK =====
export const useWorldManager = (
  initialWorld: Partial<WorldParameters> = {},
  initialConfig: Partial<WorldConfig> = {}
): WorldManagerReturn => {
  
  // World state
  const [world, setWorld] = useState<WorldParameters>({ ...DEFAULT_WORLD, ...initialWorld });
  const [config, setConfig] = useState<WorldConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  
  // Internal state
  const baseWorld = useRef<WorldParameters>({ ...DEFAULT_WORLD, ...initialWorld });
  const difficultyMultiplier = useRef<number>(1.0);
  const screenScale = useRef<number>(1.0);

  // ===== COMPUTED BOUNDS =====
  const bounds: WorldBounds = {
    minX: 0,
    maxX: world.w,
    minY: 0,
    maxY: world.h,
    groundY: world.h - 20, // 20px from bottom
    ceilingY: 20,          // 20px from top
  };

  // ===== WORLD QUERIES =====
  const isInBounds = useCallback((x: number, y: number): boolean => {
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
  }, [bounds]);

  const isOnGround = useCallback((y: number, tolerance: number = 5): boolean => {
    return Math.abs(y - bounds.groundY) <= tolerance;
  }, [bounds.groundY]);

  const isBelowGround = useCallback((y: number): boolean => {
    return y > bounds.groundY;
  }, [bounds.groundY]);

  const isAboveCeiling = useCallback((y: number): boolean => {
    return y < bounds.ceilingY;
  }, [bounds.ceilingY]);

  // ===== COORDINATE TRANSFORMATIONS =====
  const worldToScreen = useCallback((x: number, y: number) => {
    return {
      x: x * screenScale.current,
      y: y * screenScale.current,
    };
  }, []);

  const screenToWorld = useCallback((x: number, y: number) => {
    return {
      x: x / screenScale.current,
      y: y / screenScale.current,
    };
  }, []);

  const scaleToWorld = useCallback((value: number): number => {
    return value / screenScale.current;
  }, []);

  const scaleToScreen = useCallback((value: number): number => {
    return value * screenScale.current;
  }, []);

  // ===== WORLD UPDATES =====
  const updateWorldSize = useCallback((width: number, height: number) => {
    if (config.autoScale) {
      // Calculate scale to fit world in screen
      const scaleX = width / baseWorld.current.w;
      const scaleY = height / baseWorld.current.h;
      const newScale = Math.min(scaleX, scaleY);
      
      // Clamp scale to configured limits
      screenScale.current = Math.max(config.minScale, Math.min(config.maxScale, newScale));
      
      // Update world dimensions to match scaled size
      setWorld(prev => ({
        ...prev,
        w: width / screenScale.current,
        h: height / screenScale.current,
      }));
    } else {
      // Fixed world size
      setWorld(prev => ({
        ...prev,
        w: width,
        h: height,
      }));
    }
  }, [config.autoScale, config.minScale, config.maxScale]);

  const updatePhysics = useCallback((params: Partial<WorldParameters>) => {
    setWorld(prev => ({ ...prev, ...params }));
    
    // Update base world for difficulty scaling
    baseWorld.current = { ...baseWorld.current, ...params };
  }, []);

  const setPhysicsPreset = useCallback((preset: 'normal' | 'easy' | 'hard' | 'insane') => {
    const presetParams = PHYSICS_PRESETS[preset];
    if (presetParams) {
      updatePhysics(presetParams);
      setConfig(prev => ({ ...prev, physicsPreset: preset }));
      console.log(`🌍 Physics preset changed to: ${preset}`);
    }
  }, [updatePhysics]);

  const resetPhysics = useCallback(() => {
    setWorld({ ...DEFAULT_WORLD });
    baseWorld.current = { ...DEFAULT_WORLD };
    difficultyMultiplier.current = 1.0;
    console.log('🌍 Physics reset to defaults');
  }, []);

  // ===== DIFFICULTY SCALING =====
  const updateDifficulty = useCallback((score: number) => {
    if (!config.difficultyScaling) return;
    
    const newMultiplier = Math.min(1.0 + (score * config.difficultyRate), config.maxDifficulty);
    
    if (Math.abs(newMultiplier - difficultyMultiplier.current) > 0.01) {
      difficultyMultiplier.current = newMultiplier;
      
      // Apply difficulty scaling to certain parameters
      setWorld(prev => ({
        ...prev,
        gameSpeed: baseWorld.current.gameSpeed * newMultiplier,
        pipeSpawnRate: baseWorld.current.pipeSpawnRate * Math.min(newMultiplier, 2.0), // Cap spawn rate
        gravity: baseWorld.current.gravity * (1.0 + (newMultiplier - 1.0) * 0.3), // Moderate gravity increase
      }));
    }
  }, [config.difficultyScaling, config.difficultyRate, config.maxDifficulty]);

  const getDifficultyMultiplier = useCallback((): number => {
    return difficultyMultiplier.current;
  }, []);

  const resetDifficulty = useCallback(() => {
    difficultyMultiplier.current = 1.0;
    setWorld(prev => ({
      ...prev,
      gameSpeed: baseWorld.current.gameSpeed,
      pipeSpawnRate: baseWorld.current.pipeSpawnRate,
      gravity: baseWorld.current.gravity,
    }));
  }, []);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<WorldConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getWorldInfo = useCallback((): string => {
    return [
      `🌍 World: ${Math.round(world.w)}×${Math.round(world.h)}`,
      `⚖️ Gravity: ${world.gravity.toFixed(3)}`,
      `🐦 Jump: ${world.jumpPower.toFixed(2)}`,
      `🏃 Speed: ${world.gameSpeed.toFixed(1)}x`,
      `📊 Difficulty: ${difficultyMultiplier.current.toFixed(2)}x`,
      `📏 Scale: ${screenScale.current.toFixed(2)}x`,
    ].join(' | ');
  }, [world]);

  return {
    world,
    bounds,
    config,
    isInBounds,
    isOnGround,
    isBelowGround,
    isAboveCeiling,
    worldToScreen,
    screenToWorld,
    scaleToWorld,
    scaleToScreen,
    updateWorldSize,
    updatePhysics,
    setPhysicsPreset,
    resetPhysics,
    updateDifficulty,
    getDifficultyMultiplier,
    resetDifficulty,
    updateConfig,
    getWorldInfo,
  };
};

export default useWorldManager;