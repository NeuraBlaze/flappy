/**
 * ========================================
 * PHASE 5.3: EFFECTS RENDERER
 * ========================================
 * 
 * Particle effects, visual effects, UI overlays, and environmental rendering system
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { RenderManagerReturn } from './RenderManager';

// ===== PARTICLE SYSTEM TYPES =====
export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number; // acceleration
  ay: number;
  
  // Visual properties
  size: number;
  startSize: number;
  endSize: number;
  color: string;
  startColor: string;
  endColor: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  
  // Lifecycle
  life: number;
  maxLife: number;
  age: number;
  
  // Behavior
  type: 'spark' | 'smoke' | 'explosion' | 'trail' | 'magic' | 'coin' | 'feather' | 'leaf' | 'snow' | 'rain';
  gravity: boolean;
  friction: number;
  bounce: number;
  
  // Special properties
  data?: any;
}

export interface ParticleEmitter {
  id: string;
  name: string;
  x: number;
  y: number;
  
  // Emission properties
  enabled: boolean;
  emissionRate: number; // particles per second
  emissionCount: number; // burst count
  emissionTimer: number;
  maxParticles: number;
  
  // Particle configuration
  particleConfig: Partial<Particle>;
  randomness: {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    size: number;
    life: number;
    color: boolean;
  };
  
  // Behavior
  followTarget: boolean;
  targetX: number;
  targetY: number;
  autoDestroy: boolean;
  duration: number;
  remainingTime: number;
}

export interface VisualEffect {
  id: string;
  type: 'explosion' | 'powerup' | 'collision' | 'achievement' | 'weather' | 'magic' | 'screen' | 'ui';
  x: number;
  y: number;
  
  // Timing
  duration: number;
  remainingTime: number;
  startTime: number;
  
  // Animation
  animationPhase: number;
  animationSpeed: number;
  
  // Visual properties
  size: number;
  color: string;
  alpha: number;
  intensity: number;
  
  // Configuration
  config: any;
  
  // State
  active: boolean;
  completed: boolean;
}

export interface ScreenEffect {
  type: 'shake' | 'flash' | 'fade' | 'blur' | 'zoom' | 'chromatic' | 'distortion';
  intensity: number;
  duration: number;
  remainingTime: number;
  
  // Effect-specific properties
  direction?: { x: number; y: number };
  color?: string;
  fadeType?: 'in' | 'out' | 'inout';
  frequency?: number;
}

export interface UIOverlay {
  id: string;
  type: 'damage' | 'score' | 'powerup' | 'achievement' | 'combo' | 'warning' | 'tutorial';
  x: number;
  y: number;
  
  // Content
  text?: string;
  icon?: string;
  image?: HTMLImageElement;
  
  // Animation
  animationType: 'fadeIn' | 'slideUp' | 'bounce' | 'pulse' | 'typewriter' | 'explosion';
  duration: number;
  remainingTime: number;
  
  // Visual
  fontSize: number;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  shadow: boolean;
  
  // Behavior
  followTarget: boolean;
  targetId?: string;
  gravity: boolean;
  velocity: { x: number; y: number };
  
  // State
  visible: boolean;
  completed: boolean;
}

export interface BackgroundEffect {
  type: 'parallax' | 'clouds' | 'stars' | 'rain' | 'snow' | 'fog' | 'wind' | 'lightning';
  layers: Array<{
    id: string;
    depth: number; // for parallax
    speed: { x: number; y: number };
    density: number;
    size: { min: number; max: number };
    color: string;
    alpha: number;
    elements: Array<{
      x: number;
      y: number;
      size: number;
      rotation: number;
      age: number;
    }>;
  }>;
  
  // Configuration
  enabled: boolean;
  intensity: number;
  windSpeed: { x: number; y: number };
  
  // Special effects
  lightning: {
    enabled: boolean;
    frequency: number;
    timer: number;
    flash: boolean;
    flashDuration: number;
    flashTimer: number;
  };
}

export interface EffectsRenderConfig {
  // Particle settings
  maxParticles: number;
  particleQuality: 'low' | 'medium' | 'high';
  enableParticles: boolean;
  
  // Visual effects
  enableVisualEffects: boolean;
  enableScreenEffects: boolean;
  enableUIOverlays: boolean;
  enableBackgroundEffects: boolean;
  
  // Performance settings
  useOffscreenCanvas: boolean;
  enableCulling: boolean;
  cullingDistance: number;
  enableLOD: boolean;
  lodDistance: number;
  
  // Quality settings
  antiAliasing: boolean;
  softParticles: boolean;
  enableBloom: boolean;
  enableGlow: boolean;
  
  // Debug settings
  showParticleBounds: boolean;
  showEmitters: boolean;
  showEffectBounds: boolean;
  debugColor: string;
}

export interface EffectsRendererReturn {
  // Particle system
  particles: Particle[];
  emitters: ParticleEmitter[];
  particleCount: number;
  
  // Effect systems
  visualEffects: VisualEffect[];
  screenEffects: ScreenEffect[];
  uiOverlays: UIOverlay[];
  backgroundEffects: BackgroundEffect[];
  
  // Configuration
  config: EffectsRenderConfig;
  
  // Particle operations
  addParticle: (particle: Partial<Particle>) => string;
  removeParticle: (id: string) => void;
  clearParticles: (type?: string) => void;
  
  // Emitter operations
  createEmitter: (emitter: Partial<ParticleEmitter>) => string;
  updateEmitter: (id: string, updates: Partial<ParticleEmitter>) => void;
  removeEmitter: (id: string) => void;
  startEmission: (id: string) => void;
  stopEmission: (id: string) => void;
  
  // Visual effect operations
  addVisualEffect: (effect: Partial<VisualEffect>) => string;
  removeVisualEffect: (id: string) => void;
  clearVisualEffects: (type?: string) => void;
  
  // Screen effect operations
  addScreenEffect: (effect: Partial<ScreenEffect>) => void;
  clearScreenEffects: () => void;
  
  // UI overlay operations
  addUIOverlay: (overlay: Partial<UIOverlay>) => string;
  removeUIOverlay: (id: string) => void;
  clearUIOverlays: (type?: string) => void;
  
  // Background effect operations
  setBackgroundEffect: (effect: Partial<BackgroundEffect>) => void;
  updateBackgroundEffect: (updates: Partial<BackgroundEffect>) => void;
  clearBackgroundEffects: () => void;
  
  // Predefined effects
  createExplosion: (x: number, y: number, intensity?: number) => void;
  createPowerUpEffect: (x: number, y: number, type: string) => void;
  createCollisionSparks: (x: number, y: number, count?: number) => void;
  createAchievementEffect: (text: string, x?: number, y?: number) => void;
  createScorePopup: (score: number, x: number, y: number) => void;
  createComboEffect: (combo: number, x: number, y: number) => void;
  
  // Weather effects
  startRain: (intensity?: number) => void;
  startSnow: (intensity?: number) => void;
  startWind: (speed: { x: number; y: number }) => void;
  stopWeather: () => void;
  
  // Screen effects
  shakeScreen: (intensity: number, duration: number) => void;
  flashScreen: (color: string, duration: number) => void;
  fadeScreen: (type: 'in' | 'out', duration: number, color?: string) => void;
  
  // Update and render
  updateEffects: (deltaTime: number) => void;
  renderBackgroundEffects: (renderer: RenderManagerReturn) => void;
  renderParticles: (renderer: RenderManagerReturn) => void;
  renderVisualEffects: (renderer: RenderManagerReturn) => void;
  renderUIOverlays: (renderer: RenderManagerReturn) => void;
  renderScreenEffects: (renderer: RenderManagerReturn) => void;
  renderDebug: (renderer: RenderManagerReturn) => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<EffectsRenderConfig>) => void;
  getEffectsInfo: () => string;
}

// ===== DEFAULT VALUES =====
const DEFAULT_PARTICLE: Partial<Particle> = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  ax: 0,
  ay: 0.1, // gravity
  size: 3,
  startSize: 3,
  endSize: 0,
  color: '#FFFFFF',
  startColor: '#FFFFFF',
  endColor: '#000000',
  alpha: 1.0,
  rotation: 0,
  rotationSpeed: 0,
  life: 1.0,
  maxLife: 1.0,
  age: 0,
  type: 'spark',
  gravity: true,
  friction: 0.98,
  bounce: 0.3,
};

const DEFAULT_CONFIG: EffectsRenderConfig = {
  maxParticles: 1000,
  particleQuality: 'medium',
  enableParticles: true,
  enableVisualEffects: true,
  enableScreenEffects: true,
  enableUIOverlays: true,
  enableBackgroundEffects: true,
  useOffscreenCanvas: false,
  enableCulling: true,
  cullingDistance: 1000,
  enableLOD: true,
  lodDistance: 500,
  antiAliasing: true,
  softParticles: false,
  enableBloom: false,
  enableGlow: true,
  showParticleBounds: false,
  showEmitters: false,
  showEffectBounds: false,
  debugColor: '#FF0000',
};

// ===== EFFECTS RENDERER HOOK =====
export const useEffectsRenderer = (
  initialConfig: Partial<EffectsRenderConfig> = {}
): EffectsRendererReturn => {
  
  // State
  const [particles, setParticles] = useState<Particle[]>([]);
  const [emitters, setEmitters] = useState<ParticleEmitter[]>([]);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const [screenEffects, setScreenEffects] = useState<ScreenEffect[]>([]);
  const [uiOverlays, setUIOverlays] = useState<UIOverlay[]>([]);
  const [backgroundEffects, setBackgroundEffects] = useState<BackgroundEffect[]>([]);
  const [config, setConfig] = useState<EffectsRenderConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  
  // Internal state
  const nextId = useRef<number>(1);
  const offscreenCanvas = useRef<HTMLCanvasElement | null>(null);
  const time = useRef<number>(0);

  // ===== UTILITY FUNCTIONS =====
  const generateId = useCallback(() => `effect_${nextId.current++}`, []);
  
  const interpolateColor = useCallback((color1: string, color2: string, factor: number): string => {
    // Simple color interpolation
    if (color1 === color2) return color1;
    
    // Extract RGB values (simplified)
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `rgb(${r},${g},${b})`;
  }, []);

  // ===== PARTICLE OPERATIONS =====
  const addParticle = useCallback((particleData: Partial<Particle>): string => {
    if (!config.enableParticles || particles.length >= config.maxParticles) return '';
    
    const id = generateId();
    const particle: Particle = {
      id,
      ...DEFAULT_PARTICLE,
      ...particleData,
    } as Particle;
    
    setParticles(prev => [...prev, particle]);
    return id;
  }, [config.enableParticles, config.maxParticles, particles.length, generateId]);

  const removeParticle = useCallback((id: string) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearParticles = useCallback((type?: string) => {
    if (type) {
      setParticles(prev => prev.filter(p => p.type !== type));
    } else {
      setParticles([]);
    }
  }, []);

  // ===== EMITTER OPERATIONS =====
  const createEmitter = useCallback((emitterData: Partial<ParticleEmitter>): string => {
    const id = generateId();
    const emitter: ParticleEmitter = {
      id,
      name: emitterData.name || 'emitter',
      x: 0,
      y: 0,
      enabled: true,
      emissionRate: 10,
      emissionCount: 1,
      emissionTimer: 0,
      maxParticles: 100,
      particleConfig: DEFAULT_PARTICLE,
      randomness: {
        position: { x: 5, y: 5 },
        velocity: { x: 2, y: 2 },
        size: 0.5,
        life: 0.3,
        color: false,
      },
      followTarget: false,
      targetX: 0,
      targetY: 0,
      autoDestroy: false,
      duration: 0,
      remainingTime: 0,
      ...emitterData,
    };
    
    setEmitters(prev => [...prev, emitter]);
    return id;
  }, [generateId]);

  const updateEmitter = useCallback((id: string, updates: Partial<ParticleEmitter>) => {
    setEmitters(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const removeEmitter = useCallback((id: string) => {
    setEmitters(prev => prev.filter(e => e.id !== id));
  }, []);

  const startEmission = useCallback((id: string) => {
    updateEmitter(id, { enabled: true });
  }, [updateEmitter]);

  const stopEmission = useCallback((id: string) => {
    updateEmitter(id, { enabled: false });
  }, [updateEmitter]);

  // ===== VISUAL EFFECT OPERATIONS =====
  const addVisualEffect = useCallback((effectData: Partial<VisualEffect>): string => {
    if (!config.enableVisualEffects) return '';
    
    const id = generateId();
    const effect: VisualEffect = {
      id,
      type: 'explosion',
      x: 0,
      y: 0,
      duration: 1000,
      remainingTime: 1000,
      startTime: Date.now(),
      animationPhase: 0,
      animationSpeed: 1.0,
      size: 20,
      color: '#FFFFFF',
      alpha: 1.0,
      intensity: 1.0,
      config: {},
      active: true,
      completed: false,
      ...effectData,
    };
    
    setVisualEffects(prev => [...prev, effect]);
    return id;
  }, [config.enableVisualEffects, generateId]);

  const removeVisualEffect = useCallback((id: string) => {
    setVisualEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const clearVisualEffects = useCallback((type?: string) => {
    if (type) {
      setVisualEffects(prev => prev.filter(e => e.type !== type));
    } else {
      setVisualEffects([]);
    }
  }, []);

  // ===== SCREEN EFFECT OPERATIONS =====
  const addScreenEffect = useCallback((effectData: Partial<ScreenEffect>) => {
    if (!config.enableScreenEffects) return;
    
    const effect: ScreenEffect = {
      type: 'shake',
      intensity: 1.0,
      duration: 500,
      remainingTime: 500,
      ...effectData,
    };
    
    setScreenEffects(prev => [...prev, effect]);
  }, [config.enableScreenEffects]);

  const clearScreenEffects = useCallback(() => {
    setScreenEffects([]);
  }, []);

  // ===== UI OVERLAY OPERATIONS =====
  const addUIOverlay = useCallback((overlayData: Partial<UIOverlay>): string => {
    if (!config.enableUIOverlays) return '';
    
    const id = generateId();
    const overlay: UIOverlay = {
      id,
      type: 'score',
      x: 0,
      y: 0,
      text: '',
      animationType: 'fadeIn',
      duration: 2000,
      remainingTime: 2000,
      fontSize: 24,
      color: '#FFFFFF',
      shadow: true,
      followTarget: false,
      gravity: false,
      velocity: { x: 0, y: 0 },
      visible: true,
      completed: false,
      ...overlayData,
    };
    
    setUIOverlays(prev => [...prev, overlay]);
    return id;
  }, [config.enableUIOverlays, generateId]);

  const removeUIOverlay = useCallback((id: string) => {
    setUIOverlays(prev => prev.filter(o => o.id !== id));
  }, []);

  const clearUIOverlays = useCallback((type?: string) => {
    if (type) {
      setUIOverlays(prev => prev.filter(o => o.type !== type));
    } else {
      setUIOverlays([]);
    }
  }, []);

  // ===== BACKGROUND EFFECT OPERATIONS =====
  const setBackgroundEffect = useCallback((effectData: Partial<BackgroundEffect>) => {
    if (!config.enableBackgroundEffects) return;
    
    const effect: BackgroundEffect = {
      type: 'clouds',
      layers: [],
      enabled: true,
      intensity: 1.0,
      windSpeed: { x: 0.5, y: 0 },
      lightning: {
        enabled: false,
        frequency: 0.1,
        timer: 0,
        flash: false,
        flashDuration: 100,
        flashTimer: 0,
      },
      ...effectData,
    };
    
    setBackgroundEffects([effect]);
  }, [config.enableBackgroundEffects]);

  const updateBackgroundEffect = useCallback((updates: Partial<BackgroundEffect>) => {
    setBackgroundEffects(prev => prev.map(e => ({ ...e, ...updates })));
  }, []);

  const clearBackgroundEffects = useCallback(() => {
    setBackgroundEffects([]);
  }, []);

  // ===== PREDEFINED EFFECTS =====
  const createExplosion = useCallback((x: number, y: number, intensity: number = 1.0) => {
    // Create explosion particles
    const particleCount = Math.floor(15 * intensity);
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 3;
      
      addParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed * intensity,
        vy: Math.sin(angle) * speed * intensity,
        size: 2 + Math.random() * 4,
        color: ['#FF4500', '#FF6600', '#FF8800', '#FFAA00'][Math.floor(Math.random() * 4)],
        type: 'explosion',
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1.0,
      });
    }
    
    // Create visual effect
    addVisualEffect({
      type: 'explosion',
      x,
      y,
      duration: 300,
      size: 30 * intensity,
      color: '#FF6600',
      intensity,
    });
  }, [addParticle, addVisualEffect]);

  const createPowerUpEffect = useCallback((x: number, y: number, type: string) => {
    const colors = {
      shield: '#00BFFF',
      speed: '#FF4500',
      magnet: '#9370DB',
      coin: '#FFD700',
    };
    
    const color = colors[type as keyof typeof colors] || '#FFFFFF';
    
    // Create sparkle particles
    for (let i = 0; i < 20; i++) {
      addParticle({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 1,
        size: 1 + Math.random() * 3,
        color,
        type: 'magic',
        gravity: false,
        life: 1.0 + Math.random() * 1.0,
        maxLife: 2.0,
      });
    }
    
    addVisualEffect({
      type: 'powerup',
      x,
      y,
      duration: 1000,
      size: 25,
      color,
      config: { powerUpType: type },
    });
  }, [addParticle, addVisualEffect]);

  const createCollisionSparks = useCallback((x: number, y: number, count: number = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      
      addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2,
        color: '#FFFF00',
        type: 'spark',
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
      });
    }
  }, [addParticle]);

  const createAchievementEffect = useCallback((text: string, x?: number, y?: number) => {
    addUIOverlay({
      type: 'achievement',
      x: x || 400,
      y: y || 200,
      text,
      animationType: 'bounce',
      duration: 3000,
      fontSize: 32,
      color: '#FFD700',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: '#FFD700',
    });
    
    // Add achievement particles
    const centerX = x || 400;
    const centerY = y || 200;
    
    for (let i = 0; i < 30; i++) {
      addParticle({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        size: 2 + Math.random() * 3,
        color: '#FFD700',
        type: 'magic',
        gravity: false,
        life: 2.0 + Math.random() * 1.0,
        maxLife: 3.0,
      });
    }
  }, [addUIOverlay, addParticle]);

  const createScorePopup = useCallback((score: number, x: number, y: number) => {
    addUIOverlay({
      type: 'score',
      x,
      y,
      text: `+${score}`,
      animationType: 'slideUp',
      duration: 1500,
      fontSize: 20,
      color: '#00FF00',
      velocity: { x: 0, y: -2 },
      gravity: false,
    });
  }, [addUIOverlay]);

  const createComboEffect = useCallback((combo: number, x: number, y: number) => {
    addUIOverlay({
      type: 'combo',
      x,
      y,
      text: `COMBO x${combo}!`,
      animationType: 'pulse',
      duration: 2000,
      fontSize: 24 + combo * 2,
      color: '#FF4500',
      shadow: true,
    });
  }, [addUIOverlay]);

  // ===== WEATHER EFFECTS =====
  const startRain = useCallback((intensity: number = 1.0) => {
    setBackgroundEffect({
      type: 'rain',
      enabled: true,
      intensity,
      layers: [{
        id: 'rain_layer',
        depth: 1,
        speed: { x: -1, y: 8 },
        density: Math.floor(100 * intensity),
        size: { min: 1, max: 3 },
        color: '#87CEEB',
        alpha: 0.6,
        elements: [],
      }],
      windSpeed: { x: -0.5, y: 0 },
    });
  }, [setBackgroundEffect]);

  const startSnow = useCallback((intensity: number = 1.0) => {
    setBackgroundEffect({
      type: 'snow',
      enabled: true,
      intensity,
      layers: [{
        id: 'snow_layer',
        depth: 1,
        speed: { x: 0, y: 2 },
        density: Math.floor(50 * intensity),
        size: { min: 2, max: 5 },
        color: '#FFFFFF',
        alpha: 0.8,
        elements: [],
      }],
      windSpeed: { x: 0.2, y: 0 },
    });
  }, [setBackgroundEffect]);

  const startWind = useCallback((speed: { x: number; y: number }) => {
    updateBackgroundEffect({ windSpeed: speed });
  }, [updateBackgroundEffect]);

  const stopWeather = useCallback(() => {
    clearBackgroundEffects();
  }, [clearBackgroundEffects]);

  // ===== SCREEN EFFECTS =====
  const shakeScreen = useCallback((intensity: number, duration: number) => {
    addScreenEffect({
      type: 'shake',
      intensity,
      duration,
    });
  }, [addScreenEffect]);

  const flashScreen = useCallback((color: string, duration: number) => {
    addScreenEffect({
      type: 'flash',
      intensity: 1.0,
      duration,
      color,
    });
  }, [addScreenEffect]);

  const fadeScreen = useCallback((type: 'in' | 'out', duration: number, color: string = '#000000') => {
    addScreenEffect({
      type: 'fade',
      intensity: 1.0,
      duration,
      color,
      fadeType: type,
    });
  }, [addScreenEffect]);

  // ===== UPDATE LOGIC =====
  const updateEffects = useCallback((deltaTime: number) => {
    time.current += deltaTime;
    
    // Update particles
    if (config.enableParticles) {
      setParticles(prev => prev
        .map(particle => {
          const newParticle = { ...particle };
          
          // Update physics
          newParticle.vx += newParticle.ax * deltaTime * 0.01;
          newParticle.vy += newParticle.ay * deltaTime * 0.01;
          
          if (newParticle.gravity) {
            newParticle.vy += 0.2 * deltaTime * 0.01;
          }
          
          newParticle.vx *= newParticle.friction;
          newParticle.vy *= newParticle.friction;
          
          newParticle.x += newParticle.vx * deltaTime * 0.01;
          newParticle.y += newParticle.vy * deltaTime * 0.01;
          
          // Update rotation
          newParticle.rotation += newParticle.rotationSpeed * deltaTime * 0.01;
          
          // Update life
          newParticle.age += deltaTime * 0.001;
          newParticle.life = Math.max(0, newParticle.maxLife - newParticle.age);
          
          // Update visual properties based on age
          const ageRatio = newParticle.age / newParticle.maxLife;
          newParticle.size = newParticle.startSize + (newParticle.endSize - newParticle.startSize) * ageRatio;
          newParticle.alpha = Math.max(0, 1 - ageRatio);
          
          if (newParticle.startColor !== newParticle.endColor) {
            newParticle.color = interpolateColor(newParticle.startColor, newParticle.endColor, ageRatio);
          }
          
          return newParticle;
        })
        .filter(particle => particle.life > 0)
      );
    }
    
    // Update emitters
    setEmitters(prev => prev.map(emitter => {
      if (!emitter.enabled) return emitter;
      
      const newEmitter = { ...emitter };
      
      // Update emission timer
      newEmitter.emissionTimer += deltaTime;
      const emissionInterval = 1000 / emitter.emissionRate;
      
      if (newEmitter.emissionTimer >= emissionInterval) {
        newEmitter.emissionTimer = 0;
        
        // Emit particles
        for (let i = 0; i < emitter.emissionCount; i++) {
          const randomness = emitter.randomness;
          
          addParticle({
            ...emitter.particleConfig,
            x: emitter.x + (Math.random() - 0.5) * randomness.position.x,
            y: emitter.y + (Math.random() - 0.5) * randomness.position.y,
            vx: (emitter.particleConfig.vx || 0) + (Math.random() - 0.5) * randomness.velocity.x,
            vy: (emitter.particleConfig.vy || 0) + (Math.random() - 0.5) * randomness.velocity.y,
            size: (emitter.particleConfig.size || 3) + (Math.random() - 0.5) * randomness.size,
            life: (emitter.particleConfig.life || 1) + (Math.random() - 0.5) * randomness.life,
          });
        }
      }
      
      // Update duration
      if (emitter.autoDestroy && emitter.duration > 0) {
        newEmitter.remainingTime -= deltaTime;
        if (newEmitter.remainingTime <= 0) {
          newEmitter.enabled = false;
        }
      }
      
      return newEmitter;
    }));
    
    // Update visual effects
    setVisualEffects(prev => prev
      .map(effect => {
        const newEffect = { ...effect };
        newEffect.remainingTime -= deltaTime;
        newEffect.animationPhase += deltaTime * effect.animationSpeed * 0.001;
        
        const progress = 1 - (newEffect.remainingTime / effect.duration);
        newEffect.alpha = Math.max(0, 1 - progress);
        
        if (newEffect.remainingTime <= 0) {
          newEffect.completed = true;
        }
        
        return newEffect;
      })
      .filter(effect => !effect.completed)
    );
    
    // Update screen effects
    setScreenEffects(prev => prev
      .map(effect => ({
        ...effect,
        remainingTime: effect.remainingTime - deltaTime,
      }))
      .filter(effect => effect.remainingTime > 0)
    );
    
    // Update UI overlays
    setUIOverlays(prev => prev
      .map(overlay => {
        const newOverlay = { ...overlay };
        newOverlay.remainingTime -= deltaTime;
        
        // Update position based on velocity
        if (newOverlay.velocity) {
          newOverlay.x += newOverlay.velocity.x * deltaTime * 0.01;
          newOverlay.y += newOverlay.velocity.y * deltaTime * 0.01;
        }
        
        // Apply gravity
        if (newOverlay.gravity && newOverlay.velocity) {
          newOverlay.velocity.y += 0.2 * deltaTime * 0.01;
        }
        
        if (newOverlay.remainingTime <= 0) {
          newOverlay.completed = true;
        }
        
        return newOverlay;
      })
      .filter(overlay => !overlay.completed)
    );
    
    // Update background effects
    setBackgroundEffects(prev => prev.map(effect => {
      const newEffect = { ...effect };
      
      // Update layers
      newEffect.layers = effect.layers.map(layer => {
        const newLayer = { ...layer };
        
        // Update existing elements
        newLayer.elements = layer.elements.map(element => ({
          ...element,
          x: element.x + layer.speed.x * deltaTime * 0.01,
          y: element.y + layer.speed.y * deltaTime * 0.01,
          age: element.age + deltaTime * 0.001,
        })).filter(element => {
          // Remove elements that are out of bounds
          return element.x > -100 && element.x < 1000 && element.y > -100 && element.y < 800;
        });
        
        // Add new elements if needed
        while (newLayer.elements.length < layer.density) {
          newLayer.elements.push({
            x: Math.random() * 1000,
            y: -10,
            size: layer.size.min + Math.random() * (layer.size.max - layer.size.min),
            rotation: Math.random() * Math.PI * 2,
            age: 0,
          });
        }
        
        return newLayer;
      });
      
      // Update lightning
      if (newEffect.lightning.enabled) {
        newEffect.lightning.timer += deltaTime;
        
        if (newEffect.lightning.timer >= 1000 / newEffect.lightning.frequency) {
          newEffect.lightning.timer = 0;
          newEffect.lightning.flash = true;
          newEffect.lightning.flashTimer = newEffect.lightning.flashDuration;
        }
        
        if (newEffect.lightning.flash) {
          newEffect.lightning.flashTimer -= deltaTime;
          if (newEffect.lightning.flashTimer <= 0) {
            newEffect.lightning.flash = false;
          }
        }
      }
      
      return newEffect;
    }));
  }, [config.enableParticles, addParticle, interpolateColor]);

  // ===== RENDERING =====
  const renderBackgroundEffects = useCallback((renderer: RenderManagerReturn) => {
    if (!config.enableBackgroundEffects || backgroundEffects.length === 0) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    ctx.save();
    
    for (const effect of backgroundEffects) {
      if (!effect.enabled) continue;
      
      // Render lightning flash
      if (effect.lightning.flash) {
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
      }
      
      // Render layers
      for (const layer of effect.layers) {
        ctx.save();
        ctx.globalAlpha = layer.alpha;
        ctx.fillStyle = layer.color;
        
        for (const element of layer.elements) {
          const screenPos = renderer.worldToScreen(element.x, element.y);
          
          if (effect.type === 'rain') {
            // Draw rain drops
            ctx.beginPath();
            ctx.moveTo(screenPos.x, screenPos.y);
            ctx.lineTo(screenPos.x - 2, screenPos.y + element.size * 3);
            ctx.stroke();
          } else if (effect.type === 'snow') {
            // Draw snowflakes
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, element.size, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Generic particles
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, element.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        ctx.restore();
      }
    }
    
    ctx.restore();
  }, [config.enableBackgroundEffects, backgroundEffects]);

  const renderParticles = useCallback((renderer: RenderManagerReturn) => {
    if (!config.enableParticles || particles.length === 0) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    ctx.save();
    
    for (const particle of particles) {
      const screenPos = renderer.worldToScreen(particle.x, particle.y);
      
      // Culling
      if (config.enableCulling) {
        const distance = Math.sqrt(
          Math.pow(particle.x - renderer.camera.x, 2) + 
          Math.pow(particle.y - renderer.camera.y, 2)
        );
        if (distance > config.cullingDistance) continue;
      }
      
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      
      // Apply rotation if needed
      if (particle.rotation !== 0) {
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(particle.rotation);
        ctx.translate(-screenPos.x, -screenPos.y);
      }
      
      // Draw particle based on type
      switch (particle.type) {
        case 'spark':
        case 'explosion':
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'trail':
          ctx.beginPath();
          ctx.ellipse(screenPos.x, screenPos.y, particle.size * 2, particle.size, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'magic':
          // Draw star shape
          const spikes = 5;
          const outerRadius = particle.size;
          const innerRadius = particle.size * 0.5;
          
          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = screenPos.x + Math.cos(angle) * radius;
            const y = screenPos.y + Math.sin(angle) * radius;
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        default:
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
      }
      
      ctx.restore();
    }
    
    ctx.restore();
  }, [config.enableParticles, config.enableCulling, config.cullingDistance, particles]);

  const renderVisualEffects = useCallback((renderer: RenderManagerReturn) => {
    if (!config.enableVisualEffects || visualEffects.length === 0) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    ctx.save();
    
    for (const effect of visualEffects) {
      const screenPos = renderer.worldToScreen(effect.x, effect.y);
      
      ctx.save();
      ctx.globalAlpha = effect.alpha;
      
      switch (effect.type) {
        case 'explosion':
          // Draw explosion ring
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 3;
          const progress = 1 - (effect.remainingTime / effect.duration);
          const radius = effect.size * progress;
          
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case 'powerup':
          // Draw power-up glow
          const glowSize = effect.size + Math.sin(effect.animationPhase * 5) * 5;
          const gradient = ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, glowSize
          );
          gradient.addColorStop(0, effect.color);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(screenPos.x, screenPos.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    }
    
    ctx.restore();
  }, [config.enableVisualEffects, visualEffects]);

  const renderUIOverlays = useCallback((renderer: RenderManagerReturn) => {
    if (!config.enableUIOverlays || uiOverlays.length === 0) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    ctx.save();
    
    for (const overlay of uiOverlays) {
      if (!overlay.visible) continue;
      
      ctx.save();
      
      // Calculate alpha based on animation
      const progress = 1 - (overlay.remainingTime / overlay.duration);
      let alpha = 1.0;
      
      switch (overlay.animationType) {
        case 'fadeIn':
          alpha = Math.min(1, progress * 3);
          break;
        case 'slideUp':
          alpha = Math.max(0, 1 - progress);
          break;
        case 'bounce':
          alpha = Math.max(0, 1 - progress);
          break;
      }
      
      ctx.globalAlpha = alpha;
      
      // Draw background if specified
      if (overlay.backgroundColor) {
        ctx.fillStyle = overlay.backgroundColor;
        const metrics = ctx.measureText(overlay.text || '');
        const padding = 10;
        
        ctx.fillRect(
          overlay.x - metrics.width / 2 - padding,
          overlay.y - overlay.fontSize / 2 - padding,
          metrics.width + padding * 2,
          overlay.fontSize + padding * 2
        );
      }
      
      // Draw text
      if (overlay.text) {
        ctx.font = `${overlay.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw shadow if enabled
        if (overlay.shadow) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillText(overlay.text, overlay.x + 2, overlay.y + 2);
        }
        
        // Draw text
        ctx.fillStyle = overlay.color;
        ctx.fillText(overlay.text, overlay.x, overlay.y);
        
        // Draw border if specified
        if (overlay.borderColor) {
          ctx.strokeStyle = overlay.borderColor;
          ctx.lineWidth = 2;
          ctx.strokeText(overlay.text, overlay.x, overlay.y);
        }
      }
      
      ctx.restore();
    }
    
    ctx.restore();
  }, [config.enableUIOverlays, uiOverlays]);

  const renderScreenEffects = useCallback((renderer: RenderManagerReturn) => {
    if (!config.enableScreenEffects || screenEffects.length === 0) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    for (const effect of screenEffects) {
      const progress = 1 - (effect.remainingTime / effect.duration);
      
      switch (effect.type) {
        case 'shake':
          // Screen shake is handled by the camera system
          break;
          
        case 'flash':
          ctx.save();
          ctx.fillStyle = effect.color || '#FFFFFF';
          ctx.globalAlpha = effect.intensity * (1 - progress);
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.restore();
          break;
          
        case 'fade':
          ctx.save();
          ctx.fillStyle = effect.color || '#000000';
          
          if (effect.fadeType === 'in') {
            ctx.globalAlpha = effect.intensity * (1 - progress);
          } else if (effect.fadeType === 'out') {
            ctx.globalAlpha = effect.intensity * progress;
          }
          
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.restore();
          break;
      }
    }
  }, [config.enableScreenEffects, screenEffects]);

  const renderDebug = useCallback((renderer: RenderManagerReturn) => {
    if (!config.showParticleBounds && !config.showEmitters && !config.showEffectBounds) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    ctx.save();
    ctx.strokeStyle = config.debugColor;
    ctx.fillStyle = config.debugColor;
    ctx.lineWidth = 1;
    
    // Show particle bounds
    if (config.showParticleBounds) {
      ctx.globalAlpha = 0.3;
      for (const particle of particles) {
        const screenPos = renderer.worldToScreen(particle.x, particle.y);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, particle.size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    // Show emitters
    if (config.showEmitters) {
      ctx.globalAlpha = 0.5;
      for (const emitter of emitters) {
        const screenPos = renderer.worldToScreen(emitter.x, emitter.y);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // Show emission area
        ctx.beginPath();
        ctx.arc(
          screenPos.x, 
          screenPos.y, 
          Math.max(emitter.randomness.position.x, emitter.randomness.position.y), 
          0, Math.PI * 2
        );
        ctx.stroke();
      }
    }
    
    // Show effect bounds
    if (config.showEffectBounds) {
      ctx.globalAlpha = 0.4;
      for (const effect of visualEffects) {
        const screenPos = renderer.worldToScreen(effect.x, effect.y);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, effect.size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }, [config, particles, emitters, visualEffects]);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<EffectsRenderConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getEffectsInfo = useCallback((): string => {
    return [
      `🎆 Particles: ${particles.length}/${config.maxParticles}`,
      `🎭 Effects: ${visualEffects.length}`,
      `🎪 Overlays: ${uiOverlays.length}`,
      `🌧️ Weather: ${backgroundEffects.length}`,
      `📺 Screen: ${screenEffects.length}`,
    ].join(' | ');
  }, [particles.length, config.maxParticles, visualEffects.length, uiOverlays.length, backgroundEffects.length, screenEffects.length]);

  // ===== INITIALIZATION =====
  useEffect(() => {
    // Initialize offscreen canvas if needed
    if (config.useOffscreenCanvas && !offscreenCanvas.current) {
      offscreenCanvas.current = document.createElement('canvas');
    }
  }, [config.useOffscreenCanvas]);

  return {
    particles,
    emitters,
    particleCount: particles.length,
    visualEffects,
    screenEffects,
    uiOverlays,
    backgroundEffects,
    config,
    addParticle,
    removeParticle,
    clearParticles,
    createEmitter,
    updateEmitter,
    removeEmitter,
    startEmission,
    stopEmission,
    addVisualEffect,
    removeVisualEffect,
    clearVisualEffects,
    addScreenEffect,
    clearScreenEffects,
    addUIOverlay,
    removeUIOverlay,
    clearUIOverlays,
    setBackgroundEffect,
    updateBackgroundEffect,
    clearBackgroundEffects,
    createExplosion,
    createPowerUpEffect,
    createCollisionSparks,
    createAchievementEffect,
    createScorePopup,
    createComboEffect,
    startRain,
    startSnow,
    startWind,
    stopWeather,
    shakeScreen,
    flashScreen,
    fadeScreen,
    updateEffects,
    renderBackgroundEffects,
    renderParticles,
    renderVisualEffects,
    renderUIOverlays,
    renderScreenEffects,
    renderDebug,
    updateConfig,
    getEffectsInfo,
  };
};

export default useEffectsRenderer;