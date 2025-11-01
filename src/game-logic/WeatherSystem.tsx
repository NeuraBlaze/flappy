// ===== 🌤️ WEATHER SYSTEM =====
// Weather effects and environmental atmosphere management
// Separated from main game component for modularity

import { useState, useCallback, useRef } from 'react';

// ===== INTERFACES =====
export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'rain' | 'snow' | 'fog';
}

export interface WeatherState {
  type: 'clear' | 'rain' | 'snow' | 'fog';
  intensity: number; // 0-1
  particles: WeatherParticle[];
}

export interface WeatherSystemConfig {
  // Performance settings
  maxParticles: number;
  weatherIntensity: number;
  enableWeatherEffects: boolean;
  // Transition settings
  transitionDuration: number; // frames
  autoWeatherChange: boolean;
  weatherChangeInterval: number; // frames
  // Particle settings
  rainSettings: {
    spawnRate: number;
    speed: { min: number; max: number };
    life: number;
    color: string;
    size: { min: number; max: number };
  };
  snowSettings: {
    spawnRate: number;
    speed: { min: number; max: number };
    life: number;
    color: string;
    size: { min: number; max: number };
  };
  fogSettings: {
    spawnRate: number;
    speed: { min: number; max: number };
    life: number;
    color: string;
    size: { min: number; max: number };
  };
}

export interface UseWeatherSystemReturn {
  // State
  weather: WeatherState;
  
  // Actions
  setWeatherType: (type: 'clear' | 'rain' | 'snow' | 'fog') => void;
  setWeatherIntensity: (intensity: number) => void;
  updateWeather: (worldWidth: number, worldHeight: number) => void;
  spawnWeatherParticles: (worldWidth: number, worldHeight: number) => void;
  clearWeatherParticles: () => void;
  
  // Utilities
  isWeatherActive: () => boolean;
  getParticleCount: () => number;
  setWeatherFromBiome: (allowedWeatherTypes: string[]) => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<WeatherSystemConfig>) => void;
}

// ===== DEFAULT CONFIGURATION =====
const defaultConfig: WeatherSystemConfig = {
  maxParticles: 100,
  weatherIntensity: 1.0,
  enableWeatherEffects: true,
  transitionDuration: 60,
  autoWeatherChange: true,
  weatherChangeInterval: 1800, // 30 seconds at 60fps
  
  rainSettings: {
    spawnRate: 0.1,
    speed: { min: 8, max: 12 },
    life: 100,
    color: '#4A90E2',
    size: { min: 1, max: 2 }
  },
  
  snowSettings: {
    spawnRate: 0.08,
    speed: { min: 1, max: 3 },
    life: 200,
    color: '#FFFFFF',
    size: { min: 2, max: 5 }
  },
  
  fogSettings: {
    spawnRate: 0.05,
    speed: { min: 0.5, max: 1 },
    life: 300,
    color: '#CCCCCC',
    size: { min: 15, max: 40 }
  }
};

