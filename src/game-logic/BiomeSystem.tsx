// ===== 🌍 BIOME SYSTEM =====
// Biome management and environment switching
// Separated from main game component for modularity

import { useState, useCallback, useRef, useEffect } from 'react';

// ===== INTERFACES =====
export interface Biome {
  id: 'forest' | 'city';
  name: string;
  backgroundColors: string[];
  obstacleTypes: ('pipe' | 'tree' | 'building')[];
  weatherTypes: ('clear' | 'rain' | 'snow' | 'fog')[];
  powerUpBonus: number; // power-up spawn rate multiplier
  musicTheme: string;
  particleColor: string;
}

export interface BiomeTransition {
  fromBiome: string;
  toBiome: string;
  transitionScore: number;
  effectsTriggered: boolean;
}

export interface BiomeSystemConfig {
  // Transition settings
  transitionInterval: number; // Score interval for biome changes
  enableAutoTransition: boolean;
  // Storage settings
  startingBiomeStorageKey: string;
  // Visual effects
  enableTransitionEffects: boolean;
  transitionParticleCount: number;
}

export interface UseBiomeSystemReturn {
  // State
  currentBiome: Biome;
  availableBiomes: Biome[];
  transitionScore: number;
  startingBiome: number;
  
  // Actions
  switchBiome: (biomeId: string) => void;
  switchBiomeByIndex: (index: number) => void;
  checkBiomeTransition: (score: number) => BiomeTransition | null;
  setStartingBiome: (index: number) => void;
  
  // Utilities
  getBiomeById: (id: string) => Biome | undefined;
  getBiomeByIndex: (index: number) => Biome | undefined;
  getCurrentBiomeIndex: () => number;
  getNextBiomeIndex: (score: number) => number;
  
