/**
 * ========================================
 * PHASE 5.2: OBSTACLE MANAGER
 * ========================================
 * 
 * Obstacle spawning, movement, and management system
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState } from 'react';
import { WorldParameters, WorldBounds } from './WorldManager';
import { CollisionObject, CollisionShape } from './CollisionManager';

// ===== OBSTACLE TYPES =====
export interface Obstacle {
  id: string;
  type: 'pipe' | 'tree' | 'building' | 'cloud' | 'spike';
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;          // velocity x
  vy: number;          // velocity y
  
  // Visual properties
  color: string;
  pattern?: string;
  opacity: number;
  rotation: number;
  scale: number;
  
  // Behavior properties
  solid: boolean;      // blocks movement
  deadly: boolean;     // causes game over
  moving: boolean;     // moves over time
  spawned: number;     // spawn timestamp
  lifetime: number;    // max lifetime (0 = infinite)
  
  // Game mechanics
  layer: number;       // rendering layer (0 = background, 10 = foreground)
  scored: boolean;     // whether bird passed this obstacle (for scoring)
  biome: 'forest' | 'city' | 'sky' | 'any';
  
  // Metadata
  metadata?: any;
}

export interface ObstaclePattern {
  type: Obstacle['type'];
  minGap: number;
  maxGap: number;
  minHeight: number;
  maxHeight: number;
  spawnRate: number;
  velocity: number;
  biomePreference: Obstacle['biome'];
  deadly: boolean;
  solid: boolean;
}

export interface ObstacleConfig {
  // Spawning settings
  maxObstacles: number;
  spawnDistance: number;          // distance ahead to spawn
  despawnDistance: number;        // distance behind to remove
  
  // Difficulty scaling
  difficultyScaling: boolean;
  speedMultiplier: number;
  densityMultiplier: number;
  
  // Biome settings
  currentBiome: Obstacle['biome'];
  biomeTransitionChance: number;
  
  // Performance settings
  enableCulling: boolean;
  maxProcessedPerFrame: number;
  
  // Debug settings
  showObstacleInfo: boolean;
  showSpawnZones: boolean;
  logObstacles: boolean;
}

export interface ObstacleManagerReturn {
  // Obstacle data
  obstacles: Obstacle[];
  obstaclePatterns: ObstaclePattern[];
  config: ObstacleConfig;
  
  // Obstacle management
  spawnObstacle: (pattern: ObstaclePattern, x?: number, y?: number) => Obstacle | null;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
  clearObstacles: () => void;
  
  // Pattern management
  addPattern: (pattern: ObstaclePattern) => void;
  removePattern: (type: Obstacle['type']) => void;
  getPattern: (type: Obstacle['type']) => ObstaclePattern | null;
  
  // Obstacle updates
  updateObstacles: (deltaTime: number, birdX: number) => void;
  processSpawning: (birdX: number) => void;
  processCulling: (birdX: number) => void;
  
  // Collision integration
  getCollisionObjects: () => CollisionObject[];
  getObstacleById: (id: string) => Obstacle | null;
  getObstaclesInRange: (x: number, range: number) => Obstacle[];
  
  // Scoring helpers
  getPassableObstacles: (birdX: number) => Obstacle[];
  markObstacleScored: (id: string) => void;
  getObstacleScore: () => number;
  
  // Configuration
  updateConfig: (newConfig: Partial<ObstacleConfig>) => void;
  setBiome: (biome: Obstacle['biome']) => void;
  getObstacleStats: () => string;
}

// ===== DEFAULT PATTERNS =====
const DEFAULT_OBSTACLE_PATTERNS: ObstaclePattern[] = [
  {
    type: 'pipe',
    minGap: 80,
    maxGap: 120,
    minHeight: 100,
    maxHeight: 300,
    spawnRate: 0.008,
    velocity: -2.0,
    biomePreference: 'any',
    deadly: true,
    solid: true,
  },
  {
    type: 'tree',
    minGap: 100,
    maxGap: 150,
    minHeight: 120,
    maxHeight: 250,
    spawnRate: 0.004,
    velocity: -1.5,
    biomePreference: 'forest',
    deadly: true,
    solid: true,
  },
  {
    type: 'building',
    minGap: 90,
    maxGap: 140,
    minHeight: 150,
    maxHeight: 400,
    spawnRate: 0.006,
    velocity: -2.2,
    biomePreference: 'city',
    deadly: true,
    solid: true,
  },
  {
    type: 'cloud',
    minGap: 200,
    maxGap: 300,
    minHeight: 50,
    maxHeight: 100,
    spawnRate: 0.002,
    velocity: -0.5,
    biomePreference: 'sky',
    deadly: false,
    solid: false,
  },
];

const DEFAULT_OBSTACLE_CONFIG: ObstacleConfig = {
  maxObstacles: 20,
  spawnDistance: 400,
  despawnDistance: -100,
  difficultyScaling: true,
  speedMultiplier: 1.0,
  densityMultiplier: 1.0,
  currentBiome: 'any',
  biomeTransitionChance: 0.001,
  enableCulling: true,
  maxProcessedPerFrame: 10,
  showObstacleInfo: false,
  showSpawnZones: false,
  logObstacles: false,
};

// ===== OBSTACLE COLORS BY TYPE =====
const OBSTACLE_COLORS: Record<Obstacle['type'], string> = {
  pipe: '#4CAF50',
  tree: '#8BC34A',
  building: '#9E9E9E',
  cloud: '#E0E0E0',
  spike: '#F44336',
};

// ===== OBSTACLE MANAGER HOOK =====
export const useObstacleManager = (
  worldParams: WorldParameters,
  worldBounds: WorldBounds,
  initialConfig: Partial<ObstacleConfig> = {}
): ObstacleManagerReturn => {
  
  // State
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [obstaclePatterns, setObstaclePatterns] = useState<ObstaclePattern[]>(DEFAULT_OBSTACLE_PATTERNS);
  const [config, setConfig] = useState<ObstacleConfig>({ ...DEFAULT_OBSTACLE_CONFIG, ...initialConfig });
  
  // Internal tracking
  const obstacleIdCounter = useRef<number>(0);
  const lastSpawnX = useRef<number>(0);
  const nextSpawnDistance = useRef<number>(0);
  const biomeChangeTimer = useRef<number>(0);

  // ===== UTILITY FUNCTIONS =====
  const generateObstacleId = useCallback((): string => {
    return `obstacle_${++obstacleIdCounter.current}_${Date.now()}`;
  }, []);

  const getRandomInRange = useCallback((min: number, max: number): number => {
    return Math.random() * (max - min) + min;
  }, []);

  const selectPatternForBiome = useCallback((biome: Obstacle['biome']): ObstaclePattern | null => {
    const suitablePatterns = obstaclePatterns.filter(pattern => 
      pattern.biomePreference === biome || pattern.biomePreference === 'any'
    );
    
    if (suitablePatterns.length === 0) return null;
    
    // Weighted selection based on spawn rate
    const totalWeight = suitablePatterns.reduce((sum, p) => sum + p.spawnRate, 0);
    let random = Math.random() * totalWeight;
    
    for (const pattern of suitablePatterns) {
      random -= pattern.spawnRate;
      if (random <= 0) return pattern;
    }
    
    return suitablePatterns[0];
  }, [obstaclePatterns]);

  // ===== OBSTACLE MANAGEMENT =====
  const spawnObstacle = useCallback((pattern: ObstaclePattern, x?: number, y?: number): Obstacle | null => {
    if (obstacles.length >= config.maxObstacles) {
      return null;
    }
    
    const spawnX = x ?? (lastSpawnX.current + config.spawnDistance);
    const gapSize = getRandomInRange(pattern.minGap, pattern.maxGap);
    const gapY = getRandomInRange(worldBounds.ceilingY + gapSize/2, worldBounds.groundY - gapSize/2);
    
    // Create pipe pair (top and bottom)
    if (pattern.type === 'pipe' || pattern.type === 'tree' || pattern.type === 'building') {
      const topHeight = gapY - gapSize/2 - worldBounds.ceilingY;
      const bottomHeight = worldBounds.groundY - (gapY + gapSize/2);
      
      if (topHeight > 20) {
        // Top obstacle
        const topObstacle: Obstacle = {
          id: generateObstacleId(),
          type: pattern.type,
          x: spawnX,
          y: worldBounds.ceilingY,
          width: worldParams.pipeW,
          height: topHeight,
          vx: pattern.velocity * config.speedMultiplier,
          vy: 0,
          color: OBSTACLE_COLORS[pattern.type],
          opacity: 1.0,
          rotation: 0,
          scale: 1.0,
          solid: pattern.solid,
          deadly: pattern.deadly,
          moving: true,
          spawned: Date.now(),
          lifetime: 0,
          layer: 5,
          scored: false,
          biome: config.currentBiome,
        };
        
        setObstacles(prev => [...prev, topObstacle]);
      }
      
      if (bottomHeight > 20) {
        // Bottom obstacle
        const bottomObstacle: Obstacle = {
          id: generateObstacleId(),
          type: pattern.type,
          x: spawnX,
          y: gapY + gapSize/2,
          width: worldParams.pipeW,
          height: bottomHeight,
          vx: pattern.velocity * config.speedMultiplier,
          vy: 0,
          color: OBSTACLE_COLORS[pattern.type],
          opacity: 1.0,
          rotation: 0,
          scale: 1.0,
          solid: pattern.solid,
          deadly: pattern.deadly,
          moving: true,
          spawned: Date.now(),
          lifetime: 0,
          layer: 5,
          scored: false,
          biome: config.currentBiome,
        };
        
        setObstacles(prev => [...prev, bottomObstacle]);
      }
      
      lastSpawnX.current = spawnX;
      
      if (config.logObstacles) {
        console.log(`🏗️ Spawned ${pattern.type} pair at x=${spawnX}, gap=${gapSize}`);
      }
      
      return obstacles[obstacles.length - 1]; // Return one of the created obstacles
    }
    
    // Single obstacles (clouds, etc.)
    const obstacle: Obstacle = {
      id: generateObstacleId(),
      type: pattern.type,
      x: spawnX,
      y: y ?? getRandomInRange(worldBounds.ceilingY + 50, worldBounds.groundY - 50),
      width: getRandomInRange(40, 80),
      height: getRandomInRange(pattern.minHeight, pattern.maxHeight),
      vx: pattern.velocity * config.speedMultiplier,
      vy: 0,
      color: OBSTACLE_COLORS[pattern.type],
      opacity: pattern.type === 'cloud' ? 0.7 : 1.0,
      rotation: 0,
      scale: 1.0,
      solid: pattern.solid,
      deadly: pattern.deadly,
      moving: true,
      spawned: Date.now(),
      lifetime: pattern.type === 'cloud' ? 30000 : 0, // Clouds disappear after 30s
      layer: pattern.type === 'cloud' ? 1 : 5,
      scored: false,
      biome: config.currentBiome,
    };
    
    setObstacles(prev => [...prev, obstacle]);
    
    if (config.logObstacles) {
      console.log(`🌟 Spawned ${pattern.type} at (${spawnX}, ${obstacle.y})`);
    }
    
    return obstacle;
  }, [obstacles.length, config, worldBounds, worldParams.pipeW, generateObstacleId, getRandomInRange]);

  const removeObstacle = useCallback((id: string) => {
    setObstacles(prev => prev.filter(obs => obs.id !== id));
  }, []);

  const updateObstacle = useCallback((id: string, updates: Partial<Obstacle>) => {
    setObstacles(prev => prev.map(obs => 
      obs.id === id ? { ...obs, ...updates } : obs
    ));
  }, []);

  const clearObstacles = useCallback(() => {
    setObstacles([]);
    lastSpawnX.current = 0;
    nextSpawnDistance.current = 0;
  }, []);

  // ===== PATTERN MANAGEMENT =====
  const addPattern = useCallback((pattern: ObstaclePattern) => {
    setObstaclePatterns(prev => {
      const filtered = prev.filter(p => p.type !== pattern.type);
      return [...filtered, pattern];
    });
  }, []);

  const removePattern = useCallback((type: Obstacle['type']) => {
    setObstaclePatterns(prev => prev.filter(p => p.type !== type));
  }, []);

  const getPattern = useCallback((type: Obstacle['type']): ObstaclePattern | null => {
    return obstaclePatterns.find(p => p.type === type) || null;
  }, [obstaclePatterns]);

  // ===== OBSTACLE UPDATES =====
  const updateObstacles = useCallback((deltaTime: number, birdX: number) => {
    const now = Date.now();
    
    setObstacles(prev => {
      return prev.map(obstacle => {
        if (!obstacle.moving) return obstacle;
        
        // Update position
        const newX = obstacle.x + obstacle.vx * deltaTime;
        const newY = obstacle.y + obstacle.vy * deltaTime;
        
        // Check lifetime
        if (obstacle.lifetime > 0 && now - obstacle.spawned > obstacle.lifetime) {
          return { ...obstacle, opacity: Math.max(0, obstacle.opacity - deltaTime * 0.001) };
        }
        
        return {
          ...obstacle,
          x: newX,
          y: newY,
        };
      }).filter(obstacle => {
        // Remove fully faded obstacles
        return obstacle.opacity > 0;
      });
    });
    
    // Process spawning and culling
    processSpawning(birdX);
    processCulling(birdX);
  }, []);

  const processSpawning = useCallback((birdX: number) => {
    const spawnX = birdX + config.spawnDistance;
    
    // Check if we need to spawn new obstacles
    if (spawnX > lastSpawnX.current + nextSpawnDistance.current) {
      const pattern = selectPatternForBiome(config.currentBiome);
      
      if (pattern) {
        // Check spawn probability
        const spawnChance = pattern.spawnRate * config.densityMultiplier;
        if (Math.random() < spawnChance) {
          spawnObstacle(pattern, spawnX);
          
          // Set next spawn distance
          nextSpawnDistance.current = getRandomInRange(150, 250);
        }
      }
    }
    
    // Handle biome transitions
    biomeChangeTimer.current += 1;
    if (biomeChangeTimer.current > 1000) { // Check every ~1000 frames
      biomeChangeTimer.current = 0;
      
      if (Math.random() < config.biomeTransitionChance) {
        const biomes: Obstacle['biome'][] = ['forest', 'city', 'sky'];
        const newBiome = biomes[Math.floor(Math.random() * biomes.length)];
        setBiome(newBiome);
      }
    }
  }, [config, selectPatternForBiome, spawnObstacle, getRandomInRange]);

  const processCulling = useCallback((birdX: number) => {
    if (!config.enableCulling) return;
    
    const cullX = birdX + config.despawnDistance;
    
    setObstacles(prev => {
      const culled = prev.filter(obstacle => obstacle.x > cullX);
      
      if (culled.length !== prev.length && config.logObstacles) {
        console.log(`🗑️ Culled ${prev.length - culled.length} obstacles behind x=${cullX}`);
      }
      
      return culled;
    });
  }, [config.enableCulling, config.despawnDistance, config.logObstacles]);

  // ===== COLLISION INTEGRATION =====
  const getCollisionObjects = useCallback((): CollisionObject[] => {
    return obstacles.map(obstacle => ({
      id: obstacle.id,
      type: 'obstacle',
      shape: {
        type: 'rectangle' as const,
        x: obstacle.x,
        y: obstacle.y,
        width: obstacle.width,
        height: obstacle.height,
      },
      solid: obstacle.solid,
      deadly: obstacle.deadly,
      collectible: false,
      metadata: obstacle,
    }));
  }, [obstacles]);

  const getObstacleById = useCallback((id: string): Obstacle | null => {
    return obstacles.find(obs => obs.id === id) || null;
  }, [obstacles]);

  const getObstaclesInRange = useCallback((x: number, range: number): Obstacle[] => {
    return obstacles.filter(obs => Math.abs(obs.x - x) <= range);
  }, [obstacles]);

  // ===== SCORING HELPERS =====
  const getPassableObstacles = useCallback((birdX: number): Obstacle[] => {
    return obstacles.filter(obs => 
      !obs.scored && 
      obs.solid && 
      obs.x < birdX && 
      obs.x + obs.width < birdX
    );
  }, [obstacles]);

  const markObstacleScored = useCallback((id: string) => {
    updateObstacle(id, { scored: true });
  }, [updateObstacle]);

  const getObstacleScore = useCallback((): number => {
    return obstacles.filter(obs => obs.scored && obs.solid).length;
  }, [obstacles]);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<ObstacleConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const setBiome = useCallback((biome: Obstacle['biome']) => {
    setConfig(prev => ({ ...prev, currentBiome: biome }));
    
    if (config.logObstacles) {
      console.log(`🌍 Biome changed to: ${biome}`);
    }
  }, [config.logObstacles]);

  const getObstacleStats = useCallback((): string => {
    const totalObstacles = obstacles.length;
    const activeObstacles = obstacles.filter(obs => obs.moving).length;
    const scoredObstacles = obstacles.filter(obs => obs.scored).length;
    
    return [
      `🏗️ Total: ${totalObstacles}`,
      `🔄 Active: ${activeObstacles}`,
      `⭐ Scored: ${scoredObstacles}`,
      `🌍 Biome: ${config.currentBiome}`,
    ].join(' | ');
  }, [obstacles, config.currentBiome]);

  return {
    obstacles,
    obstaclePatterns,
    config,
    spawnObstacle,
    removeObstacle,
    updateObstacle,
    clearObstacles,
    addPattern,
    removePattern,
    getPattern,
    updateObstacles,
    processSpawning,
    processCulling,
    getCollisionObjects,
    getObstacleById,
    getObstaclesInRange,
    getPassableObstacles,
    markObstacleScored,
    getObstacleScore,
    updateConfig,
    setBiome,
    getObstacleStats,
  };
};

export default useObstacleManager;