// ===== CUSTOM HOOK =====
export function useWeatherSystem(
  config: Partial<WeatherSystemConfig> = {}
): UseWeatherSystemReturn {
  const finalConfig = useRef({ ...defaultConfig, ...config });
  
  // ===== STATE =====
  const weatherRef = useRef<WeatherState>({
    type: 'clear',
    intensity: 0,
    particles: []
  });
  
  const [weather, setWeather] = useState<WeatherState>(weatherRef.current);
  const frameCountRef = useRef(0);
  
  // ===== ACTIONS =====
  const setWeatherType = useCallback((type: 'clear' | 'rain' | 'snow' | 'fog') => {
    weatherRef.current.type = type;
    weatherRef.current.intensity = type === 'clear' ? 0 : 0.5 + Math.random() * 0.5;
    setWeather({ ...weatherRef.current });
  }, []);
  
  const setWeatherIntensity = useCallback((intensity: number) => {
    weatherRef.current.intensity = Math.max(0, Math.min(1, intensity));
    setWeather({ ...weatherRef.current });
  }, []);
  
  const clearWeatherParticles = useCallback(() => {
    weatherRef.current.particles = [];
    setWeather({ ...weatherRef.current });
  }, []);
  
  const spawnWeatherParticles = useCallback((worldWidth: number, worldHeight: number) => {
    const config = finalConfig.current;
    const weatherData = weatherRef.current;
    
    // If weather is clear or effects disabled, don't spawn particles
    if (weatherData.type === 'clear' || !config.enableWeatherEffects) return;
    
    // Limit particle count for performance
    if (weatherData.particles.length >= config.maxParticles) return;
    
    // Adjust intensity based on config
    const adjustedIntensity = weatherData.intensity * config.weatherIntensity;
    let spawnRate = 0;
    let particleSettings;
    
    switch (weatherData.type) {
      case 'rain':
        particleSettings = config.rainSettings;
        spawnRate = adjustedIntensity * particleSettings.spawnRate;
        break;
      case 'snow':
        particleSettings = config.snowSettings;
        spawnRate = adjustedIntensity * particleSettings.spawnRate;
        break;
      case 'fog':
        particleSettings = config.fogSettings;
        spawnRate = adjustedIntensity * particleSettings.spawnRate;
        break;
    }
    
    if (Math.random() < spawnRate && particleSettings) {
      let particle: WeatherParticle;
      
      switch (weatherData.type) {
        case 'rain':
          particle = {
            x: Math.random() * (worldWidth + 50) - 25,
            y: -10,
            vx: -1 - Math.random() * 2,
            vy: particleSettings.speed.min + Math.random() * (particleSettings.speed.max - particleSettings.speed.min),
            life: particleSettings.life,
            maxLife: particleSettings.life,
            color: particleSettings.color,
            size: particleSettings.size.min + Math.random() * (particleSettings.size.max - particleSettings.size.min),
            type: 'rain'
          };
          break;
          
        case 'snow':
          particle = {
            x: Math.random() * (worldWidth + 50) - 25,
            y: -10,
            vx: -0.5 + Math.random(),
            vy: particleSettings.speed.min + Math.random() * (particleSettings.speed.max - particleSettings.speed.min),
            life: particleSettings.life,
            maxLife: particleSettings.life,
            color: particleSettings.color,
            size: particleSettings.size.min + Math.random() * (particleSettings.size.max - particleSettings.size.min),
            type: 'snow'
          };
          break;
          
        case 'fog':
          particle = {
            x: worldWidth + 20,
            y: Math.random() * worldHeight,
            vx: -particleSettings.speed.min - Math.random() * (particleSettings.speed.max - particleSettings.speed.min),
            vy: 0,
            life: particleSettings.life,
            maxLife: particleSettings.life,
            color: particleSettings.color,
            size: particleSettings.size.min + Math.random() * (particleSettings.size.max - particleSettings.size.min),
            type: 'fog'
          };
          break;
      }
      
      weatherRef.current.particles.push(particle);
    }
  }, []);
  
  const updateWeather = useCallback((worldWidth: number, worldHeight: number) => {
    frameCountRef.current++;
    
    // Spawn new weather particles
    spawnWeatherParticles(worldWidth, worldHeight);
    
    // Update existing particles
    weatherRef.current.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      
      // Add some variation to fog movement
      if (particle.type === 'fog') {
        particle.vy += (Math.random() - 0.5) * 0.1;
        particle.vx += (Math.random() - 0.5) * 0.05;
      }
    });
    
    // Remove dead particles and those that went off-screen
    weatherRef.current.particles = weatherRef.current.particles.filter(
      p => p.life > 0 && p.x > -50 && p.y < worldHeight + 20
    );
    
    // Auto weather changes
    const config = finalConfig.current;
    if (config.autoWeatherChange && frameCountRef.current % config.weatherChangeInterval === 0) {
      const weatherTypes: ('clear' | 'rain' | 'snow' | 'fog')[] = ['clear', 'rain', 'snow', 'fog'];
      const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      setWeatherType(newWeather);
    }
    
    setWeather({ ...weatherRef.current });
  }, [spawnWeatherParticles, setWeatherType]);
  
  const setWeatherFromBiome = useCallback((allowedWeatherTypes: string[]) => {
    const validTypes = allowedWeatherTypes.filter(type => 
      ['clear', 'rain', 'snow', 'fog'].includes(type)
    ) as ('clear' | 'rain' | 'snow' | 'fog')[];
    
    if (validTypes.length > 0) {
      const currentType = weatherRef.current.type;
      if (!validTypes.includes(currentType)) {
        const newType = validTypes[Math.floor(Math.random() * validTypes.length)];
        setWeatherType(newType);
      }
    }
  }, [setWeatherType]);
  
  // ===== UTILITIES =====
  const isWeatherActive = useCallback((): boolean => {
    return weatherRef.current.type !== 'clear' && weatherRef.current.intensity > 0;
  }, []);
  
  const getParticleCount = useCallback((): number => {
    return weatherRef.current.particles.length;
  }, []);
  
  const updateConfig = useCallback((newConfig: Partial<WeatherSystemConfig>) => {
    finalConfig.current = { ...finalConfig.current, ...newConfig };
  }, []);
  
  return {
    // State
    weather: weather,
    
    // Actions
    setWeatherType,
    setWeatherIntensity,
    updateWeather,
    spawnWeatherParticles,
    clearWeatherParticles,
    
    // Utilities
    isWeatherActive,
    getParticleCount,
    setWeatherFromBiome,
    
    // Configuration
    updateConfig,
  };
}

// ===== COMPONENT EXPORT =====
export default useWeatherSystem;