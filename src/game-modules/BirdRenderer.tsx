/**
 * ========================================
 * PHASE 5.3: BIRD RENDERER
 * ========================================
 * 
 * Bird rendering, animation, and visual effects system
 * Extracted from SzenyoMadar.tsx monolith
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { BirdState } from './BirdManager';
import { RenderManagerReturn } from './RenderManager';

// ===== BIRD VISUAL TYPES =====
export interface BirdSprite {
  image?: HTMLImageElement | HTMLCanvasElement;
  frames: number;
  frameWidth: number;
  frameHeight: number;
  animationSpeed: number;
  
  // Sprite atlas coordinates
  sourceX: number;
  sourceY: number;
  
  // Visual properties
  scale: number;
  color: string;
  outline: boolean;
  outlineColor: string;
  outlineWidth: number;
}

export interface BirdAnimation {
  name: string;
  startFrame: number;
  endFrame: number;
  loop: boolean;
  speed: number;
  currentFrame: number;
  playing: boolean;
}

export interface BirdTrail {
  enabled: boolean;
  maxPoints: number;
  points: Array<{ x: number; y: number; time: number; alpha: number }>;
  color: string;
  width: number;
  fadeTime: number;
}

export interface BirdEffects {
  // Power-up effects
  shield: {
    enabled: boolean;
    color: string;
    pulseSpeed: number;
    radius: number;
  };
  
  speedBoost: {
    enabled: boolean;
    particles: Array<{ x: number; y: number; vx: number; vy: number; life: number }>;
    color: string;
  };
  
  magnet: {
    enabled: boolean;
    rings: Array<{ radius: number; alpha: number; rotation: number }>;
    color: string;
  };
  
  invulnerability: {
    enabled: boolean;
    flashSpeed: number;
    alpha: number;
  };
  
  // Animation effects
  flapping: {
    enabled: boolean;
    intensity: number;
    duration: number;
    startTime: number;
  };
  
  death: {
    enabled: boolean;
    rotation: number;
    scale: number;
    particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }>;
  };
}

export interface BirdRenderConfig {
  // Sprite settings
  useSprites: boolean;
  spriteUrl?: string;
  fallbackColor: string;
  
  // Animation settings
  animationEnabled: boolean;
  smoothAnimation: boolean;
  frameSmoothing: number;
  
  // Visual effects
  showTrail: boolean;
  showEffects: boolean;
  showShadow: boolean;
  shadowOffset: number;
  shadowBlur: number;
  shadowColor: string;
  
  // Performance settings
  useOffscreenCanvas: boolean;
  cacheSprites: boolean;
  maxParticles: number;
  
  // Debug settings
  showHitbox: boolean;
  showOrigin: boolean;
  showVelocityVector: boolean;
  debugColor: string;
}

export interface BirdRendererReturn {
  // Sprite management
  sprite: BirdSprite;
  animations: BirdAnimation[];
  trail: BirdTrail;
  effects: BirdEffects;
  config: BirdRenderConfig;
  
  // Sprite operations
  loadSprite: (url: string) => Promise<boolean>;
  setSprite: (sprite: Partial<BirdSprite>) => void;
  createFallbackSprite: () => void;
  
  // Animation management
  addAnimation: (animation: Omit<BirdAnimation, 'currentFrame' | 'playing'>) => void;
  playAnimation: (name: string, restart?: boolean) => void;
  stopAnimation: (name?: string) => void;
  updateAnimations: (deltaTime: number) => void;
  
  // Trail management
  updateTrail: (bird: BirdState, deltaTime: number) => void;
  clearTrail: () => void;
  
  // Effects management
  activateShield: () => void;
  activateSpeedBoost: () => void;
  activateMagnet: () => void;
  activateInvulnerability: () => void;
  activateFlapping: () => void;
  activateDeath: () => void;
  updateEffects: (bird: BirdState, deltaTime: number) => void;
  clearEffects: () => void;
  
  // Rendering
  renderBird: (bird: BirdState, renderer: RenderManagerReturn) => void;
  renderTrail: (renderer: RenderManagerReturn) => void;
  renderEffects: (bird: BirdState, renderer: RenderManagerReturn) => void;
  renderDebug: (bird: BirdState, renderer: RenderManagerReturn) => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<BirdRenderConfig>) => void;
  getBirdRenderInfo: () => string;
}

// ===== DEFAULT VALUES =====
const DEFAULT_BIRD_SPRITE: BirdSprite = {
  frames: 3,
  frameWidth: 32,
  frameHeight: 32,
  animationSpeed: 8.0,
  sourceX: 0,
  sourceY: 0,
  scale: 1.0,
  color: '#FFD700', // Gold
  outline: true,
  outlineColor: '#FF8C00', // Dark orange
  outlineWidth: 2,
};

const DEFAULT_BIRD_TRAIL: BirdTrail = {
  enabled: false,
  maxPoints: 15,
  points: [],
  color: '#FFD700',
  width: 3,
  fadeTime: 1000, // ms
};

const DEFAULT_BIRD_EFFECTS: BirdEffects = {
  shield: {
    enabled: false,
    color: '#00BFFF',
    pulseSpeed: 3.0,
    radius: 20,
  },
  speedBoost: {
    enabled: false,
    particles: [],
    color: '#FF4500',
  },
  magnet: {
    enabled: false,
    rings: [],
    color: '#9370DB',
  },
  invulnerability: {
    enabled: false,
    flashSpeed: 10.0,
    alpha: 1.0,
  },
  flapping: {
    enabled: false,
    intensity: 1.0,
    duration: 150,
    startTime: 0,
  },
  death: {
    enabled: false,
    rotation: 0,
    scale: 1.0,
    particles: [],
  },
};

const DEFAULT_BIRD_RENDER_CONFIG: BirdRenderConfig = {
  useSprites: false,
  fallbackColor: '#FFD700',
  animationEnabled: true,
  smoothAnimation: true,
  frameSmoothing: 0.1,
  showTrail: false,
  showEffects: true,
  showShadow: true,
  shadowOffset: 3,
  shadowBlur: 5,
  shadowColor: 'rgba(0,0,0,0.3)',
  useOffscreenCanvas: false,
  cacheSprites: true,
  maxParticles: 50,
  showHitbox: false,
  showOrigin: false,
  showVelocityVector: false,
  debugColor: '#FF0000',
};

const DEFAULT_ANIMATIONS: BirdAnimation[] = [
  {
    name: 'idle',
    startFrame: 0,
    endFrame: 2,
    loop: true,
    speed: 1.0,
    currentFrame: 0,
    playing: true,
  },
  {
    name: 'flap',
    startFrame: 0,
    endFrame: 2,
    loop: false,
    speed: 3.0,
    currentFrame: 0,
    playing: false,
  },
  {
    name: 'fall',
    startFrame: 1,
    endFrame: 1,
    loop: true,
    speed: 1.0,
    currentFrame: 1,
    playing: false,
  },
];

// ===== BIRD RENDERER HOOK =====
export const useBirdRenderer = (
  initialConfig: Partial<BirdRenderConfig> = {}
): BirdRendererReturn => {
  
  // State
  const [sprite, setSprite] = useState<BirdSprite>(DEFAULT_BIRD_SPRITE);
  const [animations, setAnimations] = useState<BirdAnimation[]>(DEFAULT_ANIMATIONS);
  const [trail, setTrail] = useState<BirdTrail>(DEFAULT_BIRD_TRAIL);
  const [effects, setEffects] = useState<BirdEffects>(DEFAULT_BIRD_EFFECTS);
  const [config, setConfig] = useState<BirdRenderConfig>({ ...DEFAULT_BIRD_RENDER_CONFIG, ...initialConfig });
  
  // Internal state
  const spriteCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const offscreenCanvas = useRef<HTMLCanvasElement | null>(null);
  const animationTime = useRef<number>(0);

  // ===== SPRITE OPERATIONS =====
  const loadSprite = useCallback(async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Check cache first
      const cached = spriteCache.current.get(url);
      if (cached) {
        setSprite(prev => ({ ...prev, image: cached }));
        resolve(true);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        spriteCache.current.set(url, img);
        setSprite(prev => ({ ...prev, image: img }));
        console.log(`🖼️ Bird sprite loaded: ${url}`);
        resolve(true);
      };
      img.onerror = () => {
        console.error(`❌ Failed to load bird sprite: ${url}`);
        createFallbackSprite();
        resolve(false);
      };
      img.src = url;
    });
  }, []);

  const setSpriteData = useCallback((spriteData: Partial<BirdSprite>) => {
    setSprite(prev => ({ ...prev, ...spriteData }));
  }, []);

  const createFallbackSprite = useCallback(() => {
    if (!offscreenCanvas.current) {
      offscreenCanvas.current = document.createElement('canvas');
    }
    
    const canvas = offscreenCanvas.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Create simple bird sprite
    const size = 32;
    canvas.width = size * 3; // 3 frames
    canvas.height = size;
    
    for (let frame = 0; frame < 3; frame++) {
      const x = frame * size;
      const centerX = x + size / 2;
      const centerY = size / 2;
      
      // Bird body
      ctx.fillStyle = config.fallbackColor;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Wing animation
      const wingOffset = Math.sin(frame * Math.PI) * 3;
      ctx.fillStyle = '#FF8C00';
      ctx.beginPath();
      ctx.ellipse(centerX - 5, centerY + wingOffset, size * 0.2, size * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(centerX + 5, centerY - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Beak
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      ctx.moveTo(centerX + 12, centerY);
      ctx.lineTo(centerX + 18, centerY - 2);
      ctx.lineTo(centerX + 18, centerY + 2);
      ctx.closePath();
      ctx.fill();
    }
    
    setSprite(prev => ({ 
      ...prev, 
      image: canvas,
      frames: 3,
      frameWidth: size,
      frameHeight: size,
    }));
    
    console.log('🎨 Fallback bird sprite created');
  }, [config.fallbackColor]);

  // ===== ANIMATION MANAGEMENT =====
  const addAnimation = useCallback((animationData: Omit<BirdAnimation, 'currentFrame' | 'playing'>) => {
    const animation: BirdAnimation = {
      ...animationData,
      currentFrame: animationData.startFrame,
      playing: false,
    };
    
    setAnimations(prev => {
      const filtered = prev.filter(a => a.name !== animation.name);
      return [...filtered, animation];
    });
  }, []);

  const playAnimation = useCallback((name: string, restart: boolean = false) => {
    setAnimations(prev => prev.map(anim => {
      if (anim.name === name) {
        return {
          ...anim,
          playing: true,
          currentFrame: restart ? anim.startFrame : anim.currentFrame,
        };
      } else {
        return { ...anim, playing: false };
      }
    }));
  }, []);

  const stopAnimation = useCallback((name?: string) => {
    setAnimations(prev => prev.map(anim => {
      if (!name || anim.name === name) {
        return { ...anim, playing: false };
      }
      return anim;
    }));
  }, []);

  const updateAnimations = useCallback((deltaTime: number) => {
    if (!config.animationEnabled) return;
    
    animationTime.current += deltaTime;
    
    setAnimations(prev => prev.map(anim => {
      if (!anim.playing) return anim;
      
      const frameTime = 1000 / (sprite.animationSpeed * anim.speed);
      if (animationTime.current >= frameTime) {
        let newFrame = anim.currentFrame + 1;
        
        if (newFrame > anim.endFrame) {
          if (anim.loop) {
            newFrame = anim.startFrame;
          } else {
            newFrame = anim.endFrame;
            return { ...anim, playing: false, currentFrame: newFrame };
          }
        }
        
        return { ...anim, currentFrame: newFrame };
      }
      
      return anim;
    }));
    
    // Reset animation timer
    const frameTime = 1000 / sprite.animationSpeed;
    if (animationTime.current >= frameTime) {
      animationTime.current = 0;
    }
  }, [config.animationEnabled, sprite.animationSpeed]);

  // ===== TRAIL MANAGEMENT =====
  const updateTrail = useCallback((bird: BirdState, _deltaTime: number) => {
    if (!config.showTrail || !trail.enabled) return;
    
    const now = Date.now();
    
    setTrail(prev => {
      // Add new point
      const newPoints = [...prev.points, {
        x: bird.x,
        y: bird.y,
        time: now,
        alpha: 1.0,
      }];
      
      // Remove old points and update alpha
      const filteredPoints = newPoints
        .filter(point => now - point.time < prev.fadeTime)
        .map(point => ({
          ...point,
          alpha: Math.max(0, 1.0 - (now - point.time) / prev.fadeTime),
        }))
        .slice(-prev.maxPoints);
      
      return { ...prev, points: filteredPoints };
    });
  }, [config.showTrail, trail.enabled, trail.fadeTime, trail.maxPoints]);

  const clearTrail = useCallback(() => {
    setTrail(prev => ({ ...prev, points: [] }));
  }, []);

  // ===== EFFECTS MANAGEMENT =====
  const activateShield = useCallback(() => {
    setEffects(prev => ({
      ...prev,
      shield: { ...prev.shield, enabled: true },
    }));
  }, []);

  const activateSpeedBoost = useCallback(() => {
    setEffects(prev => ({
      ...prev,
      speedBoost: { ...prev.speedBoost, enabled: true, particles: [] },
    }));
  }, []);

  const activateMagnet = useCallback(() => {
    setEffects(prev => ({
      ...prev,
      magnet: { 
        ...prev.magnet, 
        enabled: true,
        rings: [
          { radius: 20, alpha: 1.0, rotation: 0 },
          { radius: 35, alpha: 0.7, rotation: 0 },
          { radius: 50, alpha: 0.4, rotation: 0 },
        ],
      },
    }));
  }, []);

  const activateInvulnerability = useCallback(() => {
    setEffects(prev => ({
      ...prev,
      invulnerability: { ...prev.invulnerability, enabled: true },
    }));
  }, []);

  const activateFlapping = useCallback(() => {
    setEffects(prev => ({
      ...prev,
      flapping: { 
        ...prev.flapping, 
        enabled: true,
        startTime: Date.now(),
      },
    }));
    
    playAnimation('flap', true);
  }, [playAnimation]);

  const activateDeath = useCallback(() => {
    setEffects(prev => ({
      ...prev,
      death: { 
        ...prev.death, 
        enabled: true,
        rotation: 0,
        scale: 1.0,
        particles: [],
      },
    }));
  }, []);

  const updateEffects = useCallback((bird: BirdState, deltaTime: number) => {
    const now = Date.now();
    
    setEffects(prev => {
      const newEffects = { ...prev };
      
      // Update shield
      if (newEffects.shield.enabled && !bird.hasShield) {
        newEffects.shield.enabled = false;
      }
      
      // Update speed boost particles
      if (newEffects.speedBoost.enabled) {
        if (bird.hasSpeedBoost) {
          // Add new particles
          for (let i = 0; i < 2; i++) {
            if (newEffects.speedBoost.particles.length < config.maxParticles) {
              newEffects.speedBoost.particles.push({
                x: bird.x + (Math.random() - 0.5) * 10,
                y: bird.y + (Math.random() - 0.5) * 10,
                vx: -2 - Math.random() * 3,
                vy: (Math.random() - 0.5) * 2,
                life: 1.0,
              });
            }
          }
        } else {
          newEffects.speedBoost.enabled = false;
        }
        
        // Update particles
        newEffects.speedBoost.particles = newEffects.speedBoost.particles
          .map(p => ({
            ...p,
            x: p.x + p.vx * deltaTime * 0.01,
            y: p.y + p.vy * deltaTime * 0.01,
            life: p.life - deltaTime * 0.002,
          }))
          .filter(p => p.life > 0);
      }
      
      // Update magnet rings
      if (newEffects.magnet.enabled) {
        if (bird.hasMagnet) {
          newEffects.magnet.rings = newEffects.magnet.rings.map(ring => ({
            ...ring,
            rotation: ring.rotation + deltaTime * 0.002,
          }));
        } else {
          newEffects.magnet.enabled = false;
        }
      }
      
      // Update invulnerability flash
      if (newEffects.invulnerability.enabled) {
        if (bird.invulnerabilityTime > 0) {
          const flashTime = Math.sin(now * newEffects.invulnerability.flashSpeed * 0.01);
          newEffects.invulnerability.alpha = 0.3 + flashTime * 0.4;
        } else {
          newEffects.invulnerability.enabled = false;
          newEffects.invulnerability.alpha = 1.0;
        }
      }
      
      // Update flapping effect
      if (newEffects.flapping.enabled) {
        const elapsed = now - newEffects.flapping.startTime;
        if (elapsed > newEffects.flapping.duration) {
          newEffects.flapping.enabled = false;
          playAnimation('idle');
        }
      }
      
      // Update death effect
      if (newEffects.death.enabled && !bird.isAlive) {
        newEffects.death.rotation += deltaTime * 0.01;
        newEffects.death.scale = Math.max(0.1, newEffects.death.scale - deltaTime * 0.001);
        
        // Add death particles
        if (newEffects.death.particles.length < 20) {
          for (let i = 0; i < 3; i++) {
            newEffects.death.particles.push({
              x: bird.x,
              y: bird.y,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: ['#FF0000', '#FF8000', '#FFFF00'][Math.floor(Math.random() * 3)],
              life: 1.0,
            });
          }
        }
        
        // Update death particles
        newEffects.death.particles = newEffects.death.particles
          .map(p => ({
            ...p,
            x: p.x + p.vx * deltaTime * 0.01,
            y: p.y + p.vy * deltaTime * 0.01,
            life: p.life - deltaTime * 0.003,
          }))
          .filter(p => p.life > 0);
      }
      
      return newEffects;
    });
  }, [config.maxParticles, playAnimation]);

  const clearEffects = useCallback(() => {
    setEffects(DEFAULT_BIRD_EFFECTS);
  }, []);

  // ===== RENDERING =====
  const renderBird = useCallback((bird: BirdState, renderer: RenderManagerReturn) => {
    if (!bird.isAlive && !effects.death.enabled) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    const screenPos = renderer.worldToScreen(bird.x, bird.y);
    
    ctx.save();
    
    // Apply invulnerability effect
    if (effects.invulnerability.enabled) {
      ctx.globalAlpha = effects.invulnerability.alpha;
    }
    
    // Apply death effect
    if (effects.death.enabled) {
      ctx.translate(screenPos.x, screenPos.y);
      ctx.rotate(effects.death.rotation);
      ctx.scale(effects.death.scale, effects.death.scale);
      ctx.translate(-screenPos.x, -screenPos.y);
    } else {
      // Normal rotation based on velocity
      ctx.translate(screenPos.x, screenPos.y);
      ctx.rotate(bird.angle);
      ctx.translate(-screenPos.x, -screenPos.y);
    }
    
    // Render shadow
    if (config.showShadow) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = config.shadowColor;
      ctx.beginPath();
      ctx.arc(
        screenPos.x + config.shadowOffset,
        screenPos.y + config.shadowOffset,
        bird.radius * sprite.scale,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
    
    // Render sprite or fallback
    if (config.useSprites && sprite.image) {
      const activeAnim = animations.find(a => a.playing) || animations[0];
      const frame = activeAnim ? activeAnim.currentFrame : 0;
      
      const sourceX = sprite.sourceX + (frame * sprite.frameWidth);
      const destSize = bird.radius * 2 * sprite.scale;
      
      ctx.drawImage(
        sprite.image,
        sourceX,
        sprite.sourceY,
        sprite.frameWidth,
        sprite.frameHeight,
        screenPos.x - destSize / 2,
        screenPos.y - destSize / 2,
        destSize,
        destSize
      );
    } else {
      // Fallback circle
      ctx.fillStyle = sprite.color;
      if (sprite.outline) {
        ctx.strokeStyle = sprite.outlineColor;
        ctx.lineWidth = sprite.outlineWidth;
      }
      
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, bird.radius * sprite.scale, 0, Math.PI * 2);
      ctx.fill();
      
      if (sprite.outline) {
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }, [effects, config, sprite, animations]);

  const renderTrail = useCallback((renderer: RenderManagerReturn) => {
    if (!config.showTrail || !trail.enabled || trail.points.length < 2) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    ctx.save();
    ctx.strokeStyle = trail.color;
    ctx.lineWidth = trail.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    for (let i = 1; i < trail.points.length; i++) {
      const prevPoint = trail.points[i - 1];
      const currentPoint = trail.points[i];
      
      const prevScreen = renderer.worldToScreen(prevPoint.x, prevPoint.y);
      const currentScreen = renderer.worldToScreen(currentPoint.x, currentPoint.y);
      
      ctx.globalAlpha = currentPoint.alpha;
      ctx.beginPath();
      ctx.moveTo(prevScreen.x, prevScreen.y);
      ctx.lineTo(currentScreen.x, currentScreen.y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [config.showTrail, trail]);

  const renderEffects = useCallback((bird: BirdState, renderer: RenderManagerReturn) => {
    if (!config.showEffects) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    const screenPos = renderer.worldToScreen(bird.x, bird.y);
    
    // Render shield
    if (effects.shield.enabled) {
      const pulseRadius = effects.shield.radius + Math.sin(Date.now() * effects.shield.pulseSpeed * 0.01) * 5;
      
      ctx.save();
      ctx.strokeStyle = effects.shield.color;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, pulseRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    
    // Render speed boost particles
    if (effects.speedBoost.enabled) {
      ctx.save();
      ctx.fillStyle = effects.speedBoost.color;
      
      for (const particle of effects.speedBoost.particles) {
        const particleScreen = renderer.worldToScreen(particle.x, particle.y);
        ctx.globalAlpha = particle.life;
        ctx.beginPath();
        ctx.arc(particleScreen.x, particleScreen.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    // Render magnet rings
    if (effects.magnet.enabled) {
      ctx.save();
      ctx.strokeStyle = effects.magnet.color;
      ctx.lineWidth = 2;
      
      for (const ring of effects.magnet.rings) {
        ctx.save();
        ctx.globalAlpha = ring.alpha;
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(ring.rotation);
        ctx.beginPath();
        ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      
      ctx.restore();
    }
    
    // Render death particles
    if (effects.death.enabled) {
      ctx.save();
      
      for (const particle of effects.death.particles) {
        const particleScreen = renderer.worldToScreen(particle.x, particle.y);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;
        ctx.beginPath();
        ctx.arc(particleScreen.x, particleScreen.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }, [config.showEffects, effects]);

  const renderDebug = useCallback((bird: BirdState, renderer: RenderManagerReturn) => {
    if (!config.showHitbox && !config.showOrigin && !config.showVelocityVector) return;
    
    const ctx = renderer.getContext();
    if (!ctx) return;
    
    const screenPos = renderer.worldToScreen(bird.x, bird.y);
    
    ctx.save();
    ctx.strokeStyle = config.debugColor;
    ctx.fillStyle = config.debugColor;
    ctx.lineWidth = 1;
    
    // Show hitbox
    if (config.showHitbox) {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, bird.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Show origin
    if (config.showOrigin) {
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Show velocity vector
    if (config.showVelocityVector) {
      const velocityEnd = renderer.worldToScreen(bird.x + bird.vx * 10, bird.y + bird.vy * 10);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(screenPos.x, screenPos.y);
      ctx.lineTo(velocityEnd.x, velocityEnd.y);
      ctx.stroke();
      
      // Arrow head
      const angle = Math.atan2(velocityEnd.y - screenPos.y, velocityEnd.x - screenPos.x);
      const arrowLength = 8;
      ctx.beginPath();
      ctx.moveTo(velocityEnd.x, velocityEnd.y);
      ctx.lineTo(
        velocityEnd.x - arrowLength * Math.cos(angle - Math.PI / 6),
        velocityEnd.y - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(velocityEnd.x, velocityEnd.y);
      ctx.lineTo(
        velocityEnd.x - arrowLength * Math.cos(angle + Math.PI / 6),
        velocityEnd.y - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
    
    ctx.restore();
  }, [config]);

  // ===== CONFIGURATION =====
  const updateConfig = useCallback((newConfig: Partial<BirdRenderConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const getBirdRenderInfo = useCallback((): string => {
    const activeAnim = animations.find(a => a.playing);
    return [
      `🎨 Sprite: ${config.useSprites ? 'ON' : 'OFF'}`,
      `🎬 Anim: ${activeAnim?.name || 'none'}`,
      `✨ Effects: ${Object.values(effects).filter(e => typeof e === 'object' && e.enabled).length}`,
      `👻 Trail: ${trail.points.length}pts`,
    ].join(' | ');
  }, [config.useSprites, animations, effects, trail.points.length]);

  // ===== INITIALIZATION =====
  useEffect(() => {
    // Create fallback sprite if not using external sprites
    if (!config.useSprites) {
      createFallbackSprite();
    }
  }, [config.useSprites, createFallbackSprite]);

  return {
    sprite,
    animations,
    trail,
    effects,
    config,
    loadSprite,
    setSprite: setSpriteData,
    createFallbackSprite,
    addAnimation,
    playAnimation,
    stopAnimation,
    updateAnimations,
    updateTrail,
    clearTrail,
    activateShield,
    activateSpeedBoost,
    activateMagnet,
    activateInvulnerability,
    activateFlapping,
    activateDeath,
    updateEffects,
    clearEffects,
    renderBird,
    renderTrail,
    renderEffects,
    renderDebug,
    updateConfig,
    getBirdRenderInfo,
  };
};

export default useBirdRenderer;