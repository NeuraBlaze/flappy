/**
 * ========================================
 * PHASE 5.3: OBSTACLE RENDERER
 * ========================================
 * 
 * Obstacle rendering, patterns, textures, and visual effects system
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { Obstacle } from './ObstacleManager';
import { RenderManagerReturn } from './RenderManager';

// ===== OBSTACLE VISUAL TYPES =====
export interface ObstacleTexture {
  image?: HTMLImageElement | HTMLCanvasElement;
  pattern?: CanvasPattern;
  color: string;
  
  // Texture properties
  repeatX: boolean;
  repeatY: boolean;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  
  // Visual effects
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export interface ObstaclePattern {
  name: string;
  type: 'solid' | 'gradient' | 'texture' | 'procedural';
  
  // Pattern data
  colors: string[];
  gradientDirection?: 'horizontal' | 'vertical' | 'radial';
  textureUrl?: string;
  proceduralSeed?: number;
  
  // Animation
  animated: boolean;
  animationSpeed: number;
  animationOffset: number;
}

export interface ObstacleBiomeStyle {
  name: string;
  patterns: ObstaclePattern[];
  defaultPattern: string;
  
  // Environmental effects
  particleCount: number;
  particleColor: string;
  particleSize: number;
  ambientColor: string;
  fogDensity: number;
  
  // Lighting
  lightIntensity: number;
  lightColor: string;
  shadowIntensity: number;
}

export interface ObstacleAnimation {
  type: 'none' | 'pulse' | 'rotate' | 'sway' | 'float' | 'glow';
  speed: number;
  intensity: number;
  phase: number;
  enabled: boolean;
}

export interface ObstacleRenderConfig {
  // Texture settings
  useTextures: boolean;
  fallbackPattern: string;
  textureQuality: 'low' | 'medium' | 'high';
  
  // Pattern settings
  enablePatterns: boolean;
  animatePatterns: boolean;
  patternScale: number;
  
  // Visual effects
  showShadows: boolean;
  showOutlines: boolean;
  showAnimations: boolean;
  showBiomeEffects: boolean;
  showParticles: boolean;
  
  // Performance settings
  useOffscreenCanvas: boolean;
  cacheTextures: boolean;
  maxCachedTextures: number;
  lodDistance: number; // Level of detail based on distance
  
  // Debug settings
  showBounds: boolean;
  showOrigins: boolean;
  showBiomes: boolean;
  debugColor: string;
}

export interface ObstacleVisualEffects {
  // Particle system
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
  }>;
  
  // Environmental effects
  fog: {
    enabled: boolean;
    density: number;
    color: string;
    speed: number;
    offset: number;
  };
  
  // Lighting effects
  lighting: {
    enabled: boolean;
    intensity: number;
    color: string;
    position: { x: number; y: number };
    radius: number;
  };
  
  // Screen shake from collisions
  screenShake: {
    enabled: boolean;
    intensity: number;
    duration: number;
    remainingTime: number;
  };
}

export interface ObstacleRendererReturn {
  // Texture management
  textures: Map<string, ObstacleTexture>;
  patterns: ObstaclePattern[];
  biomeStyles: ObstacleBiomeStyle[];
  animations: Map<string, ObstacleAnimation>;
  visualEffects: ObstacleVisualEffects;
  config: ObstacleRenderConfig;
  
  // Texture operations
  loadTexture: (url: string, name: string) => Promise<boolean>;
  createTexture: (texture: Partial<ObstacleTexture>, name: string) => void;
  createPattern: (pattern: Omit<ObstaclePattern, 'animationOffset'>) => void;
  createBiomeStyle: (style: ObstacleBiomeStyle) => void;
  
  // Pattern operations
  getPatternByName: (name: string) => ObstaclePattern | undefined;
  getBiomeStyle: (biomeName: string) => ObstacleBiomeStyle | undefined;
  updatePatternAnimations: (deltaTime: number) => void;
  
  // Animation operations
  setAnimation: (obstacleId: string, animation: Partial<ObstacleAnimation>) => void;
  updateAnimations: (deltaTime: number) => void;
  clearAnimation: (obstacleId: string) => void;
  
  // Visual effects
  addParticleSystem: (x: number, y: number, count: number, config?: any) => void;
  updateVisualEffects: (deltaTime: number) => void;
  clearVisualEffects: () => void;
  triggerScreenShake: (intensity: number, duration: number) => void;
  
  // Rendering
  renderObstacle: (obstacle: Obstacle, renderer: RenderManagerReturn, biome?: string) => void;
  renderObstacles: (obstacles: Obstacle[], renderer: RenderManagerReturn) => void;
  renderVisualEffects: (renderer: RenderManagerReturn) => void;
  renderDebug: (obstacles: Obstacle[], renderer: RenderManagerReturn) => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<ObstacleRenderConfig>) => void;
  getObstacleRenderInfo: () => string;
}

// ===== DEFAULT VALUES =====
const DEFAULT_OBSTACLE_TEXTURE: ObstacleTexture = {
  color: '#8B4513', // Brown
  repeatX: false,
  repeatY: true,
  scaleX: 1.0,
  scaleY: 1.0,
  offsetX: 0,
  offsetY: 0,
  outline: true,
  outlineColor: '#654321', // Dark brown
  outlineWidth: 2,
  shadow: true,
  shadowColor: 'rgba(0,0,0,0.3)',
  shadowBlur: 5,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
};

const DEFAULT_PATTERNS: ObstaclePattern[] = [
  {
    name: 'classic',
    type: 'gradient',
    colors: ['#8B4513', '#654321'],
    gradientDirection: 'vertical',
    animated: false,
    animationSpeed: 1.0,
    animationOffset: 0,
  },
  {
    name: 'metal',
    type: 'gradient',
    colors: ['#C0C0C0', '#808080', '#404040'],
    gradientDirection: 'vertical',
    animated: false,
    animationSpeed: 1.0,
    animationOffset: 0,
  },
  {
    name: 'neon',
    type: 'gradient',
    colors: ['#00FFFF', '#0080FF', '#0040FF'],
    gradientDirection: 'radial',
    animated: true,
    animationSpeed: 2.0,
    animationOffset: 0,
  },
  {
    name: 'lava',
    type: 'gradient',
    colors: ['#FF4500', '#FF6600', '#FF8800'],
    gradientDirection: 'vertical',
    animated: true,
    animationSpeed: 1.5,
    animationOffset: 0,
  },
];

const DEFAULT_BIOME_STYLES: ObstacleBiomeStyle[] = [
  {
    name: 'forest',
    patterns: DEFAULT_PATTERNS,
    defaultPattern: 'classic',
    particleCount: 5,
    particleColor: '#90EE90',
    particleSize: 2,
    ambientColor: '#228B22',
    fogDensity: 0.1,
    lightIntensity: 0.8,
    lightColor: '#FFFACD',
    shadowIntensity: 0.3,
  },
  {
    name: 'cave',
    patterns: DEFAULT_PATTERNS,
    defaultPattern: 'metal',
    particleCount: 3,
    particleColor: '#696969',
    particleSize: 1,
    ambientColor: '#2F4F4F',
    fogDensity: 0.2,
    lightIntensity: 0.4,
    lightColor: '#F5F5DC',
    shadowIntensity: 0.6,
  },
  {
    name: 'neon',
    patterns: DEFAULT_PATTERNS,
    defaultPattern: 'neon',
    particleCount: 10,
    particleColor: '#00FFFF',
    particleSize: 3,
    ambientColor: '#191970',
    fogDensity: 0.05,
    lightIntensity: 1.2,
    lightColor: '#00FFFF',
    shadowIntensity: 0.2,
  },
  {
    name: 'volcano',
    patterns: DEFAULT_PATTERNS,
    defaultPattern: 'lava',
    particleCount: 15,
    particleColor: '#FF4500',
    particleSize: 4,
    ambientColor: '#8B0000',
    fogDensity: 0.3,
    lightIntensity: 1.0,
    lightColor: '#FF6600',
    shadowIntensity: 0.4,
  },
];

const DEFAULT_RENDER_CONFIG: ObstacleRenderConfig = {
  useTextures: false,
  fallbackPattern: 'classic',
  textureQuality: 'medium',
  enablePatterns: true,
  animatePatterns: true,
  patternScale: 1.0,
  showShadows: true,
  showOutlines: true,
  showAnimations: true,
  showBiomeEffects: true,
  showParticles: true,
  useOffscreenCanvas: false,
  cacheTextures: true,
  maxCachedTextures: 10,
  lodDistance: 500,
  showBounds: false,
  showOrigins: false,
  showBiomes: false,
  debugColor: '#FF0000',
};

const DEFAULT_VISUAL_EFFECTS: ObstacleVisualEffects = {
  particles: [],
  fog: {
    enabled: false,
    density: 0.1,
    color: '#FFFFFF',
    speed: 0.5,
    offset: 0,
  },
  lighting: {
    enabled: false,
    intensity: 1.0,
    color: '#FFFFFF',
    position: { x: 0, y: 0 },
    radius: 100,
  },
  screenShake: {
    enabled: false,
    intensity: 0,
    duration: 0,
    remainingTime: 0,
  },
};

// ===== OBSTACLE RENDERER HOOK =====
export const useObstacleRenderer = (
  initialConfig: Partial<ObstacleRenderConfig> = {}
): ObstacleRendererReturn => {
  
  // State
  const [textures] = useState<Map<string, ObstacleTexture>>(new Map([['default', DEFAULT_OBSTACLE_TEXTURE]]));
  const [patterns, setPatterns] = useState<ObstaclePattern[]>(DEFAULT_PATTERNS);
  const [biomeStyles] = useState<ObstacleBiomeStyle[]>(DEFAULT_BIOME_STYLES);
  const [animations] = useState<Map<string, ObstacleAnimation>>(new Map());
  const [visualEffects, setVisualEffects] = useState<ObstacleVisualEffects>(DEFAULT_VISUAL_EFFECTS);
  const [config, setConfig] = useState<ObstacleRenderConfig>({ ...DEFAULT_RENDER_CONFIG, ...initialConfig });
  
  // Internal state
  const textureCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const patternCache = useRef<Map<string, CanvasPattern>>(new Map());
  const animationTime = useRef<number>(0);

  // ===== TEXTURE OPERATIONS =====
  const loadTexture = useCallback(async (url: string, name: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check cache first
      const cached = textureCache.current.get(url);
      if (cached) {
        const texture: ObstacleTexture = { ...DEFAULT_OBSTACLE_TEXTURE, image: cached };
        textures.set(name, texture);
        resolve(true);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        textureCache.current.set(url, img);
        const texture: ObstacleTexture = { ...DEFAULT_OBSTACLE_TEXTURE, image: img };
        textures.set(name, texture);
        console.log(`🖼️ Obstacle texture loaded: ${name} from ${url}`);
        resolve(true);
      };
      img.onerror = () => {
        console.error(`❌ Failed to load obstacle texture: ${url}`);
        resolve(false);
      };
      img.src = url;
    });
  }, [textures]);

  const createTexture = useCallback((textureData: Partial<ObstacleTexture>, name: string) => {
    const texture: ObstacleTexture = { ...DEFAULT_OBSTACLE_TEXTURE, ...textureData };
    textures.set(name, texture);
    console.log(`🎨 Created texture: ${name}`);
  }, [textures]);

  const createPattern = useCallback((patternData: Omit<ObstaclePattern, 'animationOffset'>) => {
    const pattern: ObstaclePattern = { ...patternData, animationOffset: 0 };
    setPatterns(prev => {
      const filtered = prev.filter(p => p.name !== pattern.name);
      return [...filtered, pattern];
    });
    console.log(`🎯 Created pattern: ${pattern.name}`);
  }, []);

  const createBiomeStyle = useCallback((style: ObstacleBiomeStyle) => {
    const index = biomeStyles.findIndex(s => s.name === style.name);
    if (index >= 0) {
      biomeStyles[index] = style;
    } else {
      biomeStyles.push(style);
    }
    console.log(`🌍 Created biome style: ${style.name}`);
  }, [biomeStyles]);

  // ===== PATTERN OPERATIONS =====
  const getPatternByName = useCallback((name: string): ObstaclePattern | undefined => {
    return patterns.find(p => p.name === name);
  }, [patterns]);

  const getBiomeStyle = useCallback((biomeName: string): ObstacleBiomeStyle | undefined => {
    return biomeStyles.find(s => s.name === biomeName);
  }, [biomeStyles]);

  const updatePatternAnimations = useCallback((deltaTime: number) => {
    if (!config.animatePatterns) return;
    
    setPatterns(prev => prev.map(pattern => {
      if (pattern.animated) {
        return {
          ...pattern,
          animationOffset: pattern.animationOffset + (deltaTime * pattern.animationSpeed * 0.001),
        };
      }
      return pattern;
    }));
  }, [config.animatePatterns]);

  // ===== ANIMATION OPERATIONS =====
  const setAnimation = useCallback((obstacleId: string, animationData: Partial<ObstacleAnimation>) => {
    const defaultAnimation: ObstacleAnimation = {
      type: 'none',
      speed: 1.0,
      intensity: 1.0,
      phase: 0,
      enabled: false,
    };
    
    const animation: ObstacleAnimation = { ...defaultAnimation, ...animationData };
    animations.set(obstacleId, animation);
  }, [animations]);

  const updateAnimations = useCallback((deltaTime: number) => {
    if (!config.showAnimations) return;
    
    animationTime.current += deltaTime;
    
    for (const [, animation] of animations.entries()) {
      if (animation.enabled) {
        animation.phase += deltaTime * animation.speed * 0.001;
        if (animation.phase > Math.PI * 2) {
          animation.phase -= Math.PI * 2;
        }
      }
    }
  }, [config.showAnimations, animations]);

  const clearAnimation = useCallback((obstacleId: string) => {
    animations.delete(obstacleId);
  }, [animations]);

  // ===== VISUAL EFFECTS =====
  const addParticleSystem = useCallback((x: number, y: number, count: number, particleConfig?: any) => {
    if (!config.showParticles) return;
    
    const newParticles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }> = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1.0,
        maxLife: 1.0,
        color: particleConfig?.color || '#FFFFFF',
        size: particleConfig?.size || 2,
      });
    }
    
    setVisualEffects(prev => ({
      ...prev,
      particles: [...prev.particles, ...newParticles].slice(-100), // Limit particles
    }));
  }, [config.showParticles]);

  const updateVisualEffects = useCallback((deltaTime: number) => {
    setVisualEffects(prev => {
      const newEffects = { ...prev };
      
      // Update particles
      newEffects.particles = prev.particles
        .map(p => ({
          ...p,
          x: p.x + p.vx * deltaTime * 0.01,
          y: p.y + p.vy * deltaTime * 0.01,
          life: p.life - deltaTime * 0.001,
        }))
        .filter(p => p.life > 0);
      
      // Update fog
      if (newEffects.fog.enabled) {
        newEffects.fog.offset += deltaTime * newEffects.fog.speed * 0.001;
      }
      
      // Update screen shake
      if (newEffects.screenShake.enabled) {
        newEffects.screenShake.remainingTime -= deltaTime;
        if (newEffects.screenShake.remainingTime <= 0) {
          newEffects.screenShake.enabled = false;
          newEffects.screenShake.intensity = 0;
        }
      }
      
      return newEffects;
    });
  }, []);

  const clearVisualEffects = useCallback(() => {
    setVisualEffects(DEFAULT_VISUAL_EFFECTS);
  }, []);

  const triggerScreenShake = useCallback((intensity: number, duration: number) => {
    setVisualEffects(prev => ({
      ...prev,
      screenShake: {
        enabled: true,
        intensity,
        duration,
        remainingTime: duration,
      },
    }));
  }, []);

  // ===== RENDERING HELPERS =====
  const createGradient = useCallback((ctx: CanvasRenderingContext2D, pattern: ObstaclePattern, width: number, height: number): CanvasGradient => {
    let gradient: CanvasGradient;
    
    switch (pattern.gradientDirection) {
      case 'horizontal':
        gradient = ctx.createLinearGradient(0, 0, width, 0);
        break;
      case 'vertical':
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        break;
      case 'radial':
        gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
        break;
      default:
        gradient = ctx.createLinearGradient(0, 0, 0, height);
    }
    
    const colorCount = pattern.colors.length;
    for (let i = 0; i < colorCount; i++) {
      const offset = i / (colorCount - 1);
      gradient.addColorStop(offset, pattern.colors[i]);
    }
    
    return gradient;
  }, []);

  // ===== RENDERING =====
  const renderObstacle = useCallback((obstacle: Obstacle, renderer: RenderManagerReturn, biome?: string) => {
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    const screenPos = renderer.worldToScreen(obstacle.x, obstacle.y);
    const obstacleKey = `${obstacle.x}-${obstacle.y}-${obstacle.width}-${obstacle.height}`;
    
    // Get biome style
    const biomeStyle = biome ? getBiomeStyle(biome) : undefined;
    const patternName = biomeStyle?.defaultPattern || config.fallbackPattern;
    const pattern = getPatternByName(patternName);
    
    // Get animation
    const animation = animations.get(obstacleKey);
    
    ctx.save();
    
    // Apply screen shake
    if (visualEffects.screenShake.enabled) {
      const shakeX = (Math.random() - 0.5) * visualEffects.screenShake.intensity;
      const shakeY = (Math.random() - 0.5) * visualEffects.screenShake.intensity;
      ctx.translate(shakeX, shakeY);
    }
    
    // Apply animation transformations
    if (animation && animation.enabled && config.showAnimations) {
      const centerX = screenPos.x + obstacle.width / 2;
      const centerY = screenPos.y + obstacle.height / 2;
      
      ctx.translate(centerX, centerY);
      
      switch (animation.type) {
        case 'rotate':
          ctx.rotate(animation.phase * animation.intensity);
          break;
        case 'pulse':
          const scale = 1 + Math.sin(animation.phase) * animation.intensity * 0.1;
          ctx.scale(scale, scale);
          break;
        case 'sway':
          ctx.translate(Math.sin(animation.phase) * animation.intensity * 5, 0);
          break;
        case 'float':
          ctx.translate(0, Math.sin(animation.phase) * animation.intensity * 3);
          break;
      }
      
      ctx.translate(-centerX, -centerY);
    }
    
    // Render shadow
    if (config.showShadows) {
      const texture = textures.get('default');
      if (texture && texture.shadow) {
        ctx.save();
        ctx.globalAlpha = biomeStyle?.shadowIntensity || 0.3;
        ctx.fillStyle = texture.shadowColor;
        ctx.filter = `blur(${texture.shadowBlur}px)`;
        ctx.fillRect(
          screenPos.x + texture.shadowOffsetX,
          screenPos.y + texture.shadowOffsetY,
          obstacle.width,
          obstacle.height
        );
        ctx.restore();
      }
    }
    
    // Render main obstacle
    if (pattern && config.enablePatterns) {
      // Use pattern
      switch (pattern.type) {
        case 'solid':
          ctx.fillStyle = pattern.colors[0] || '#8B4513';
          break;
        case 'gradient':
          ctx.fillStyle = createGradient(ctx, pattern, obstacle.width, obstacle.height);
          break;
        case 'texture':
          // Use texture if available
          const texture = textures.get(pattern.name);
          if (texture && texture.image) {
            // Create pattern
            let canvasPattern = patternCache.current.get(pattern.name);
            if (!canvasPattern) {
              canvasPattern = ctx.createPattern(texture.image, texture.repeatX && texture.repeatY ? 'repeat' : 'no-repeat') || undefined;
              if (canvasPattern) {
                patternCache.current.set(pattern.name, canvasPattern);
              }
            }
            ctx.fillStyle = canvasPattern || pattern.colors[0] || '#8B4513';
          } else {
            ctx.fillStyle = pattern.colors[0] || '#8B4513';
          }
          break;
        case 'procedural':
          // Simple procedural pattern
          ctx.fillStyle = pattern.colors[Math.floor(Math.sin(obstacle.x * 0.01 + pattern.animationOffset) * 2) % pattern.colors.length];
          break;
      }
    } else {
      // Use default texture
      const texture = textures.get('default');
      ctx.fillStyle = texture?.color || '#8B4513';
    }
    
    // Draw obstacle
    ctx.fillRect(screenPos.x, screenPos.y, obstacle.width, obstacle.height);
    
    // Render outline
    if (config.showOutlines) {
      const texture = textures.get('default');
      if (texture && texture.outline) {
        ctx.strokeStyle = texture.outlineColor;
        ctx.lineWidth = texture.outlineWidth;
        ctx.strokeRect(screenPos.x, screenPos.y, obstacle.width, obstacle.height);
      }
    }
    
    // Render glow effect for certain animations
    if (animation?.type === 'glow' && animation.enabled) {
      ctx.save();
      const glowIntensity = (Math.sin(animation.phase) + 1) * 0.5 * animation.intensity;
      ctx.shadowColor = biomeStyle?.lightColor || '#FFFFFF';
      ctx.shadowBlur = 20 * glowIntensity;
      ctx.strokeStyle = biomeStyle?.lightColor || '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.globalAlpha = glowIntensity;
      ctx.strokeRect(screenPos.x - 2, screenPos.y - 2, obstacle.width + 4, obstacle.height + 4);
      ctx.restore();
    }
    
    ctx.restore();
  }, [textures, patterns, biomeStyles, animations, visualEffects, config, getBiomeStyle, getPatternByName, createGradient]);

  const renderObstacles = useCallback((obstacles: Obstacle[], renderer: RenderManagerReturn) => {
    const camera = renderer.camera;
    const canvas = renderer.getCanvas();
    const viewBounds = {
      left: camera.x - (canvas?.width || 800) / 2,
      right: camera.x + (canvas?.width || 800) / 2,
      top: camera.y - (canvas?.height || 600) / 2,
      bottom: camera.y + (canvas?.height || 600) / 2,
    };
    
    // Only render obstacles in view (with some margin)
    const margin = 100;
    const visibleObstacles = obstacles.filter(obstacle => 
      obstacle.x < viewBounds.right + margin &&
      obstacle.x + obstacle.width > viewBounds.left - margin &&
      obstacle.y < viewBounds.bottom + margin &&
      obstacle.y + obstacle.height > viewBounds.top - margin
    );
    
    // Sort by distance for LOD
    const cameraDistance = (obstacle: Obstacle) => {
      const dx = obstacle.x + obstacle.width / 2 - camera.x;
      const dy = obstacle.y + obstacle.height / 2 - camera.y;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    visibleObstacles.sort((a, b) => cameraDistance(a) - cameraDistance(b));
    
    // Render obstacles with LOD
    for (const obstacle of visibleObstacles) {
      const distance = cameraDistance(obstacle);
      
      // Skip detailed rendering for distant obstacles
      if (distance > config.lodDistance && config.lodDistance > 0) {
        // Simple rendering for distant obstacles
        const ctx = renderer.getContext();
        if (ctx) {
          const screenPos = renderer.worldToScreen(obstacle.x, obstacle.y);
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(screenPos.x, screenPos.y, obstacle.width, obstacle.height);
        }
      } else {
        // Full rendering for close obstacles
        renderObstacle(obstacle, renderer);
      }
    }
  }, [config.lodDistance, renderObstacle]);

  const renderVisualEffects = useCallback((renderer: RenderManagerReturn) => {
    if (!config.showBiomeEffects) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    // Render particles
    if (config.showParticles && visualEffects.particles.length > 0) {
      ctx.save();
      
      for (const particle of visualEffects.particles) {
        const screenPos = renderer.worldToScreen(particle.x, particle.y);
        const alpha = particle.life / particle.maxLife;
        
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    // Render fog
    if (visualEffects.fog.enabled) {
      const canvas = renderer.getCanvas();
      ctx.save();
      ctx.globalAlpha = visualEffects.fog.density;
      ctx.fillStyle = visualEffects.fog.color;
      
      // Create fog pattern
      const gradient = ctx.createLinearGradient(0, 0, canvas?.width || 800, 0);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, visualEffects.fog.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas?.width || 800, canvas?.height || 600);
      ctx.restore();
    }
    
    // Render lighting
    if (visualEffects.lighting.enabled) {
      const screenPos = renderer.worldToScreen(visualEffects.lighting.position.x, visualEffects.lighting.position.y);
      
      ctx.save();
      ctx.globalAlpha = visualEffects.lighting.intensity * 0.3;
      
      const gradient = ctx.createRadialGradient(
        screenPos.x, screenPos.y, 0,
        screenPos.x, screenPos.y, visualEffects.lighting.radius
      );
      gradient.addColorStop(0, visualEffects.lighting.color);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, visualEffects.lighting.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [config, visualEffects]);

  const renderDebug = useCallback((obstacles: Obstacle[], renderer: RenderManagerReturn) => {
    if (!config.showBounds && !config.showOrigins && !config.showBiomes) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    ctx.save();
    ctx.strokeStyle = config.debugColor;
    ctx.fillStyle = config.debugColor;
    ctx.lineWidth = 1;
    
    for (const obstacle of obstacles) {
      const screenPos = renderer.worldToScreen(obstacle.x, obstacle.y);
      
      // Show bounds
      if (config.showBounds) {
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(screenPos.x, screenPos.y, obstacle.width, obstacle.height);
      }
      
      // Show origins
      if (config.showOrigins) {
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }, [config]);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<ObstacleRenderConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getObstacleRenderInfo = useCallback((): string => {
    return [
      `🏗️ Textures: ${textures.size}`,
      `🎨 Patterns: ${patterns.length}`,
      `🌍 Biomes: ${biomeStyles.length}`,
      `✨ Particles: ${visualEffects.particles.length}`,
      `🎬 Animations: ${animations.size}`,
    ].join(' | ');
  }, [textures.size, patterns.length, biomeStyles.length, visualEffects.particles.length, animations.size]);

  // ===== INITIALIZATION =====
  useEffect(() => {
    // Initialize default patterns in cache
    patterns.forEach(pattern => {
      if (!patternCache.current.has(pattern.name)) {
        // Create simple procedural patterns if needed
      }
    });
  }, [patterns]);

  return {
    textures,
    patterns,
    biomeStyles,
    animations,
    visualEffects,
    config,
    loadTexture,
    createTexture,
    createPattern,
    createBiomeStyle,
    getPatternByName,
    getBiomeStyle,
    updatePatternAnimations,
    setAnimation,
    updateAnimations,
    clearAnimation,
    addParticleSystem,
    updateVisualEffects,
    clearVisualEffects,
    triggerScreenShake,
    renderObstacle,
    renderObstacles,
    renderVisualEffects,
    renderDebug,
    updateConfig,
    getObstacleRenderInfo,
  };
};

export default useObstacleRenderer;