  // Properties
  getPowerUpBonus: () => number;
  getParticleColor: () => string;
  getBackgroundColors: () => string[];
  getObstacleTypes: () => ('pipe' | 'tree' | 'building')[];
  getWeatherTypes: () => ('clear' | 'rain' | 'snow' | 'fog')[];
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: BiomeSystemConfig = {
  transitionInterval: 10,
  enableAutoTransition: true,
  startingBiomeStorageKey: "szenyo_madar_starting_biome",
  enableTransitionEffects: true,
  transitionParticleCount: 20,
};

// ===== DEFAULT BIOMES =====
const defaultBiomes: Biome[] = [
  {
    id: 'forest',
    name: 'Varázserdő',
    backgroundColors: ['#2D5A0B', '#4A7C59', '#8FBC8F'],
    obstacleTypes: ['tree', 'pipe'],
    weatherTypes: ['clear', 'rain', 'fog'],
    powerUpBonus: 1.2,
    musicTheme: 'nature',
    particleColor: '#90EE90'
  },
  {
    id: 'city',
    name: 'Cyber Város',
    backgroundColors: ['#1a1a2e', '#16213e', '#0f3460'],
    obstacleTypes: ['building', 'pipe'],
    weatherTypes: ['clear', 'rain', 'fog'],
    powerUpBonus: 1.0,
    musicTheme: 'urban',
    particleColor: '#00FFFF'
  }
];

// ===== CUSTOM HOOK =====
export function useBiomeSystem(
  config: Partial<BiomeSystemConfig> = {},
  customBiomes: Biome[] = defaultBiomes
): UseBiomeSystemReturn {
  const finalConfig = { ...defaultConfig, ...config };
  const biomesRef = useRef<Biome[]>(customBiomes);
  
  // ===== STATE =====
  const [startingBiome, setStartingBiomeState] = useState<number>(() => {
    const saved = localStorage.getItem(finalConfig.startingBiomeStorageKey);
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const currentBiomeRef = useRef<Biome>(biomesRef.current[0]);
  const [currentBiome, setCurrentBiome] = useState<Biome>(biomesRef.current[0]);
  const transitionScoreRef = useRef(0);
  
  // ===== INITIALIZATION =====
  useEffect(() => {
    if (biomesRef.current[startingBiome]) {
      const newBiome = biomesRef.current[startingBiome];
      currentBiomeRef.current = newBiome;
      setCurrentBiome(newBiome);
    }
  }, [startingBiome]);
  
  // ===== ACTIONS =====
  const switchBiome = useCallback((biomeId: string) => {
    const biome = biomesRef.current.find(b => b.id === biomeId);
    if (biome) {
      currentBiomeRef.current = biome;
      setCurrentBiome(biome);
    }
  }, []);
  
  const switchBiomeByIndex = useCallback((index: number) => {
    const biome = biomesRef.current[index];
    if (biome) {
      currentBiomeRef.current = biome;
      setCurrentBiome(biome);
    }
  }, []);
  
  const setStartingBiome = useCallback((index: number) => {
    setStartingBiomeState(index);
    localStorage.setItem(finalConfig.startingBiomeStorageKey, index.toString());
  }, [finalConfig.startingBiomeStorageKey]);
  
  const checkBiomeTransition = useCallback((score: number): BiomeTransition | null => {
    if (!finalConfig.enableAutoTransition) return null;
    
    // Check if it's time for a biome transition
    if (score > transitionScoreRef.current + finalConfig.transitionInterval && score > 0) {
      transitionScoreRef.current = score;
      const nextBiomeIndex = Math.floor(score / finalConfig.transitionInterval) % biomesRef.current.length;
      const newBiome = biomesRef.current[nextBiomeIndex];
      
      if (currentBiomeRef.current.id !== newBiome.id) {
        const transition: BiomeTransition = {
          fromBiome: currentBiomeRef.current.id,
          toBiome: newBiome.id,
          transitionScore: score,
          effectsTriggered: false
        };
        
        // Switch to new biome
        currentBiomeRef.current = newBiome;
        setCurrentBiome(newBiome);
        
        return transition;
      }
    }
    
    return null;
  }, [finalConfig.enableAutoTransition, finalConfig.transitionInterval]);
  
  // ===== UTILITIES =====
  const getBiomeById = useCallback((id: string): Biome | undefined => {
    return biomesRef.current.find(b => b.id === id);
  }, []);
  
  const getBiomeByIndex = useCallback((index: number): Biome | undefined => {
    return biomesRef.current[index];
  }, []);
  
  const getCurrentBiomeIndex = useCallback((): number => {
    return biomesRef.current.findIndex(b => b.id === currentBiomeRef.current.id);
  }, []);
  
  const getNextBiomeIndex = useCallback((score: number): number => {
    return Math.floor(score / finalConfig.transitionInterval) % biomesRef.current.length;
  }, [finalConfig.transitionInterval]);
  
  // ===== PROPERTY GETTERS =====
  const getPowerUpBonus = useCallback((): number => {
    return currentBiomeRef.current.powerUpBonus;
  }, []);
  
  const getParticleColor = useCallback((): string => {
    return currentBiomeRef.current.particleColor;
  }, []);
  
  const getBackgroundColors = useCallback((): string[] => {
    return currentBiomeRef.current.backgroundColors;
  }, []);
  
  const getObstacleTypes = useCallback((): ('pipe' | 'tree' | 'building')[] => {
    return currentBiomeRef.current.obstacleTypes;
  }, []);
  
  const getWeatherTypes = useCallback((): ('clear' | 'rain' | 'snow' | 'fog')[] => {
    return currentBiomeRef.current.weatherTypes;
  }, []);
  
  return {
    // State
    currentBiome: currentBiome,
    availableBiomes: biomesRef.current,
    transitionScore: transitionScoreRef.current,
    startingBiome,
    
    // Actions
    switchBiome,
    switchBiomeByIndex,
    checkBiomeTransition,
    setStartingBiome,
    
    // Utilities
    getBiomeById,
    getBiomeByIndex,
    getCurrentBiomeIndex,
    getNextBiomeIndex,
    
    // Properties
    getPowerUpBonus,
    getParticleColor,
    getBackgroundColors,
    getObstacleTypes,
    getWeatherTypes,
  };
}

// ===== COMPONENT EXPORT =====
export default useBiomeSystem;